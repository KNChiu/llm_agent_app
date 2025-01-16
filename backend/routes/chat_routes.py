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
        else:
            # 傳入所有參數，包括 prompt
            response = await call_openai_api(
                chat.message,
                chat.model,
                chat.temperature,
                chat.max_tokens,
                chat.context,
                chat.prompt,
                chat.api_type
            )

        # 記錄 AI 回應
        logger.info(f"Assistant: {response}")

        # 更新對話記錄
        db_chat.assistant_message = response
        db.add(db_chat)
        db.commit()
        db.refresh(db_chat)

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
    model: str = "gpt-4-mini",
    temperature: float = 0.7,
    max_tokens: int = 1000,
    context: list = [],
    prompt: str = "",  # 新增 prompt 參數
    api_type: str = "openai",
) -> str:
    try:
        if api_type == "openai":
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
        elif api_type == "gemini":
            return await call_gemini_api(message, context=context, prompt=prompt, model=model)
        else:
            raise ValueError(f"Unsupported API type: {api_type}")

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