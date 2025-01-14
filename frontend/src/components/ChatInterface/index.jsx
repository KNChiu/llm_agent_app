import React from 'react';
import Header from './Header';
import ChatHistory from './ChatHistory';
import MessageList from './MessageList';
import InputArea from './InputArea';
import Settings from './Settings'; 
import { useChatState } from './hooks/useChatState';
import { useMessageHandlers } from './hooks/useMessageHandlers';
import { useBackendStatus } from './hooks/useBackendStatus';

const ChatInterface = () => {
  const chatState = useChatState();
  const messageHandlers = useMessageHandlers(chatState);
  const backendStatus = useBackendStatus();

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
          setCurrentMessages={chatState.setCurrentMessages}
          setShowHistory={chatState.setShowHistory}
          fetchChatHistory={chatState.fetchChatHistory}
        />
      )}

      <MessageList
        messages={chatState.currentMessages}
        isLoading={chatState.isLoading}
        copiedMessageId={chatState.copiedMessageId}
        copiedCodeIndex={chatState.copiedCodeIndex}
        onCopyMessage={messageHandlers.handleCopyMessage}
        onCopyCode={messageHandlers.handleCopyCode}
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
        />
      )}
    </div>
  );
};

export default ChatInterface; 