# schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    id: int
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ChatHistory(BaseModel):
    id: int
    user_message: str
    assistant_message: str
    timestamp: datetime

    class Config:
        from_attributes = True