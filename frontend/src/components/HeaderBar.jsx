import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const HeaderBar = () => {
  const { currentUser, logout, isLoading } = useAuth(); 

  const handleLogout = async () => {
    await logout(); 
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" noWrap component={RouterLink} to={currentUser ? (currentUser.profile?.role === 'manager' ? '/manager-dashboard' : '/staff-tasks') : '/login'} sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
          CleanTrack
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
