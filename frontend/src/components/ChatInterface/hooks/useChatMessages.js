// hooks/useChatMessages.js - 專門處理聊天消息狀態
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useChatMessages = () => {
  const [currentMessages, setCurrentMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);

  const handleNewChat = useCallback(() => {
    setCurrentMessages([]);
    setSessionId(uuidv4());
  }, []);

  const addMessage = useCallback((message) => {
    setCurrentMessages(prev => [...prev, message]);
  }, []);

  const updateLastMessage = useCallback((updater) => {
    setCurrentMessages(prev => {
      if (prev.length === 0) return prev;
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      if (typeof updater === 'function') {
        newMessages[lastIndex] = updater(newMessages[lastIndex]);
      } else {
        newMessages[lastIndex] = { ...newMessages[lastIndex], ...updater };
      }
      return newMessages;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setCurrentMessages([]);
  }, []);

  return {
    // 狀態
    currentMessages,
    inputMessage,
    sessionId,
    isLoading,
    copiedMessageId,
    copiedCodeIndex,
    
    // 設置器
    setCurrentMessages,
    setInputMessage,
    setSessionId,
    setIsLoading,
    setCopiedMessageId,
    setCopiedCodeIndex,
    
    // 方法
    handleNewChat,
    addMessage,
    updateLastMessage,
    clearMessages,
  };
};