import React from 'react';
import Message from './Message';

const MessageList = ({ 
  messages, 
  isLoading, 
  copiedMessageId,
  copiedCodeIndex,
  onCopyMessage,
  onCopyCode,
  // VectorDB props
  retrievedDocs,
  isVectorDBLoading,
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
        {/* VectorDB Loading Indicator */}
        {isVectorDBLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-orange-50 p-3 rounded-lg shadow text-orange-600">
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>知識庫處理中...</span>
              </div>
            </div>
          </div>
        )}
        {/* Display Retrieved Documents */}
        {retrievedDocs && retrievedDocs.length > 0 && (
          <div className="mt-4 mb-4 p-3 bg-orange-50 rounded-lg shadow">
            <h4 className="text-sm font-semibold text-orange-700 mb-2">知識庫檢索結果:</h4>
            <ul className="space-y-2">
              {retrievedDocs.map((doc, index) => (
                <li key={doc.id || index} className="text-sm text-gray-700 bg-white p-2 rounded shadow-sm">
                  {/* Assuming doc structure has 'page_content' and maybe 'metadata' */}
                  <p>{doc.page_content || JSON.stringify(doc)}</p>
                  {doc.metadata && (
                     <p className="text-xs text-gray-500 mt-1">來源: {doc.metadata.source || '未知'}, 類型: {doc.metadata.type || '未知'}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;
