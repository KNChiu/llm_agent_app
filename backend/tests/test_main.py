import pytest
import requests

def test_health_endpoint():
    url = "http://localhost:8000/health"
    response = requests.get(url)
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
