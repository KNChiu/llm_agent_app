import { chatService } from '../../../services/api';
import { COPY_TIMEOUT } from '../../../config/chat';

export const useMessageHandlers = (chatState) => {
  const handleSendMessage = async (selectedFeature = null, fileContent = '') => {
    if (!chatState.inputMessage.trim() || chatState.isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: fileContent ? `FileContent: ${fileContent}  \nTask: ${chatState.inputMessage.trim()}` : chatState.inputMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      fileContent,
    };

    const updatedMessages = [...chatState.currentMessages, userMessage];
    
    chatState.setCurrentMessages(updatedMessages);
    chatState.setInputMessage('');
    chatState.setIsLoading(true);

    try {
      const response = await chatService.sendMessage(
        userMessage.text,
        updatedMessages,
        chatState.selectedModel,
        chatState.temperature,
        chatState.maxTokens,
        selectedFeature?.prompt || ''
      );

      const assistantMessage = {
        id: `${Date.now()}-assistant`,
        text: response.message,
        sender: 'assistant',
        timestamp: new Date().toISOString()
      };

      chatState.setCurrentMessages(messages => [...messages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      chatState.setIsLoading(false);
    }
  };

  const handleCopyMessage = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      chatState.setCopiedMessageId(messageId);
      setTimeout(() => {
        chatState.setCopiedMessageId(null);
      }, COPY_TIMEOUT);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleCopyCode = async (code, index) => {
    try {
      await navigator.clipboard.writeText(code);
      chatState.setCopiedCodeIndex(index);
      setTimeout(() => {
        chatState.setCopiedCodeIndex(null);
      }, COPY_TIMEOUT);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return {
    handleSendMessage,
    handleKeyPress: (e, selectedFeature) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(selectedFeature);
      }
    },
    handleCopyMessage,
    handleCopyCode
  };
}; 