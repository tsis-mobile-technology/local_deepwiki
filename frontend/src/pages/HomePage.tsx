import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import RepoInputForm from '../components/RepoInputForm';
import LoadingSpinner from '../components/LoadingSpinner';
import CodeBlock from '../components/CodeBlock';
import QASection from '../components/QASection';
import ArchitectureDiagram from '../components/ArchitectureDiagram';
import useAppStore from '../store';
import axios from 'axios';
import 'highlight.js/styles/vs2015.css';

const HomePage: React.FC = () => {
  const {
    repoUrl,
    setRepoUrl,
    analysisStatus,
    setAnalysisStatus,
    documentation,
    setDocumentation,
    isLoading,
    setIsLoading,
    error,
    setError,
  } = useAppStore();

  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [architectureData, setArchitectureData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'documentation' | 'architecture' | 'qa'>('documentation');

  const handleAnalyze = async (url: string) => {
    setRepoUrl(url);
    setIsLoading(true);
    setAnalysisStatus('Starting analysis...');
    setError(null);
    setDocumentation('');

    try {
      const response = await axios.post('http://localhost:8000/api/analyze', { repo_url: url });
      const taskId = response.data.task_id;
      setCurrentTaskId(taskId);
      setAnalysisStatus(`Analysis started with task ID: ${taskId}`);

      // Establish WebSocket connection for real-time updates
      const ws = new WebSocket(`ws://localhost:8000/ws/status/${taskId}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status) {
          setAnalysisStatus(data.status);
        }
        if (data.documentation) {
          setDocumentation(data.documentation);
          setIsLoading(false);
          loadArchitectureData(taskId);
          ws.close();
        }
        if (data.error) {
          setError(data.error);
          setIsLoading(false);
          ws.close();
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        if (isLoading) { // If still loading when closed, it means an error or completion happened
          setIsLoading(false);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error.');
        setIsLoading(false);
      };

    } catch (err) {
      console.error('API call error:', err);
      setError('Failed to start analysis. Please check the URL and try again.');
      setIsLoading(false);
    }
  };

  const loadArchitectureData = async (taskId: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/architecture/${taskId}`);
      if (response.data.status === 'success') {
        setArchitectureData(response.data.architecture);
      }
    } catch (err) {
      console.error('Failed to load architecture data:', err);
    }
  };

  return (
    <div>
      <h1>Welcome to DeepWiki</h1>
      <p>Enter a GitHub repository URL to generate documentation.</p>
      <RepoInputForm onSubmit={handleAnalyze} />

      {isLoading && (
        <div>
          <LoadingSpinner />
          <p>{analysisStatus}</p>
        </div>
      )}

      {error && (
        <div style={{ color: 'red' }}>
          <p>Error: {error}</p>
        </div>
      )}

      {documentation && (
        <div>
          <h2>Generated Documentation</h2>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <ReactMarkdown
              rehypePlugins={[rehypeHighlight]}
              components={{
                code: ({ className, children, ...props }) => (
                  <CodeBlock 
                    className={className} 
                    repoUrl={repoUrl}
                    {...props}
                  >
                    {String(children)}
                  </CodeBlock>
                )
              }}
            >
              {documentation}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Tabs and Content - only show when documentation is available */}
      {documentation && (
        <div style={{ marginTop: '30px' }}>
          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid #ddd',
            marginBottom: '0'
          }}>
            <button
              onClick={() => setActiveTab('documentation')}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: activeTab === 'documentation' ? '2px solid #2196f3' : '2px solid transparent',
                backgroundColor: activeTab === 'documentation' ? '#f5f5f5' : 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'documentation' ? 'bold' : 'normal'
              }}
            >
              📝 문서
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: activeTab === 'architecture' ? '2px solid #2196f3' : '2px solid transparent',
                backgroundColor: activeTab === 'architecture' ? '#f5f5f5' : 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'architecture' ? 'bold' : 'normal'
              }}
            >
              🏗️ 아키텍처
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: activeTab === 'qa' ? '2px solid #2196f3' : '2px solid transparent',
                backgroundColor: activeTab === 'qa' ? '#f5f5f5' : 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'qa' ? 'bold' : 'normal'
              }}
            >
              💬 Q&A
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'documentation' && (
            <div>
              <h2>Generated Documentation</h2>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '20px', 
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}>
                <ReactMarkdown
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code: ({ className, children, ...props }) => (
                      <CodeBlock 
                        className={className} 
                        repoUrl={repoUrl}
                        {...props}
                      >
                        {String(children)}
                      </CodeBlock>
                    )
                  }}
                >
                  {documentation}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && architectureData && (
            <ArchitectureDiagram architectureData={architectureData} />
          )}

          {activeTab === 'architecture' && !architectureData && (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}>
              아키텍처 분석 데이터를 로드하는 중...
            </div>
          )}

          {activeTab === 'qa' && (
            <QASection 
              repoName={repoUrl ? repoUrl.split('/').slice(-2).join('/') : ''} 
            />
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;