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
    // 統一錯誤處理邏輯
    if (DEBUG_MODE) {
      console.error('Response error:', {
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    }

    // 處理不同類型的錯誤
    if (error.response) {
      // 服務器響應了錯誤狀態碼
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.statusText || '未知錯誤';
      
      switch (status) {
        case 400:
          console.error('請求參數錯誤:', message);
          break;
        case 401:
          console.error('未授權訪問:', message);
          break;
        case 403:
          console.error('訪問被禁止:', message);
          break;
        case 404:
          console.error('請求的資源不存在:', message);
          break;
        case 500:
          console.error('服務器內部錯誤:', message);
          break;
        case 502:
          console.error('網關錯誤:', message);
          break;
        case 503:
          console.error('服務不可用:', message);
          break;
        default:
          console.error(`HTTP錯誤 ${status}:`, message);
      }
      
      // 創建統一的錯誤對象
      error.userMessage = message;
      error.statusCode = status;
    } else if (error.request) {
      // 請求已發送但沒有收到響應
      console.error('網絡錯誤: 無法連接到服務器');
      error.userMessage = '網絡連接失敗，請檢查網絡連接';
      error.statusCode = 0;
    } else {
      // 請求配置錯誤
      console.error('請求配置錯誤:', error.message);
      error.userMessage = '請求配置錯誤';
      error.statusCode = -1;
    }

    return Promise.reject(error);
  }
);

// 其他服務函式保持不變
export const chatService = {
  // 發送聊天訊息 (Streaming)
  sendMessageStream: async (session_id, userMessage, context = [], model = 'gpt-4-mini', temperature = 0.7, maxTokens = 1000, prompt = '', apiType = 'openai', user_id = null, onChunk, onError, onComplete) => {
    try {
      const formattedContext = context.reduce((acc, msg, index, array) => {
        if (msg.sender === 'user') {
          acc.push({
            user_message: msg.text,
            assistant_message: array[index + 1]?.sender === 'assistant' ? array[index + 1].text : '',
            file_content: msg.fileContent || ''
          });
        }
        return acc;
      }, []);

      // Prepare request body
      const requestBody = {
        session_id: session_id,
        prompt: prompt,
        message: userMessage.text,
        context: formattedContext,
        model,
        temperature,
        max_tokens: maxTokens,
        api_type: apiType,
        user_id: user_id
      };

      // Add image data if present
      if (userMessage.images && userMessage.images.length > 0) {
        // Extract base64 data from images
        requestBody.images = userMessage.images.map(img => ({
          base64: img.base64,
          name: img.name,
          type: img.type
        }));
        
        // Force API type to OpenAI if images are present
        if (apiType !== 'openai') {
          console.log('Forcing API type to OpenAI for image processing');
          requestBody.api_type = 'openai';
        }
      }

      const endpoint = `${API_BASE_URL}/chat`; // Use API_BASE_URL
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add any other necessary headers, e.g., Authorization
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        // Handle HTTP errors (e.g., 4xx, 5xx)
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        console.error('Error sending message (stream):', errorData);
        if (onError) onError(new Error(errorData.detail || 'Failed to send message'));
        return; // Stop further processing
      }

      if (!response.body) {
        if (onError) onError(new Error('Response body is null'));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        if (onChunk) onChunk(chunk); // Pass the raw chunk
      }
      
      if (onComplete) onComplete(accumulatedResponse); // Pass the full response on completion

    } catch (error) {
      console.error('Error sending message (stream):', error);
      if (onError) onError(error);
    }
  },

  // 發送聊天訊息 (Original - Non-streaming)
  sendMessage: async (session_id, userMessage, context = [], model = 'gpt-4-mini', temperature = 0.7, maxTokens = 1000, prompt = '', apiType = 'openai', user_id = null) => {
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
        api_type: apiType,
        user_id: user_id
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // 獲取聊天歷史，預設返回最新的20條記錄
  getChatHistory: async (skip = 0, limit = 20, user_id = null) => {
    try {
      const params = { skip, limit };
      if (user_id) params.user_id = user_id;
      
      const response = await apiClient.get('/history', {
        params: params,
      });
      
      // 確保正確返回 has_more 值，即使是空數組
      return {
        items: response.data.items || [],
        total: response.data.total || 0,
        page: response.data.page || 0,
        limit: response.data.limit || limit,
        hasMore: response.data.has_more
      };
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  },

  // 獲取特定 session 的完整聊天記錄
  getSessionChatHistory: async (sessionId, user_id = null) => {
    try {
      const params = {};
      if (user_id) params.user_id = user_id;
      
      const response = await apiClient.get(`/history/session/${sessionId}`, {
        params: params
      });
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

// VectorDB 服務函式
export const vectorDBService = {
  // 初始化 VectorDB
  initVectorDB: async (session_id) => {
    try {
      const response = await apiClient.post('/vectordb/init', null, { // POST request with no body, params in URL
        params: { session_id },
      });
      return response.data;
    } catch (error) {
      console.error('Error initializing VectorDB:', error);
      throw error;
    }
  },

  // 添加文件到 VectorDB
  addDocuments: async (session_id, document, document_id = null, chunk_size = 200, chunk_overlap = 50, type = "txt") => {
    console.log("session_id:", session_id)
    try {
      const response = await apiClient.post('/vectordb/add', { // POST request with body
        document,
        document_id,
        chunk_size,
        chunk_overlap,
        type
      }, {
        params: { session_id } // session_id as query parameter
      });
      return response.data;
    } catch (error) {
      console.error('Error adding documents to VectorDB:', error);
      throw error;
    }
  },

  // 從 VectorDB 檢索文件
  retrieveDocuments: async (session_id, query, n_results = 5) => {
    try {
      const response = await apiClient.get('/vectordb/retrieve', {
        params: { session_id, query, n_results },
      });
      return response.data;
    } catch (error) {
      console.error('Error retrieving documents from VectorDB:', error);
      throw error;
    }
  },

  // 刪除 VectorDB 集合
  deleteCollection: async (session_id) => {
    try {
      const response = await apiClient.delete('/vectordb/delete', {
        params: { session_id },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting VectorDB collection:', error);
      throw error;
    }
  }
};
