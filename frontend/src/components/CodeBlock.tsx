import React, { useState } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  children: string;
  className?: string;
  repoUrl?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, className, repoUrl }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const language = className?.replace('language-', '') || 'text';
  const code = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Transform GitHub file references [filename:L1-L10] to actual GitHub links
  const transformGitHubLinks = (text: string) => {
    if (!repoUrl) return text;
    
    const githubLinkRegex = /\[(\S+):L(\d+)(?:-L(\d+))?\]/g;
    return text.replace(githubLinkRegex, (match, filename, startLine, endLine) => {
      const baseUrl = repoUrl.replace('github.com', 'github.com');
      const lineFragment = endLine ? `#L${startLine}-L${endLine}` : `#L${startLine}`;
      return `[${filename}:L${startLine}${endLine ? '-L' + endLine : ''}](${baseUrl}/blob/main/${filename}${lineFragment})`;
    });
  };

  const processedCode = transformGitHubLinks(code);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: copySuccess ? '#4CAF50' : '#333',
          color: 'white',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 1
        }}
      >
        {copySuccess ? 'Copied!' : 'Copy'}
      </button>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{
          margin: 0,
          paddingTop: '32px'
        }}
      >
        {processedCode}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
