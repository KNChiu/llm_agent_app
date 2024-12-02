import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from utils.logging import setup_logging
from routes import chat_routes, log_routes, health_routes, history_routes

# 設置日誌
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="聊天 API",
    description="這是一個使用 FastAPI 和 LangChain 實現的聊天 API",
    version="1.1.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生產環境中應該指定確切的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 引入路由
app.include_router(chat_routes.router, prefix="/chat", tags=["Chat"])
app.include_router(log_routes.router, prefix="/logs", tags=["Logs"])
app.include_router(history_routes.router, prefix="/history", tags=["History"])
app.include_router(health_routes.router, tags=["Health"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)