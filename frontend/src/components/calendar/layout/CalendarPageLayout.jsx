import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { styled, useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const drawerWidth = 300; // Sidebar width

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })((
  { theme, open },
) => ({
  flexGrow: 1,
  padding: 0,
  minHeight: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
  overflowX: 'visible',
  overflowY: 'hidden',
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginRight: -drawerWidth,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  }),
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  backgroundColor: 'transparent',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  background: `${alpha(theme.palette.background.default, 0.65)}`,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
  boxShadow: theme.shadows[1],
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['margin', 'width', 'background'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginRight: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width', 'background'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-start',
}));

/**
 * A reusable layout component for calendar pages.
 * Manages a persistent right-hand sidebar, a main content area, and a header.
 */
export default function CalendarPageLayout({
  children,
  headerContent,
  sidebarContent,
  filtersBarContent,
  initialSidebarOpen = true,
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(initialSidebarOpen);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          {/* Custom Header Content is rendered here */}
          {headerContent}
          {/* This is a placeholder for the sidebar toggle button, can be moved into headerContent */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerOpen}
            sx={{ ...(open && { display: 'none' }) }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Main open={open}>
        <DrawerHeader /> {/* This is a spacer to push content below the AppBar */}
        {/* Optional Filters Bar content rendered here */}
        {filtersBarContent}
        {/* Main page content (e.g., the FullCalendar component) rendered here */}
        {children}
      </Main>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#F5F6F8',
            borderLeft: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
          },
        }}
        variant="persistent"
        anchor="right"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        {/* Custom Sidebar Content is rendered here */}
        {sidebarContent}
      </Drawer>
    </Box>
  );
}

CalendarPageLayout.propTypes = {
  /**
   * The main content to display, typically the FullCalendar component.
   */
  children: PropTypes.node.isRequired,
  /**
   * The content to display in the header/AppBar.
   */
  headerContent: PropTypes.node,
  /**
   * The content to display in the right-hand sidebar.
   */
  sidebarContent: PropTypes.node,
  /**
   * Optional content to display in a collapsible bar below the header.
   */
  filtersBarContent: PropTypes.node,
  /**
   * The initial open state of the sidebar.
   */
  initialSidebarOpen: PropTypes.bool,
};
