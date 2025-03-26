import pytest
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import importlib.util

# 添加專案根目錄到 Python 路徑
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# 在導入任何模塊之前，先設置環境變量
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

# 重新導入 database 模塊以使用新的環境變量
spec = importlib.util.spec_from_file_location("database", os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database.py')))
database = importlib.util.module_from_spec(spec)
spec.loader.exec_module(database)

# 從重新導入的 database 模塊獲取 Base
Base = database.Base

# 現在可以安全地導入其他模塊
from utils.dependencies import get_db

# 測試數據庫 URL
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def test_db():
    """
    創建測試數據庫並提供會話
    """
    # 創建內存數據庫引擎
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # 創建所有表
    Base.metadata.create_all(bind=engine)
    
    # 創建會話
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    
    try:
        yield db
    finally:
        db.close()
        
    # 清理 - 刪除所有表
    Base.metadata.drop_all(bind=engine)

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
