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

const drawerWidth = 280;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: 0,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginRight: -drawerWidth,
    height: '100%',
    position: 'relative',
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginRight: 0,
    }),
  }),
);

const AppBar = styled(MuiAppBar, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    backgroundColor: 'transparent',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    background: `${alpha(theme.palette.background.default, 0.65)}`,
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: 'none',
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginRight: drawerWidth,
    }),
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-start',
}));

/**
 * A reusable layout component for calendar pages.
 * Manages a persistent right-hand sidebar, a main content area, and a header.
 */
function CalendarPageLayout({
  children,
  headerContent,
  sidebarContent,
  filtersBarContent,
  initialSidebarOpen = true,
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(initialSidebarOpen);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar sx={{ minHeight: '48px!important' }}>
          {headerContent}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="end"
            sx={{ ml: 'auto', ...(open && { display: 'none' }) }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Main open={open}>
        <DrawerHeader />
        <Box sx={{ p: 1, height: '100%', position: 'relative' }}>
          {filtersBarContent}
          {children}
        </Box>
      </Main>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            backgroundColor: 'transparent',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            background: alpha(theme.palette.background.default, 0.65),
            borderLeft: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          },
        }}
        variant="persistent"
        anchor="right"
        open={open}
      >
        <DrawerHeader sx={{ justifyContent: 'flex-end' }}>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
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
   * Content for the header/app bar, e.g., navigation controls.
   */
  headerContent: PropTypes.node,
  /**
   * Content for the right-hand sidebar.
   */
  sidebarContent: PropTypes.node,
  /**
   * Optional content to display above the main children, like a filter bar.
   */
  filtersBarContent: PropTypes.node,
  /**
   * Whether the sidebar is open by default.
   */
  initialSidebarOpen: PropTypes.bool,
};

export default CalendarPageLayout;
