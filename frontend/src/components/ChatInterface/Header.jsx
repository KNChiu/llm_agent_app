import React from 'react';
import { PlusCircle, History, Settings, AlertCircle } from 'lucide-react';

const Header = ({ 
  backendStatus = 'checking', 
  showHistory, 
  setShowHistory, 
  showSettings, 
  setShowSettings,
  handleNewChat = () => {},
  fetchChatHistory = () => {}
}) => {
  const handleHistoryClick = () => {
    setShowHistory(!showHistory);
    // 只有在開啟歷史記錄且尚未載入數據時才載入
    if (!showHistory) {
      // 可以讓 ChatInterface 中的 useEffect 自動處理載入邏輯
      // 不在這裡直接調用 fetchChatHistory
    }
  };

  return (
    <div className="bg-white shadow-sm p-4">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-800">LLM Chatbot</h1>
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
            onClick={handleHistoryClick}
          >
            <History className={`w-5 h-5 ${showHistory ? 'text-blue-600' : 'text-gray-600'}`} />
          </button>
          <button 
            className={`p-2 rounded-full ${showSettings ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className={`w-5 h-5 ${showSettings ? 'text-blue-600' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header; 