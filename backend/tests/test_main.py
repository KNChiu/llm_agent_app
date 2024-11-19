import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import asyncio

from main import app, get_db
from database import Base
from models import Chat

# 使用測試用的 SQLite 數據庫
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
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
    async def mock_call_openai_api(message: str, model: str = "gpt-4o-mini") -> str:
        return f"這是來自 {model} 的測試回應"
    
    monkeypatch.setattr("main.call_openai_api", mock_call_openai_api)
    
    # 測試默認模型
    response = client.post(
        "/chat",
        json={"message": "測試訊息"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "這是來自 gpt-4o-mini 的測試回應"
    assert "id" in data
    assert "timestamp" in data

    # 測試指定模型
    response = client.post(
        "/chat",
        json={"message": "測試訊息", "model": "gpt-4"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "這是來自 gpt-4 的測試回應"

@pytest.mark.asyncio
async def test_create_chat_error(client, monkeypatch):
    # 模擬 OpenAI API 錯誤
    async def mock_call_openai_api_error(message: str, model: str = "gpt-4o-mini") -> str:
        raise Exception("API 錯誤")
    
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