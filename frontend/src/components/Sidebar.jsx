import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Box, Divider, useTheme, useMediaQuery, Tooltip, Collapse, IconButton, Paper } from '@mui/material';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import appLogo from '../assets/box_icon.png'; 

// Import icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout'; 
import BusinessIcon from '@mui/icons-material/Business';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat'; 
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune'; // For Management group 
import DescriptionIcon from '@mui/icons-material/Description'; // For Document Templates
import FolderOpenIcon from '@mui/icons-material/FolderOpen'; // For Documents Library
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // Added missing import
import LocalShippingIcon from '@mui/icons-material/LocalShipping'; // For Suppliers
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'; // For Recipe Management
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits'; // For Production Scheduler
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export const drawerWidth = 240;
const collapsedDrawerWidth = (theme) => theme.spacing(7); 

const Sidebar = ({ mobileOpen, handleDrawerToggle, isCollapsed, onCollapseToggle = () => {} }) => {

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

  const getListItemButtonStyles = (isActiveState, isParentActiveState = false) => {
    const active = isActiveState || isParentActiveState;
    const showText = isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen;
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: showTooltip && !showText ? 'center' : 'flex-start',
      padding: theme.spacing(1, showText ? 2 : (showTooltip ? 1.5 : 2)),
      margin: theme.spacing(0.5, 1.5),
      borderRadius: '22px', // Pill shape
      minHeight: '44px',
      width: `calc(100% - ${theme.spacing(1.5 * 2)})`, // Account for margin
      boxSizing: 'border-box',
      transition: theme.transitions.create(['background-color', 'color', 'opacity'], {
        duration: theme.transitions.duration.short,
      }),
      ...(active && {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        '&:hover': {
          backgroundColor: theme.palette.primary.dark,
        },
        '& .MuiListItemText-primary': {
            fontWeight: 500,
        },
      }),
      ...(!active && {
        color: theme.palette.text.secondary,
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.text.primary,
        },
        '& .MuiListItemText-primary': {
            fontWeight: 400,
        },
      }),
      '& .MuiListItemIcon-root': {
        minWidth: 0,
        mr: showText ? 2 : 'auto',
        justifyContent: 'center',
      },
    };
  };

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
        { text: 'Recipe Management', icon: <RestaurantMenuIcon />, path: '/recipe-management' },
        { text: 'Cleaning Item Management', icon: <CleaningServicesIcon />, path: '/manager-items' },
        { text: 'Staff', icon: <PeopleIcon />, path: '/manager-users' },
        { text: 'Suppliers', icon: <LocalShippingIcon />, path: '/manager-suppliers' },
        // departmentManagementLink will be added here conditionally
      ],
    },
    { text: 'Thermometers', icon: <DeviceThermostatIcon />, path: '/manager-thermometers' },
    { text: 'Temperature Checks', icon: <AcUnitIcon />, path: '/manager-temperature-checks' },
    { text: 'Document Templates', icon: <DescriptionIcon />, path: '/manager-documents' },
    { text: 'Documents Library', icon: <FolderOpenIcon />, path: '/manager-documents-library' },

    { text: 'Task Scheduler', icon: <CalendarMonthIcon />, path: '/manager-schedule' },
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

  const renderNavItem = (link, parentActive=false) => {
    const button = (
      <ListItemButton
        component={NavLink}
        to={link.path}
        sx={getListItemButtonStyles(location.pathname === link.path, parentActive)}
      >
        <ListItemIcon>{link.icon}</ListItemIcon>
        <ListItemText primary={link.text} sx={{ opacity: isPermanentDrawerEffectivelyOpen ? 1 : 0 }} />
      </ListItemButton>
    );

    // Show tooltip only when collapsed and desktop
    if (showTooltip) {
      return (
        <Tooltip title={link.text} placement="right" enterDelay={500} arrow>
          {button}
        </Tooltip>
      );
    }
    return button;
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
                <ListItem disablePadding>
                  <Tooltip title={showTooltip ? link.text : ''} placement="right" arrow>
                    <ListItemButton
                      onClick={() => handleSectionToggle(link.text)}
                      sx={getListItemButtonStyles(false, isParentActive)}
                    >
                      <ListItemIcon>{link.icon}</ListItemIcon>
                      <ListItemText primary={link.text} sx={{ opacity: isPermanentDrawerEffectivelyOpen ? 1 : 0 }} />
                    </ListItemButton>
                  </Tooltip>
                  <Box sx={{ opacity: (isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) ? 1 : 0, transition: 'opacity 0.2s', ml: 0.5 }}>
                    {openSections[link.text] ? <ExpandLess /> : <ExpandMore />}
                  </Box>
                </ListItem>
                <Collapse in={openSections[link.text]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {link.children.map((childLink) => (
                      <React.Fragment key={childLink.text}>
                        <ListItem disablePadding>
                          {renderNavItem(childLink, isParentActive)}
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }
          // Render non-parent link
          return (
            <React.Fragment key={link.text}>
              <ListItem disablePadding>
                {renderNavItem(link, isParentActive)}
              </ListItem>
            </React.Fragment>
          );
        })}
        {currentUser && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding> 
              <Tooltip title={showTooltip ? 'Logout' : ''} placement="right" enterDelay={500} arrow>
                <ListItemButton onClick={handleLogoutClick} sx={getListItemButtonStyles(false)}>
                  <ListItemIcon sx={{ minWidth: 0, mr: (isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) ? 3 : 'auto', justifyContent: 'center' }}> 
                    <LogoutIcon />
                  </ListItemIcon>
                  {(isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) && <ListItemText primary="Logout" />}
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
      sx={{ width: { md: currentPermanentDrawerWidth }, flexShrink: { md: 0 } }} // Removed transition from Box sx
      aria-label="mailbox folders"
    >
      {/* Drawer for mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle} // Restored
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        PaperProps={{
          sx: {
            width: drawerWidth,
            backgroundColor: theme.palette.sidebarBackground, // Use new sidebar background
            borderRight: `1px solid ${theme.palette.divider}`,
            boxSizing: 'border-box',
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer for desktop */}
      <Drawer
        variant="permanent"
        open // Permanent drawers are typically 'open' and their visibility/width is controlled by styles
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.sidebarBackground, // Use new sidebar background
            width: isPermanentDrawerEffectivelyOpen ? drawerWidth : collapsedDrawerWidth(theme),
            borderRight: 'none', 
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            boxSizing: 'border-box',
            backdropFilter: showTooltip ? 'blur(6px)' : 'none',
            boxShadow: showTooltip ? theme.shadows[4] : 'none',
          }
        }}
      >
        <Toolbar 
          sx={{ display: 'flex', alignItems: 'center', justifyContent: isPermanentDrawerEffectivelyOpen ? 'flex-start' : 'center', px: 2 }}
        >
          <img src={appLogo} alt="CleanTrack Logo" style={{ height: '32px', marginRight: (isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) ? '8px' : '0' }} /> 
          {(isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) && (
            <Typography variant="h6" component="div" sx={{ color: theme.palette.text.primary, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              CleanTrac
            </Typography>
          )}
        </Toolbar>
        {/* Collapse/Expand toggle button (desktop only) */}
        {isMdUp && (
          <Box sx={{ position: 'absolute', top: theme.spacing(1), right: theme.spacing(1), zIndex: theme.zIndex.drawer + 1 }}>
            <IconButton size="small" color="primary" onClick={onCollapseToggle} sx={{ bgcolor: 'inherit', '&:hover': { bgcolor: 'action.hover' } }}>
              {isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
            </IconButton>
          </Box>
        )}
        <Divider />
        <List sx={{ pt: 0 }} component="nav">
          {determinedLinks.map((link) => {
            const isParentActive = link.children && link.children.some(child => location.pathname.startsWith(child.path));
            if (link.children) {
              return (
                <React.Fragment key={link.text}>
                  <ListItem disablePadding>
                    <Tooltip title={showTooltip ? link.text : ''} placement="right" arrow>
                      <ListItemButton
                        onClick={() => handleSectionToggle(link.text)}
                        sx={getListItemButtonStyles(false, isParentActive)}
                      >
                        <ListItemIcon>{link.icon}</ListItemIcon>
                        <ListItemText primary={link.text} sx={{ opacity: isPermanentDrawerEffectivelyOpen ? 1 : 0 }} />
                      </ListItemButton>
                    </Tooltip>
                    <Box sx={{ opacity: (isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) ? 1 : 0, transition: 'opacity 0.2s', ml: 0.5 }}>
                      {openSections[link.text] ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                  </ListItem>
                  <Collapse in={openSections[link.text]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {link.children.map((childLink) => (
                        <React.Fragment key={childLink.text}>
                          <ListItem disablePadding>
                            {renderNavItem(childLink, isParentActive)}
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  </Collapse>
                </React.Fragment>
              );
            }
            // Render non-parent link
            return (
              <React.Fragment key={link.text}>
                <ListItem disablePadding>
                  {renderNavItem(link, isParentActive)}
                </ListItem>
              </React.Fragment>
            );
          })}
          {currentUser && (
            <>
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding> 
                <Tooltip title={showTooltip ? 'Logout' : ''} placement="right" enterDelay={500} arrow>
                  <ListItemButton onClick={handleLogoutClick} sx={getListItemButtonStyles(false)}>
                    <ListItemIcon sx={{ minWidth: 0, mr: (isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) ? 3 : 'auto', justifyContent: 'center' }}> 
                      <LogoutIcon />
                    </ListItemIcon>
                    {(isPermanentDrawerEffectivelyOpen || isMobileDrawerOpen) && <ListItemText primary="Logout" />}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            </>
          )}
        </List>
      </Drawer>
    </Box>
  );
};

export default Sidebar;
