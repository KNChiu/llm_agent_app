import { useState } from 'react';
import { MODELS, DEFAULT_MODEL, DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS } from '../../../config/chat';
import { chatService } from '../../../services/api';

export const useChatState = () => {
  const [currentMessages, setCurrentMessages] = useState([]);
  const [historyMessages, setHistoryMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
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
      const groupedHistory = history.reduce((acc, msg) => {
        const conversationId = msg.timestamp.split('T')[0];
        if (!acc[conversationId]) {
          acc[conversationId] = [];
        }
        acc[conversationId].push({
          id: msg.id,
          userMessage: {
            id: `${msg.id}-user`,
            text: msg.user_message,
            sender: 'user',
            timestamp: msg.timestamp
          },
          assistantMessage: {
            id: `${msg.id}-assistant`,
            text: msg.assistant_message,
            sender: 'assistant',
            timestamp: msg.timestamp
          }
        });
        return acc;
      }, {});
      
      const formattedHistory = Object.entries(groupedHistory).map(([date, messages]) => ({
        date,
        messages
      }));
      
      setHistoryMessages(formattedHistory);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleNewChat = () => {
    setCurrentMessages([]);
  };

  return {
    models: MODELS,
    currentMessages,
    setCurrentMessages,
    historyMessages,
    setHistoryMessages,
    inputMessage,
    setInputMessage,
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
  };
}; 