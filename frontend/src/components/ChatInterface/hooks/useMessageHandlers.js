import { chatService } from '../../../services/api';
import { COPY_TIMEOUT } from '../../../config/chat';

export const useMessageHandlers = (chatState) => {
  const handleSendMessage = async (selectedFeature = null, contentData = '', apiType, userId = null) => {
    // Handle different content types
    let messageText = '';
    let fileContent = '';
    let images = [];
    
    if (typeof contentData === 'object' && contentData !== null) {
      // Handle image data from chat mode
      if (contentData.message !== undefined && contentData.images) {
        messageText = contentData.message || '';
        images = contentData.images || [];
      } else if (contentData.question && contentData.documents) {
        // Handle document data from summary mode
        messageText = contentData.question;
        fileContent = contentData.documents;
      }
    } else {
      // Handle simple file content or text
      messageText = chatState.inputMessage.trim();
      fileContent = contentData;
    }

    // Check if we have any content to send
    if (!messageText.trim() && !fileContent && images.length === 0) {
return;
}
    if (chatState.isLoading) {
return;
}

    const userMessage = {
      id: Date.now().toString(), // Unique ID for user message
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString(),
      fileContent,
      images: images.length > 0 ? images : undefined, // Include images if present
    };

    // Add user message and an initial empty assistant message for streaming
    const assistantMessageId = `${Date.now()}-assistant`;
    const initialAssistantMessage = {
      id: assistantMessageId,
      text: '', // Start with empty text
      sender: 'assistant',
      timestamp: new Date().toISOString(), // Timestamp will be when streaming starts
    };

    // Update messages: add user message first, then the placeholder for assistant message
    chatState.setCurrentMessages((prevMessages) => [
      ...prevMessages,
      userMessage,
      initialAssistantMessage,
    ]);
    
    chatState.setInputMessage('');
    chatState.setIsLoading(true);

    try {
      const userIdToUse = userId || chatState.currentUserId;
      
      // Call the streaming service method
      await chatService.sendMessageStream(
        chatState.sessionId,
        userMessage, // Pass the userMessage object, service will extract text
        chatState.currentMessages, // Pass current history for context
        chatState.selectedModel,
        chatState.temperature,
        chatState.maxTokens,
        selectedFeature?.prompt || '',
        apiType,
        userIdToUse,
        (chunk) => { // onChunk callback
          chatState.setCurrentMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, text: msg.text + chunk }
                : msg,
            ),
          );
        },
        (error) => { // onError callback
          console.error('Streaming error:', error);
          chatState.setCurrentMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, text: msg.text + `\nError: ${error.message}` } // Append error to the message
                : msg,
            ),
          );
          chatState.setIsLoading(false);
        },
        (fullResponse) => { // onComplete callback
          // Optional: if you need to do something with the full response after streaming
          console.log('Streaming complete. Full response:', fullResponse);
          chatState.setIsLoading(false);
          // The message text is already updated by onChunk.
          // If backend saves and returns a final timestamp or turn_id, update here.
        },
      );

    } catch (error) {
      // This catch block might be redundant if sendMessageStream handles all its errors via onError
      console.error('Error in handleSendMessage after calling sendMessageStream:', error);
      chatState.setCurrentMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, text: msg.text + `\nError: Failed to send message` }
            : msg,
        ),
      );
      chatState.setIsLoading(false); 
    }
    // setLoading(false) is now handled by onComplete or onError in sendMessageStream
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
        handleSendMessage(selectedFeature, '', chatState.apiType, chatState.currentUserId);
      }
    },
    handleCopyMessage,
    handleCopyCode,
  };
};
