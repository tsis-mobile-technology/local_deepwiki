import React, { useState } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { registerLanguage } from 'react-syntax-highlighter/dist/esm/highlight';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';

SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('javascript', javascript);
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Box, Button, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface CodeBlockProps {
  children: string;
  className?: string;
  repoUrl?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = React.memo(({ children, className, repoUrl }) => {
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
    
    const githubLinkRegex = / \[(\S+):L(\d+)(?:-L(\d+))?\]/g;
    return text.replace(githubLinkRegex, (match, filename, startLine, endLine) => {
      const baseUrl = repoUrl.replace('github.com', 'github.com');
      const lineFragment = endLine ? `#L${startLine}-L${endLine}` : `#L${startLine}`;
      return `[${filename}:L${startLine}${endLine ? '-L' + endLine : ''}](${baseUrl}/blob/main/${filename}${lineFragment})`;
    });
  };

  const processedCode = transformGitHubLinks(code);

  return (
    <Box sx={{ position: 'relative', bgcolor: '#1e1e1e', borderRadius: '4px', overflow: 'hidden' }}>
      <Tooltip title={copySuccess ? 'Copied!' : 'Copy to clipboard'} placement="left">
        <Button
          onClick={handleCopy}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            minWidth: 'auto',
            padding: '4px',
            bgcolor: copySuccess ? 'success.main' : 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            '&:hover': {
              bgcolor: copySuccess ? 'success.dark' : 'rgba(255, 255, 255, 0.2)',
            },
            zIndex: 1,
          }}
        >
          {copySuccess ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
        </Button>
      </Tooltip>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{
          margin: 0,
          paddingTop: '32px',
          backgroundColor: 'transparent', // Ensure background is handled by Box
        }}
      >
        {processedCode}
      </SyntaxHighlighter>
    </Box>
  );
});

CodeBlock.displayName = 'CodeBlock';
export default CodeBlock;

