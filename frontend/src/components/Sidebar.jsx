import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Box, Divider, useTheme, useMediaQuery, Tooltip } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import appLogo from '../assets/box_icon.png'; 

// Import icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout'; 
import BusinessIcon from '@mui/icons-material/Business';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat'; 

export const drawerWidth = 240;
const collapsedDrawerWidth = (theme) => theme.spacing(7); 

const Sidebar = ({ mobileOpen, handleDrawerToggle, isCollapsed }) => {
  const { currentUser, logout } = useAuth();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md')); 
  const navigate = useNavigate();

  const isPermanentDrawerEffectivelyOpen = isMdUp && !isCollapsed;
  const isMobileDrawerOpen = mobileOpen; 
  const showTooltip = isCollapsed && isMdUp && !mobileOpen;

  const commonStyles = (isActive) => ({
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    '& .MuiListItemButton-root': {
      borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
      paddingLeft: isActive ? `calc(${theme.spacing(3)} - 3px)` : theme.spacing(3), 
      '&:hover': {
        backgroundColor: theme.palette.action.hover, 
      },
    },
    '& .MuiListItemIcon-root': {
      color: isActive ? theme.palette.primary.main : theme.palette.text.secondary, 
    },
    '& .MuiListItemText-primary': {
      color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
      fontWeight: isActive ? 'medium' : 'normal',
    },
  });

  const managerLinks = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/manager-dashboard' },
    { text: 'Coming SOON!', icon: <CalendarMonthIcon />, path: '/manager-schedule' },
    { text: 'Item Management', icon: <ListAltIcon />, path: '/manager-items' },
    { text: 'Staff', icon: <PeopleIcon />, path: '/manager-users' },
    { text: 'Thermometers', icon: <DeviceThermostatIcon />, path: '/manager-thermometers' },
  ];

  const staffLinks = [
    { text: 'My Tasks', icon: <AssignmentIcon />, path: '/staff-tasks' },
  ];

  let determinedLinks = [];
  const departmentManagementLink = { 
    text: 'Departments', 
    icon: <BusinessIcon />,
    path: '/admin/departments' 
  };

  if (currentUser?.is_superuser) {
    determinedLinks = [
      ...managerLinks,
      departmentManagementLink
    ];
  } else if (currentUser?.profile?.role === 'manager') {
    determinedLinks = [
      ...managerLinks,
      departmentManagementLink
    ];
  } else if (currentUser?.profile?.role === 'staff') {
    determinedLinks = staffLinks;
  }

  const handleLogoutClick = async () => {
    await logout();
  };

  const drawerContent = (
    <div>
      <Toolbar 
        sx={{
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: (isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) ? 'flex-start' : 'center',
          py: 1, 
          mt: 1, 
          mb: 0.5,
          px: (isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) ? 2.5 : 2, 
        }}
      >
        <img src={appLogo} alt="CleanTrack Logo" style={{ height: '32px', marginRight: (isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) ? '8px' : '0' }} /> 
        {(isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) && (
          <Typography variant="h6" component="div" sx={{ color: theme.palette.text.primary, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            CleanTrac
          </Typography>
        )}
      </Toolbar>
      
      <Divider />
      <List sx={{ pt: 0 }}>
        {determinedLinks.map((link) => (
          <NavLink to={link.path} key={link.text} style={{ textDecoration: 'none', color: 'inherit' }}>
            {({ isActive }) => (
              <ListItem disablePadding sx={commonStyles(isActive)}>
                <Tooltip title={showTooltip ? link.text : ''} placement="right" arrow>
                  <ListItemButton sx={{ justifyContent: showTooltip ? 'center' : 'flex-start', px: showTooltip ? theme.spacing(2.5) : `calc(${theme.spacing(3)} - 3px)` }}>
                    <ListItemIcon sx={{ minWidth: 0, mr: (isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) ? 3 : 'auto', justifyContent: 'center' }}>
                      {link.icon}
                    </ListItemIcon>
                    {(isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) && <ListItemText primary={link.text} sx={{ color: theme.palette.text.primary }} />}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            )}
          </NavLink>
        ))}
        {currentUser && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding sx={commonStyles(false)}> 
              <Tooltip title={showTooltip ? 'Logout' : ''} placement="right" arrow>
                <ListItemButton onClick={handleLogoutClick} sx={{ justifyContent: showTooltip ? 'center' : 'flex-start', px: showTooltip ? theme.spacing(2.5) : `calc(${theme.spacing(3)} - 3px)` }}>
                  <ListItemIcon sx={{ minWidth: 0, mr: (isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) ? 3 : 'auto', justifyContent: 'center', color: theme.palette.text.secondary }}> 
                    <LogoutIcon />
                  </ListItemIcon>
                  {(isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) && <ListItemText primary="Logout" sx={{ color: theme.palette.text.primary }} />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </>
        )}
      </List>
    </div>
  );

  const currentPermanentDrawerWidth = isCollapsed ? collapsedDrawerWidth(theme) : drawerWidth;

  return (
    <Box
      component="nav"
      sx={{ width: { md: currentPermanentDrawerWidth }, flexShrink: { md: 0 }, transition: theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.enteringScreen }) }}
      aria-label="mailbox folders"
    >
      <Drawer 
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle} 
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }, 
        }}
      >
        {drawerContent} 
      </Drawer>
      
      <Drawer 
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box', 
            width: currentPermanentDrawerWidth, 
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            overflowX: 'hidden', 
            transition: theme.transitions.create('width', { 
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        open 
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
