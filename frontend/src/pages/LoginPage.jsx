import React, { useState } from 'react';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Alert
} from '@mui/material';
import { loginUser, getCurrentUser } from '../services/authService'; 

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // const [user, setUser] = useState(null); // To store user data after login

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const tokenData = await loginUser(username, password);
            // localStorage.setItem('authToken', tokenData.token); // Handled by authService
            const userData = await getCurrentUser();
            // setUser(userData); // Store user data (e.g., in context or Redux for app-wide access)
            console.log('Login successful! User details:', userData);
            alert(`Login successful! Welcome ${userData.username}. Role: ${userData.profile.role}, Department: ${userData.profile.department_name}`);
            // TODO: Redirect to dashboard or appropriate page based on role/department
            // For example: history.push('/dashboard'); or navigate('/dashboard'); (using React Router)
            setLoading(false);
        } catch (err) {
            setLoading(false);
            const errorMessage = err.response?.data?.non_field_errors?.[0] || 
                               err.response?.data?.detail || 
                               'Login failed. Please check your credentials or server status.';
            setError(errorMessage);
            console.error('Login error object:', err);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
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
                    {error && (
                        <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                            {error}
                        </Alert>
                    )}
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
