import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; // Assuming you use React Router for navigation

const HeaderBar = () => {
  // Placeholder for actual authentication state and user info
  const isLoggedIn = true; // Replace with actual auth check
  const userName = 'Jane Doe'; // Replace with actual user name
  const userRole = 'Manager'; // Replace with actual user role
  const currentDepartment = 'Butchery'; // Replace with actual department

  const handleLogout = () => {
    // Placeholder for logout logic
    console.log('Logout clicked');
    // Navigate to login page, clear tokens, etc.
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" noWrap component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
          CleanTrack
        </Typography>

        {isLoggedIn && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Dept: {currentDepartment}
            </Typography>
            <Typography variant="subtitle2" sx={{ mr: 2 }}>
              {userName} ({userRole})
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default HeaderBar;
