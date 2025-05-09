import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MODELS, DEFAULT_MODEL, DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS, DEFAULT_API_TYPE } from '../../../config/chat';
import { chatService } from '../../../services/api';

export const useChatState = () => {
  const [currentMessages, setCurrentMessages] = useState([]);
  const [historyMessages, setHistoryMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_MAX_TOKENS);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);
  const [apiType, setApiType] = useState(DEFAULT_API_TYPE);
  
  // 分頁相關狀態
  const [historyPage, setHistoryPage] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 使用 useCallback 優化函數
  const fetchChatHistory = useCallback(async (page = 0, append = false) => {
    // 已經在載入中，直接返回
    if (isLoadingHistory) return;
    
    // 如果不是追加模式且已經沒有更多歷史記錄，直接返回
    if (!append && !hasMoreHistory && historyMessages.length > 0) return;
    
    // 檢查是否請求相同頁面但已有數據，避免重複請求
    if (page === historyPage && historyMessages.length > 0 && !append) return;
    
    try {
      setIsLoadingHistory(true);
      const skip = page * 20;
      const history = await chatService.getChatHistory(skip, 20);
      
      // 沒有數據，設置沒有更多記錄
      if (history.items.length === 0) {
        setHasMoreHistory(false);
        return;
      }

      const formattedHistory = history.items.map((msg) => ({
        sessionId: msg.session_id,
        date: new Date(msg.timestamp).toLocaleDateString(),
        lastMessage: msg.user_message,
        message: {
          id: msg.turn_id,
          userMessage: {
            id: `${msg.turn_id}-user`,
            text: msg.user_message,
            sender: 'user',
            timestamp: msg.timestamp,
          },
          assistantMessage: {
            id: `${msg.turn_id}-assistant`,
            text: msg.assistant_message,
            sender: 'assistant',
            timestamp: msg.timestamp,
          },
        },
      }));

      // 更新消息列表，追加或重置
      setHistoryMessages(prev => 
        append ? [...prev, ...formattedHistory] : formattedHistory
      );
      
      // 更新頁碼
      setHistoryPage(page);
      
      // 根據 API 返回的 hasMore 更新本地狀態
      setHasMoreHistory(history.hasMore);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isLoadingHistory, hasMoreHistory, historyMessages, historyPage, setHistoryMessages, setHistoryPage, setHasMoreHistory]);

  // 載入更多歷史訊息
  const loadMoreHistory = useCallback(() => {
    // 確保有更多歷史記錄、不在載入狀態、且當前頁有數據
    if (hasMoreHistory && !isLoadingHistory && historyMessages.length > 0) {
      console.log('Loading more history, current page:', historyPage);
      fetchChatHistory(historyPage + 1, true);
    }
  }, [fetchChatHistory, historyPage, hasMoreHistory, isLoadingHistory, historyMessages.length]);

  // 載入特定 session 的完整對話記錄
  const loadSessionChat = async (sessionId) => {
    try {
      setIsLoading(true);
      const sessionHistory = await chatService.getSessionChatHistory(sessionId);

      const messages = sessionHistory
        .map((msg) => [
          {
            id: `${msg.turn_id}-user`,
            text: msg.user_message,
            sender: 'user',
            timestamp: msg.timestamp,
          },
          {
            id: `${msg.turn_id}-assistant`,
            text: msg.assistant_message,
            sender: 'assistant',
            timestamp: msg.timestamp,
          },
        ])
        .flat();

      setCurrentMessages(messages);
      setSessionId(sessionId);
      setShowHistory(false);
    } catch (error) {
      console.error('Error loading session chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentMessages([]);
    setSessionId(uuidv4());
  };

  return {
    models: MODELS,
    currentMessages,
    setCurrentMessages,
    historyMessages,
    setHistoryMessages,
    inputMessage,
    setInputMessage,
    sessionId,
    setSessionId,
    isLoading,
    setIsLoading,
    showHistory,
    setShowHistory,
    selectedModel,
    setSelectedModel,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    showSettings,
    setShowSettings,
    copiedMessageId,
    setCopiedMessageId,
    copiedCodeIndex,
    setCopiedCodeIndex,
    fetchChatHistory,
    handleNewChat,
    loadSessionChat,
    apiType,
    setApiType,
    loadMoreHistory,
    isLoadingHistory,
    hasMoreHistory,
  };
};
