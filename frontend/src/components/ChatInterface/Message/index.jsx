import React from 'react';
import { Copy, Check } from 'lucide-react';
import MessageContent from './MessageContent';
import { formatDateTime } from '../../../utils/dateTime';

const Message = ({ 
  message, 
  copiedMessageId, 
  copiedCodeIndex,
  onCopyMessage,
  onCopyCode 
}) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`p-3 rounded-lg max-w-[80%] relative group ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-800 shadow'
        }`}
      >
        <MessageContent 
          text={message.text} 
          copiedCodeIndex={copiedCodeIndex}
          onCopyCode={onCopyCode} 
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs opacity-75">
            {formatDateTime(message.timestamp)}
          </span>
          <button
            onClick={() => onCopyMessage(message.text, message.id)}
            className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
              isUser ? 'hover:bg-blue-600' : 'hover:bg-gray-100'
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
  );
};

export default Message; 