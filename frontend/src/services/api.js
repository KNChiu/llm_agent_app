// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request攔截器
apiClient.interceptors.request.use((config) => {
  if (DEBUG_MODE) {
    console.log('Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params,
    });
  }
  return config;
}, (error) => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

// Response攔截器
apiClient.interceptors.response.use(
  (response) => {
    if (DEBUG_MODE) {
      console.log('Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    // 你的錯誤處理邏輯...
    // （這裡省略錯誤處理邏輯，保持原樣）
    return Promise.reject(error);
  }
);

// 其他服務函式保持不變
export const chatService = {
  // 發送聊天訊息
  sendMessage: async (session_id, userMessage, context = [], model = 'gpt-4-mini', temperature = 0.7, maxTokens = 1000, prompt = '', apiType = 'openai') => {
    try {
      const formattedContext = context.reduce((acc, msg, index, array) => {
        if (msg.sender === 'user') {
          acc.push({
            user_message: msg.text,
            assistant_message: array[index + 1]?.sender === 'assistant' ? array[index + 1].text : '',
            file_content: msg.fileContent || '' // 添加 fileContent
          });
        }
        return acc;
      }, []);

      const endpoint = '/chat';
      const response = await apiClient.post(endpoint, {
        session_id: session_id,
        prompt: prompt,
        message: userMessage.text,
        context: formattedContext,
        model,
        temperature,
        max_tokens: maxTokens,
        api_type: apiType
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // 獲取聊天歷史，預設返回最新的20條記錄
  getChatHistory: async (skip = 0, limit = 20) => {
    try {
      const response = await apiClient.get('/history', {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  },

  // 獲取特定 session 的完整聊天記錄
  getSessionChatHistory: async (sessionId) => {
    try {
      const response = await apiClient.get(`/history/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session chat history:', error);
      throw error;
    }
  },

  // 添加健康度檢查方法
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return {
        status: response.data.status === 'ok',
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: false,
        timestamp: new Date().toISOString()
      };
    }
  }
};
