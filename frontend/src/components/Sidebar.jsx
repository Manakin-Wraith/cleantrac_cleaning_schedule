import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Box, Divider, useTheme, useMediaQuery } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import appLogo from '../assets/box_icon.png'; // Import the logo

// Import icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout'; // Icon for Logout

export const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const { currentUser, logout } = useAuth();
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm')); // Check if screen is sm or larger
  const navigate = useNavigate();

  // Determine if the permanent drawer is effectively visible
  // This is true on 'sm' and up screens when not in mobileOpen mode (which implies temporary drawer)
  const isPermanentDrawerVisible = isSmUp;

  const commonStyles = {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    '&.active > .MuiListItemButton-root': {
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
        color: theme.palette.primary.main,
      },
    },
    '& .MuiListItemButton-root:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
    }
  };

  const managerLinks = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/manager-dashboard' },
    { text: 'Schedule', icon: <CalendarMonthIcon />, path: '/manager-schedule' },
    { text: 'Item Management', icon: <ListAltIcon />, path: '/manager-items' },
    { text: 'Staff', icon: <PeopleIcon />, path: '/manager-staff' },
  ];

  const staffLinks = [
    { text: 'My Tasks', icon: <AssignmentIcon />, path: '/staff-tasks' },
  ];

  let links = [];
  if (currentUser?.profile?.role === 'manager') {
    links = managerLinks;
  } else if (currentUser?.profile?.role === 'staff') {
    links = staffLinks;
  }

  const handleLogoutClick = async () => {
    await logout();
    // Navigation to /login is handled by AuthContext's logout method
  };

  const drawerContent = (
    <div>
      {/* Sidebar Toolbar with Logo */}
      <Toolbar 
        sx={{
          display: 'flex', 
          alignItems: 'center', 
          // Justify content differently based on whether text is shown
          justifyContent: (!isPermanentDrawerVisible || mobileOpen) ? 'center' : 'flex-start',
          py: 1, 
          mt: 1, 
          mb: 0.5,
          px: (!isPermanentDrawerVisible || mobileOpen) ? 2 : 2.5, // Add some padding for the standalone logo
        }}
      >
        <img src={appLogo} alt="CleanTrack Logo" style={{ height: '32px', marginRight: (!isPermanentDrawerVisible || mobileOpen) ? '8px' : '0' }} /> 
        {/* Conditionally render CleanTrack text */}
        {(!isPermanentDrawerVisible || mobileOpen) && (
          <Typography variant="h6" component="div" sx={{ color: theme.palette.primary.main }}>
            CleanTrac
          </Typography>
        )}
      </Toolbar>
      
      <Divider />
      <List sx={{ pt: 0 /* Padding top handled by Toolbar's margin bottom or direct List padding */ }}>
        {links.map((link) => (
          <NavLink to={link.path} key={link.text} style={{ textDecoration: 'none', color: 'inherit' }} sx={commonStyles}>
            {({ isActive }) => (
              <ListItem disablePadding className={isActive ? 'active' : ''}>
                <ListItemButton>
                  <ListItemIcon>
                    {link.icon}
                  </ListItemIcon>
                  <ListItemText primary={link.text} />
                </ListItemButton>
              </ListItem>
            )}
          </NavLink>
        ))}
        {currentUser && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogoutClick} sx={{ ...commonStyles['& .MuiListItemButton-root:hover'] /* Apply hover direct */ }}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      <Drawer // Temporary Drawer for mobile
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle} 
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      
      <Drawer // Permanent Drawer for larger screens
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }, // Keep border
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
