import React from 'react';
import { Box, Alert, Typography, Card, CardContent } from '@mui/material';

/**
 * A reusable alert section component for dashboard pages
 * 
 * @param {Object} props
 * @param {Array} props.alerts - Array of alert objects with icon, title, message, and severity properties
 * @param {Object} props.sx - Additional styles to apply to the container
 */
function AlertSection({ alerts = [], sx = {} }) {
  if (!alerts || alerts.length === 0) return null;
  
  return (
    <Box sx={{ mb: 3, ...sx }}>
      <Card variant="outlined">
        <CardContent sx={{ p: 2 }}>
          {alerts.map((alert, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                mb: index < alerts.length - 1 ? 2 : 0
              }}
            >
              {alert.icon && React.cloneElement(alert.icon, { 
                sx: { mr: 2, mt: 0.5, color: `${alert.severity}.main` } 
              })}
              <Box>
                {alert.title && (
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {alert.title}
                  </Typography>
                )}
                {alert.message && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {alert.message}
                  </Typography>
                )}
                {alert.content && (
                  <Box sx={{ mt: 1 }}>
                    <Alert severity={alert.severity || "warning"} icon={alert.contentIcon}>
                      {typeof alert.content === 'string' ? (
                        <Typography variant="body2">
                          {alert.content}
                        </Typography>
                      ) : alert.content}
                    </Alert>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}

export default AlertSection;
