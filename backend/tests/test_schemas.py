import pytest
from pydantic import ValidationError
import uuid
from datetime import datetime

import schemas

def test_chat_request_schema():
    """
    測試聊天請求模型的驗證
    """
    # 有效的請求
    valid_data = {
        "session_id": uuid.uuid4(),
        "message": "測試訊息",
        "context": [],
        "model": "gpt-4o-mini",
        "temperature": 0.7,
        "max_tokens": 1000,
        "prompt": "你是一個有幫助的助手",
        "api_type": "openai"
    }
    
    chat_request = schemas.ChatRequest(**valid_data)
    assert chat_request.session_id == valid_data["session_id"]
    assert chat_request.message == valid_data["message"]
    assert chat_request.model == valid_data["model"]
    assert chat_request.temperature == valid_data["temperature"]
    assert chat_request.max_tokens == valid_data["max_tokens"]
    assert chat_request.prompt == valid_data["prompt"]
    assert chat_request.api_type == valid_data["api_type"]
    
    # 測試默認值
    minimal_data = {
        "session_id": uuid.uuid4(),
        "message": "測試訊息"
    }
    
    chat_request = schemas.ChatRequest(**minimal_data)
    assert chat_request.context == []
    assert chat_request.model == "gpt-4o-mini"  # 默認值
    assert chat_request.temperature == 0.7  # 默認值
    assert chat_request.max_tokens == 1000  # 默認值
    assert chat_request.prompt == ""  # 默認值
    assert chat_request.api_type == "openai"  # 默認值
    
    # 測試無效的請求 - 缺少必要字段
    invalid_data = {
        "session_id": uuid.uuid4()
        # 缺少 message
    }
    
    with pytest.raises(ValidationError):
        schemas.ChatRequest(**invalid_data)
    
    # 測試無效的請求 - 無效的溫度值
    invalid_temperature = {
        "session_id": uuid.uuid4(),
        "message": "測試訊息",
        "temperature": 2.0  # 溫度應該在 0-1 之間
    }
    
    # 注意：Pydantic 默認不會驗證浮點數的範圍，除非在模型中明確定義了驗證器
    # 如果 schemas.py 中有定義溫度範圍的驗證器，則取消下面的註釋
    # with pytest.raises(ValidationError):
    #     schemas.ChatRequest(**invalid_temperature)

def test_chat_response_schema():
    """
    測試聊天回應模型的驗證
    """
    # 有效的回應
    valid_data = {
        "turn_id": uuid.uuid4(),
        "message": "這是一個測試回應",
        "timestamp": datetime.now()
    }
    
    chat_response = schemas.ChatResponse(**valid_data)
    assert chat_response.turn_id == valid_data["turn_id"]
    assert chat_response.message == valid_data["message"]
    assert chat_response.timestamp == valid_data["timestamp"]
    
    # 測試無效的回應 - 缺少必要字段
    invalid_data = {
        "turn_id": uuid.uuid4(),
        "message": "這是一個測試回應"
        # 缺少 timestamp
    }
    
    with pytest.raises(ValidationError):
        schemas.ChatResponse(**invalid_data)

def test_chat_history_schema():
    """
    測試聊天歷史記錄模型的驗證
    """
    # 有效的歷史記錄
    valid_data = {
        "session_id": uuid.uuid4(),
        "turn_id": uuid.uuid4(),
        "user_message": "用戶訊息",
        "assistant_message": "助手回應",
        "timestamp": datetime.now()
    }
    
    chat_history = schemas.ChatHistory(**valid_data)
    assert chat_history.session_id == valid_data["session_id"]
    assert chat_history.turn_id == valid_data["turn_id"]
    assert chat_history.user_message == valid_data["user_message"]
    assert chat_history.assistant_message == valid_data["assistant_message"]
    assert chat_history.timestamp == valid_data["timestamp"]
    
    # 測試無效的歷史記錄 - 缺少必要字段
    invalid_data = {
        "session_id": uuid.uuid4(),
        "turn_id": uuid.uuid4(),
        "user_message": "用戶訊息"
        # 缺少 assistant_message 和 timestamp
    }
    
    with pytest.raises(ValidationError):
        schemas.ChatHistory(**invalid_data)
