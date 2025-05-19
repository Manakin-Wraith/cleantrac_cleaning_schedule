import React from 'react';
import LoginPage from './pages/LoginPage.jsx';
import { CssBaseline, Box } from '@mui/material';

function App() {
  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh', 
          // backgroundColor: '#f0f2f5', 
        }}
      >
        <LoginPage />
      </Box>
    </>
  );
}

export default App;
