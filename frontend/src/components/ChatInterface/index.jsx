import React, { useEffect, useState } from 'react';
import Header from './Header';
import ChatHistory from './ChatHistory';
import MessageList from './MessageList';
import InputArea from './InputArea';
import Settings from './Settings';
import { useChatState } from './hooks/useChatState';
import { useMessageHandlers } from './hooks/useMessageHandlers';
import { useBackendStatus } from './hooks/useBackendStatus';
import { useVectorDB } from './hooks/useVectorDB'; // Import the new hook

const ChatInterface = ({ userId }) => {
  const chatState = useChatState(userId);
  const messageHandlers = useMessageHandlers(chatState);
  const backendStatus = useBackendStatus();
  const vectorDB = useVectorDB(chatState.sessionId); // Instantiate the hook
  const [hasTriedLoadHistory, setHasTriedLoadHistory] = useState(false);

  // 當 showHistory 變為 true 時，僅嘗試載入一次歷史記錄
  useEffect(() => {
    if (chatState.showHistory && !hasTriedLoadHistory) {
      // 標記為已嘗試過載入歷史記錄
      setHasTriedLoadHistory(true);
      // 嘗試載入歷史記錄
      chatState.fetchChatHistory(0, false);
    } else if (!chatState.showHistory && hasTriedLoadHistory) {
      // 當關閉歷史記錄面板時，重置狀態
      setHasTriedLoadHistory(false);
    }
  }, [chatState.showHistory, chatState.fetchChatHistory, hasTriedLoadHistory]);

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-100">
      <Header
        backendStatus={backendStatus}
        showHistory={chatState.showHistory}
        setShowHistory={chatState.setShowHistory}
        showSettings={chatState.showSettings}
        setShowSettings={chatState.setShowSettings}
        handleNewChat={chatState.handleNewChat}
        fetchChatHistory={chatState.fetchChatHistory}
      />

      {chatState.showHistory && (
        <ChatHistory
          historyMessages={chatState.historyMessages}
          loadSessionChat={chatState.loadSessionChat}
          setShowHistory={chatState.setShowHistory}
          loadMoreHistory={chatState.loadMoreHistory}
          isLoadingHistory={chatState.isLoadingHistory}
          hasMoreHistory={chatState.hasMoreHistory}
          setCurrentUserId={chatState.setCurrentUserIdAndReload}
          fetchChatHistory={chatState.fetchChatHistory}
          currentUserId={chatState.currentUserId}
        />
      )}

      <MessageList
        messages={chatState.currentMessages}
        isLoading={chatState.isLoading}
        copiedMessageId={chatState.copiedMessageId}
        copiedCodeIndex={chatState.copiedCodeIndex}
        onCopyMessage={messageHandlers.handleCopyMessage}
        onCopyCode={messageHandlers.handleCopyCode}
        retrievedDocs={vectorDB.retrievedDocs} // Pass retrieved docs
        isVectorDBLoading={vectorDB.isVectorDBLoading} // Pass loading state
      />

      <InputArea
        inputMessage={chatState.inputMessage}
        setInputMessage={chatState.setInputMessage}
        sessionId={chatState.sessionId}
        selectedModel={chatState.selectedModel}
        setSelectedModel={chatState.setSelectedModel}
        isLoading={chatState.isLoading}
        onSendMessage={messageHandlers.handleSendMessage}
        onKeyPress={messageHandlers.handleKeyPress}
        models={chatState.models}
        apiType={chatState.apiType}
        userId={userId}
        // Pass VectorDB handlers and loading state
        onAddDocuments={vectorDB.handleAddDocuments}
        onRetrieveDocuments={vectorDB.handleRetrieveDocuments}
        isVectorDBLoading={vectorDB.isVectorDBLoading}
      />

      {chatState.showSettings && (
        <Settings
          selectedModel={chatState.selectedModel}
          setSelectedModel={chatState.setSelectedModel}
          temperature={chatState.temperature}
          setTemperature={chatState.setTemperature}
          maxTokens={chatState.maxTokens}
          setMaxTokens={chatState.setMaxTokens}
          models={chatState.models}
          setShowSettings={chatState.setShowSettings}
          apiType={chatState.apiType}
          setApiType={chatState.setApiType}
        />
      )}
    </div>
  );
};

export default ChatInterface;
