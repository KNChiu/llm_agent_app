// VirtualizedMessageList.jsx - 虛擬滾動的消息列表
import React, { memo, useMemo, useRef, useEffect, useState } from 'react';
import Message from './Message';

const ITEM_HEIGHT = 120; // 預估每個訊息的高度
const BUFFER_SIZE = 5; // 緩衝區大小，額外渲染的項目數

const VirtualizedMessageList = memo(({
  messages,
  copiedMessageId,
  copiedCodeIndex,
  onCopyMessage,
  onCopyCode,
  containerHeight = 500,
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: containerHeight });

  // 計算可見區域
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
    const endIndex = Math.min(
      messages.length - 1,
      Math.ceil((scrollTop + containerSize.height) / ITEM_HEIGHT) + BUFFER_SIZE,
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerSize.height, messages.length]);

  // 可見的消息
  const visibleMessages = useMemo(() => {
    return messages.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [messages, visibleRange]);

  // 總高度
  const totalHeight = messages.length * ITEM_HEIGHT;

  // 處理滾動事件
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // 監聽容器大小變化
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 自動滾動到底部
  useEffect(() => {
    if (containerRef.current) {
      const isNearBottom = scrollTop + containerSize.height >= totalHeight - ITEM_HEIGHT * 2;
      if (isNearBottom) {
        containerRef.current.scrollTop = totalHeight;
      }
    }
  }, [messages.length, totalHeight, scrollTop, containerSize.height]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleRange.startIndex * ITEM_HEIGHT}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleMessages.map((message, index) => (
            <div
              key={`${message.id}-${visibleRange.startIndex + index}`}
              style={{ height: ITEM_HEIGHT }}
              className="px-4"
            >
              <Message
                message={message}
                copiedMessageId={copiedMessageId}
                copiedCodeIndex={copiedCodeIndex}
                onCopyMessage={onCopyMessage}
                onCopyCode={onCopyCode}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualizedMessageList.displayName = 'VirtualizedMessageList';

export default VirtualizedMessageList;