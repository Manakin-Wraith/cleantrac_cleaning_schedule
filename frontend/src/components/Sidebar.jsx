import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Box, Divider, useTheme, useMediaQuery, Tooltip, Collapse } from '@mui/material';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune'; // For Management group 

export const drawerWidth = 240;
const collapsedDrawerWidth = (theme) => theme.spacing(7); 

const Sidebar = ({ mobileOpen, handleDrawerToggle, isCollapsed }) => {

  const [openSections, setOpenSections] = React.useState({});
  const { currentUser, logout } = useAuth();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md')); 
  const navigate = useNavigate();
  const location = useLocation();

  const handleSectionToggle = (sectionName) => {
    setOpenSections(prevOpenSections => ({
      ...prevOpenSections,
      [sectionName]: !prevOpenSections[sectionName],
    }));
  };

  const isPermanentDrawerEffectivelyOpen = isMdUp && !isCollapsed;
  const isMobileDrawerOpen = mobileOpen; 
  const showTooltip = isCollapsed && isMdUp && !mobileOpen;

  const commonStyles = (isActive, isParentActive = false) => ({
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    '& .MuiListItemButton-root': {
      borderLeft: isActive || isParentActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
      paddingLeft: isActive || isParentActive ? `calc(${theme.spacing(3)} - 3px)` : theme.spacing(3), 
      // boxSizing: 'border-box', // Removed - was incorrectly added
      // backgroundColor: 'lime', // DEBUG: Removed - was incorrectly added
      '&:hover': {
        backgroundColor: theme.palette.action.hover, 
      },
    },
    '& .MuiListItemIcon-root': {
      color: isActive || isParentActive ? theme.palette.primary.main : theme.palette.text.secondary, 
    },
    '& .MuiListItemText-primary': {
      color: isActive || isParentActive ? theme.palette.primary.main : theme.palette.text.primary,
      fontWeight: isActive || isParentActive ? 'medium' : 'normal',
    },
  });

  const nestedListItemStyles = (isActive) => ({
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    '& .MuiListItemButton-root': {
      paddingLeft: theme.spacing(4), // Indent nested items
      borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
    '& .MuiListItemIcon-root': {
      color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
      minWidth: theme.spacing(4), // Adjust icon spacing for nested items
    },
    '& .MuiListItemText-primary': {
      color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
      fontWeight: isActive ? 'medium' : 'normal',
    },
  });

  const departmentManagementLink = { 
    text: 'Departments', 
    icon: <BusinessIcon />,
    path: '/admin/departments' 
  };

  const baseManagerLinks = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/manager-dashboard' },
    {
      text: 'Management',
      icon: <TuneIcon />,
      children: [
        { text: 'Item Management', icon: <ListAltIcon />, path: '/manager-items' },
        { text: 'Staff', icon: <PeopleIcon />, path: '/manager-users' },
        // departmentManagementLink will be added here conditionally
      ],
    },
    { text: 'Thermometers', icon: <DeviceThermostatIcon />, path: '/manager-thermometers' },
    { text: 'Coming SOON!', icon: <CalendarMonthIcon />, path: '/manager-schedule' }, // Example: can be top-level or nested
  ];

  const staffLinks = [
    { text: 'My Tasks', icon: <AssignmentIcon />, path: '/staff-tasks' },
  ];

  let determinedLinks = [];

  if (currentUser?.is_superuser) {
    const managementChildren = baseManagerLinks.find(link => link.text === 'Management').children;
    determinedLinks = baseManagerLinks.map(link => 
      link.text === 'Management' 
        ? { ...link, children: [...managementChildren, departmentManagementLink] } 
        : link
    );
  } else if (currentUser?.profile?.role === 'manager') {
    // For managers, include department management if they have access, or filter it out if not needed by default
    // Assuming managers always see department link if it's part of their role's general links
    const managementChildren = baseManagerLinks.find(link => link.text === 'Management').children;
    determinedLinks = baseManagerLinks.map(link => 
      link.text === 'Management' 
        ? { ...link, children: [...managementChildren, departmentManagementLink] } // Or filter departmentManagementLink based on specific manager perms
        : link
    );
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
      <List sx={{ pt: 0 }} component="nav">
        {determinedLinks.map((link) => {
          const isParentActive = link.children && link.children.some(child => location.pathname.startsWith(child.path));
          if (link.children) {
            return (
              <React.Fragment key={link.text}>
                <ListItem disablePadding sx={commonStyles(false, isParentActive)}>
                  <Tooltip title={showTooltip ? link.text : ''} placement="right" arrow>
                    <ListItemButton 
                      onClick={() => handleSectionToggle(link.text)} 
                      sx={{ justifyContent: showTooltip ? 'center' : 'flex-start', px: showTooltip ? theme.spacing(2.5) : `calc(${theme.spacing(3)} - 3px)` }}
                    >
                      <ListItemIcon sx={{ minWidth: 0, mr: (isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) ? 3 : 'auto', justifyContent: 'center' }}>
                        {link.icon}
                      </ListItemIcon>
                      {(isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) && <ListItemText primary={link.text} sx={{ color: theme.palette.text.primary }} />}
                      {(isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) && (openSections[link.text] ? <ExpandLess /> : <ExpandMore />)}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
                <Collapse in={openSections[link.text]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {link.children.map((childLink) => (
                      <NavLink to={childLink.path} key={childLink.text} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {({ isActive }) => (
                          <ListItem disablePadding sx={nestedListItemStyles(isActive)}>
                            <Tooltip title={showTooltip ? childLink.text : ''} placement="right" arrow>
                              <ListItemButton sx={{ justifyContent: showTooltip ? 'center' : 'flex-start', pl: showTooltip ? theme.spacing(2.5) : theme.spacing(4) }}>
                                <ListItemIcon sx={{ minWidth: 0, mr: (isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) ? 2 : 'auto', justifyContent: 'center', pl: showTooltip ? 0 : theme.spacing(0.5) }}>
                                  {childLink.icon}
                                </ListItemIcon>
                                {(isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) && <ListItemText primary={childLink.text} sx={{ color: theme.palette.text.primary }} />}
                              </ListItemButton>
                            </Tooltip>
                          </ListItem>
                        )}
                      </NavLink>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }
          // Render non-parent link
          return (
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
          );
        })}
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

            flexShrink: 0, // Prevent shrinking
            transition: theme.transitions.create('width', { 
              easing: theme.transitions.easing.sharp,
              duration: 225, // Fixed duration in ms for both expanding and collapsing
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
