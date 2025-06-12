import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MODELS, DEFAULT_MODEL, DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS, DEFAULT_API_TYPE } from '../../../config/chat';
import { chatService } from '../../../services/api';

export const useChatState = (userId = null) => {
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
  const [currentUserId, setCurrentUserId] = useState(userId);
  
  // 分頁相關狀態
  const [historyPage, setHistoryPage] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [loadedPagesCount, setLoadedPagesCount] = useState(0);
  const MAX_LOADED_PAGES = 5;

  // 使用 useCallback 優化函數
  const fetchChatHistory = useCallback(async (page = 0, append = false, force = false) => {
    // 已經在載入中，直接返回
    if (isLoadingHistory) {
return;
}
    
    // 如果不是追加模式且已經沒有更多歷史記錄，直接返回（但如果是強制刷新則忽略此檢查）
    if (!append && !hasMoreHistory && historyMessages.length > 0 && !force) {
return;
}
    
    // 檢查是否請求相同頁面但已有數據，避免重複請求（但如果是強制刷新則忽略此檢查）
    if (page === historyPage && historyMessages.length > 0 && !append && !force) {
return;
}
    
    // 檢查是否已達到最大頁數限制（僅適用於分頁載入）
    if (append && loadedPagesCount >= MAX_LOADED_PAGES) {
      setHasMoreHistory(false); // 強制設置為沒有更多歷史記錄
      return;
    }
    
    try {
      setIsLoadingHistory(true);
      const skip = page * 20;
      const history = await chatService.getChatHistory(skip, 20, currentUserId);
      
      // 如果返回的數據為空，設置沒有更多記錄並立即返回
      if (history.items.length === 0) {
        setHasMoreHistory(false);
        setIsLoadingHistory(false);
        return;
      }
      
      // 根據 API 返回的 hasMore 更新本地狀態或因達到頁數限制而設為 false
      setHasMoreHistory(
        loadedPagesCount + 1 < MAX_LOADED_PAGES 
          ? history.hasMore 
          : false,
      );
      
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
        append ? [...prev, ...formattedHistory] : formattedHistory,
      );
      
      // 更新頁碼
      setHistoryPage(page);
      
      // 如果是分頁載入，增加已載入頁數計數
      if (append) {
        setLoadedPagesCount(prevCount => prevCount + 1);
      } else {
        // 如果是初始載入，重置計數器
        setLoadedPagesCount(0);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      // 發生錯誤時也設置為沒有更多記錄，避免重複嘗試
      setHasMoreHistory(false);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isLoadingHistory, hasMoreHistory, historyMessages, historyPage, loadedPagesCount, MAX_LOADED_PAGES, setHistoryMessages, setHistoryPage, setHasMoreHistory, currentUserId]);

  // 設置當前用戶 ID 的增強函數
  const setCurrentUserIdAndReload = useCallback((newUserId) => {
    // 如果用戶 ID 發生變化，或是重置用戶 ID 的情況（進行強制刷新）
    if (newUserId !== currentUserId || (newUserId === null && currentUserId === null)) {
      setCurrentUserId(newUserId);
      // 重置分頁和歷史記錄相關狀態
      setHistoryPage(0);
      setHasMoreHistory(true);
      setLoadedPagesCount(0);
      setHistoryMessages([]);
      
      // 如果當前正在顯示歷史記錄，則自動重新加載
      if (showHistory) {
        setTimeout(() => fetchChatHistory(0, false, true), 100); // 使用 force = true 強制刷新
      }
    }
  }, [currentUserId, fetchChatHistory, showHistory]);

  // 載入更多歷史訊息
  const loadMoreHistory = useCallback(() => {
    // 確保有更多歷史記錄、不在載入狀態、且當前頁有數據，並且未達到載入限制
    if (hasMoreHistory && !isLoadingHistory && historyMessages.length > 0 && loadedPagesCount < MAX_LOADED_PAGES) {
      console.log('Loading more history, current page:', historyPage, 'loaded pages:', loadedPagesCount);
      fetchChatHistory(historyPage + 1, true);
    }
  }, [fetchChatHistory, historyPage, hasMoreHistory, isLoadingHistory, historyMessages.length, loadedPagesCount, MAX_LOADED_PAGES]);

  // 載入特定 session 的完整對話記錄
  const loadSessionChat = async (sessionId) => {
    try {
      setIsLoading(true);
      const sessionHistory = await chatService.getSessionChatHistory(sessionId, currentUserId);

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
    setHistoryPage(0);
    setHasMoreHistory(true);
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
    currentUserId,
    setCurrentUserId,
    setCurrentUserIdAndReload,
  };
};
