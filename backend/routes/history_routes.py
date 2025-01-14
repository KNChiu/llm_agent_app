import models
import schemas
import logging
from typing import List
from sqlalchemy import desc, func
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from utils.dependencies import get_db
from utils.logging import setup_logging


setup_logging()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/session/{session_id}", response_model=List[schemas.ChatHistory])
def read_session_chat_history(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    獲取特定 session_id 的所有聊天記錄
    
    - **session_id**: 聊天 session 的唯一識別碼
    - 返回: 該 session 的所有聊天記錄，按時間順序排列
    """
    chats = (
        db.query(models.Chat)
        .filter(models.Chat.session_id == session_id)
        .order_by(models.Chat.timestamp)
        .all()
    )
    return chats

@router.get("/", response_model=List[schemas.ChatHistory])
def read_chat_history(
    skip: int = 0, 
    limit: int = 20,  # 設定較小的預設值
    db: Session = Depends(get_db)
):
    """
    獲取聊天歷史記錄，按照時間倒序排列並依據 session_id 分組
    
    - **skip**: 跳過前面的記錄數量
    - **limit**: 返回的最大記錄數量，預設為20
    - 返回: 聊天歷史記錄列表，每個 session 只返回最新的一筆對話
    """
    # 使用子查詢找出每個 session 最新的對話
    latest_chats = (
        db.query(
            models.Chat.session_id,
            func.max(models.Chat.timestamp).label('max_timestamp')
        )
        .group_by(models.Chat.session_id)
        .subquery()
    )

    # 主查詢與子查詢關聯，並按時間倒序排序
    chats = (
        db.query(models.Chat)
        .join(
            latest_chats,
            (models.Chat.session_id == latest_chats.c.session_id) &
            (models.Chat.timestamp == latest_chats.c.max_timestamp)
        )
        .order_by(desc(models.Chat.timestamp))
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return chats
