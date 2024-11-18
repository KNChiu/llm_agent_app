FROM node:18-alpine

WORKDIR /app

# 只複製依賴相關文件
COPY package*.json ./

# 設置淘寶鏡像並安裝依賴
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm install

# 複製源代碼
COPY . .

# 添加健康檢查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5173 || exit 1

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 