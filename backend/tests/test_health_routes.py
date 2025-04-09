import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture(scope="module")
def test_client():
    with TestClient(app) as client:
        yield client

def test_health_check(test_client: TestClient):
    """
    測試 /health 端點是否返回成功狀態和時間戳
    """
    response = test_client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "ok"
    assert "timestamp" in json_data
    
    try:
        from datetime import datetime
        datetime.fromisoformat(json_data["timestamp"])
        assert True
    except (ValueError, TypeError):
        pytest.fail("Timestamp is not in valid ISO format")