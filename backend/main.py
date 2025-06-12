import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from utils.logging import setup_logging
from utils.security_middleware import (
    rate_limit_middleware,
    security_headers_middleware,
    validate_request_size,
    request_logging_middleware
)
from routes import chat_routes, log_routes, health_routes, history_routes, vectordb_routes

# 設置日誌
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="聊天 API",
    description="這是一個使用 FastAPI 和 LangChain 實現的聊天 API",
    version="1.1.0"
)

# 配置 CORS - 根據環境設置不同的安全級別
import os
from dotenv import load_dotenv

load_dotenv()

# 根據環境變數決定允許的來源
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

if ENVIRONMENT == "production":
    # 生產環境 - 嚴格的 CORS 設置
    allowed_origins = [
        FRONTEND_URL,
        "https://llm-chatbot-frontend.onrender.com",  # 你的 Render 前端域名
    ]
else:
    # 開發環境 - 較寬鬆但仍然安全的設置
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",  # 備用開發端口
        FRONTEND_URL,
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # 明確指定允許的方法
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
    ],  # 明確指定允許的頭部
    expose_headers=["X-Total-Count"],  # 暴露必要的響應頭部
    max_age=600,  # 預檢請求的緩存時間（秒）
)

# 添加安全中間件 (按順序添加，順序很重要！)
app.middleware("http")(request_logging_middleware)
app.middleware("http")(security_headers_middleware)
app.middleware("http")(rate_limit_middleware)
app.middleware("http")(validate_request_size(max_size=10 * 1024 * 1024))  # 10MB 限制

# 引入路由
app.include_router(chat_routes.router, prefix="/chat", tags=["Chat"])
app.include_router(log_routes.router, prefix="/logs", tags=["Logs"])
app.include_router(history_routes.router, prefix="/history", tags=["History"])
app.include_router(vectordb_routes.router, prefix="/vectordb", tags=["VectorDB"])
app.include_router(health_routes.router, tags=["Health"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)