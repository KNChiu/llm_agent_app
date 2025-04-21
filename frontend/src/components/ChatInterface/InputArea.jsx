import React, { useState, useEffect, useRef } from 'react';
import FeatureMenu, { defaultFeatures } from './FeatureMenu';
import { handleFileChange } from './fileHandlers';

const InputArea = ({
  inputMessage,
  setInputMessage,
  isLoading, // General loading state from useChatState
  onSendMessage,
  apiType,
  // VectorDB props
  onAddDocuments,
  onRetrieveDocuments,
  isVectorDBLoading, // Specific loading state from useVectorDB
}) => {
  const defaultFeature = defaultFeatures.find((f) => f.mode === 'chat');
  const [selectedFeature, setSelectedFeature] = useState(defaultFeature);
  const [fileContent, setFileContent] = useState(''); // 儲存檔案內容
  const [fileName, setFileName] = useState('');

  const handleSelectMode = (feature) => {
    setSelectedFeature(feature);
  };

  // Determine if the overall UI should be disabled (either chat loading or VectorDB loading)
  const isDisabled = isLoading || isVectorDBLoading;

  const handleAction = async () => {
    if (selectedFeature.mode === 'summary') {
      if (fileContent) {
        // Add document if file content exists
        const success = await onAddDocuments(fileContent, fileName);
        if (success) {
          setFileContent('');
          setFileName('');
        }
      } else if (inputMessage.trim()) {
        // Retrieve documents if input message exists
        const retrievedContent = await onRetrieveDocuments(inputMessage);
  
        await onSendMessage(selectedFeature, {
          question: inputMessage,
          documents: retrievedContent,
        }, apiType);
  
        // Clear inputMessage after retrieval
        setInputMessage('');
      }
    } else {
      // 其他模式的預設傳送訊息
      onSendMessage(selectedFeature, fileContent, apiType);
      setFileContent('');
      setFileName('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleAction();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cursorPosition = e.target.selectionStart;
      const textBeforeCursor = inputMessage.slice(0, cursorPosition);
      const textAfterCursor = inputMessage.slice(cursorPosition);
      setInputMessage(textBeforeCursor + '\n' + textAfterCursor);

      setTimeout(() => {
        e.target.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
      }, 0);
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

            <div className="flex-1 flex items-center">
              {selectedFeature.mode === 'summary' && fileName && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded mx-2">
                  <span className="text-sm text-gray-600 truncate max-w-[150px]">
                    {fileName}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setFileName('');
                      setFileContent('');
                    }}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    ×
                  </button>
                </div>
              )}

              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={selectedFeature?.placeholder || '輸入訊息...'}
                className="w-full p-2 focus:outline-none resize-none overflow-y-auto"
                disabled={isDisabled || (selectedFeature.mode === 'summary' && !!fileContent)} // Disable textarea if file is loaded in summary mode
                rows="1"
                ref={textareaRef}
                style={{
                  minHeight: '40px',
                  maxHeight: '200px',
                  lineHeight: '1.5',
                }}
              />
            </div>

            {selectedFeature.mode === 'summary' && (
              <div className="px-2">
                <input
                  type="file"
                  accept=".pdf, .txt"
                  onChange={(e) => {
                    // Call handleFileChange with only event and setter
                    handleFileChange(e, setFileContent);
                    if (e.target.files[0]) {
                      setFileName(e.target.files[0].name);
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                  disabled={isDisabled} // Disable file input when loading
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer text-blue-500 hover:text-blue-600 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  上傳檔案
                </label>
              </div>
            )}
          </div>

          <button
            onClick={handleAction} // Use the new handler
            disabled={isDisabled || (selectedFeature.mode === 'summary' ? (!fileContent && !inputMessage.trim()) : (!inputMessage.trim() && !fileContent))}
            className={`px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors
              ${selectedFeature ? selectedFeature.colors.button : 'bg-blue-500'}`}
          >
            {/* Dynamically change button text for summary mode */}
            {selectedFeature.mode === 'summary'
              ? fileContent
                ? '加入知識庫' // Add to KB
                : '知識庫檢索' // Retrieve from KB
              : selectedFeature?.buttonText || '發送'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
