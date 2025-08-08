import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';

const Header: React.FC = () => {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          DeepWiki
        </Typography>
        {/* Add any other header elements here */}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
