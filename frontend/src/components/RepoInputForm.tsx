import React, { useState, useCallback } from 'react';
import { useStore } from '../store';
import { TextField, Button } from '@mui/material';

const RepoInputForm: React.FC = React.memo(() => {
  const [repoUrl, setRepoUrl] = useState('');
  const { submitRepoUrl, loading } = useStore();

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      submitRepoUrl(repoUrl.trim());
    }
  }, [repoUrl, submitRepoUrl]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRepoUrl(e.target.value);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl flex">
      <TextField
        label="GitHub Repository URL"
        placeholder="Enter GitHub repository URL"
        variant="outlined"
        fullWidth
        value={repoUrl}
        onChange={handleInputChange}
        disabled={loading}
        sx={{
          marginRight: 1,
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px 0 0 8px',
            backgroundColor: '#424242',
            color: 'white',
            '& fieldset': {
              borderColor: '#616161',
            },
            '&:hover fieldset': {
              borderColor: '#9e9e9e',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2196f3',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#bdbdbd',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#2196f3',
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading || !repoUrl.trim()}
        sx={{
          borderRadius: '0 8px 8px 0',
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 'bold',
          backgroundColor: '#2196f3',
          '&:hover': {
            backgroundColor: '#1976d2',
          },
          '&.Mui-disabled': {
            backgroundColor: '#616161',
            color: '#bdbdbd',
          },
        }}
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </Button>
    </form>
  );
});

RepoInputForm.displayName = 'RepoInputForm';
export default RepoInputForm;
