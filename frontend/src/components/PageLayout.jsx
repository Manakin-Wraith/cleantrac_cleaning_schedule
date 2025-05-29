import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, useTheme, Container } from '@mui/material';
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
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: theme.palette.background.default }}> 
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
          backgroundColor: theme.palette.background.paper, // White background for main content
          // py and px removed, will be applied to the Container
          minHeight: `calc(100vh - ${theme.mixins.toolbar.minHeight}px - 1px)`, // Adjusted for header and potential border
          marginTop: `${theme.mixins.toolbar.minHeight}px`, // Align directly below HeaderBar
          display: 'flex', // Added to allow Toolbar and Container to be direct children with correct flow
          flexDirection: 'column', // Added for Toolbar and Container stacking
          transition: theme.transitions.create(['width', 'margin', 'border-radius'], { 
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          ...(showSidebar && {
            [theme.breakpoints.up('md')]: {
              marginLeft: `${collapsedWidthValue}px`, // Always use collapsed width for margin, sidebar will overlap
              borderTopLeftRadius: theme.shape.borderRadius * 2, // 'Scooped' corner
            },
          }),
          ...(!showSidebar && {
            borderTopLeftRadius: 0, // No radius if sidebar is hidden
          }),
          [theme.breakpoints.down('md')]: {
            borderTopLeftRadius: 0, // No radius on smaller screens where sidebar is temporary
          },
        }}
      >
        <Toolbar /> 
        <Container maxWidth="lg" sx={{ flexGrow: 1, py: 3, px: { xs: 2, sm: 3 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default PageLayout;
