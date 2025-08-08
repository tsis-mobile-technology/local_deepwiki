import React from 'react';
import { Drawer, List, ListItem, ListItemText, Toolbar, Typography } from '@mui/material';

const Sidebar: React.FC = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box', bgcolor: '#1a1a1a', color: 'white' },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'primary.main' }}>
          Navigation
        </Typography>
      </Toolbar>
      <List>
        {/* Example List Item */}
        <ListItem button>
          <ListItemText primary="Home" />
        </ListItem>
        {/* Add more list items as needed */}
      </List>
    </Drawer>
  );
};

export default Sidebar;
