import React, { useEffect } from 'react';
import Header from './Header';
import ChatHistory from './ChatHistory';
import MessageList from './MessageList';
import InputArea from './InputArea';
import Settings from './Settings';
import { useChatState } from './hooks/useChatState';
import { useMessageHandlers } from './hooks/useMessageHandlers';
import { useBackendStatus } from './hooks/useBackendStatus';
import { useVectorDB } from './hooks/useVectorDB'; // Import the new hook

const ChatInterface = () => {
  const chatState = useChatState();
  const messageHandlers = useMessageHandlers(chatState);
  const backendStatus = useBackendStatus();
  const vectorDB = useVectorDB(chatState.sessionId); // Instantiate the hook

  // 當 showHistory 變為 true 時，載入歷史記錄
  useEffect(() => {
    if (chatState.showHistory && chatState.historyMessages.length === 0) {
      // 只有當顯示歷史記錄且尚未加載數據時才載入
      chatState.fetchChatHistory(0, false);
    }
  }, [chatState.showHistory, chatState.fetchChatHistory, chatState.historyMessages.length]);

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
