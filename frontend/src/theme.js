import { createTheme, alpha } from '@mui/material/styles';
import { red, amber, grey } from '@mui/material/colors';

// --- BASE THEME --- 
const baseThemeConfig = {
  palette: {
    primary: {
      main: '#556cd6', // Default blue
    },
    secondary: {
      main: '#19857b', // Default teal
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    sidebarBackground: grey[100], // Added for the new sidebar design
    surfaceHigh: alpha('#ffffff', 0.95),
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.2rem', fontWeight: 500, marginBottom: '0.5em' },
    h2: { fontSize: '1.8rem', fontWeight: 500, marginBottom: '0.5em' },
    h3: { fontSize: '1.5rem', fontWeight: 500, marginBottom: '0.5em' },
    h4: { fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5em' },
    h5: { fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5em' },
    h6: { fontSize: '1rem', fontWeight: 500, marginBottom: '0.5em' },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 1,
        color: 'inherit',
      },
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 2,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: (theme) => theme.palette.surfaceHigh,
          backdropFilter: 'blur(2px)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          backgroundColor: (theme) => theme.palette.surfaceHigh,
          backdropFilter: 'blur(2px)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 12,
          backgroundColor: theme.palette.surfaceHigh,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.6)',
          backdropFilter: 'blur(4px)',
          color: theme.palette.getContrastText(theme.palette.surfaceHigh),
        }),
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiFormControl: {
      defaultProps: {
        size: 'small',
      },
    },
  },
};

const baseTheme = createTheme(baseThemeConfig);

// --- BUTCHERY THEME --- 
const butcheryTheme = createTheme(baseTheme, {
  palette: {
    primary: {
      main: red[700], // A strong red
      contrastText: '#fff',
    },
    secondary: {
      main: red[300],
    },
  },
});

// --- BAKERY THEME --- 
const bakeryTheme = createTheme(baseTheme, {
  palette: {
    primary: {
      main: amber[600], // A rich yellow/amber
      contrastText: 'rgba(0, 0, 0, 0.87)',
    },
    secondary: {
      main: amber[300],
    },
  },
});

// --- HMR THEME --- 
const hmrTheme = createTheme(baseTheme, {
  palette: {
    primary: {
      main: grey[400], // A light-medium grey for better visibility than grey[300]
      contrastText: 'rgba(0, 0, 0, 0.87)',
    },
    secondary: {
      main: grey[600], // A medium grey
    },
    // Example: if HMR has a specific off-white page background
    // background: {
    //   default: '#fafafa', // An off-white background
    //   paper: '#ffffff',
    // },
  },
});

export { baseTheme, butcheryTheme, bakeryTheme, hmrTheme };

// Default export can be the baseTheme or one of the department themes if there's a global default
export default baseTheme; // Keeping baseTheme as default for now
