import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SnackbarProvider } from 'notistack';
import App from './App.jsx';
import './index.css';

// ThemeProvider and CssBaseline will be handled in App.jsx

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* AuthProvider will wrap App, and App will handle ThemeProvider */}
    <SnackbarProvider 
      maxSnack={3}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <App />
    </SnackbarProvider>
  </StrictMode>,
);
