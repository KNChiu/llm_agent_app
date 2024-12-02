import models
import schemas
import logging
from typing import List

from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from utils.dependencies import get_db
from utils.logging import setup_logging


setup_logging()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[schemas.ChatHistory])
def read_chat_history(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    獲取聊天歷史記錄
    
    - **skip**: 跳過前面的記錄數量
    - **limit**: 返回的最大記錄數量
    - 返回: 聊天歷史記錄列表
    """
    chats = db.query(models.Chat).offset(skip).limit(limit).all()
    return chats