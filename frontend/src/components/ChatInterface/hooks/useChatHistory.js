// hooks/useChatHistory.js - 專門處理歷史記錄
import { useState, useCallback } from 'react';
import { chatService } from '../../../services/api';

export const useChatHistory = (userId = null) => {
  const [historyMessages, setHistoryMessages] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [loadedPagesCount, setLoadedPagesCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(userId);
  
  const MAX_LOADED_PAGES = 5;

  const fetchChatHistory = useCallback(async (page = 0, append = false, force = false) => {
    // 防止重複請求
    if (isLoadingHistory) return;
    
    // 檢查是否需要請求
    if (!append && !hasMoreHistory && historyMessages.length > 0 && !force) return;
    if (page === historyPage && historyMessages.length > 0 && !append && !force) return;
    
    // 檢查分頁限制
    if (append && loadedPagesCount >= MAX_LOADED_PAGES) {
      setHasMoreHistory(false);
      return;
    }
    
    try {
      setIsLoadingHistory(true);
      const skip = page * 20;
      const history = await chatService.getChatHistory(skip, 20, currentUserId);
      
      if (history.items.length === 0) {
        setHasMoreHistory(false);
        return;
      }
      
      // 更新是否有更多記錄
      setHasMoreHistory(
        loadedPagesCount + 1 < MAX_LOADED_PAGES 
          ? history.hasMore 
          : false
      );
      
      // 格式化歷史記錄
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

      // 更新消息列表
      setHistoryMessages(prev => 
        append ? [...prev, ...formattedHistory] : formattedHistory
      );
      
      setHistoryPage(page);
      
      // 更新已載入頁數
      if (append) {
        setLoadedPagesCount(prevCount => prevCount + 1);
      } else {
        setLoadedPagesCount(0);
      }
      
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setHasMoreHistory(false);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [
    isLoadingHistory, 
    hasMoreHistory, 
    historyMessages.length, 
    historyPage, 
    loadedPagesCount, 
    MAX_LOADED_PAGES, 
    currentUserId
  ]);

  const loadMoreHistory = useCallback(() => {
    if (hasMoreHistory && !isLoadingHistory && historyMessages.length > 0 && loadedPagesCount < MAX_LOADED_PAGES) {
      console.log('Loading more history, current page:', historyPage, 'loaded pages:', loadedPagesCount);
      fetchChatHistory(historyPage + 1, true);
    }
  }, [fetchChatHistory, historyPage, hasMoreHistory, isLoadingHistory, historyMessages.length, loadedPagesCount, MAX_LOADED_PAGES]);

  const loadSessionChat = useCallback(async (sessionId, onComplete) => {
    try {
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

      if (onComplete) {
        onComplete(messages, sessionId);
      }
      
      setShowHistory(false);
      return messages;
    } catch (error) {
      console.error('Error loading session chat:', error);
      throw error;
    }
  }, [currentUserId]);

  const setCurrentUserIdAndReload = useCallback((newUserId) => {
    if (newUserId !== currentUserId || (newUserId === null && currentUserId === null)) {
      setCurrentUserId(newUserId);
      // 重置狀態
      setHistoryPage(0);
      setHasMoreHistory(true);
      setLoadedPagesCount(0);
      setHistoryMessages([]);
      
      // 如果正在顯示歷史記錄，重新加載
      if (showHistory) {
        setTimeout(() => fetchChatHistory(0, false, true), 100);
      }
    }
  }, [currentUserId, fetchChatHistory, showHistory]);

  const resetHistoryState = useCallback(() => {
    setHistoryPage(0);
    setHasMoreHistory(true);
    setLoadedPagesCount(0);
    setHistoryMessages([]);
  }, []);

  return {
    // 狀態
    historyMessages,
    showHistory,
    isLoadingHistory,
    hasMoreHistory,
    currentUserId,
    
    // 設置器
    setHistoryMessages,
    setShowHistory,
    setCurrentUserId,
    
    // 方法
    fetchChatHistory,
    loadMoreHistory,
    loadSessionChat,
    setCurrentUserIdAndReload,
    resetHistoryState,
  };
};