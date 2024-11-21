import React from 'react';
import { Send } from 'lucide-react';

const InputArea = ({
  inputMessage,
  setInputMessage,
  isLoading,
  selectedModel,
  setSelectedModel,
  models,
  onSendMessage,
  onKeyPress
}) => {
  return (
    <div className="bg-white border-t p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            {models?.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="輸入訊息..."
              className="w-full p-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 resize-none"
              rows="1"
              style={{ maxHeight: '150px' }}
            />
          </div>
          <button
            onClick={onSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className={`p-3 rounded-lg ${
              isLoading || !inputMessage.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea; 