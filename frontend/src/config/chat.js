export const MODELS = [
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'deepseek-v3(快速回應)', apiType: 'openrouter' },
  { id: 'deepseek/deepseek-r1:free', name: 'deepseek-r1(深度思考)', apiType: 'openrouter' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini-2.0-flash(快速回應)', apiType: 'gemini' },
  { id: 'gemini-2.0-flash-thinking-exp-1219', name: 'Gemini-2.0-thinking(深度思考)', apiType: 'gemini' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1-mini(平衡回答)', apiType: 'openai' },
];

export const API_TYPES = ['openrouter', 'openai', 'gemini'];
export const DEFAULT_API_TYPE = 'openrouter';
export const DEFAULT_MODEL = 'deepseek/deepseek-r1:free';
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 1000;
export const COPY_TIMEOUT = 2000; // 複製提示顯示時間（毫秒）