import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { useStore } from '../store';
import CodeBlock from '../components/CodeBlock';
import QASection from '../components/QASection';
import ArchitectureDiagram from '../components/ArchitectureDiagram';
import { Box, Typography, Button, Tabs, Tab, Paper } from '@mui/material';
import 'highlight.js/styles/github-dark.css'; // Using a dark theme

const DocumentationPage: React.FC = () => {
  const { documentation, architecture, repoName, resetState } = useStore();
  const [activeTab, setActiveTab] = useState<number>(0); // 0: documentation, 1: architecture, 2: qa

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 'lg', mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1" color="text.primary">{repoName}</Typography>
        <Button 
          variant="contained"
          color="primary"
          onClick={resetState}
        >
          Analyze Another Repository
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="documentation tabs">
          <Tab label="📝 Documentation" />
          <Tab label="🏗️ Architecture" />
          <Tab label="💬 Q&A" />
        </Tabs>
      </Box>

      <Paper elevation={3} sx={{ p: 3, minHeight: '60vh', bgcolor: '#212121', color: 'white' }}>
        {activeTab === 0 && (
          <Box className="prose prose-invert max-w-none">
            <ReactMarkdown
              rehypePlugins={[rehypeHighlight]}
              components={{
                code: ({ node, className, children, ...props }) => (
                  <CodeBlock className={className} {...props}>
                    {String(children).replace(/\n$/, '')}
                  </CodeBlock>
                ),
              }}
            >
              {documentation ? documentation : 'No documentation available.'}
            </ReactMarkdown>
          </Box>
        )}

        {activeTab === 1 && (
          <ArchitectureDiagram architectureData={architecture} />
        )}

        {activeTab === 2 && <QASection repoName={repoName} />}
      </Paper>
    </Box>
  );
};

export default DocumentationPage;
