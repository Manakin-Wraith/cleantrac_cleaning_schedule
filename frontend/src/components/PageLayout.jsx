import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, useTheme, IconButton } from '@mui/material';
import HeaderBar from './HeaderBar';
import Sidebar, { drawerWidth as expandedSidebarWidthValue } from './Sidebar'; 
import MenuIcon from '@mui/icons-material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';

const PageLayout = ({ children, showHeaderBar = true, showSidebar = true, disableMaxWidth = false }) => {
  const theme = useTheme();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

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
      {showHeaderBar && (
        <HeaderBar 
          handleDrawerToggle={handleMobileDrawerToggle}
          handleSidebarToggle={handleDesktopSidebarToggle} 
          isSidebarCollapsed={isDesktopSidebarCollapsed}
          showSidebar={showSidebar}
        />
      )}
      {showSidebar && (
        <Sidebar 
          isMobileOpen={isMobileDrawerOpen} 
          handleDrawerToggle={handleMobileDrawerToggle} 
          isCollapsed={isDesktopSidebarCollapsed}
          onCollapseToggle={handleDesktopSidebarToggle}
        />
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: theme.palette.background.paper, // White background for main content
          // py and px removed, will be applied to the Container
          minHeight: `calc(100vh - ${showHeaderBar ? theme.mixins.toolbar.minHeight : 0}px)`,
          marginTop: showHeaderBar ? `${theme.mixins.toolbar.minHeight}px` : 0,
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
        {showHeaderBar && <Toolbar />}
        {!showHeaderBar && showSidebar && (isMdUp ? isDesktopSidebarCollapsed : true) && (
          <IconButton
            onClick={isMdUp ? handleDesktopSidebarToggle : handleMobileDrawerToggle}
            size="small"
            sx={{
              position: 'fixed',
              top: 8,
              left: { xs: 8, md: isDesktopSidebarCollapsed ? 8 : expandedSidebarWidthValue + 8 },
              zIndex: (theme) => theme.zIndex.appBar + 1,
              display: { xs: 'block', md: 'block' },
            }}
            color="primary"
          >
            <MenuIcon />
          </IconButton>
        )}
                        <Box sx={{ flexGrow: 1, py: 3, px: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default PageLayout;
