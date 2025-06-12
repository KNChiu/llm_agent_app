# 多階段構建 - 第一階段：構建階段
FROM node:18-alpine as builder

WORKDIR /app

# 複製 package 文件
COPY package*.json ./

# 安裝所有依賴（包含 devDependencies 用於構建）
RUN npm ci --silent

# 複製源代碼
COPY . .

# 構建應用
RUN npm run build

# 多階段構建 - 第二階段：運行階段
FROM nginx:alpine as runtime

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 複製自定義 nginx 配置
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# 從構建階段複製構建產物
COPY --from=builder /app/dist /usr/share/nginx/html

# 設置權限
RUN chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /etc/nginx/conf.d

# 切換到非 root 用戶
USER nextjs

# 添加健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

# 暴露端口
EXPOSE 80

# 啟動 nginx
CMD ["nginx", "-g", "daemon off;"]

# 開發環境的替代 Dockerfile
FROM node:18-alpine as development

WORKDIR /app

# 安裝 dumb-init 以正確處理信號
RUN apk add --no-cache dumb-init

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 複製 package 文件
COPY package*.json ./

# 安裝依賴（在 root 用戶下進行）
RUN npm ci --silent

# 創建非 root 用戶並設置權限
RUN chown -R nextjs:nodejs /app

# 切換用戶
USER nextjs

# 複製應用代碼
COPY --chown=nextjs:nodejs . .

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5173 || exit 1

EXPOSE 5173

# 使用 dumb-init 啟動
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 