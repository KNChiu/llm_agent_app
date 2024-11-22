import React, { useState } from 'react';
import FeatureMenu from './FeatureMenu';

const InputArea = ({ 
  inputMessage,
  setInputMessage,
  isLoading,
  onSendMessage,
  onKeyPress,
}) => {
  const [selectedFeature, setSelectedFeature] = useState(null);

  const handleSelectMode = (feature) => {
    setSelectedFeature(feature);
  };

  const handleSendMessage = () => {
    onSendMessage(selectedFeature);
  };

  const handleKeyPress = (e) => {
    if (onKeyPress) {
      onKeyPress(e, selectedFeature);
    }
  };

  return (
    <div className="p-4 border-t">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <FeatureMenu onSelectMode={handleSelectMode} />
          <div className="flex flex-1 items-center border rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
            {selectedFeature?.icon && (
              <div className={`p-2 m-1 rounded-md ${selectedFeature.colors.bg}`}>
                <selectedFeature.icon className="w-5 h-5" />
              </div>
            )}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedFeature?.placeholder || "輸入訊息..."}
              className="flex-1 p-2 focus:outline-none"
              disabled={isLoading}
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