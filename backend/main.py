# main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import SessionLocal, engine
from datetime import datetime
import openai
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

# 載入環境變數
load_dotenv()

# 創建數據表
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="聊天 API",
    description="這是一個使用 FastAPI 和 OpenAI 實現的聊天 API",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生產環境中應該指定確切的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI 配置
openai.api_key = os.getenv("OPENAI_API_KEY")

# 依賴注入
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/chat", response_model=schemas.ChatResponse)
async def create_chat(chat: schemas.ChatRequest, db: Session = Depends(get_db)):
    """
    創建新的聊天對話
    
    - **message**: 使用者輸入的訊息
    - 返回: 包含 AI 回應的對話記錄
    """
    try:
        # 創建對話歷史記錄
        db_chat = models.Chat(
            user_message=chat.message,
            timestamp=datetime.now()
        )
        
        # 調用 OpenAI API
        response = await call_openai_api(chat.message)
        
        # 更新對話記錄
        db_chat.assistant_message = response
        db.add(db_chat)
        db.commit()
        db.refresh(db_chat)
        
        return {
            "id": db_chat.id,
            "message": response,
            "timestamp": db_chat.timestamp
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history", response_model=List[schemas.ChatHistory])
def read_chat_history(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    獲取聊天歷史記錄
    
    - **skip**: 跳過前面的記錄數量
    - **limit**: 返回的最大記錄數量
    - 返回: 聊天歷史記錄列表
    """
    chats = db.query(models.Chat).offset(skip).limit(limit).all()
    return chats

async def call_openai_api(message: str) -> str:
    try:
        # 建立 OpenAI 客戶端
        client = AsyncOpenAI()

        
        # 使用新的 API 格式
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": message}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI API error: {e}")
        raise HTTPException(status_code=500, detail="Error calling OpenAI API")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    
