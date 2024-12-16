FROM node:18-alpine

WORKDIR /app

# 只複製依賴相關文件
COPY package*.json ./

RUN npm install

# 複製其餘檔案
COPY . .

# 創建數據目錄 
RUN mkdir -p /app/data

# 修改 HEALTHCHECK 路徑
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5173 || exit 1

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 