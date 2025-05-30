import React from 'react';
import { Container, Box, CircularProgress, Alert, Typography } from '@mui/material';
import DashboardHeader from './DashboardHeader';
import AlertSection from './AlertSection';

/**
 * A reusable layout component for dashboard pages
 * 
 * @param {Object} props
 * @param {string} props.title - Main title for the dashboard
 * @param {string} props.subtitle - Optional subtitle
 * @param {React.ReactNode} props.action - Optional action button or component
 * @param {Array} props.alerts - Array of alert objects for the AlertSection
 * @param {boolean} props.loading - Whether the dashboard is loading
 * @param {string} props.error - Error message to display
 * @param {string} props.loadingMessage - Message to display while loading
 * @param {string} props.errorMessage - Message to display with the error alert
 * @param {React.ReactNode} props.children - Dashboard content
 */
function DashboardLayout({ 
  title,
  subtitle,
  action,
  alerts = [],
  loading = false,
  error = '',
  loadingMessage = 'Loading dashboard...',
  errorMessage = 'Could not load dashboard. Please try again later.',
  children
}) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        {loadingMessage && (
          <Typography variant="body2" sx={{ ml: 2 }}>
            {loadingMessage}
          </Typography>
        )}
      </Box>
    );
  }

  if (error) {
    return (
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Typography variant="h6" color="text.secondary" align="center">
          {errorMessage}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <DashboardHeader title={title} subtitle={subtitle} action={action} />
      
      {alerts.length > 0 && <AlertSection alerts={alerts} />}
      
      {children}
    </Container>
  );
}

export default DashboardLayout;
