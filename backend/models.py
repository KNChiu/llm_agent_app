# models.py
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from database import Base

class Chat(Base):
    __tablename__ = "chats"
    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    turn_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    user_message = Column(String)
    assistant_message = Column(String)
    timestamp = Column(DateTime)