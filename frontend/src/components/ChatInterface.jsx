import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, History, PlusCircle, AlertCircle } from 'lucide-react';
import { chatService } from '../services/api';
import { XMarkIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const ChatInterface = () => {
  const [currentMessages, setCurrentMessages] = useState([]);
  const [historyMessages, setHistoryMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const settingsRef = useRef(null);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'online' | 'offline'

  const models = [
    { id: 'gpt-4o-mini', name: 'GPT-4o-mini' },
    { id: 'gpt-4o', name: 'GPT-4o' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  // 添加時間格式化函數
  const formatDateTime = (timestamp) => {
    // 先將時間字串轉換為 Date 物件
    const date = new Date(timestamp);
    // 加上 8 小時來調整為台灣時間
    const taiwanDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    
    return taiwanDate.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setCurrentMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(
        inputMessage, 
        selectedModel,
        temperature,
        maxTokens
      );
      setCurrentMessages(prev => [...prev, {
        id: response.id,
        text: response.message,
        sender: 'assistant',
        timestamp: response.timestamp,
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 添加新對話函數
  const handleNewChat = () => {
    setCurrentMessages([]);
  };

  // 點擊外部關閉設定
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 添加健康檢查
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        await chatService.checkHealth();
        setBackendStatus('online');
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    // 初始檢查
    checkBackendHealth();

    // 每 30 秒檢查一次
    const interval = setInterval(checkBackendHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-100">
      {/* Header - 減少高度 */}
      <div className="bg-white shadow-sm p-2">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-xl font-semibold text-gray-800">LLM Agent</h1>
            {backendStatus === 'offline' && (
              <div className="flex items-center text-red-500 text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                後端離線中
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleNewChat}
              className="p-1.5 hover:bg-gray-100 rounded-full"
            >
              <PlusCircle className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              className={`p-1.5 rounded-full ${showHistory ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) {
                  fetchChatHistory();
                }
              }}
            >
              <History className={`w-4 h-4 ${showHistory ? 'text-blue-600' : 'text-gray-600'}`} />
            </button>
            <div className="relative" ref={settingsRef}>
              <button 
                className={`p-1.5 rounded-full ${showSettings ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className={`w-4 h-4 ${showSettings ? 'text-blue-600' : 'text-gray-600'}`} />
              </button>
              
              {showSettings && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-64 bg-white rounded-lg shadow-lg p-3 z-50">
                  <div className="space-y-3">
                    {/* 簡化設定選項的間距 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        語言模型
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full p-1.5 text-sm border border-gray-300 rounded-lg"
                      >
                        {models.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* ... 其他設定選項 ... */}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container - 使用 flex-1 和 min-0 確保可以正確縮放 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2">
        <div className="max-w-4xl mx-auto space-y-2">
          {currentMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`p-2 rounded-lg max-w-[85%] ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                <span className="text-[10px] opacity-75 block mt-0.5">
                  {formatDateTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-2 rounded-lg shadow">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - 減少高度 */}
      <div className="bg-white border-t p-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="p-1.5 text-xs border border-gray-300 rounded-lg"
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="輸入訊息..."
                className="w-full p-2 text-sm rounded-lg border border-gray-300 resize-none"
                rows="1"
                style={{ maxHeight: '100px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className={`p-2 rounded-lg ${
                isLoading || !inputMessage.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 歷史記錄側邊欄 */}
      {showHistory && (
        <div className="fixed inset-0 bg-white z-10">
          <div className="h-full flex flex-col">
            <div className="p-2 border-b flex justify-between items-center">
              <h2 className="text-base font-bold">聊天記錄</h2>
              <button onClick={() => setShowHistory(false)}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {/* ... 歷史記錄內容 ... */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;