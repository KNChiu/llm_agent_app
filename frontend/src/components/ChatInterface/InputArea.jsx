import React, { useState, useEffect, useRef } from 'react';
import FeatureMenu, { defaultFeatures } from './FeatureMenu';
import { handleFileChange, handleImageDrop, handleImageSelect } from './fileHandlers';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

const InputArea = ({
  inputMessage,
  setInputMessage,
  sessionId,
  selectedModel,
  setSelectedModel,
  isLoading, // General loading state from useChatState
  onSendMessage,
  onKeyPress,
  models,
  apiType,
  setApiType, // 添加 setApiType 參數用於自動切換 API
  userId, // 添加 userId 參數
  // VectorDB props
  onAddDocuments,
  onRetrieveDocuments,
  isVectorDBLoading, // Specific loading state from useVectorDB
}) => {
  const defaultFeature = defaultFeatures.find((f) => f.mode === 'chat');
  const [selectedFeature, setSelectedFeature] = useState(defaultFeature);
  const [fileContent, setFileContent] = useState(''); // 儲存檔案內容
  const [fileName, setFileName] = useState('');
  
  // 圖片上傳相關狀態
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [originalApiType, setOriginalApiType] = useState(null);
  const [originalModel, setOriginalModel] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const handleSelectMode = (feature) => {
    setSelectedFeature(feature);
    // 如果切換到非對話模式，清除圖片
    if (feature.mode !== 'chat' && uploadedImages.length > 0) {
      handleClearImages();
    }
  };

  // 自動切換 API 到 OpenAI
  const switchToOpenAI = () => {
    console.log('switchToOpenAI called - current apiType:', apiType, 'originalApiType:', originalApiType);
    if (apiType !== 'openai') {
      if (!originalApiType) {
        console.log('Switching from', apiType, 'to openai');
        setOriginalApiType(apiType);
        setOriginalModel(selectedModel);
        setApiType('openai');
        
        // 同時切換到適合的 OpenAI 模型
        const openaiModel = models.find(model => model.apiType === 'openai');
        if (openaiModel && selectedModel !== openaiModel.id) {
          console.log('Switching model from', selectedModel, 'to', openaiModel.id);
          setSelectedModel(openaiModel.id);
        }
        
        showNotification('已自動切換到 OpenAI API 以支援圖片處理', 'switch');
      } else {
        console.log('API switch already performed, originalApiType exists:', originalApiType);
      }
    } else {
      console.log('Already using OpenAI API');
    }
  };

  // 恢復原始 API
  const restoreOriginalAPI = () => {
    console.log('restoreOriginalAPI called - originalApiType:', originalApiType, 'originalModel:', originalModel);
    if (originalApiType) {
      console.log('Restoring API from', apiType, 'to', originalApiType);
      setApiType(originalApiType);
      setOriginalApiType(null);
      
      // 恢復原始模型
      if (originalModel) {
        console.log('Restoring model from', selectedModel, 'to', originalModel);
        setSelectedModel(originalModel);
        setOriginalModel(null);
      }
      
      showNotification('已恢復到原始 API 設定', 'restore');
    } else {
      console.log('No originalApiType to restore to');
    }
  };

  // 顯示通知
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // 處理圖片上傳
  const handleImageAdd = (images) => {
    console.log('handleImageAdd called with', images.length, 'images');
    setUploadedImages(prev => [...prev, ...images]);
    if (images.length > 0) {
      console.log('Calling switchToOpenAI...');
      switchToOpenAI();
    }
  };

  // 移除圖片
  const removeImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    
    console.log('removeImage - remaining images:', newImages.length);
    if (newImages.length === 0) {
      console.log('No images left, calling restoreOriginalAPI');
      restoreOriginalAPI();
    }
  };

  // 清除所有圖片
  const handleClearImages = () => {
    console.log('handleClearImages called');
    setUploadedImages([]);
    console.log('All images cleared, calling restoreOriginalAPI');
    restoreOriginalAPI();
  };

  // 處理錯誤
  const handleError = (errorMessage) => {
    showNotification(errorMessage, 'error');
  };

  // 拖曳事件處理
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedFeature.mode === 'chat') {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (selectedFeature.mode === 'chat' && !isDisabled) {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleImageDrop(files, handleImageAdd, handleError);
      }
    }
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
        }, apiType, userId); // 傳遞 userId
  
        // Clear inputMessage after retrieval
        setInputMessage('');
      }
    } else if (selectedFeature.mode === 'chat' && uploadedImages.length > 0) {
      // 對話模式且有圖片 - 傳送圖片和文字
      await onSendMessage(selectedFeature, {
        message: inputMessage,
        images: uploadedImages,
      }, apiType, userId);
      
      // 清除輸入內容和圖片
      setInputMessage('');
      setUploadedImages([]);
      restoreOriginalAPI();
    } else {
      // 其他模式的預設傳送訊息
      onSendMessage(selectedFeature, fileContent, apiType, userId); // 傳遞 userId
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

  // 處理貼上事件
  const handlePaste = async (e) => {
    if (selectedFeature.mode !== 'chat' || isDisabled) {
return;
}

    const clipboardData = e.clipboardData || window.clipboardData;
    const items = clipboardData.items;

    const imageFiles = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault(); // 阻止預設的貼上行為
        const file = item.getAsFile();
        if (file) {
          try {
            // 將圖片轉換為 base64
            const base64Data = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            imageFiles.push({
              file,
              name: `pasted-image-${Date.now()}-${i}.png`,
              size: file.size,
              type: file.type,
              base64: base64Data,
              preview: base64Data, // 用於預覽
            });
          } catch (error) {
            console.error('Failed to convert pasted image to base64:', error);
            handleError('圖片處理失敗');
          }
        }
      }
    }

    if (imageFiles.length > 0) {
      console.log('Pasted', imageFiles.length, 'images');
      handleImageAdd(imageFiles);
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
    <div className="p-4 border-t relative">
      {/* 通知系統 */}
      {notification.show && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
            notification.type === 'switch' ? 'bg-blue-50 border border-blue-200 text-blue-700' :
            notification.type === 'restore' ? 'bg-green-50 border border-green-200 text-green-700' :
            'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification({ show: false, message: '', type: '' })}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* 圖片預覽區域 - 只在對話模式顯示 */}
        {selectedFeature.mode === 'chat' && uploadedImages.length > 0 && (
          <div className="mb-4 p-3 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                已上傳 {uploadedImages.length} 張圖片
              </span>
              <button
                onClick={handleClearImages}
                className="text-sm text-red-500 hover:text-red-700"
              >
                清除全部
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-16 h-16 object-cover rounded border"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 主要輸入區域 */}
        <div 
          className="relative"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* 拖曳覆蓋層 - 只在對話模式顯示 */}
          {selectedFeature.mode === 'chat' && isDragging && (
            <div className="absolute inset-0 min-h-[100px] bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <PhotoIcon className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                <p className="text-blue-600 font-medium">拖曳圖片到這裡上傳</p>
                <p className="text-blue-500 text-sm">支援 JPG, PNG, GIF, WebP</p>
              </div>
            </div>
          )}

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
                  onPaste={handlePaste}
                  placeholder={selectedFeature?.placeholder || '輸入訊息...'}
                  className="w-full p-2 focus:outline-none resize-none overflow-y-auto"
                  disabled={isDisabled || (selectedFeature.mode === 'summary' && !!fileContent)}
                  rows="1"
                  ref={textareaRef}
                  style={{
                    minHeight: '40px',
                    maxHeight: '200px',
                    lineHeight: '1.5',
                  }}
                />
              </div>

              {/* 檔案上傳按鈕 - 文件模式 */}
              {selectedFeature.mode === 'summary' && (
                <div className="px-2">
                  <input
                    type="file"
                    accept=".pdf, .txt"
                    onChange={(e) => {
                      handleFileChange(e, setFileContent);
                      if (e.target.files[0]) {
                        setFileName(e.target.files[0].name);
                      }
                    }}
                    className="hidden"
                    id="file-upload"
                    disabled={isDisabled}
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
              onClick={handleAction}
              disabled={isDisabled || (
                selectedFeature.mode === 'summary' 
                  ? (!fileContent && !inputMessage.trim()) 
                  : selectedFeature.mode === 'chat' 
                    ? (!inputMessage.trim() && uploadedImages.length === 0)
                    : (!inputMessage.trim() && !fileContent)
              )}
              className={`px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 transition-colors
                ${selectedFeature ? selectedFeature.colors.button : 'bg-blue-500'}`}
            >
              {selectedFeature.mode === 'summary'
                ? fileContent
                  ? '加入知識庫'
                  : '知識庫檢索'
                : selectedFeature?.buttonText || '發送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
