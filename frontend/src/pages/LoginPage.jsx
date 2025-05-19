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
import { loginUser, getCurrentUser } from '../services/authService'; 

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); 
    const { enqueueSnackbar } = useSnackbar(); 

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const tokenData = await loginUser(username, password);
            localStorage.setItem('authToken', tokenData.token); 
            const userData = await getCurrentUser();
            enqueueSnackbar(`Login successful! Welcome ${userData.username}. Role: ${userData.profile.role}, Department: ${userData.profile.department_name}`, { variant: 'success' });
            console.log('User details:', userData);
            navigate('/dashboard'); 
            setLoading(false);
        } catch (err) {
            setLoading(false);
            const errorMessage = err.response?.data?.non_field_errors?.[0] || 
                               err.response?.data?.detail || 
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
