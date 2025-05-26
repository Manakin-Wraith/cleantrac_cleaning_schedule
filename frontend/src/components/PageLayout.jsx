import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, useTheme } from '@mui/material';
import HeaderBar from './HeaderBar';
import Sidebar, { drawerWidth } from './Sidebar'; 

const PageLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const currentDrawerWidth = isSidebarCollapsed ? theme.spacing(7) : `${drawerWidth}px`;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}> 
      <CssBaseline />
      <HeaderBar 
        handleDrawerToggle={handleDrawerToggle} 
        handleSidebarToggle={handleSidebarToggle} 
        isSidebarCollapsed={isSidebarCollapsed} 
      />
      <Sidebar 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle} 
        isCollapsed={isSidebarCollapsed} 
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 3,
          px: 2,
          width: { sm: `calc(100% - ${currentDrawerWidth})` }, 
          marginLeft: { sm: currentDrawerWidth }, 
          backgroundColor: '#f0f2f5',
          transition: theme.transitions.create(['width', 'margin'], { 
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar /> 
        {children}
      </Box>
    </Box>
  );
};

export default PageLayout;
