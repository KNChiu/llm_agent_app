// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatService = {
  // 發送聊天訊息
  sendMessage: async (message) => {
    try {
      const response = await apiClient.post('/chat', { message });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // 獲取聊天歷史
  getChatHistory: async (skip = 0, limit = 100) => {
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
};

// 錯誤處理中間件
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 處理常見的錯誤情況
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 處理未授權錯誤
          console.error('Unauthorized access');
          break;
        case 403:
          // 處理禁止訪問錯誤
          console.error('Forbidden access');
          break;
        case 404:
          // 處理未找到資源錯誤
          console.error('Resource not found');
          break;
        case 500:
          // 處理服務器錯誤
          console.error('Server error');
          break;
        default:
          console.error('An error occurred:', error.response.data);
      }
    } else if (error.request) {
      // 請求已發出但沒有收到回應
      console.error('No response received:', error.request);
    } else {
      // 發送請求時出現錯誤
      console.error('Error sending request:', error.message);
    }

    return Promise.reject(error);
  }
);