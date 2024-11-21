export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

export interface ChatHistory {
  date: string;
  messages: {
    id: string;
    userMessage: Message;
    assistantMessage: Message;
  }[];
}

export interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
} 