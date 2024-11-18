# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 確保 data 目錄存在
os.makedirs("data", exist_ok=True)

# 使用 SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///data/chat.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite 需要這個參數
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()