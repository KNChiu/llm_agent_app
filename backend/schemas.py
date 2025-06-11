# schemas.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional, List

class ImageData(BaseModel):
    base64: str
    name: str
    type: str

class ChatRequest(BaseModel):
    session_id: UUID
    message: str
    context: list = []
    model: str = "gpt-4o-mini"
    temperature: float = 0.7
    max_tokens: int = 1000
    prompt: str = ""
    api_type: str = "openai"
    user_id: UUID | None = None
    images: Optional[List[ImageData]] = None

class ChatResponse(BaseModel):
    turn_id: UUID
    message: str
    timestamp: datetime

    model_config = ConfigDict(
        from_attributes=True
    )

class ChatHistory(BaseModel):
    session_id: UUID
    turn_id: UUID
    user_id: UUID | None = None
    user_message: str
    assistant_message: str
    timestamp: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
