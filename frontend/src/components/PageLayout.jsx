import React from 'react';
import { Box, CssBaseline } from '@mui/material';

const PageLayout = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5', // Default background color
      }}
    >
      <CssBaseline />
      {children}
    </Box>
  );
};

export default PageLayout;
