# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
from utils.backend_logger import BackendLogger
backend_logger = BackendLogger().logger

# 載入環境變數
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
db_type = DATABASE_URL.split("+")[0]

# 創建 SQLAlchemy 引擎
engine = create_engine(DATABASE_URL)

# 創建 SessionLocal 類
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 創建基礎類別
Base = declarative_base()

# 測試連接
try:
    with engine.connect() as connection:
        backend_logger.info(f"Connection {db_type} successful!")
except Exception as e:
    backend_logger.error(f"Failed to connect  {db_type}: {e}")