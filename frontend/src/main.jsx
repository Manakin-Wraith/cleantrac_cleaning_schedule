import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SnackbarProvider } from 'notistack';
import App from './App.jsx';
import './index.css';

// Polyfill for Node.js globals needed by convert-units and other Node.js libraries
if (typeof window !== 'undefined') {
  // Add global object
  if (!window.global) window.global = window;
  
  // Add process object
  if (!window.process) window.process = { env: {} };
  
  // Add Buffer object
  if (!window.Buffer) window.Buffer = { isBuffer: () => false };
}

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
