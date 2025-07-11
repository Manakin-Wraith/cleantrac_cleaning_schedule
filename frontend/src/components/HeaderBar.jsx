import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, CircularProgress, IconButton, useTheme, Avatar, Menu, MenuItem, ListItemIcon, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu'; 
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'; 
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutline';
import { alpha as muiAlpha } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { drawerWidth as expandedDrawerWidthValue } from './Sidebar'; 

const HeaderBar = ({ handleDrawerToggle, handleSidebarToggle, isSidebarCollapsed, showSidebar }) => { 
  const { currentUser, logout, isLoading } = useAuth();
  const theme = useTheme(); 
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout(); 
    navigate('/login'); // Redirect to login after logout
  };

  const handleProfile = () => {
    handleMenuClose();
    // navigate('/profile'); // TODO: Implement profile page and navigation
    console.log('Navigate to profile page');
  };

  const handleSettings = () => {
    handleMenuClose();
    // navigate('/settings'); // TODO: Implement settings page and navigation
    console.log('Navigate to settings page');
  };

  const collapsedWidthValue = theme.spacing(7);
  const currentEffectiveDrawerWidth = showSidebar 
    ? collapsedWidthValue // Always use collapsed width for AppBar calculations when sidebar is shown
    : 0;

  return (
    <AppBar 
      position="fixed" 
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: muiAlpha('#ffffff', 0.4),
        color: '#333',
        boxShadow: 'none',
        borderBottom: `1px solid ${theme.palette.divider}`, // Added for visual separation
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
      <Toolbar sx={{ minHeight: { xs: '56px', sm: '56px', md: '56px' }, alignItems: 'center' }}>
        {showSidebar && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle} 
            sx={{ mr: 2, display: { md: 'none' } }} 
          >
            <MenuIcon />
          </IconButton>
        )}

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

        <Typography variant="h6" noWrap component={RouterLink} to={currentUser ? (currentUser.profile?.role === 'manager' ? '/manager-dashboard' : '/staff-tasks') : '/login'} sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 1, lineHeight: 1 }}>
          <PieChartOutlineIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
          CLEENTRAC
        </Typography>

        {isLoading ? (
          <CircularProgress color="inherit" size={24} />
        ) : currentUser ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {currentUser.profile?.department_name && (
              <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}> 
                Dept: {currentUser.profile.department_name}
              </Typography>
            )}
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ ml: 1 }}
              aria-controls={menuOpen ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={menuOpen ? 'true' : undefined}
            >
              <AccountCircleIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={menuOpen}
              onClose={handleMenuClose}
              onClick={handleMenuClose} // Also close on item click if not navigating away
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem disabled sx={{ '&.Mui-disabled': { opacity: 1, color: theme.palette.text.primary } }}>
                <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>{currentUser.username}</Typography>
              </MenuItem>
              <MenuItem disabled sx={{ '&.Mui-disabled': { opacity: 0.7 } }}>
                <Typography variant="body2" component="div">Role: {currentUser.profile?.role}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleProfile}>
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleSettings}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
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
