// hooks/useChatSettings.js - 專門處理聊天設置
import { useState, useCallback } from 'react';
import { MODELS, DEFAULT_MODEL, DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS, DEFAULT_API_TYPE } from '../../../config/chat';

export const useChatSettings = () => {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_MAX_TOKENS);
  const [apiType, setApiType] = useState(DEFAULT_API_TYPE);
  const [showSettings, setShowSettings] = useState(false);

  const resetToDefaults = useCallback(() => {
    setSelectedModel(DEFAULT_MODEL);
    setTemperature(DEFAULT_TEMPERATURE);
    setMaxTokens(DEFAULT_MAX_TOKENS);
    setApiType(DEFAULT_API_TYPE);
  }, []);

  const validateSettings = useCallback(() => {
    const errors = {};
    
    if (temperature < 0 || temperature > 2) {
      errors.temperature = 'Temperature 必須在 0-2 之間';
    }
    
    if (maxTokens < 1 || maxTokens > 4000) {
      errors.maxTokens = 'Max Tokens 必須在 1-4000 之間';
    }
    
    if (!MODELS.some(model => model.value === selectedModel)) {
      errors.selectedModel = '無效的模型選擇';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [selectedModel, temperature, maxTokens]);

  const updateSettings = useCallback((newSettings) => {
    if (newSettings.selectedModel !== undefined) {
      setSelectedModel(newSettings.selectedModel);
    }
    if (newSettings.temperature !== undefined) {
      setTemperature(newSettings.temperature);
    }
    if (newSettings.maxTokens !== undefined) {
      setMaxTokens(newSettings.maxTokens);
    }
    if (newSettings.apiType !== undefined) {
      setApiType(newSettings.apiType);
    }
  }, []);

  const getSettingsForRequest = useCallback(() => {
    return {
      model: selectedModel,
      temperature,
      maxTokens,
      apiType,
    };
  }, [selectedModel, temperature, maxTokens, apiType]);

  return {
    // 狀態
    models: MODELS,
    selectedModel,
    temperature,
    maxTokens,
    apiType,
    showSettings,
    
    // 設置器
    setSelectedModel,
    setTemperature,
    setMaxTokens,
    setApiType,
    setShowSettings,
    
    // 方法
    resetToDefaults,
    validateSettings,
    updateSettings,
    getSettingsForRequest,
  };
};