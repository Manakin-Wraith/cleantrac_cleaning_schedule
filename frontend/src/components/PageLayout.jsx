import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import HeaderBar from './HeaderBar'; // Import the HeaderBar

const PageLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}> 
      <CssBaseline />
      <HeaderBar />
      <Box
        component="main" // Semantic element for main content
        sx={{
          flexGrow: 1, // Allows this Box to grow and fill available space
          py: 3, // Vertical padding (top and bottom)
          px: 2, // Horizontal padding
          mt: '64px', // Margin top to offset the AppBar height (default is 64px)
          // The following can be used if you want the content centered as before
          // display: 'flex',
          // flexDirection: 'column',
          // alignItems: 'center',
          // justifyContent: 'center', // This might not be desired if content should start at top
          backgroundColor: '#f0f2f5', // Keep original background color if desired for content area
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PageLayout;
