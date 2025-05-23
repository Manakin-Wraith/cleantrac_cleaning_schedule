import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useSnackbar } from 'notistack'; 
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
} from '@mui/material';
// import { loginUser, getCurrentUser } from '../services/authService'; // No longer directly used
import { useAuth } from '../context/AuthContext'; // Import useAuth

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); 
    const { enqueueSnackbar } = useSnackbar(); 
    const { login } = useAuth(); // Get login function from AuthContext

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            // const tokenData = await loginUser(username, password);
            // localStorage.setItem('authToken', tokenData.token); 
            // const userData = await getCurrentUser();
            const userData = await login(username, password); // Use context login

            if (userData) { // Ensure userData is returned before proceeding
                enqueueSnackbar(`Login successful! Welcome ${userData.username}. Role: ${userData.profile.role}, Department: ${userData.profile.department_name}`, { variant: 'success' });
                console.log('User details:', userData);

                // Role-based redirection
                if (userData.is_superuser) {
                    // Superusers can be directed to a primary dashboard, e.g., manager's or a specific admin dashboard
                    navigate('/manager-dashboard'); // Or '/admin/dashboard' if you create one
                } else {
                    const userRole = userData.profile?.role;
                    if (userRole === 'manager') {
                        navigate('/manager-dashboard');
                    } else if (userRole === 'staff') {
                        navigate('/staff-tasks');
                    } else {
                        console.warn('Unknown user role:', userRole, 'Defaulting to login.');
                        enqueueSnackbar('Login successful, but role is undefined or not recognized. Please contact admin.', { variant: 'warning' });
                        // It might be better to log them out or send to a generic landing page if role is truly unknown
                        // For now, keeping them on login might be confusing. Let's try navigating to a base path if no role.
                        // However, if they are logged in, AuthContext will persist. This needs careful thought.
                        // Perhaps navigate('/login') is okay if they can't proceed further anyway.
                        navigate('/login'); 
                    }
                }
            } else {
                // This case should ideally be handled by an error thrown from login context function
                enqueueSnackbar('Login failed. User data not returned.', { variant: 'error' });
            }

            setLoading(false);
        } catch (err) {
            setLoading(false);
            const errorMessage = err.response?.data?.non_field_errors?.[0] || 
                                 err.response?.data?.detail || 
                                 err.message || // Use err.message if response is not available
                                 'Login failed. Please check your credentials or server status.';
            enqueueSnackbar(errorMessage, { variant: 'error' });
            console.error('Login error object:', err);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    // marginTop: 8, // Removed for better centering by parent
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    CleanTrack - Sign In
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    {/* We can add 'Remember Me' later */}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Sign In'}
                    </Button>
                    {/* 'Forgot Password?' link can be added later */}
                </Box>
            </Box>
        </Container>
    );
}

export default LoginPage;
