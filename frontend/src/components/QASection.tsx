import React, { useState } from 'react';
import axios from 'axios';
import { Box, Typography, TextField, Button, CircularProgress, Chip, Alert } from '@mui/material';

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
      const response = await axios.get(`/api/suggestions/${repoName}`);
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
      const response = await axios.post<QAResponse>('/api/ask', {
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
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body1">문서 분석이 완료되면 질문할 수 있습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom>💬 AI와 대화하기</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        이 리포지토리에 대해 궁금한 것을 질문해보세요!
      </Typography>

      {/* 추천 질문들 */}
      {suggestions.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>💡 추천 질문</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {suggestions.map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                color="primary"
                variant="outlined"
                clickable
              />
            ))}
          </Box>
        </Box>
      )}

      {/* 질문 입력 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="궁금한 것을 질문해보세요..."
          onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
          disabled={isLoading}
          size="small"
        />
        <Button
          variant="contained"
          onClick={() => handleAskQuestion()}
          disabled={isLoading || !question.trim()}
          endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? '생각중...' : '질문하기'}
        </Button>
      </Box>

      {/* 답변 영역 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {answer && (
        <Box sx={{ p: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>🤖 답변</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {answer}
          </Typography>
        </Box>
      )}

      {/* 참조 문서들 */}
      {sources.length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>📚 참조된 문서</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {sources.map((source, index) => (
              <Box
                key={index}
                sx={{
                  p: 1.5,
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                }}
              >
                {source.content}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default QASection;