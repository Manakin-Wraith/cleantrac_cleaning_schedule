import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, useTheme } from '@mui/material';
import HeaderBar from './HeaderBar';
import Sidebar, { drawerWidth as expandedSidebarWidthValue } from './Sidebar'; 

const PageLayout = ({ children, showSidebar = true }) => {
  const theme = useTheme();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const collapsedWidthValue = theme.spacing(7);

  const handleMobileDrawerToggle = () => {
    setIsMobileDrawerOpen(!isMobileDrawerOpen);
  };

  const handleDesktopSidebarToggle = () => {
    setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}> 
      <CssBaseline />
      <HeaderBar 
        handleDrawerToggle={handleMobileDrawerToggle}
        handleSidebarToggle={handleDesktopSidebarToggle} 
        isSidebarCollapsed={isDesktopSidebarCollapsed}
        showSidebar={showSidebar}
      />
      {showSidebar && (
        <Sidebar 
          isMobileOpen={isMobileDrawerOpen} 
          onMobileClose={handleMobileDrawerToggle} 
          isCollapsed={isDesktopSidebarCollapsed} 
        />
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 3,
          px: 2,
          backgroundColor: '#f0f2f5',
          transition: theme.transitions.create(['width', 'margin'], { 
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          width: '100%',
          marginLeft: 0,
          ...(showSidebar && {
            [theme.breakpoints.up('md')]: {
              marginLeft: isDesktopSidebarCollapsed ? `${collapsedWidthValue}px` : `${expandedSidebarWidthValue}px`,
              width: `calc(100% - ${isDesktopSidebarCollapsed ? collapsedWidthValue : expandedSidebarWidthValue}px)`,
            },
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
