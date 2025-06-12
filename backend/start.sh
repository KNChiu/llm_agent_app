#!/bin/bash

# 設置默認值
HOST=${HOST:-"0.0.0.0"}
PORT=${PORT:-8000}
WORKERS=${WORKERS:-1}

# 檢查是否在生產環境
if [ "$ENVIRONMENT" = "production" ]; then
    echo "Starting in production mode with $WORKERS workers..."
    uvicorn main:app --host $HOST --port $PORT --workers $WORKERS
else
    echo "Starting in development mode..."
    uvicorn main:app --host $HOST --port $PORT --reload
fi