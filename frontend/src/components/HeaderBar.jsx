import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, CircularProgress, IconButton, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu'; 
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'; 
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { drawerWidth as expandedDrawerWidthValue } from './Sidebar'; 

const HeaderBar = ({ handleDrawerToggle, handleSidebarToggle, isSidebarCollapsed, showSidebar }) => { 
  const { currentUser, logout, isLoading } = useAuth();
  const theme = useTheme(); 

  const handleLogout = async () => {
    await logout(); 
  };

  const collapsedWidthValue = theme.spacing(7);
  const currentEffectiveDrawerWidth = showSidebar 
    ? (isSidebarCollapsed ? collapsedWidthValue : expandedDrawerWidthValue) 
    : 0;

  return (
    <AppBar 
      position="fixed" 
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: theme.transitions.create(['width', 'margin'], { 
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        ...(showSidebar && {
          [theme.breakpoints.up('md')]: {
            width: `calc(100% - ${currentEffectiveDrawerWidth}px)`,
            ml: `${currentEffectiveDrawerWidth}px`,
          },
        }),
        ...(!showSidebar && {
          width: '100%',
          ml: 0,
        }),
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle} 
          sx={{ mr: 2, display: { md: 'none' } }} 
        >
          <MenuIcon />
        </IconButton>

        {showSidebar && (
          <IconButton
            color="inherit"
            aria-label="toggle sidebar collapse"
            edge="start"
            onClick={handleSidebarToggle} 
            sx={{ mr: 2, display: { xs: 'none', md: 'block' } }} 
          >
            {isSidebarCollapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}

        <Typography variant="h6" noWrap component={RouterLink} to={currentUser ? (currentUser.profile?.role === 'manager' ? '/manager-dashboard' : '/staff-tasks') : '/login'} sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
          CleanTrac
        </Typography>

        {isLoading ? (
          <CircularProgress color="inherit" size={24} />
        ) : currentUser ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {currentUser.profile?.department_name && (
              <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', md: 'block' } }}> 
                Dept: {currentUser.profile.department_name}
              </Typography>
            )}
            <Typography variant="subtitle2" sx={{ mr: 2 }}>
              {currentUser.username} ({currentUser.profile?.role})
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        ) : (
          <Button color="inherit" component={RouterLink} to="/login">
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default HeaderBar;
