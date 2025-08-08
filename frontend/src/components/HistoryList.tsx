import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Box, 
  Typography, 
  Chip, 
  Paper, 
  Grid, 
  Button, 
  Checkbox, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  DialogContentText,
  Fab,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import DeleteIcon from '@mui/icons-material/Delete';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';

const HistoryList: React.FC = () => {
  const { 
    history, 
    fetchResult,
    isSelectionMode,
    selectedItems,
    isDeleting,
    error,
    toggleSelectionMode,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    deleteSelectedItems
  } = useStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (history.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h3" sx={{ mb: 2, color: '#ffffff' }}>📭</Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 1,
            color: '#ffffff',
            fontWeight: 'bold'
          }}
        >
          분석 기록이 없습니다
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#b0b0b0'
          }}
        >
          GitHub 리포지토리를 분석해보세요!
        </Typography>
      </Box>
    );
  }

  const handleItemClick = (taskId: string) => {
    if (isSelectionMode) {
      toggleItemSelection(taskId);
    } else {
      fetchResult(taskId);
    }
  };

  const handleDeleteClick = () => {
    if (selectedItems.size === 0) return;
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteDialogOpen(false);
    await deleteSelectedItems();
    setSuccessMessage(`${selectedItems.size}개 항목이 삭제되었습니다.`);
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
      {/* Header with controls */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            color: '#ffffff',
            fontWeight: 'bold'
          }}
        >
          📊 Analysis History
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isSelectionMode && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#b0b0b0',
                fontSize: '0.875rem'
              }}
            >
              {history.length}개의 분석 결과
            </Typography>
          )}

          {isSelectionMode && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                {selectedItems.size}개 선택됨
              </Typography>
              <Button
                size="small"
                onClick={selectAllItems}
                startIcon={<SelectAllIcon />}
                sx={{ color: '#00bcd4' }}
              >
                전체선택
              </Button>
              <Button
                size="small"
                onClick={clearSelection}
                startIcon={<ClearIcon />}
                sx={{ color: '#9e9e9e' }}
              >
                선택해제
              </Button>
            </Box>
          )}

          <Button
            variant={isSelectionMode ? "contained" : "outlined"}
            color={isSelectionMode ? "success" : "primary"}
            startIcon={isSelectionMode ? <DoneIcon /> : <EditIcon />}
            onClick={toggleSelectionMode}
            sx={{
              color: isSelectionMode ? '#ffffff' : '#00bcd4',
              borderColor: '#00bcd4',
              '&:hover': {
                backgroundColor: isSelectionMode ? '#4caf50' : 'rgba(0, 188, 212, 0.1)'
              }
            }}
          >
            {isSelectionMode ? '완료' : '편집'}
          </Button>
        </Box>
      </Box>

      {/* Selection mode controls */}
      {isSelectionMode && selectedItems.size > 0 && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
            disabled={isDeleting}
            sx={{
              bgcolor: '#f44336',
              '&:hover': {
                bgcolor: '#d32f2f'
              }
            }}
          >
            {isDeleting ? '삭제 중...' : `${selectedItems.size}개 항목 삭제`}
          </Button>
        </Box>
      )}
      
      {/* Grid of analysis cards */}
      <Grid container spacing={2}>
        {history.map((item) => {
          const repo = formatRepoName(item.repo_name);
          const statusColor = getStatusColor(item.status);
          const statusIcon = getStatusIcon(item.status);
          const isSelected = selectedItems.has(item.id);
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Paper 
                elevation={3} 
                sx={{
                  p: 2, 
                  cursor: 'pointer', 
                  transition: 'all 0.3s',
                  position: 'relative',
                  '&:hover': { 
                    transform: isSelectionMode ? 'none' : 'scale(1.02)', 
                    boxShadow: isSelected ? '0 8px 32px rgba(76, 175, 80, 0.3)' : '0 8px 32px rgba(0, 188, 212, 0.3)',
                    borderColor: isSelected ? '#4caf50' : '#00bcd4'
                  },
                  bgcolor: '#1e1e1e',
                  color: '#ffffff',
                  border: '1px solid',
                  borderColor: isSelected ? '#4caf50' : '#424242',
                  borderRadius: '12px',
                  opacity: isSelectionMode && !isSelected ? 0.6 : 1,
                }}
                onClick={() => handleItemClick(item.id)}
              >
                {/* Selection checkbox */}
                {isSelectionMode && (
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleItemSelection(item.id)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: '#00bcd4',
                      '&.Mui-checked': {
                        color: '#4caf50'
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}

                <Box sx={{ mb: 1.5, pr: isSelectionMode ? 5 : 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                      <Box sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '8px', 
                        bgcolor: '#00bcd4', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '0.875rem', 
                        fontWeight: 'bold', 
                        flexShrink: 0,
                        color: '#ffffff'
                      }}>
                        {repo.owner ? repo.owner[0].toUpperCase() : '?'}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        {repo.owner && (
                          <Typography 
                            variant="caption" 
                            noWrap
                            sx={{ 
                              color: '#9e9e9e',
                              fontSize: '0.75rem',
                              display: 'block'
                            }}
                          >
                            {repo.owner}
                          </Typography>
                        )}
                        <Typography 
                          variant="subtitle1" 
                          noWrap 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: '#00bcd4',
                            fontSize: '1rem'
                          }}
                        >
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
                    sx={{
                      color: '#ffffff',
                      '& .MuiChip-icon': {
                        color: 'inherit'
                      }
                    }}
                  />
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 1
                }}>
                  <Typography 
                    variant="caption"
                    sx={{ 
                      color: '#b0b0b0',
                      fontSize: '0.75rem'
                    }}
                  >
                    ⏰ {formatDate(item.updated_at)}
                  </Typography>
                  {item.commit_hash && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        maxWidth: '80px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        color: '#9e9e9e',
                        fontSize: '0.7rem'
                      }} 
                      title={item.commit_hash}
                    >
                      {item.commit_hash.substring(0, 7)}
                    </Typography>
                  )}
                </Box>

                {!isSelectionMode && (
                  <Box sx={{ 
                    mt: 2, 
                    pt: 2, 
                    borderTop: '1px solid #424242', 
                    opacity: 0, 
                    transition: 'opacity 0.3s'
                  }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#00bcd4', 
                        fontWeight: 'medium', 
                        textAlign: 'center', 
                        display: 'block',
                        fontSize: '0.8rem'
                      }}
                    >
                      클릭하여 결과 보기 →
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1e1e1e',
            color: '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff' }}>
          선택한 항목 삭제
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#e0e0e0' }}>
            선택한 {selectedItems.size}개의 분석 결과를 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: '#9e9e9e' }}
          >
            취소
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success message snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage('')}
          severity="success" 
          sx={{ 
            bgcolor: '#4caf50',
            color: '#ffffff'
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HistoryList;
