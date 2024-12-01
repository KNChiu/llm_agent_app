import React, { useState, useEffect, useRef } from 'react';
import FeatureMenu, { defaultFeatures } from './FeatureMenu';

const InputArea = ({ 
  inputMessage,
  setInputMessage,
  isLoading,
  onSendMessage,
  onKeyPress,
}) => {
  const defaultFeature = defaultFeatures.find(f => f.mode === 'chat');
  const [selectedFeature, setSelectedFeature] = useState(defaultFeature);

  const handleSelectMode = (feature) => {
    setSelectedFeature(feature);
  };

  const handleSendMessage = () => {
    onSendMessage(selectedFeature);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setInputMessage(prevMessage => prevMessage + '\n');
    }
  };

  const textareaRef = useRef(null);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [inputMessage]);


  return (
    <div className="p-4 border-t">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center border rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
            <FeatureMenu 
              onSelectMode={handleSelectMode}
              currentMode={selectedFeature.mode}
            />      
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={selectedFeature?.placeholder || "輸入訊息..."}
              className="flex-1 p-2 focus:outline-none resize-none overflow-y-auto"
              disabled={isLoading}
              rows="1"
              ref={textareaRef}
              style={{ 
                minHeight: '40px', 
                maxHeight: '200px',
                lineHeight: '1.5',
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className={`px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors
              ${selectedFeature ? selectedFeature.colors.button : 'bg-blue-500'}`}
          >
            {selectedFeature?.buttonText || '發送'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea; 