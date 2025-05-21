import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, CircularProgress, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu'; 
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { drawerWidth } from './Sidebar'; 

const HeaderBar = ({ handleDrawerToggle }) => { 
  const { currentUser, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout(); 
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }} 
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component={RouterLink} to={currentUser ? (currentUser.profile?.role === 'manager' ? '/manager-dashboard' : '/staff-tasks') : '/login'} sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
          CleanTrac
        </Typography>

        {isLoading ? (
          <CircularProgress color="inherit" size={24} />
        ) : currentUser ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {currentUser.profile?.department_name && (
              <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}> 
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
