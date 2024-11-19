# main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import SessionLocal, engine
from datetime import datetime, timedelta
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
async def get_logs(
    lines: int = 100,
    start_date: str = None,
    end_date: str = None,
    keyword: str = None
):
    """
    獲取最新的日誌記錄，並按對話分組
    
    - **lines**: 要返回的日誌行數
    - **start_date**: 開始日期 (YYYY-MM-DD)
    - **end_date**: 結束日期 (YYYY-MM-DD)
    - **keyword**: 搜尋關鍵字
    - 返回: 按對話分組的日誌記錄
    """
    try:
        if not os.path.exists('app.log'):
            return {"conversations": [], "total_conversations": 0}
            
        # 只在有提供日期時才解析日期
        start_datetime = None
        end_datetime = None
        if start_date and start_date.strip():  # 檢查是否為空字符串
            try:
                start_datetime = datetime.strptime(start_date, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                logger.warning(f"無效的開始日期格式: {start_date}")
                
        if end_date and end_date.strip():  # 檢查是否為空字符串
            try:
                end_datetime = datetime.strptime(end_date, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                logger.warning(f"無效的結束日期格式: {end_date}")
            
        # 清理關鍵字
        keyword = keyword.strip() if keyword else None
            
        with open('app.log', 'r', encoding='utf-8') as file:
            logs = file.readlines()[-lines:]
            
        conversations = []
        current_conversation = []
        should_include_conversation = False
        
        for log in logs:
            try:
                log_datetime = datetime.strptime(log.split(" - ")[0], "%Y-%m-%d %H:%M:%S,%f")
                
                # 日期和關鍵字檢查
                passes_date_filter = (
                    (not start_datetime or log_datetime >= start_datetime) and
                    (not end_datetime or log_datetime <= end_datetime)
                )
                
                passes_keyword_filter = not keyword or keyword.lower() in log.lower()
                
                # 解析日誌行
                if "User:" in log:
                    # 如果有前一個對話且需要被包含，則加入結果中
                    if current_conversation and should_include_conversation:
                        conversations.append(current_conversation)
                    # 重置對話和過濾標記
                    current_conversation = [log.strip()]
                    should_include_conversation = passes_date_filter and passes_keyword_filter
                elif any(marker in log for marker in ["Params:", "Assistant:", "Chat error:"]):
                    if current_conversation:
                        current_conversation.append(log.strip())
                        # 更新過濾標記
                        should_include_conversation = should_include_conversation or (passes_date_filter and passes_keyword_filter)
            except ValueError as e:
                logger.error(f"解析日誌時間出錯: {str(e)}")
                continue
        
        # 處理最後一個對話
        if current_conversation and should_include_conversation:
            conversations.append(current_conversation)
            
        # 只返回實際使用的過濾條件
        active_filters = {}
        if start_datetime:
            active_filters["start_date"] = start_date
        if end_datetime:
            active_filters["end_date"] = end_date
        if keyword:
            active_filters["keyword"] = keyword
            
        return {
            "conversations": conversations,
            "total_conversations": len(conversations),
            "active_filters": active_filters  # 只返回實際使用的過濾條件
        }
        
    except Exception as e:
        logger.error(f"讀取日誌出錯: {str(e)}")
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

@app.get("/health")
async def health_check():
    """
    健康檢查端點
    """
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    
