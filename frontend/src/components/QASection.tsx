import React, { useState } from 'react';
import axios from 'axios';

interface QASectionProps {
  repoName: string;
}

interface QAResponse {
  success: boolean;
  answer: string;
  sources: Array<{
    content: string;
    metadata: any;
  }>;
}

const QASection: React.FC<QASectionProps> = ({ repoName }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  React.useEffect(() => {
    if (repoName) {
      loadSuggestions();
    }
  }, [repoName]);

  const loadSuggestions = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/suggestions/${repoName}`);
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  const handleAskQuestion = async (questionText: string = question) => {
    if (!questionText.trim() || !repoName) return;

    setIsLoading(true);
    setError(null);
    setAnswer('');
    setSources([]);

    try {
      const response = await axios.post<QAResponse>('http://localhost:8000/api/ask', {
        question: questionText,
        repo_name: repoName
      });

      if (response.data.success) {
        setAnswer(response.data.answer);
        setSources(response.data.sources || []);
      } else {
        setError(response.data.answer);
      }
    } catch (err) {
      console.error('Failed to get answer:', err);
      setError('질문 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
    handleAskQuestion(suggestion);
  };

  if (!repoName) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        문서 분석이 완료되면 질문할 수 있습니다.
      </div>
    );
  }

  return (
    <div style={{ 
      marginTop: '30px', 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9' 
    }}>
      <h3>💬 AI와 대화하기</h3>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        이 리포지토리에 대해 궁금한 것을 질문해보세요!
      </p>

      {/* 추천 질문들 */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>💡 추천 질문</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#e3f2fd',
                  border: '1px solid #2196f3',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#1976d2'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#bbdefb'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#e3f2fd'}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 질문 입력 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="궁금한 것을 질문해보세요..."
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
          disabled={isLoading}
        />
        <button
          onClick={() => handleAskQuestion()}
          disabled={isLoading || !question.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: isLoading ? '#ccc' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {isLoading ? '생각중...' : '질문하기'}
        </button>
      </div>

      {/* 답변 영역 */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          color: '#c62828',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {answer && (
        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h4 style={{ marginTop: 0, color: '#333' }}>🤖 답변</h4>
          <div style={{ 
            lineHeight: '1.6', 
            whiteSpace: 'pre-wrap',
            color: '#444'
          }}>
            {answer}
          </div>
        </div>
      )}

      {/* 참조 문서들 */}
      {sources.length > 0 && (
        <div>
          <h4 style={{ color: '#666', fontSize: '14px' }}>📚 참조된 문서</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sources.map((source, index) => (
              <div
                key={index}
                style={{
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#666'
                }}
              >
                {source.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QASection;