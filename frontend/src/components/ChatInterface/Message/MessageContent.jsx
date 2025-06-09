import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { toString as hastToString } from 'hast-util-to-string';
import CodeBlock from './CodeBlock';

const MessageContent = ({ text, copiedCodeIndex, onCopyCode }) => {
  // Use ref to maintain code block index counter across renders
  const codeBlockIndexRef = useRef(0);
  
  // Reset counter for each render
  codeBlockIndexRef.current = 0;

  // Custom code component to use our existing CodeBlock
  const customCode = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'plaintext';
    
    // Extract code content
    const code = hastToString(node);
    
    // Enhanced inline detection - check multiple conditions
    // Prioritize inline for short code without language specification
    const hasLanguageClass = className && className.includes('language-') && className !== 'language-plaintext';
    const isShortCode = code.trim().length < 100;
    const hasNoNewlines = !code.includes('\n');
    
    const isInlineCode = inline || 
                        (hasNoNewlines && !hasLanguageClass) || 
                        (isShortCode && hasNoNewlines && !hasLanguageClass);
    
    
    // For block code (not inline)
    if (!isInlineCode && code.trim().length > 0) {
      const currentIndex = codeBlockIndexRef.current++;
      
      return (
        <CodeBlock
          code={code}
          language={language}
          index={currentIndex}
          copiedCodeIndex={copiedCodeIndex}
          onCopyCode={onCopyCode}
        />
      );
    }
    
    // For inline code, render as before
    return (
      <code className={`${className} bg-blue-50 text-blue-800 px-1 py-0.5 rounded text-sm font-mono`} {...props}>
        {children}
      </code>
    );
  };

  // Custom components for styling
  const components = {
    code: customCode,
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h4>
    ),
    h5: ({ children }) => (
      <h5 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h5>
    ),
    h6: ({ children }) => (
      <h6 className="text-xs font-bold mb-1 mt-2 first:mt-0">{children}</h6>
    ),
    p: ({ children }) => (
      <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-2 ml-4">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-2 ml-4">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="mb-1">{children}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-400 pl-4 italic mb-2 text-gray-700">{children}</blockquote>
    ),
    a: ({ href, children }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-700 underline"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => (
      <strong className="font-bold">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic">{children}</em>
    ),
    hr: () => (
      <hr className="border-gray-300 my-4" />
    ),
    table: ({ children }) => (
      <table className="border-collapse border border-gray-300 mb-2">{children}</table>
    ),
    thead: ({ children }) => (
      <thead className="bg-blue-50">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody>{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className="border-b border-gray-300">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="border border-gray-300 px-2 py-1 font-bold text-left">{children}</th>
    ),
    td: ({ children }) => (
      <td className="border border-gray-300 px-2 py-1">{children}</td>
    ),
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export default MessageContent;
