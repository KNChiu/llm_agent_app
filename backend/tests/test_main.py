import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import json
import uuid
from uuid import UUID
import importlib.util
import os
import sys
from tests.conftest import override_get_db, test_db

# 在導入 main 之前，確保使用測試數據庫
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

# 動態導入 main 模塊
spec = importlib.util.spec_from_file_location("main", os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'main.py')))
main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(main)

from utils.dependencies import get_db
app = main.app

client = TestClient(app)

@pytest.fixture
def override_get_db(test_db):
    """
    覆蓋 get_db 依賴項以使用測試數據庫
    """
    def _get_test_db():
        try:
            yield test_db
        finally:
            pass
    return _get_test_db

app.dependency_overrides[get_db] = override_get_db
