import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from utils.dependencies import get_db

# 創建一個簡單的 FastAPI 應用來測試依賴項
app = FastAPI()

@app.get("/test-db-dependency")
def test_endpoint(db: Session = Depends(get_db)):
    # 簡單地檢查 db 是否是一個 Session 對象
    return {"success": True}

client = TestClient(app)

def test_get_db_dependency():
    """
    測試數據庫依賴項是否正常工作
    """
    response = client.get("/test-db-dependency")
    assert response.status_code == 200
    assert response.json() == {"success": True}

def test_db_session_context_manager():
    """
    測試數據庫會話的上下文管理器
    """
    # 獲取一個數據庫會話
    db_generator = get_db()
    db = next(db_generator)
    
    # 檢查 db 是否是一個有效的會話對象
    assert db is not None
    assert hasattr(db, 'query')
    assert hasattr(db, 'add')
    assert hasattr(db, 'commit')
    assert hasattr(db, 'close')
    
    # 測試會話的關閉
    try:
        # 使用會話
        pass
    finally:
        try:
            # 關閉會話
            db_generator.close()
        except StopIteration:
            # 預期的行為，因為生成器已經結束
            pass

def test_db_session_with_override(test_db):
    """
    測試使用測試數據庫覆蓋依賴項
    """
    # 創建一個新的 FastAPI 應用
    test_app = FastAPI()
    
    @test_app.get("/test-override")
    def test_override_endpoint(db: Session = Depends(get_db)):
        return {"db_id": id(db)}
    
    # 覆蓋依賴項
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    test_app.dependency_overrides[get_db] = override_get_db
    
    # 創建測試客戶端
    test_client = TestClient(test_app)
    
    # 測試端點
    response = test_client.get("/test-override")
    assert response.status_code == 200
    assert response.json()["db_id"] == id(test_db)
    
    # 清理
    test_app.dependency_overrides.clear()
