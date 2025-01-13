# LLM 聊天機器人應用

這是一個基於大型語言模型的聊天機器人應用，提供簡潔的使用者介面來與 AI 助手進行對話。

## 專案結構說明

```
.
├── backend/                                        # 後端專案目錄
│   ├── tests/                                      # 測試目錄
│   │   ├── conftest.py                                 # 測試配置文件
│   │   └── test_main.py                                # 主要測試文件
│   ├── routes/                                     # 各路由
│   │   ├── chat_routes.py                              # /Chat LLM 對話相關
│   │   ├── health_routes.py                            # 檢查存活
│   │   ├── history_routes.py                           # 歷史對話紀錄查詢
│   │   └── log_routes.py                               # 系統紀錄查詢
│   ├── utils/                                      # 副程式
│   │   ├── dependencies.py                             # 資料庫連結
│   │   └── logging.py                                  # 系統紀錄管理
│   ├── Dockerfile                                      # 後端 Docker 配置文件
│   ├── database.py                                     # 數據庫配置
│   ├── main.py                                         # 主應用程序入口
│   ├── models.py                                       # 數據模型定義
│   ├── schemas.py                                      # Pydantic 模型定義
│   └── requirements.txt                                # Python 依賴清單
│
├── frontend/                                       # 前端專案目錄
|   ├── Dockerfile                                      # 前端 Docker 配置文件
|   ├── index.html                                      # HTML 模板
|   ├── package.json                                    # npm 配置文件
|   ├── postcss.config.js                               # PostCSS 配置
|   ├── public/                                     # 靜態資源目錄
|   |   └── chat-logo.svg                               # 標籤圖示
|   ├── src/                                        # 程式碼目錄
|   |   ├── App.jsx                                     # 主要的 App 元件
|   |   ├── components/                             # 元件目錄
|   |   |   ├── ChatInterface/                      # ChatInterface 元件目錄
|   |   |   |   ├── ChatHistory.jsx                     # 聊天歷史元件
|   |   |   |   ├── FeatureMenu.jsx                     # 功能選單元件
|   |   |   |   ├── Header.jsx                          # 頁面頂部元件
|   |   |   |   ├── hooks/                          # 自定義 Hooks 資料夾   
|   |   |   |   |   ├── useBackendStatus.js             # 監控後端狀態的 Hook
|   |   |   |   |   ├── useChatState.js                 # 管理聊天狀態的 Hook
|   |   |   |   |   └── useMessageHandlers.js           # 處理訊息相關邏輯的 Hook
|   |   |   |   ├── index.jsx                           # 主要的 ChatInterface 元件
|   |   |   |   ├── InputArea.jsx                       # 輸入區域元件   
|   |   |   |   ├── Message/                        # 聊天訊息相關元件
|   |   |   |   |   ├── CodeBlock.jsx                   # 程式碼塊元件
|   |   |   |   |   ├── index.jsx                       # Message 元件的入口
|   |   |   |   |   └── MessageContent.jsx              # 訊息內容元件
|   |   |   |   ├── MessageList.jsx                     # 訊息列表元件
|   |   |   |   └── Settings.jsx                        # 設定元件
|   |   |   └── ErrorBoundary.jsx                       # 錯誤相關元件
|   |   ├── config/
|   |   |   └── chat.js                                 # 聊天設定
|   |   ├── contexts/
|   |   |   └── ThemeContext.jsx                        # 主題上下文
|   |   ├── index.css                                   # 全局樣式  
|   |   ├── main.jsx                                    # 主要的 App 元件
|   |   ├── services
|   |   |   └── api.js                                  # API 服務
|   |   ├── store
|   |   |   └── index.js                                # 全局狀態管理
|   |   ├── types
|   |   |   └── chat.ts                                 # 類型定義
|   |   └── utils   
|   |       └── dateTime.js                             # 日期時間工具
|   ├── tailwind.config.js                              # Tailwind CSS 配置
|   └── vite.config.ts                                  # Vite 配置文件
│
├── docker-compose.yml                                  # Docker Compose 配置文件
├── .env                                                # 環境變數配置
├── test.db                                             # 測試數據庫 
└── README.md                                           # 專案說明文件
```


## 配置文件說明

### 後端配置
- `requirements.txt`: Python 依賴包清單
- `Dockerfile`: 後端容器化配置

### 前端配置
- `package.json`: npm 包管理和腳本配置
- `vite.config.js`: Vite 開發服務器配置
- `tailwind.config.js`: Tailwind CSS 框架配置
- `postcss.config.js`: PostCSS 處理器配置
- `Dockerfile`: 前端容器化配置

### 根目錄配置
- `docker-compose.yml`: 多容器應用編排配置
- `.env`: 環境變數配置文件


## 技術架構

### 前端
- React 18
- Tailwind CSS
- Vite
- Axios

### 後端
- FastAPI
- SQLAlchemy
- SQLite
- OpenAI API

### Design Pattern
- SOLID 原則    
    - 單一職責原則（Single Responsibility Principle，SRP）
        - UI 狀態、功能和資料元件分離
- 自定義 Hooks
    - 業務邏輯(business logic)，外圍區塊元件（block components）


## 安裝說明

### 使用 Docker（推薦）

1. 確保已安裝 Docker 和 Docker Compose
2. 複製專案並進入目錄
```bash
git clone [專案網址]
cd [專案目錄]
```

3. 啟動服務
```bash
docker-compose up -d
```

4. 重新打包
```bash
docker-compose build --no-cache
```

### 手動安裝

#### 後端設置
1. 進入後端目錄
```bash
cd backend
```

2. 建立虛擬環境
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. 安裝依賴
```bash
pip install -r requirements.txt
```

4. 啟動服務
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### 前端設置
1. 進入前端目錄
```bash
cd frontend
```

2. 安裝依賴
```bash
npm install
```

3. 啟動開發服務器
```bash
npm run dev
```

## 使用說明

1. 開啟瀏覽器訪問 `http://localhost:5173`
2. 在底部輸入框輸入訊息
3. 按下發送按鈕或按 Enter 鍵發送訊息
4. 等待 AI 助手回應
5. 點擊右上角歷史記錄圖標可查看過往對話

## 環境變數設置

建立 `.env` 檔案並設置以下變數：

```env
OPENAI_API_KEY=你的OpenAI API金鑰
```

## 開發說明

### 測試
運行後端測試：
```bash
cd backend
pytest tests/
```

### API 文檔
啟動後端服務後，訪問 `http://localhost:8000/docs` 查看 API 文件

## 注意事項

- 確保 OpenAI API 可用
- 預設使用 SQLite 數據庫，無需額外配置
- 開發環境下前端預設監聽 5173 端口
- 後端 API 預設監聽 8000 端口