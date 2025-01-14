import React from 'react';
import { XMarkIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const ChatHistory = ({ historyMessages, loadSessionChat, setShowHistory }) => {

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-10 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">聊天記錄</h2>
        <button onClick={() => setShowHistory(false)}>
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="space-y-4">
        {historyMessages.map((session) => (
          <div
            key={session.sessionId}
            className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
            onClick={() => loadSessionChat(session.sessionId)}
          >
            <div className="flex justify-between items-center mb-2">
            <div className="font-semibold">
                {session.lastMessage && session.lastMessage.length > 30 
                  ? `${session.lastMessage.substring(0, 30)}...` 
                  : session.lastMessage || '空對話'}
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <ChatBubbleLeftIcon className="h-4 w-4 inline mr-1" />
              <span className="line-clamp-2 flex-1 text-right">{session.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;
