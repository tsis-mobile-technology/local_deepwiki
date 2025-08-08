import React, { useEffect } from 'react';
import RepoInputForm from '../components/RepoInputForm';
import HistoryList from '../components/HistoryList';
import DocumentationPage from './DocumentationPage';
import { useStore } from '../store';
import { Container, Box, Typography, CircularProgress, Alert } from '@mui/material';

const HomePage: React.FC = () => {
  const {
    currentView,
    loading,
    error,
    progress,
    fetchHistory,
  } = useStore();

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'docs':
        return <DocumentationPage />;
      case 'loading':
        return (
          <Box sx={{ textAlign: 'center', p: 5, bgcolor: '#212121', borderRadius: 2, boxShadow: 3 }}>
            <CircularProgress color="primary" size={60} />
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>{progress}</Typography>
          </Box>
        );
      case 'home':
      default:
        return (
          <>
            <Box sx={{ textAlign: 'center', mb: 4, mt: 4 }}>
              <Typography variant="h2" component="h1" color="primary" gutterBottom>DeepWiki</Typography>
              <Typography variant="h5" color="text.secondary">AI-Powered GitHub Documentation Generator</Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <RepoInputForm />
            </Box>
            <HistoryList />
          </>
        );
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
          <strong>Error:</strong> {error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
        {renderContent()}
      </Box>
    </Container>
  );
};

export default HomePage;
