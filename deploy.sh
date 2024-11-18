#!/bin/bash

# 停止所有運行中的容器
echo "停止容器..."
docker-compose down

# 清理未使用的 Docker 資源
echo "清理 Docker 資源..."
docker system prune -f

# 重新構建和啟動容器
echo "重新構建和啟動容器..."
docker-compose up --build -d

# 顯示容器日誌
echo "顯示容器日誌..."
docker-compose logs -f 