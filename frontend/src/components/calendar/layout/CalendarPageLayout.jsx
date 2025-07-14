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

const drawerWidth = 280; // Reduced sidebar width for more calendar space

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' && prop !== 'sidebarWidth' })(({
  theme, open, sidebarWidth = 0 },
) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  height: `calc(100vh - 48px)`,
  overflowX: 'hidden',
  overflowY: 'auto',
  transition: theme.transitions.create(['margin', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginRight: 0, // No margin when drawer is closed
  marginLeft: `${sidebarWidth}px`, // No extra margin from sidebar
  position: 'relative',
  zIndex: 1, // Ensure proper stacking context
  ...(open && {
    transition: theme.transitions.create(['margin', 'padding'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: drawerWidth, // Exact drawer width when open
  }),
  [theme.breakpoints.down('sm')]: {
    padding: 0,
    marginLeft: sidebarWidth ? `${sidebarWidth}px` : 0,
  },
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'sidebarWidth',
})(({ theme, open, sidebarWidth = 0 }) => ({
  backgroundColor: 'transparent',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  background: `${alpha(theme.palette.background.default, 0.65)}`,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: 'none',
  zIndex: theme.zIndex.drawer + 1,
  width: `calc(100% - ${sidebarWidth}px)`,
  marginLeft: `${sidebarWidth}px`,
  transition: theme.transitions.create(['margin', 'width', 'background'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // marginLeft is now set above
  ...(open && {
    width: `calc(100% - ${drawerWidth + sidebarWidth}px)`,
    marginRight: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    marginLeft: 0,
  },
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: 0,
  // necessary for content to be below app bar, but minimized
  height: '40px',
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
  sidebarWidth = 0, // Add sidebarWidth prop with default value
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
      <AppBar position="fixed" open={open} sidebarWidth={sidebarWidth}>
        <Toolbar sx={{ minHeight: '40px', py: 0.25, px: 0.5 }}>
          {/* Custom Header Content is rendered here */}
          {React.cloneElement(headerContent, { sidebarWidth })}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerOpen}
            sx={{ ...(open && { display: 'none' }) }}
          >
            {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Main open={open} sidebarWidth={sidebarWidth}>
        {/* Optional Filters Bar content rendered here */}
        {filtersBarContent}
        {/* Main page content (e.g., the FullCalendar component) rendered here */}
        {children}
      </Main>
      <Drawer
        sx={{
          width: open ? drawerWidth : 0,
          display: open ? 'block' : 'none',
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            backgroundColor: 'transparent',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            background: alpha(theme.palette.background.default, 0.65),
            borderLeft: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            boxShadow: theme.shadows[1],
            zIndex: theme.zIndex.drawer - 1, // Lower than main sidebar
            transition: theme.transitions.create(['transform', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            transform: open ? 'translateX(0)' : `translateX(${drawerWidth}px)`,
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
