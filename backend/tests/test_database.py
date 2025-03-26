import pytest
from datetime import datetime
import uuid
from fastapi.testclient import TestClient
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import importlib.util
import os
import sys

# 在導入 models 之前，確保使用測試數據庫
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

# 動態導入 models 模塊
spec = importlib.util.spec_from_file_location("models", os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models.py')))
models = importlib.util.module_from_spec(spec)
spec.loader.exec_module(models)

# 動態導入 main 模塊
spec = importlib.util.spec_from_file_location("main", os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'main.py')))
main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(main)

from utils.dependencies import get_db
app = main.app

client = TestClient(app)

# def test_create_and_read_chat(test_db):
#     """
#     測試創建和讀取聊天記錄
#     """
#     # 創建一個新的聊天記錄
#     session_id = uuid.uuid4()
#     turn_id = uuid.uuid4()
#     timestamp = datetime.now()
#
#     chat = models.Chat(
#         session_id=session_id,
#         turn_id=turn_id,
#         user_message="測試用戶訊息",
#         assistant_message="測試助手回應",
#         timestamp=timestamp
#     )
#
#     # 添加到數據庫
#     test_db.add(chat)
#     test_db.commit()
#     test_db.refresh(chat)
#
#     # 從數據庫讀取
#     db_chat = test_db.query(models.Chat).filter(models.Chat.turn_id == turn_id).first()
#
#     # 驗證數據
#     assert db_chat is not None
#     assert db_chat.session_id == session_id
#     assert db_chat.turn_id == turn_id
#     assert db_chat.user_message == "測試用戶訊息"
#     assert db_chat.assistant_message == "測試助手回應"
#     assert db_chat.timestamp == timestamp

# def test_query_chat_by_session(test_db):
#     """
#     測試按 session_id 查詢聊天記錄
#     """
#     # 創建一個共同的 session_id
#     session_id = uuid.uuid4()
#
#     # 創建多個聊天記錄
#     for i in range(3):
#         chat = models.Chat(
#             session_id=session_id,
#             turn_id=uuid.uuid4(),
#             user_message=f"用戶訊息 {i}",
#             assistant_message=f"助手回應 {i}",
#             timestamp=datetime.now()
#         )
#         test_db.add(chat)
#
#     # 創建一個不同 session_id 的聊天記錄
#     other_chat = models.Chat(
#         session_id=uuid.uuid4(),
#         turn_id=uuid.uuid4(),
#         user_message="其他用戶訊息",
#         assistant_message="其他助手回應",
#         timestamp=datetime.now()
#     )
#     test_db.add(other_chat)
#
#     test_db.commit()
#
#     # 查詢特定 session_id 的聊天記錄
#     chats = test_db.query(models.Chat).filter(models.Chat.session_id == session_id).all()
#
#     # 驗證結果
#     assert len(chats) == 3
#     for i, chat in enumerate(chats):
#         assert chat.session_id == session_id
#         assert chat.user_message.startswith("用戶訊息")
#         assert chat.assistant_message.startswith("助手回應")

# def test_chat_api_with_db(test_db, monkeypatch):
#     """
#     測試聊天 API 與數據庫的交互
#     """
#     # 模擬 API 調用
#     def mock_call_openai_api(*args, **kwargs):
#         return "這是一個模擬的回應"
#
#     # 修改 chat_routes 模塊中的 call_openai_api 函數
#     monkeypatch.setattr("routes.chat_routes.call_openai_api", mock_call_openai_api)
#
#     # 修改依賴項以使用測試數據庫
#     def override_get_db():
#         try:
#             yield test_db
#         finally:
#             pass
#
#     app.dependency_overrides[get_db] = override_get_db
#
#     # 發送聊天請求
#     session_id = str(uuid.uuid4())
#     chat_request = {
#         "message": "測試訊息",
#         "session_id": session_id,
#         "model": "gpt-4o-mini",
#         "temperature": 0.7,
#         "max_tokens": 1000,
#         "context": [],
#         "prompt": "你是一個有幫助的助手",
#         "api_type": "openai"
#     }
#
#     response = client.post("/chat/", json=chat_request)
#     assert response.status_code == 200
#
#     # 驗證數據庫中是否有記錄
#     db_chat = test_db.query(models.Chat).filter(models.Chat.session_id == uuid.UUID(session_id)).first()
#     assert db_chat is not None
#     assert db_chat.user_message == "測試訊息"
#     assert db_chat.assistant_message == "這是一個模擬的回應"
#
#     # 清理
#     app.dependency_overrides.clear()
