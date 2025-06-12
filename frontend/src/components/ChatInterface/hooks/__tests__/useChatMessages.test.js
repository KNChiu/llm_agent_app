// __tests__/useChatMessages.test.js
import { renderHook, act } from '@testing-library/react';
import { useChatMessages } from '../useChatMessages';

describe('useChatMessages', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useChatMessages());
    
    expect(result.current.currentMessages).toEqual([]);
    expect(result.current.inputMessage).toBe('');
    expect(result.current.sessionId).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.copiedMessageId).toBe(null);
    expect(result.current.copiedCodeIndex).toBe(null);
  });

  it('should add messages correctly', () => {
    const { result } = renderHook(() => useChatMessages());
    
    const testMessage = { id: '1', text: 'Hello', sender: 'user' };
    
    act(() => {
      result.current.addMessage(testMessage);
    });
    
    expect(result.current.currentMessages).toEqual([testMessage]);
  });

  it('should update last message correctly', () => {
    const { result } = renderHook(() => useChatMessages());
    
    const testMessage = { id: '1', text: 'Hello', sender: 'user' };
    
    act(() => {
      result.current.addMessage(testMessage);
    });
    
    act(() => {
      result.current.updateLastMessage({ text: 'Updated Hello' });
    });
    
    expect(result.current.currentMessages[0].text).toBe('Updated Hello');
  });

  it('should handle new chat correctly', () => {
    const { result } = renderHook(() => useChatMessages());
    
    const testMessage = { id: '1', text: 'Hello', sender: 'user' };
    const originalSessionId = result.current.sessionId;
    
    act(() => {
      result.current.addMessage(testMessage);
    });
    
    act(() => {
      result.current.handleNewChat();
    });
    
    expect(result.current.currentMessages).toEqual([]);
    expect(result.current.sessionId).not.toBe(originalSessionId);
  });

  it('should clear messages correctly', () => {
    const { result } = renderHook(() => useChatMessages());
    
    const testMessage = { id: '1', text: 'Hello', sender: 'user' };
    
    act(() => {
      result.current.addMessage(testMessage);
    });
    
    act(() => {
      result.current.clearMessages();
    });
    
    expect(result.current.currentMessages).toEqual([]);
  });

  it('should update input message correctly', () => {
    const { result } = renderHook(() => useChatMessages());
    
    act(() => {
      result.current.setInputMessage('Test input');
    });
    
    expect(result.current.inputMessage).toBe('Test input');
  });

  it('should update loading state correctly', () => {
    const { result } = renderHook(() => useChatMessages());
    
    act(() => {
      result.current.setIsLoading(true);
    });
    
    expect(result.current.isLoading).toBe(true);
  });
});