import React from 'react';
import Message from './Message';

const MessageList = ({ 
  messages, 
  isLoading, 
  copiedMessageId,
  copiedCodeIndex,
  onCopyMessage,
  onCopyCode 
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            copiedMessageId={copiedMessageId}
            copiedCodeIndex={copiedCodeIndex}
            onCopyMessage={onCopyMessage}
            onCopyCode={onCopyCode}
          />
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
      </div>
    </div>
  );
};

export default MessageList; 