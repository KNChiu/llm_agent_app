export const MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o-mini', apiType: 'openai' },
  { id: 'gpt-4o', name: 'GPT-4o', apiType: 'openai' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini-2.0-flash', apiType: 'gemini' },
  { id: 'gemini-2.0-flash-thinking-exp-1219', name: 'Gemini-2.0-thinking', apiType: 'gemini' },
];

export const API_TYPES = ['openai', 'gemini'];
export const DEFAULT_API_TYPE = 'gemini';
export const DEFAULT_MODEL = 'gemini-2.0-flash-exp';
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 1000;
export const COPY_TIMEOUT = 2000; // 複製提示顯示時間（毫秒）