import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import AddWeeklyTemperatureReviewForm from './AddWeeklyTemperatureReviewForm';
import { fetchWeeklyTemperatureReviews } from '../../services/foodSafetyService';
import { useAuth } from '../../context/AuthContext'; // Import useAuth

const WeeklyTemperatureReviewSection = () => {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // For data fetching within this component
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const { currentUser, isLoading: authLoading } = useAuth(); // Get currentUser and auth loading state

    const loadReviews = useCallback(async (deptId) => {
        if (!deptId) {
            setError('Department information is not available. Cannot fetch reviews.');
            setIsLoading(false);
            setReviews([]);
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const data = await fetchWeeklyTemperatureReviews(deptId);
            setReviews(data);
        } catch (err) {
            console.error('Failed to fetch weekly temperature reviews:', err);
            setError(err.message || 'Failed to fetch weekly temperature reviews. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []); 

    useEffect(() => {
        if (authLoading) {
            // If auth is loading, display a message and wait for currentUser to be resolved
            setError('Authenticating user and loading department information...');
            setReviews([]);
            setIsLoading(false); // Ensure local loading is false if auth is primary blocker
            return;
        }

        const departmentId = currentUser?.profile?.department_id;
        
        if (currentUser && departmentId) {
            loadReviews(departmentId);
        } else if (currentUser && !departmentId) {
            setError('No department assigned to the current user. Cannot display temperature reviews.');
            setReviews([]);
            setIsLoading(false); 
        } else if (!currentUser) {
            // This case might occur if auth fails or user logs out
            setError('User not authenticated. Please log in to view temperature reviews.');
            setReviews([]);
            setIsLoading(false);
        }
    }, [currentUser, authLoading, loadReviews]);

    const handleFormSuccess = () => {
        setShowForm(false);
        const departmentId = currentUser?.profile?.department_id;
        if (departmentId) {
            loadReviews(departmentId); // Refresh the list
        }
    };

    const departmentId = currentUser?.profile?.department_id;

    // Display a general loading spinner if auth is still in progress and no specific error yet
    if (authLoading && error === 'Authenticating user and loading department information...') {
        return (
            <Paper elevation={3} sx={{ p: 3, mt: 2, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 1 }}>Loading user and department data...</Typography>
            </Paper>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h5" gutterBottom>Weekly Temperature Reviews</Typography>
            <Button 
                variant="contained" 
                onClick={() => setShowForm(!showForm)} 
                sx={{ mb: 2 }}
                disabled={!departmentId || isLoading || authLoading} // Disable if no departmentId, local loading, or auth loading
            >
                {showForm ? 'Cancel' : 'Add New Temperature Review'}
            </Button>

            {showForm && departmentId && (
                <AddWeeklyTemperatureReviewForm 
                    onSuccess={handleFormSuccess} 
                    departmentId={departmentId} // Pass departmentId to the form
                />
            )}
            {showForm && !departmentId && !authLoading && ( // Only show if not auth loading
                <Alert severity="warning" sx={{mt:1}}>Cannot add a review: No department assigned to your profile.</Alert>
            )}

            {isLoading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
            {error && !isLoading && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            
            {!isLoading && !error && reviews.length === 0 && !showForm && (
                <Typography sx={{ mt: 2 }}>
                    {departmentId ? 'No weekly temperature reviews found for your department.' : 
                     (currentUser && !authLoading ? 'Department information is required to display reviews.' : 
                      (!currentUser && !authLoading ? 'Please log in to view reviews.' : ''))}
                </Typography>
            )}

            {!isLoading && !error && reviews.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>Submitted Reviews:</Typography>
                    <List>
                        {reviews.map((review, index) => (
                            <React.Fragment key={review.id}>
                                <ListItem alignItems="flex-start">
                                    <ListItemText
                                        primary={`Week of: ${new Date(review.week_start_date).toLocaleDateString()} - Status: ${review.overall_status}`}
                                        secondaryTypographyProps={{ component: 'div' }} 
                                        secondary={
                                            <>
                                                <Typography component="span" variant="body2" color="text.primary">
                                                    Reviewed by: {review.reviewed_by_username || 'N/A'} on {new Date(review.submission_date).toLocaleString()}
                                                </Typography>
                                                <br />
                                                Comments: {review.comments || 'No comments.'}
                                            </>
                                        }
                                    />
                                </ListItem>
                                {index < reviews.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                </Box>
            )}
        </Paper>
    );
};

export default WeeklyTemperatureReviewSection;
