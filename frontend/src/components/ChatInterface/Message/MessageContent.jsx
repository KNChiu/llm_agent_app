import React from 'react';
import CodeBlock from './CodeBlock';

const MessageContent = ({ text, copiedCodeIndex, onCopyCode }) => {
  const renderContent = () => {
    if (text.includes('```')) {
      const parts = text.split(/(```[\s\S]*?```)/);
      return parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.split('\n');
          const language = lines[0].replace('```', '').trim();
          const code = lines.slice(1, -1).join('\n');
          
          return (
            <CodeBlock
              key={index}
              code={code}
              language={language}
              index={index}
              copiedCodeIndex={copiedCodeIndex}
              onCopyCode={onCopyCode}
            />
          );
        }
        return <span key={index}>{part}</span>;
      });
    }
    return <p className="whitespace-pre-wrap">{text}</p>;
  };

  return <div>{renderContent()}</div>;
};

export default MessageContent; 