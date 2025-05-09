import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const ChatHistory = ({ 
  historyMessages, 
  loadSessionChat, 
  setShowHistory,
  loadMoreHistory,
  isLoadingHistory,
  hasMoreHistory 
}) => {
  const containerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // 確認是否在底部附近
      const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      // 只有當狀態改變時才觸發載入更多
      if (nearBottom !== isNearBottom) {
        setIsNearBottom(nearBottom);
        
        // 只有當處於底部附近、有更多歷史記錄且不在載入狀態時才載入更多
        if (nearBottom && hasMoreHistory && !isLoadingHistory) {
          loadMoreHistory();
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMoreHistory, hasMoreHistory, isLoadingHistory, isNearBottom]);

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-10 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">聊天記錄</h2>
          <button onClick={() => setShowHistory(false)}>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {historyMessages.length === 0 && !isLoadingHistory && (
          <div className="text-center text-gray-500 py-8">
            沒有聊天記錄
          </div>
        )}

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
        
        {isLoadingHistory && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        {!hasMoreHistory && historyMessages.length > 0 && (
          <div className="text-center text-gray-500 text-sm py-4">
            沒有更多記錄了
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
