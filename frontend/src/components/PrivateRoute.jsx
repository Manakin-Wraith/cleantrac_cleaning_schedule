import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = ({ allowedRoles }) => {
    const { currentUser, isLoading } = useAuth();

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    const userRole = currentUser.profile?.role;
    const isSuperuser = currentUser.is_superuser;

    // Check if user has one of the allowed roles or is a superuser (who can access anything)
    // Superuser check is primary; if not superuser, then check allowedRoles.
    const isAuthorized = isSuperuser || (allowedRoles && userRole && allowedRoles.includes(userRole));
    
    if (!isAuthorized) {
        // Redirect to a relevant page if not authorized.
        // If they are a manager but not allowed this specific route, send to manager dashboard.
        // If they are staff or other, send to login (or staff dashboard if exists).
        // This could be refined to a dedicated 'Unauthorized' page.
        if (userRole === 'manager') {
            return <Navigate to="/manager-dashboard" replace />;
        } else if (userRole === 'staff') {
            return <Navigate to="/staff-tasks" replace />;
        } else {
            return <Navigate to="/login" replace />;
        }
    }

    return <Outlet />; // Renders the child route's element if authorized
};

export default PrivateRoute;
