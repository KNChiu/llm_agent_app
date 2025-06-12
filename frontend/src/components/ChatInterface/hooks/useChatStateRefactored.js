// hooks/useChatStateRefactored.js - 重構後的聊天狀態管理
import { useChatMessages } from './useChatMessages';
import { useChatHistory } from './useChatHistory';
import { useChatSettings } from './useChatSettings';

/**
 * 重構後的聊天狀態管理 Hook
 * 將原本 216 行的單一 Hook 拆分為多個專門的 Hooks，
 * 提高代碼可維護性和可測試性
 */
export const useChatStateRefactored = (userId = null) => {
  // 使用拆分後的專門 hooks
  const messageHook = useChatMessages();
  const historyHook = useChatHistory(userId);
  const settingsHook = useChatSettings();

  // 整合 handleNewChat 功能
  const handleNewChat = () => {
    messageHook.handleNewChat();
    historyHook.resetHistoryState();
  };

  // 整合 loadSessionChat 功能
  const loadSessionChat = async (sessionId) => {
    try {
      messageHook.setIsLoading(true);
      const messages = await historyHook.loadSessionChat(
        sessionId, 
        (messages, sessionId) => {
          messageHook.setCurrentMessages(messages);
          messageHook.setSessionId(sessionId);
        },
      );
      return messages;
    } catch (error) {
      console.error('Error loading session chat:', error);
      throw error;
    } finally {
      messageHook.setIsLoading(false);
    }
  };

  // 返回統一的接口，保持向後兼容
  return {
    // 來自 useChatMessages
    currentMessages: messageHook.currentMessages,
    setCurrentMessages: messageHook.setCurrentMessages,
    inputMessage: messageHook.inputMessage,
    setInputMessage: messageHook.setInputMessage,
    sessionId: messageHook.sessionId,
    setSessionId: messageHook.setSessionId,
    isLoading: messageHook.isLoading,
    setIsLoading: messageHook.setIsLoading,
    copiedMessageId: messageHook.copiedMessageId,
    setCopiedMessageId: messageHook.setCopiedMessageId,
    copiedCodeIndex: messageHook.copiedCodeIndex,
    setCopiedCodeIndex: messageHook.setCopiedCodeIndex,
    
    // 來自 useChatHistory
    historyMessages: historyHook.historyMessages,
    setHistoryMessages: historyHook.setHistoryMessages,
    showHistory: historyHook.showHistory,
    setShowHistory: historyHook.setShowHistory,
    fetchChatHistory: historyHook.fetchChatHistory,
    loadMoreHistory: historyHook.loadMoreHistory,
    isLoadingHistory: historyHook.isLoadingHistory,
    hasMoreHistory: historyHook.hasMoreHistory,
    currentUserId: historyHook.currentUserId,
    setCurrentUserId: historyHook.setCurrentUserId,
    setCurrentUserIdAndReload: historyHook.setCurrentUserIdAndReload,
    
    // 來自 useChatSettings
    models: settingsHook.models,
    selectedModel: settingsHook.selectedModel,
    setSelectedModel: settingsHook.setSelectedModel,
    temperature: settingsHook.temperature,
    setTemperature: settingsHook.setTemperature,
    maxTokens: settingsHook.maxTokens,
    setMaxTokens: settingsHook.setMaxTokens,
    apiType: settingsHook.apiType,
    setApiType: settingsHook.setApiType,
    showSettings: settingsHook.showSettings,
    setShowSettings: settingsHook.setShowSettings,
    
    // 整合的方法
    handleNewChat,
    loadSessionChat,
    
    // 額外的工具方法
    getSettingsForRequest: settingsHook.getSettingsForRequest,
    validateSettings: settingsHook.validateSettings,
    addMessage: messageHook.addMessage,
    updateLastMessage: messageHook.updateLastMessage,
    clearMessages: messageHook.clearMessages,
  };
};

// 為了向後兼容，也導出原有的名稱
export const useChatState = useChatStateRefactored;