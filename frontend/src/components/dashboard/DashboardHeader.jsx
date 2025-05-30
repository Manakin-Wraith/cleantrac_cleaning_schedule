import React from 'react';
import { Typography, Box } from '@mui/material';

/**
 * A reusable header component for dashboard pages
 * 
 * @param {Object} props
 * @param {string} props.title - Main title for the dashboard
 * @param {string} props.subtitle - Optional subtitle
 * @param {React.ReactNode} props.action - Optional action button or component
 */
function DashboardHeader({ title, subtitle, action }) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' }, 
      justifyContent: 'space-between',
      alignItems: { xs: 'flex-start', sm: 'center' },
      mb: 3
    }}>
      <Box>
        <Typography component="h1" variant="h4" gutterBottom sx={{ mb: subtitle ? 0.5 : 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="subtitle1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Box sx={{ mt: { xs: 2, sm: 0 } }}>
          {action}
        </Box>
      )}
    </Box>
  );
}

export default DashboardHeader;
