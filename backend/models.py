# models.py
from sqlalchemy import Column, DateTime, Index, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from database import Base

class Chat(Base):
    __tablename__ = "chats"
    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    turn_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # 添加索引
    user_message = Column(Text)  # 改為 Text 類型以支持更長的內容
    assistant_message = Column(Text)  # 改為 Text 類型以支持更長的內容
    timestamp = Column(DateTime, index=True)  # 添加索引以優化時間排序查詢

    # 明確定義複合索引以優化常見查詢
    __table_args__ = (
        # 優化按用戶和時間查詢的複合索引
        Index('idx_user_timestamp', 'user_id', 'timestamp'),
        # 優化按會話查詢的索引
        Index('idx_session_timestamp', 'session_id', 'timestamp'),
        # 優化按時間和用戶的複合索引（用於分頁查詢）
        Index('idx_timestamp_user', 'timestamp', 'user_id'),
    )