import React from 'react';
import { CircularProgress } from '@mui/material';

const LoadingSpinner: React.FC = React.memo(() => {
  return (
    <CircularProgress color="primary" size={40} />
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
export default LoadingSpinner;
