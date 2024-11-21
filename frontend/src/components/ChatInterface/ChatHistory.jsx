import React from 'react';
import { XMarkIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const ChatHistory = ({ historyMessages, setCurrentMessages, setShowHistory }) => {
  return (
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
  );
};

export default ChatHistory; 