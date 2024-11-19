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
import logging

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

# 設置日誌配置
logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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
        # 記錄用戶請求
        logger.info(f"User: {chat.message}")
        
        # 創建對話歷史記錄
        db_chat = models.Chat(
            user_message=chat.message,
            timestamp=datetime.now()
        )
        
        # 傳入所有參數
        response = await call_openai_api(
            chat.message, 
            chat.model,
            chat.temperature,
            chat.max_tokens
        )
        
        # 記錄 AI 回應
        logger.info(f"Assistant: {response}")
        
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
        logger.error(f"Chat error: {str(e)}")
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

@app.get("/logs")
async def get_logs(lines: int = 100):
    """
    獲取最新的日誌記錄，並按對話分組
    
    - **lines**: 要返回的日誌行數
    - 返回: 按對話分組的日誌記錄
    """
    try:
        if not os.path.exists('app.log'):
            return {"conversations": []}
            
        with open('app.log', 'r', encoding='utf-8') as file:
            logs = file.readlines()[-lines:]
            
        # 按對話分組
        conversations = []
        current_conversation = []
        
        for log in logs:
            # 解析日誌行
            if "User:" in log:
                # 如果有前一個對話，保存它
                if current_conversation:
                    conversations.append(current_conversation)
                # 開始新的對話
                current_conversation = [log.strip()]
            elif "Params:" in log:
                if current_conversation:
                    current_conversation.append(log.strip())
            elif "Assistant:" in log:
                if current_conversation:  # 確保有對應的用戶訊息
                    current_conversation.append(log.strip())
            elif "Chat error:" in log and current_conversation:
                # 如果是錯誤訊息且屬於當前對話
                current_conversation.append(log.strip())
        
        # 添加最後一個對話
        if current_conversation:
            conversations.append(current_conversation)
            
        return {
            "conversations": conversations,
            "total_conversations": len(conversations)
        }
        
    except Exception as e:
        logger.error(f"Get logs error: {str(e)}")
        raise HTTPException(status_code=500, detail="無法讀取日誌文件")

async def call_openai_api(message: str, model: str = "gpt-4-mini", temperature: float = 0.7, max_tokens: int = 1000) -> str:
    try:
        logger.info(f"Params: model: {model}, temperature: {temperature}")
        client = AsyncOpenAI()
        
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": message}
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error calling OpenAI API")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    
