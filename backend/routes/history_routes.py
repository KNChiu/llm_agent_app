import models
import schemas
import logging
from typing import List, Optional
from sqlalchemy import desc, func, text
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from uuid import UUID

from utils.dependencies import get_db
from utils.logging import setup_logging


setup_logging()
logger = logging.getLogger(__name__)

router = APIRouter()

# 新增分頁響應模型
class PaginatedChatHistory(BaseModel):
    items: List[schemas.ChatHistory]
    total: int
    page: int
    limit: int
    has_more: bool

@router.get("/session/{session_id}", response_model=List[schemas.ChatHistory])
def read_session_chat_history(
    session_id: str,
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """
    獲取特定 session_id 的所有聊天記錄
    
    - **session_id**: 聊天 session 的唯一識別碼
    - **user_id**: 可選的用戶ID, 如果提供則只返回該用戶的聊天記錄
    - 返回: 該 session 的所有聊天記錄，按時間順序排列
    """
    query = (
        db.query(models.Chat)
        .filter(models.Chat.session_id == session_id)
    )
    
    # 如果提供了 user_id，則加入過濾條件
    if user_id is not None:
        query = query.filter(models.Chat.user_id == user_id)
    
    chats = query.order_by(models.Chat.timestamp).all()
    return chats

@router.get("/", response_model=PaginatedChatHistory)
def read_chat_history(
    skip: int = 0, 
    limit: int = 20,
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """
    獲取聊天歷史記錄，按照時間倒序排列並依據 session_id 分組
    
    - **skip**: 跳過前面的記錄數量
    - **limit**: 返回的最大記錄數量，預設為20
    - **user_id**: 可選的用戶ID，如果提供則只返回該用戶的聊天記錄
    - 返回: 分頁的聊天歷史記錄，包含記錄總數和是否有更多記錄
    """
    # 使用子查詢找出每個 session 最新的對話
    latest_chats_query = (
        db.query(
            models.Chat.session_id,
            func.max(models.Chat.timestamp).label('max_timestamp')
        )
    )
    
    # 如果有提供 user_id，則過濾該用戶的聊天記錄
    if user_id is not None:
        latest_chats_query = latest_chats_query.filter(models.Chat.user_id == user_id)
    
    latest_chats = latest_chats_query.group_by(models.Chat.session_id).subquery()

    # 主查詢與子查詢關聯，並按時間倒序排序
    chats_query = (
        db.query(models.Chat)
        .join(
            latest_chats,
            (models.Chat.session_id == latest_chats.c.session_id) &
            (models.Chat.timestamp == latest_chats.c.max_timestamp)
        )
    )
    
    # 如果有提供 user_id，在主查詢中也加入過濾
    if user_id is not None:
        chats_query = chats_query.filter(models.Chat.user_id == user_id)
    
    chats = (
        chats_query
        .order_by(desc(models.Chat.timestamp))
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # 獲取總記錄數（不同的 session 數量）
    total_query = db.query(func.count(func.distinct(models.Chat.session_id)))
    
    # 如果有提供 user_id，在計數查詢中也加入過濾
    if user_id is not None:
        total_query = total_query.filter(models.Chat.user_id == user_id)
    
    total_count = total_query.scalar()
    
    # 計算是否有更多記錄
    has_more = total_count > skip + limit
    
    # 返回分頁響應
    return {
        "items": chats,
        "total": total_count,
        "page": skip // limit,
        "limit": limit,
        "has_more": has_more
    }
