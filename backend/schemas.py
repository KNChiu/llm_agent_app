# schemas.py
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class ChatRequest(BaseModel):
    message: str
    context: list = []
    model: str = "gpt-4o-mini"
    temperature: float = 0.7
    max_tokens: int = 1000
    prompt: str = ""

class ChatResponse(BaseModel):
    id: UUID
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ChatHistory(BaseModel):
    id: UUID
    user_message: str
    assistant_message: str
    timestamp: datetime

    class Config:
        from_attributes = True