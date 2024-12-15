FROM node:18-alpine

WORKDIR /app

# 只複製依賴相關文件
COPY package*.json ./

# 設置淘寶鏡像並安裝依賴
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm install

# 複製其餘檔案
COPY . .

# 創建數據目錄 
RUN mkdir -p /app/data

# 修改 HEALTHCHECK 路徑
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:8000/docs || exit 1

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
