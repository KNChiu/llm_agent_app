import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, History } from 'lucide-react';
import { chatService } from '../services/api';
import { XMarkIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const ChatInterface = () => {
  const [currentMessages, setCurrentMessages] = useState([]);
  const [historyMessages, setHistoryMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [showHistory, setShowHistory] = useState(false);

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
      const response = await chatService.sendMessage(inputMessage);
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

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">LLM Agent</h1>
          <div className="flex gap-4">
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
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
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
                className={`p-3 rounded-lg max-w-[80%] ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <span className="text-xs opacity-75 block mt-1">
                  {formatDateTime(message.timestamp)}
                </span>
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