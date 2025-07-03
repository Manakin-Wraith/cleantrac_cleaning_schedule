import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SnackbarProvider } from 'notistack';
import App from './App.jsx';
import './index.css';

// Force modern UI: remove any stale flag stored by older builds and unregister old service workers
if (typeof localStorage !== 'undefined' && localStorage.getItem('tabletSimpleView') === 'true') {
  localStorage.removeItem('tabletSimpleView');
  // also purge entire storage if flag is present (safety)
  // localStorage.clear(); // uncomment if broader reset becomes necessary
// Unregister any existing service workers so clients always load the latest bundle
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()));
}

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
