import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MODELS, DEFAULT_MODEL, DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS } from '../../../config/chat';
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

  const fetchChatHistory = async () => {
    try {
      const history = await chatService.getChatHistory();
      // 直接使用後端返回的已排序和分組的數據
      const formattedHistory = history.map(msg => ({
        sessionId: msg.session_id,
        date: new Date(msg.timestamp).toLocaleDateString(),
        lastMessage: msg.user_message, // 添加最後一條用戶訊息作為預覽
        message: {
          id: msg.turn_id,
          userMessage: {
            id: `${msg.turn_id}-user`,
            text: msg.user_message,
            sender: 'user',
            timestamp: msg.timestamp
          },
          assistantMessage: {
            id: `${msg.turn_id}-assistant`,
            text: msg.assistant_message,
            sender: 'assistant',
            timestamp: msg.timestamp
          }
        }
      }));
      
      // 按 session_id 分組
      const groupedBySession = formattedHistory.reduce((acc, item) => {
        if (!acc[item.sessionId]) {
          acc[item.sessionId] = {
            sessionId: item.sessionId,
            date: item.date,
            lastMessage: item.lastMessage,
            messages: []
          };
        }
        acc[item.sessionId].messages.push(item.message);
        return acc;
      }, {});

      // 轉換為陣列並按日期排序
      const finalHistory = Object.values(groupedBySession).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      setHistoryMessages(finalHistory);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  // 載入特定 session 的完整對話記錄
  const loadSessionChat = async (sessionId) => {
    try {
      setIsLoading(true);
      const sessionHistory = await chatService.getSessionChatHistory(sessionId);
      
      // 轉換為前端需要的格式
      const messages = sessionHistory.map(msg => [
        {
          id: `${msg.turn_id}-user`,
          text: msg.user_message,
          sender: 'user',
          timestamp: msg.timestamp
        },
        {
          id: `${msg.turn_id}-assistant`,
          text: msg.assistant_message,
          sender: 'assistant',
          timestamp: msg.timestamp
        }
      ]).flat();

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
    setSessionId(uuidv4()); // Generate new sessionId for new chat
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
  };
};
