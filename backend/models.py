# models.py
from sqlalchemy import Column, Integer, String, DateTime
from database import Base

class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    user_message = Column(String)
    assistant_message = Column(String)
    timestamp = Column(DateTime)