import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

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

def test_create_chat(client, monkeypatch):
    # 模擬 OpenAI API 響應
    async def mock_call_openai_api(message):
        return "這是一個測試回應"
    
    from main import call_openai_api
    monkeypatch.setattr("main.call_openai_api", mock_call_openai_api)
    
    response = client.post(
        "/chat",
        json={"message": "測試訊息"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "這是一個測試回應"
    assert "id" in data
    assert "timestamp" in data

def test_read_chat_history(client):
    # 創建測試數據
    db = TestingSessionLocal()
    db_chat = Chat(
        user_message="測試用戶訊息",
        assistant_message="測試助手回應",
        timestamp=datetime.now()
    )
    db.add(db_chat)
    db.commit()
    
    response = client.get("/history")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["user_message"] == "測試用戶訊息"
    assert data[0]["assistant_message"] == "測試助手回應" 