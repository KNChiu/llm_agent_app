import os
import uuid
import models
import schemas
from database import engine
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from typing import AsyncGenerator
import google.generativeai as genai
from langchain_openai import ChatOpenAI
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

async def stream_and_save(
    db: Session,
    chat_request: schemas.ChatRequest,
    api_call: callable,
) -> AsyncGenerator[str, None]:
    db_chat = models.Chat(
        session_id=chat_request.session_id,
        turn_id=uuid.uuid4(),
        user_id=chat_request.user_id,
        user_message=chat_request.message,
        assistant_message="",
        timestamp=datetime.now()
    )
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)

    full_response = ""
    try:
        if chat_request.api_type == 'gemini':
            stream = api_call(
                chat_request.message,
                chat_request.context,
                chat_request.prompt,
                chat_request.model
            )
        elif chat_request.api_type == 'openai':
            stream = api_call(
                chat_request.message,
                chat_request.model,
                chat_request.temperature,
                chat_request.max_tokens,
                chat_request.context,
                chat_request.prompt
            )
        else:
            stream = api_call(
                message=chat_request.message,
                model=chat_request.model,
                temperature=chat_request.temperature,
                max_tokens=chat_request.max_tokens,
                context=chat_request.context,
                prompt=chat_request.prompt
            )

        async for chunk in stream:
            if chunk:
                full_response += chunk
                yield chunk
                logger.debug(f"Stream chunk: {chunk}")

    except Exception as e:
        logger.error(f"Streaming error in {chat_request.api_type}: {str(e)}")
        yield f"Error: {str(e)}"
        db_chat.assistant_message = f"Error: {str(e)}"
    finally:
        if not db_chat.assistant_message.startswith("Error:"):
            db_chat.assistant_message = full_response
        db.add(db_chat)
        db.commit()
        db.refresh(db_chat)
        logger.info(f"Streaming finished. Full response saved for turn {db_chat.turn_id}.")
        backend_logger.debug(f"session_id: {chat_request.session_id}, turn_id: {db_chat.turn_id}, api_type: {chat_request.api_type}, model: {chat_request.model}, temperature: {chat_request.temperature}, max_tokens: {chat_request.max_tokens}, user_message: {chat_request.message}, assistant_message: {full_response}")

@router.post("/")
async def create_chat(chat: schemas.ChatRequest, db: Session = Depends(get_db)):
    """
    創建新的聊天對話

    - **message**: 使用者輸入的訊息
    - **user_id**: 可選的用戶ID, 用於區分不同用戶的對話
    - 返回: 包含 AI 回應的對話記錄
    """
    try:
        api_call = None
        if chat.api_type == 'gemini':
            api_call = call_gemini_api
        elif chat.api_type == 'openai':
            api_call = call_openai_api
        elif chat.api_type == 'openrouter':
            api_call = call_openrouter_api
        else:
            raise HTTPException(status_code=400, detail="Invalid api_type specified")

        return StreamingResponse(
            stream_and_save(db, chat, api_call),
            media_type="text/plain"
        )
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
    prompt: str = "",
) -> AsyncGenerator[str, None]:
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

        messages.append(HumanMessage(content=message))
        logger.info(f"User: {message}")

        llm = ChatOpenAI(
            model_name=model, temperature=temperature, max_tokens=max_tokens, streaming=True
        )
        async for chunk in llm.astream(messages):
            yield chunk.content

    except Exception as e:
        logger.error(f"Langchain API stream error: {str(e)}")
        yield f"Error: {str(e)}"

async def call_gemini_api(
    message: str, 
    context: list = [], 
    prompt: str = "", 
    model: str = "gemini-2.0-flash-exp"
) -> AsyncGenerator[str, None]:
    try:
        # Construct the full chat history for Gemini
        chat_history = []
        if prompt:
            chat_history.append({"role": "user", "parts": [prompt]})

        if context:
            for h in context:
                user_message_ctx = h["user_message"]
                if h.get("file_content"):
                    user_message_ctx = (
                        f"FileContent:\n{h['file_content']}\n\nQuestion: {h['user_message']}"
                    )
                chat_history.append({"role": "user", "parts": [user_message_ctx]})
                if h.get("assistant_message") and h["assistant_message"] != "":
                    chat_history.append({"role": "model", "parts": [h["assistant_message"]]})
        
        # Add the current user message to the chat history
        chat_history.append({"role": "user", "parts": [message]})
        logger.info(f"User: {message}")
        logger.debug(f"Gemini call with history: {chat_history}, model: {model}")

        # Use GenerativeModel for streaming with Google AI SDK
        model_instance = genai.GenerativeModel(model_name=model)
        
        response_stream = await model_instance.generate_content_async(
            contents=chat_history,
            stream=True
        )

        async for chunk in response_stream:
            if hasattr(chunk, 'text') and chunk.text:
                yield chunk.text
            elif chunk.parts and hasattr(chunk.parts[0], 'text') and chunk.parts[0].text:
                # Fallback if it follows the other chunk structure (though chunk.text is usually sufficient)
                yield chunk.parts[0].text

    except Exception as e:
        logger.error(f"Gemini API stream error: {str(e)}")
        yield f"Error: {str(e)}"

async def call_openrouter_api(
    message: str,
    context: list = [],
    prompt: str = "",
    model: str = "deepseek/deepseek-chat-v3-0324:free",
    temperature: float = 0.7,
    max_tokens: int = 1000,
) -> AsyncGenerator[str, None]:
    try:
        messages = []
        if prompt:
            messages.append(SystemMessage(content=prompt))
            logger.info(f"Prompt: {prompt}")
        
        if context:
            logger.info(f"Context: {context}")
        logger.info(f"User: {message}")
        logger.info(
            f"Params: model={model}, temperature={temperature}, max_tokens={max_tokens}"
        )

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

        messages.append(HumanMessage(content=message))
        logger.info(f"User: {message}")

        llm = ChatOpenAI(
            model_name=model,
            temperature=temperature,
            max_tokens=max_tokens,
            streaming=True,
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )
        async for chunk in llm.astream(messages):
            yield chunk.content

    except Exception as e:
        logger.error(f"OpenRouter API stream error: {str(e)}")
        yield f"Error: {str(e)}"