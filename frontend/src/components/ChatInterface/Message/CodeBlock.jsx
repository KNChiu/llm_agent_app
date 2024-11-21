import React from 'react';
import { Copy, Check } from 'lucide-react';
import hljs from 'highlight.js';

const CodeBlock = ({ code, language, index, copiedCodeIndex, onCopyCode }) => {
  try {
    const highlightedCode = hljs.highlight(code, {
      language: language || 'plaintext',
      ignoreIllegals: true
    }).value;

    return (
      <div className="my-2">
        <div className="bg-gray-800 text-gray-200 px-4 py-1 text-sm rounded-t-lg flex justify-between items-center">
          <span>{language || '程式碼'}</span>
          <button
            onClick={() => onCopyCode(code, index)}
            className="hover:bg-gray-700 p-1 rounded"
            title="複製程式碼"
          >
            {copiedCodeIndex === index ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-300 hover:text-white" />
            )}
          </button>
        </div>
        <pre className="m-0">
          <code
            className={`hljs language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            style={{
              display: 'block',
              background: '#1a1a1a',
              padding: '1rem',
              borderRadius: '0 0 0.5rem 0.5rem',
              overflowX: 'auto'
            }}
          />
        </pre>
      </div>
    );
  } catch (error) {
    console.warn('程式碼高亮處理失敗:', error);
    return (
      <pre className="my-2 bg-gray-900 text-gray-100 p-4 rounded-lg">
        {code}
      </pre>
    );
  }
};

export default CodeBlock; 