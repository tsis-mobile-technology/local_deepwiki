import React from 'react';
import { useStore } from '../store';
import { Box, Typography, List, ListItem, ListItemText, Chip, Paper, Grid } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AutorenewIcon from '@mui/icons-material/Autorenew';

const HistoryList: React.FC = () => {
  const { history, fetchResult } = useStore();

  if (history.length === 0) {
    return null; // Don't render anything if history is empty
  }

  const handleHistoryClick = (taskId: string) => {
    fetchResult(taskId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'analyzing_files':
      case 'generating_documentation':
      case 'storing_embeddings':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'failed':
        return <ErrorIcon fontSize="small" />;
      case 'analyzing_files':
      case 'generating_documentation':
      case 'storing_embeddings':
        return <HourglassEmptyIcon fontSize="small" />;
      default:
        return <AutorenewIcon fontSize="small" />;
    }
  };

  const formatRepoName = (repoName: string) => {
    const parts = repoName.split('/');
    if (parts.length >= 2) {
      return {
        owner: parts[0],
        name: parts[1]
      };
    }
    return {
      owner: '',
      name: repoName
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}시간 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <Box sx={{ mt: 6, width: '100%', maxWidth: 'lg' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          📊 Analysis History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {history.length}개의 분석 결과
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        {history.map((item) => {
          const repo = formatRepoName(item.repo_name);
          const statusColor = getStatusColor(item.status);
          const statusIcon = getStatusIcon(item.status);
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Paper 
                elevation={3} 
                sx={{
                  p: 2, 
                  cursor: 'pointer', 
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'scale(1.02)', boxShadow: 6 },
                  bgcolor: '#212121',
                  color: 'white',
                  border: '1px solid #424242'
                }}
                onClick={() => handleHistoryClick(item.id)}
              >
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 'bold', flexShrink: 0 }}>
                        {repo.owner ? repo.owner[0].toUpperCase() : '?'}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        {repo.owner && (
                          <Typography variant="caption" color="text.secondary" noWrap>{repo.owner}</Typography>
                        )}
                        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold', color: 'primary.light' }}>
                          {repo.name}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Chip 
                    label={
                      item.status === 'analyzing_files' ? 'Analyzing' :
                      item.status === 'generating_documentation' ? 'Generating' :
                      item.status === 'storing_embeddings' ? 'Storing' :
                      item.status.charAt(0).toUpperCase() + item.status.slice(1)
                    }
                    icon={statusIcon}
                    color={statusColor}
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary' }}>
                  <Typography variant="caption">⏰ {formatDate(item.updated_at)}</Typography>
                  {item.commit_hash && (
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.commit_hash}>
                      {item.commit_hash.substring(0, 7)}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', opacity: 0, transition: 'opacity 0.3s', '&:hover': { opacity: 1 } }}>
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 'medium', textAlign: 'center', display: 'block' }}>
                    클릭하여 결과 보기 →
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {history.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>📭</Typography>
          <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>분석 기록이 없습니다</Typography>
          <Typography variant="body2" color="text.secondary">GitHub 리포지토리를 분석해보세요!</Typography>
        </Box>
      )}
    </Box>
  );
};

export default HistoryList;
