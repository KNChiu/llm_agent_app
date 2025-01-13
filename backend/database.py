# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# 載入環境變數
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# 創建 SQLAlchemy 引擎
engine = create_engine(DATABASE_URL)

# 創建 SessionLocal 類
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 創建基礎類別
Base = declarative_base()

# 測試連接
try:
    with engine.connect() as connection:
        print("Connection successful!")
except Exception as e:
    print(f"Failed to connect: {e}")