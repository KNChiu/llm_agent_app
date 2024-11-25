import React, { useState, useRef, useEffect } from 'react';
import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon, 
  MagnifyingGlassIcon, 
  DocumentTextIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';

export const defaultFeatures = [
  { 
    icon: ChatBubbleLeftRightIcon, 
    text: '對話', 
    mode: 'chat',
    placeholder: '輸入對話...',
    buttonText: '發送',
    colors: {
      bg: 'text-blue-500 bg-blue-50',
      button: 'bg-blue-500'
    },
    prompt: '請以專業且友善的方式回答以下問題：'
  },
  { 
    icon: MagnifyingGlassIcon, 
    text: '搜尋', 
    mode: 'search',
    placeholder: '輸入搜尋關鍵字...',
    buttonText: '搜尋',
    colors: {
      bg: 'text-purple-500 bg-purple-50',
      button: 'bg-purple-500'
    },
    prompt: '請幫我在網路中搜尋相關的資訊：'
  },
  { 
    icon: DocumentTextIcon, 
    text: '統整', 
    mode: 'summary',
    placeholder: '輸入要統整的內容...',
    buttonText: '統整',
    colors: {
      bg: 'text-green-500 bg-green-50',
      button: 'bg-green-500'
    },
    prompt: '請幫我統整並摘要以下內容的重點：'
  },
  { 
    icon: LanguageIcon, 
    text: '翻譯', 
    mode: 'translate',
    placeholder: '輸入要翻譯的內容...',
    buttonText: '翻譯',
    colors: {
      bg: 'text-green-500 bg-green-50',
      button: 'bg-green-500'
    },
    prompt: '請幫我翻譯以下內容(如果輸入的是英文就翻譯成通順的繁體中文台灣用語，如果是中文就翻譯成標準的英文)：'
  },
];

const FeatureMenu = ({ onSelectMode, currentMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentFeature = defaultFeatures.find(f => f.mode === currentMode) || defaultFeatures[0];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 hover:bg-gray-200 rounded-lg transition-colors ${currentFeature.colors.bg}`}
      >
        <currentFeature.icon className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg p-1 focus:outline-none">
          <div className="flex gap-1">
            {defaultFeatures.map((feature, index) => (
              <button
                key={index}
                className={`flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors min-w-[80px] 
                  ${currentMode === feature.mode ? feature.colors.bg : ''}`}
                onClick={() => {
                  onSelectMode(feature);
                  setIsOpen(false);
                }}
              >
                <feature.icon className="w-5 h-5 mr-2" />
                <span className="text-sm text-gray-600">{feature.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureMenu; 