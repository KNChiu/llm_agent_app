import models
import schemas
import logging
from database import engine
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException, Depends

from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate

from utils.dependencies import get_db
from utils.logging import setup_logging

from dotenv import load_dotenv


load_dotenv()
models.Base.metadata.create_all(bind=engine)

setup_logging()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=schemas.ChatResponse)
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
        
        # 傳入所有參數，包括 prompt
        response = await call_openai_api(
            chat.message, 
            chat.model,
            chat.temperature,
            chat.max_tokens,
            chat.context,
            chat.prompt  # 新增 prompt 參數
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


async def call_openai_api(
    message: str, 
    model: str = "gpt-4-mini", 
    temperature: float = 0.7, 
    max_tokens: int = 1000, 
    context: list = [],
    prompt: str = ""  # 新增 prompt 參數
) -> str:
    try:
        # 記錄用戶請求和上下文
        final_message = f"{prompt}\n{message}" if prompt else message
        logger.info(f"User: {final_message}")
        if context:
            logger.info(f"Context: {context}")
        if prompt:
            logger.info(f"Prompt: {prompt}")

        # 記錄參數
        logger.info(f"Params: model={model}, temperature={temperature}, max_tokens={max_tokens}")

        # 使用 Langchain 生成回應
        llm = ChatOpenAI(model_name=model, temperature=temperature)
        prompt_template = PromptTemplate(input_variables=["message"], template=final_message)
        chain = LLMChain(llm=llm, prompt=prompt_template)

        response = await chain.arun(message=final_message)
        return response
    except Exception as e:
        logger.error(f"Langchain API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error calling Langchain API")
