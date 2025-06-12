# 多階段構建 - 第一階段：構建階段
FROM python:3.10-slim as builder

WORKDIR /app

# 安裝構建依賴
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 複製 requirements.txt
COPY requirements.txt .

# 創建虛擬環境並安裝依賴
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 升級 pip 並安裝依賴
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 多階段構建 - 第二階段：運行階段
FROM python:3.10-slim as runtime

# 創建非 root 用戶
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# 安裝運行時依賴
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# 從構建階段複製虛擬環境
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 複製應用程序代碼
COPY --chown=appuser:appuser . .

# 創建必要的目錄並設置權限
RUN mkdir -p /app/data /app/logs && \
    chown -R appuser:appuser /app

# 切換到非 root 用戶
USER appuser

# 添加健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl --fail http://localhost:8000/health || exit 1

# 暴露端口
EXPOSE 8000

# 複製啟動腳本
COPY --chown=appuser:appuser start.sh .
RUN chmod +x start.sh

# 使用啟動腳本（支持環境變數配置）
CMD ["./start.sh"] 