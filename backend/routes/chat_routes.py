import models
import schemas
import logging
from database import engine
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException, Depends
import google.generativeai as genai
import os

from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage, SystemMessage, AIMessage

from utils.dependencies import get_db
from utils.logging import setup_logging
from utils.backend_logger import BackendLogger

from dotenv import load_dotenv

load_dotenv()
models.Base.metadata.create_all(bind=engine)

setup_logging()
logger = BackendLogger("chat_routes").logger
backend_logger = BackendLogger().logger

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
            session_id=chat.session_id,
            turn_id=uuid.uuid4(),
            user_message=chat.message,
            assistant_message="",
            timestamp=datetime.now()
        )

        if chat.api_type == 'gemini':
            response = await call_gemini_api(
                chat.message,
                chat.context,
                chat.prompt,
                chat.model  # 傳遞 model 參數
            )
        elif chat.api_type == 'openai':
            response = await call_openai_api(
                chat.message,
                chat.model,
                chat.temperature,
                chat.max_tokens,
                chat.context,
                chat.prompt
            )
        else:
            response = await call_openrouter_api(
                message=chat.message,
                model=chat.model,
                temperature=chat.temperature,
                max_tokens=chat.max_tokens,
                context=chat.context,
                prompt=chat.prompt
            )

        # 記錄 AI 回應
        logger.info(f"Assistant: {response}")

        # 更新對話記錄
        db_chat.assistant_message = response
        db.add(db_chat)
        db.commit()
        db.refresh(db_chat)

        backend_logger.debug(f"session_id: {chat.session_id}, turn_id: {db_chat.turn_id}, api_type: {chat.api_type}, model: {chat.model}, temperature: {chat.temperature}, max_tokens: {chat.max_tokens}, user_message: {chat.message}, assistant_message: {response}")

        return {
            "turn_id": db_chat.turn_id,
            "message": response,
            "timestamp": db_chat.timestamp
        }
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
else:
    logger.warning("GOOGLE_API_KEY environment variable is not set.")

async def call_openai_api(
    message: str,
    model: str,
    temperature: float = 0.7,
    max_tokens: int = 1000,
    context: list = [],
    prompt: str = "",  # 新增 prompt 參數
) -> str:
    try:
        messages = []
        system_message = SystemMessage(content=prompt)
        messages.append(system_message)

        if prompt:
            logger.info(f"Prompt: {prompt}")
        if context:
            logger.info(f"Context: {context}")
        logger.info(f"User: {message}")
        logger.info(
            f"Params: model={model}, temperature={temperature}, max_tokens={max_tokens}"
        )

        ### Prepare the conversation history with user inputs and responses.
        if len(context) == 0:
            messages.append(HumanMessage(content=message))
        else:
            for h in context:
                user_message = h["user_message"]
                if h.get("file_content"):
                    user_message = (
                        f"FileContent:\n{h['file_content']}\n\nQuestion: {h['user_message']}"
                    )

                messages.append(HumanMessage(content=user_message))
                if h.get("assistant_message") and h["assistant_message"] != "":
                    messages.append(AIMessage(content=h["assistant_message"]))

        llm = ChatOpenAI(
            model_name=model, temperature=temperature, max_tokens=max_tokens
        )
        response = llm.invoke(messages).content

        if isinstance(response, str):
            response = response.strip()
        else:
            raise ValueError("Unexpected response format from LangChain.")

        return response

    except Exception as e:
        logger.error(f"Langchain API error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def call_gemini_api(
    message: str, 
    context: list = [], 
    prompt: str = "", 
    model: str = "gemini-2.0-flash-exp"
) -> str:
    try:
        gemini_model = genai.GenerativeModel(model)
        contents = []
        if prompt:
            contents.append({"role": "user", "parts": [prompt]})
            logger.info(f"Prompt: {prompt}")
        if context:
            logger.info(f"Context: {context}")
            for h in context:
                user_message = h["user_message"]
                if h.get("file_content"):
                    user_message = (
                        f"FileContent:\n{h['file_content']}\n\nQuestion: {h['user_message']}"
                    )
                contents.append({"role": "user", "parts": [user_message]})
                if h.get("assistant_message") and h["assistant_message"] != "":
                    contents.append({"role": "model", "parts": [h["assistant_message"]]})

        contents.append({"role": "user", "parts": [message]})
        logger.info(f"User: {message}")

        response = gemini_model.generate_content(contents)

        if response.parts:
            return response.parts[0].text
        else:
            raise ValueError("No response parts from Gemini API.")

    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def call_openrouter_api(
    message: str,
    context: list = [],
    prompt: str = "",
    model: str = "deepseek/deepseek-chat-v3-0324:free",
    temperature: float = 0.7,
    max_tokens: int = 1000,
) -> str:
    try:

        messages = []
        if prompt:
            messages.append({"role": "system", "content": prompt})
            logger.info(f"Prompt: {prompt}")
        
        if context:
            logger.info(f"Context: {context}")
        logger.info(f"User: {message}")
        logger.info(
            f"Params: model={model}, temperature={temperature}, max_tokens={max_tokens}"
        )

        ### Prepare the conversation history with user inputs and responses.
        if len(context) == 0:
            messages.append(HumanMessage(content=message))
        else:
            for h in context:
                user_message = h["user_message"]
                if h.get("file_content"):
                    user_message = (
                        f"FileContent:\n{h['file_content']}\n\nQuestion: {h['user_message']}"
                    )

                messages.append(HumanMessage(content=user_message))
                if h.get("assistant_message") and h["assistant_message"] != "":
                    messages.append(AIMessage(content=h["assistant_message"]))

        llm = ChatOpenAI(
            model_name=model, temperature=temperature, max_tokens=max_tokens, base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )
        response = llm.invoke(messages).content

        if isinstance(response, str):
            response = response.strip()
        else:
            raise ValueError("Unexpected response format from LangChain.")

        return response

    except Exception as e:
        logger.error(f"OpenRouter API error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))