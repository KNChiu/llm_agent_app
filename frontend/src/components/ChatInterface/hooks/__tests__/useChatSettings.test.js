// __tests__/useChatSettings.test.js
import { renderHook, act } from '@testing-library/react';
import { useChatSettings } from '../useChatSettings';

// Mock the config
jest.mock('../../../config/chat', () => ({
  MODELS: [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
  ],
  DEFAULT_MODEL: 'gpt-3.5-turbo',
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 1000,
  DEFAULT_API_TYPE: 'openai',
}));

describe('useChatSettings', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useChatSettings());
    
    expect(result.current.selectedModel).toBe('gpt-3.5-turbo');
    expect(result.current.temperature).toBe(0.7);
    expect(result.current.maxTokens).toBe(1000);
    expect(result.current.apiType).toBe('openai');
    expect(result.current.showSettings).toBe(false);
  });

  it('should update settings correctly', () => {
    const { result } = renderHook(() => useChatSettings());
    
    act(() => {
      result.current.updateSettings({
        selectedModel: 'gpt-4',
        temperature: 0.5,
        maxTokens: 2000,
        apiType: 'gemini',
      });
    });
    
    expect(result.current.selectedModel).toBe('gpt-4');
    expect(result.current.temperature).toBe(0.5);
    expect(result.current.maxTokens).toBe(2000);
    expect(result.current.apiType).toBe('gemini');
  });

  it('should validate settings correctly', () => {
    const { result } = renderHook(() => useChatSettings());
    
    // Test valid settings
    let validation = result.current.validateSettings();
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toEqual({});
    
    // Test invalid temperature
    act(() => {
      result.current.setTemperature(3);
    });
    
    validation = result.current.validateSettings();
    expect(validation.isValid).toBe(false);
    expect(validation.errors.temperature).toBeDefined();
    
    // Test invalid maxTokens
    act(() => {
      result.current.setTemperature(0.7); // Reset to valid
      result.current.setMaxTokens(5000);
    });
    
    validation = result.current.validateSettings();
    expect(validation.isValid).toBe(false);
    expect(validation.errors.maxTokens).toBeDefined();
  });

  it('should reset to defaults correctly', () => {
    const { result } = renderHook(() => useChatSettings());
    
    // Change settings
    act(() => {
      result.current.setSelectedModel('gpt-4');
      result.current.setTemperature(1.0);
      result.current.setMaxTokens(2000);
      result.current.setApiType('gemini');
    });
    
    // Reset to defaults
    act(() => {
      result.current.resetToDefaults();
    });
    
    expect(result.current.selectedModel).toBe('gpt-3.5-turbo');
    expect(result.current.temperature).toBe(0.7);
    expect(result.current.maxTokens).toBe(1000);
    expect(result.current.apiType).toBe('openai');
  });

  it('should get settings for request correctly', () => {
    const { result } = renderHook(() => useChatSettings());
    
    const settings = result.current.getSettingsForRequest();
    
    expect(settings).toEqual({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
      apiType: 'openai',
    });
  });
});