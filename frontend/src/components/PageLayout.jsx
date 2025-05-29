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
          py: 3,
          px: 3, // Best practice for desktop layouts

          minHeight: `calc(100vh - ${theme.mixins.toolbar.minHeight}px - ${theme.spacing(3)} - 1px)`, // Adjust for header, padding, and potential border
          marginTop: `calc(${theme.mixins.toolbar.minHeight}px + ${theme.spacing(3)})`, // Margin top to account for HeaderBar and top padding
          transition: theme.transitions.create(['width', 'margin'], { 
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          // width: '100%', // Removed: flexGrow should handle expansion
          // marginLeft: 0, // Removed: Conditional logic below handles this
          ...(showSidebar && {
            [theme.breakpoints.up('md')]: {
              marginLeft: isDesktopSidebarCollapsed ? `${collapsedWidthValue}px` : `${expandedSidebarWidthValue}px`
              // width: `calc(100% - ${isDesktopSidebarCollapsed ? collapsedWidthValue : expandedSidebarWidthValue}px)`, // Removed, flexGrow:1 should handle this
            },
            // For mobile, when sidebar is shown (as a temporary drawer), main content shouldn't have margin or width adjustments here.
            // It should naturally take full width minus nothing, as the drawer overlays.
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
