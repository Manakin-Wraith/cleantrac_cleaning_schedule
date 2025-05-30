import React from 'react';
import { Typography, Box, Divider } from '@mui/material';

/**
 * A reusable section title component for dashboard pages
 * 
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {React.ReactNode} props.action - Optional action button or component
 * @param {boolean} props.divider - Whether to show a divider below the title
 * @param {Object} props.sx - Additional styles to apply to the container
 */
function SectionTitle({ title, action, divider = false, sx = {} }) {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      mb: 2,
      ...sx
    }}>
      <Typography variant="h5" component="h2">
        {title}
      </Typography>
      {action && (
        <Box>
          {action}
        </Box>
      )}
      {divider && <Divider sx={{ mt: 1 }} />}
    </Box>
  );
}

export default SectionTitle;
