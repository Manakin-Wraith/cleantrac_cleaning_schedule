import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import HeaderBar from './HeaderBar';
import Sidebar, { drawerWidth } from './Sidebar'; // Import Sidebar and drawerWidth

const PageLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}> 
      <CssBaseline />
      <HeaderBar handleDrawerToggle={handleDrawerToggle} /> {/* Pass handler to HeaderBar */}
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 3,
          px: 2,
          // mt: '64px', // Toolbar for spacing is better than fixed margin if AppBar height varies
          width: { sm: `calc(100% - ${drawerWidth}px)` }, // Adjust width for permanent drawer on sm+ screens
          // marginLeft: { sm: `${drawerWidth}px` }, // Alternative to width calc
          backgroundColor: '#f0f2f5',
        }}
      >
        <Toolbar /> {/* This Toolbar acts as a spacer for the fixed AppBar above it */}
        {children}
      </Box>
    </Box>
  );
};

export default PageLayout;
