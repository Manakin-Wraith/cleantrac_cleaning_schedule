import React, { useState } from 'react';
import './login-styles.css';
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutline';
import { useNavigate } from 'react-router-dom'; 
import { useSnackbar } from 'notistack'; 
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Link, // Added for Forgot Password
    Grid, // Added for layout
    Alert, // Added for messages
    InputAdornment, // Added for password reveal
    IconButton, // Added for password reveal
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material'; // Added for password reveal
// import { loginUser, getCurrentUser } from '../services/authService'; // No longer directly used
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { requestPasswordReset, confirmPasswordReset } from '../services/authService'; // Added

function LoginPage() {
    // Login State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // Added for login password reveal
    
    // Password Reset State
    const [resetStep, setResetStep] = useState('login'); // 'login', 'request', 'confirm'
    const [resetUsername, setResetUsername] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState({ type: '', text: '' }); // { type: 'success'/'error', text: '...'}
    const [showNewPassword, setShowNewPassword] = useState(false); // Added for new password reveal
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false); // Added for confirm new password reveal

    const navigate = useNavigate(); 
    const { enqueueSnackbar } = useSnackbar(); 
    const { login } = useAuth(); // Get login function from AuthContext

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleClickShowNewPassword = () => setShowNewPassword((show) => !show);
    const handleMouseDownNewPassword = (event) => {
        event.preventDefault();
    };

    const handleClickShowConfirmNewPassword = () => setShowConfirmNewPassword((show) => !show);
    const handleMouseDownConfirmNewPassword = (event) => {
        event.preventDefault();
    };

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

    const handleRequestResetSubmit = async (event) => {
        event.preventDefault();
        setResetLoading(true);
        setResetMessage({ type: '', text: '' });
        try {
            const response = await requestPasswordReset(resetUsername);
            setResetMessage({ type: 'success', text: response.message || "If an account with that username exists and has a phone number, an SMS with a reset code has been sent." });
            setResetStep('confirm'); // Move to confirm step
        } catch (error) {
            const errorMsg = error.error || error.detail || error.message || "Failed to request password reset. Please try again.";
            setResetMessage({ type: 'error', text: errorMsg });
            // Optionally, if error indicates user not found or no phone, you might not want to show it directly
            // For now, we show what the backend/service sends or a generic message.
        }
        setResetLoading(false);
    };

    const handleConfirmResetSubmit = async (event) => {
        event.preventDefault();
        if (newPassword !== confirmNewPassword) {
            setResetMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }
        setResetLoading(true);
        setResetMessage({ type: '', text: '' });
        try {
            const response = await confirmPasswordReset(resetUsername, resetToken, newPassword);
            setResetMessage({ type: 'success', text: response.message || "Password has been reset successfully. You can now log in with your new password." });
            // Clear form and navigate back to login or directly attempt login?
            // For now, clear form and show login screen.
            setResetStep('login');
            setUsername(resetUsername); // Pre-fill username for login
            setResetUsername('');
            setResetToken('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error) {
            const errorMsg = error.error || error.detail || error.new_password || error.message || "Failed to reset password. Please check your token and try again.";
            setResetMessage({ type: 'error', text: Array.isArray(errorMsg) ? errorMsg.join(' ') : errorMsg });
        }
        setResetLoading(false);
    };

    const renderLoginForm = () => (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <PieChartOutlineIcon sx={{ fontSize: 40, color: 'var(--primary-color)', mb: 1 }} />
                <Typography component="h1" variant="h5" className="login-title">
                    CLEENTRAC
                </Typography>
            </Box>
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
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleClickShowPassword}
                                    onMouseDown={handleMouseDownPassword}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 1 }} // Reduced mb
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'Sign In'}
                </Button>
                <Grid container justifyContent="flex-end">
                    <Grid item>
                        <Link href="#" variant="body2" onClick={() => { setResetStep('request'); setResetMessage({type:'', text:''}); setResetUsername(username); }}>
                            Forgot password?
                        </Link>
                    </Grid>
                </Grid>
            </Box>
        </>
    );

    const renderRequestResetForm = () => (
        <>
            <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                Forgot Password
            </Typography>
            {resetMessage.text && (
                <Alert severity={resetMessage.type} sx={{ mb: 2, width: '100%' }}>
                    {resetMessage.text}
                </Alert>
            )}
            <Box component="form" onSubmit={handleRequestResetSubmit} noValidate sx={{ mt: 1 }}>
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="reset-username"
                    label="Username"
                    name="reset-username"
                    autoComplete="username"
                    autoFocus
                    value={resetUsername} // Use resetUsername state
                    onChange={(e) => setResetUsername(e.target.value)}
                    disabled={resetLoading}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 1 }}
                    disabled={resetLoading}
                >
                    {resetLoading ? <CircularProgress size={24} /> : 'Send Reset Code'}
                </Button>
                <Grid container justifyContent="flex-end">
                    <Grid item>
                        <Link href="#" variant="body2" onClick={() => { setResetStep('login'); setResetMessage({type:'', text:''}); }}>
                            Back to Sign In
                        </Link>
                    </Grid>
                </Grid>
            </Box>
        </>
    );

    const renderConfirmResetForm = () => (
        <>
            <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                Reset Your Password
            </Typography>
            {resetMessage.text && (
                <Alert severity={resetMessage.type} sx={{ mb: 2, width: '100%' }}>
                    {resetMessage.text}
                </Alert>
            )}
            <Box component="form" onSubmit={handleConfirmResetSubmit} noValidate sx={{ mt: 1 }}>
                <TextField // Username field (read-only or pre-filled for context)
                    margin="normal"
                    fullWidth
                    id="confirm-username"
                    label="Username"
                    name="confirm-username"
                    value={resetUsername} // Display the username for which token was requested
                    disabled // Typically disabled
                    sx={{ mb: 1 }}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="reset-token"
                    label="Reset Code (from SMS)"
                    name="reset-token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    disabled={resetLoading}
                    sx={{ mb: 1 }}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="newPassword"
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={resetLoading}
                    error={newPassword !== confirmNewPassword && confirmNewPassword !== ''}
                    helperText={newPassword !== confirmNewPassword && confirmNewPassword !== '' ? "Passwords do not match" : ""}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle new password visibility"
                                    onClick={handleClickShowNewPassword}
                                    onMouseDown={handleMouseDownNewPassword}
                                    edge="end"
                                >
                                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmNewPassword"
                    label="Confirm New Password"
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    id="confirmNewPassword"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    disabled={resetLoading}
                    error={newPassword !== confirmNewPassword && confirmNewPassword !== ''}
                    helperText={newPassword !== confirmNewPassword && confirmNewPassword !== '' ? "Passwords do not match" : ""}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle confirm new password visibility"
                                    onClick={handleClickShowConfirmNewPassword}
                                    onMouseDown={handleMouseDownConfirmNewPassword}
                                    edge="end"
                                >
                                    {showConfirmNewPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2, mb: 1 }}
                    disabled={resetLoading}
                >
                    {resetLoading ? <CircularProgress size={24} /> : 'Reset Password'}
                </Button>
                <Grid container justifyContent="flex-end">
                    <Grid item>
                        <Link href="#" variant="body2" onClick={() => { setResetStep('login'); setResetMessage({type:'', text:''}); }}>
                            Back to Sign In
                        </Link>
                    </Grid>
                </Grid>
            </Box>
        </>
    );

    return (
        <div className="login-page-container">
            <div className="login-form-wrapper">
                <div className="login-form-container">
                    {resetStep === 'login' && renderLoginForm()}
                    {resetStep === 'request' && renderRequestResetForm()}
                    {resetStep === 'confirm' && renderConfirmResetForm()}
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
