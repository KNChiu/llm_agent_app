from datetime import datetime
from fastapi import APIRouter
from sqlalchemy import text
from database import engine


router = APIRouter()

@router.get("/health")
async def health_check():
    """
    健康檢查端點
    """
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@router.get("/db-activity")
async def db_activity():
    """
    資料庫活動端點 - 用於保持資料庫連接活躍
    """
    try:
        # 執行簡單查詢以保持連接活躍
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok", "message": "Database connection active", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        return {"status": "error", "message": str(e), "timestamp": datetime.now().isoformat()}
