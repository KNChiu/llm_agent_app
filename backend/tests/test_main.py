import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import asyncio

from main import app, get_db
from database import Base
from models import Chat
import os

# 確保 data 目錄存在
os.makedirs("data", exist_ok=True)

# 使用測試用的 SQLite 數據庫
SQLALCHEMY_DATABASE_URL = "sqlite:///data/test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 創建測試用的依賴覆蓋
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    # 設置測試數據庫
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    # 清理測試數據庫
    Base.metadata.drop_all(bind=engine)

@pytest.mark.asyncio
async def test_create_chat(client, monkeypatch):
    # 模擬 OpenAI API 響應
    async def mock_call_openai_api(
        message: str, 
        model: str = "gpt-4-mini", 
        temperature: float = 0.7, 
        max_tokens: int = 1000,
        context: list = [],
        prompt: str = ""
    ) -> str:
        final_message = f"{prompt}\n{message}" if prompt else message
        return f"這是來自 {model} 的測試回應，訊息：{final_message}"
    
    monkeypatch.setattr("main.call_openai_api", mock_call_openai_api)
    
    # 測試基本功能
    response = client.post(
        "/chat",
        json={"message": "測試訊息"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "這是來自 gpt-4-mini 的測試回應，訊息：測試訊息"

    # 測試帶有 prompt 的請求
    response = client.post(
        "/chat",
        json={
            "message": "測試訊息",
            "prompt": "系統提示：請用正式的語氣回答",
            "model": "gpt-4",
            "temperature": 0.5,
            "max_tokens": 500
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "系統提示：請用正式的語氣回答\n測試訊息" in data["message"]

    # 測試帶有上下文的請求
    response = client.post(
        "/chat",
        json={
            "message": "測試訊息",
            "context": [
                {"user_message": "之前的訊息", "assistant_message": "之前的回應"}
            ]
        }
    )
    
    assert response.status_code == 200
    assert "id" in data
    assert "timestamp" in data

@pytest.mark.asyncio
async def test_create_chat_error(client, monkeypatch):
    # 模擬 OpenAI API 錯誤
    async def mock_call_openai_api_error(
        message: str, 
        model: str = "gpt-4-mini", 
        temperature: float = 0.7, 
        max_tokens: int = 1000,
        context: list = [],
        prompt: str = ""
    ) -> str:
        raise Exception("Error calling OpenAI API")
    
    monkeypatch.setattr("main.call_openai_api", mock_call_openai_api_error)
    
    response = client.post(
        "/chat",
        json={"message": "測試訊息"}
    )
    
    assert response.status_code == 500
    assert response.json()["detail"] == "Error calling OpenAI API"

def test_read_chat_history(client):
    # 創建測試數據
    db = TestingSessionLocal()
    test_chats = [
        Chat(
            user_message="測試用戶訊息 1",
            assistant_message="測試助手回應 1",
            timestamp=datetime.now()
        ),
        Chat(
            user_message="測試用戶訊息 2",
            assistant_message="測試助手回應 2",
            timestamp=datetime.now()
        )
    ]
    
    for chat in test_chats:
        db.add(chat)
    db.commit()
    
    # 測試分頁
    response = client.get("/history?skip=0&limit=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["user_message"] == "測試用戶訊息 1"
    
    # 測試完整列表
    response = client.get("/history")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2 