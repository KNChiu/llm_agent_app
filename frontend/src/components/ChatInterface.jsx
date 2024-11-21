import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, History, PlusCircle, AlertCircle, Copy, Check } from 'lucide-react';
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
  const [copiedMessageId, setCopiedMessageId] = useState(null);

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
      // 重構上下文數組的處理方式
      const context = [];
      for (let i = 0; i < currentMessages.length; i += 2) {
        const userMsg = currentMessages[i];
        const assistantMsg = currentMessages[i + 1];
        
        if (userMsg && userMsg.sender === 'user') {
          context.push({
            user_message: userMsg.text,
            assistant_message: assistantMsg?.text || ''
          });
        }
      }

      const response = await chatService.sendMessage(
        inputMessage,
        context,
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

  // 添加複製功能
  const handleCopyMessage = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000); // 2秒後重置複製狀態
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-800">LLM Agent</h1>
            {backendStatus === 'offline' && (
              <div className="flex items-center text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                後端服務離線中請稍後
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleNewChat}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="建立新對話"
            >
              <PlusCircle className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              className={`p-2 rounded-full ${showHistory ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) {
                  fetchChatHistory();
                }
              }}
            >
              <History className={`w-5 h-5 ${showHistory ? 'text-blue-600' : 'text-gray-600'}`} />
            </button>
            <div className="relative" ref={settingsRef}>
              <button 
                className={`p-2 rounded-full ${showSettings ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className={`w-5 h-5 ${showSettings ? 'text-blue-600' : 'text-gray-600'}`} />
              </button>
              
              {/* 設定下拉選單 */}
              {showSettings && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 z-50">
                  <div className="space-y-4">
                    {/* 模型選擇 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        語言模型
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        {models.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Temperature 設定 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature: {temperature}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>精確</span>
                        <span>創意</span>
                      </div>
                    </div>

                    {/* Max Tokens 設定 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最大 Token 數: {maxTokens}
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="4000"
                        step="100"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* 說明文字 */}
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      <p className="mb-1">• Temperature 越高，回應越有創意性</p>
                      <p>• Token 數越大，回應可以越長</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 新增歷史記錄側邊欄 */}
      {showHistory && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-10 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">聊天記錄</h2>
            <button onClick={() => setShowHistory(false)}>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="space-y-4">
            

            {historyMessages.map((conversation) => (
              <div
                key={conversation.date}
                className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  const expandedMessages = conversation.messages.flatMap(msg => [
                    msg.userMessage,
                    msg.assistantMessage
                  ]);
                  setCurrentMessages(expandedMessages);
                  setShowHistory(false);
                }}
              >
                <div className="font-semibold mb-2">{conversation.date}</div>
                <div className="flex gap-2">
                  <div className="flex-1 text-sm text-gray-600 truncate">
                    <ChatBubbleLeftIcon className="h-4 w-4 inline mr-1" />
                    {conversation.messages[0]?.userMessage.text || '空對話'}
                  </div>
                  <div className="flex-1 text-sm text-gray-600 truncate">
                    <ChatBubbleLeftIcon className="h-4 w-4 inline mr-1" />
                    {conversation.messages[0]?.assistantMessage.text || ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {currentMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              } mb-4`}
            >
              <div
                className={`p-3 rounded-lg max-w-[80%] relative group ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs opacity-75">
                    {formatDateTime(message.timestamp)}
                  </span>
                  <button
                    onClick={() => handleCopyMessage(message.text, message.id)}
                    className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                      message.sender === 'user' ? 'hover:bg-blue-600' : 'hover:bg-gray-100'
                    }`}
                    title="複製訊息"
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white p-3 rounded-lg shadow">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="輸入訊息..."
                className="w-full p-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                rows="1"
                style={{ maxHeight: '150px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className={`p-3 rounded-lg ${
                isLoading || !inputMessage.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;