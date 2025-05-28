import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Paper, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import AddDailyCleaningRecordForm from './AddDailyCleaningRecordForm';
import { fetchDailyCleaningRecords } from '../../services/foodSafetyService';
import { useAuth } from '../../context/AuthContext'; // Import useAuth

const DailyCleaningRecordSection = () => {
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // For data fetching within this component
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const { currentUser, isLoading: authLoading } = useAuth(); // Get currentUser and auth loading state

    const loadRecords = useCallback(async (deptId) => {
        if (!deptId) {
            setError('Department information is not available. Cannot fetch cleaning records.');
            setIsLoading(false);
            setRecords([]);
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            // Pass departmentId to the service function
            const data = await fetchDailyCleaningRecords({ departmentId: deptId });
            setRecords(data);
        } catch (err) {
            console.error('Failed to fetch daily cleaning records:', err);
            setError(err.message || 'Failed to fetch daily cleaning records. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading) {
            setError('Authenticating user and loading department information...');
            setRecords([]);
            setIsLoading(false);
            return;
        }

        const departmentId = currentUser?.profile?.department_id;

        if (currentUser && departmentId) {
            loadRecords(departmentId);
        } else if (currentUser && !departmentId) {
            setError('No department assigned to the current user. Cannot display cleaning records.');
            setRecords([]);
            setIsLoading(false);
        } else if (!currentUser) {
            setError('User not authenticated. Please log in to view cleaning records.');
            setRecords([]);
            setIsLoading(false);
        }
    }, [currentUser, authLoading, loadRecords]);

    const handleFormSuccess = () => {
        setShowForm(false);
        const departmentId = currentUser?.profile?.department_id;
        if (departmentId) {
            loadRecords(departmentId); // Refresh the list after successful submission
        }
    };

    const departmentId = currentUser?.profile?.department_id;

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
            <Typography variant="h5" gutterBottom>Daily Cleaning Records</Typography>
            <Button 
                variant="contained" 
                onClick={() => setShowForm(!showForm)} 
                sx={{ mb: 2 }}
                disabled={!departmentId || isLoading || authLoading}
            >
                {showForm ? 'Cancel' : 'Add New Cleaning Record'}
            </Button>

            {showForm && departmentId && (
                <AddDailyCleaningRecordForm 
                    onSuccess={handleFormSuccess} 
                    departmentId={departmentId} // Pass departmentId to the form
                />
            )}
            {showForm && !departmentId && !authLoading && (
                <Alert severity="warning" sx={{mt:1}}>Cannot add a record: No department assigned to your profile.</Alert>
            )}

            {isLoading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
            {error && !isLoading && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            
            {!isLoading && !error && records.length === 0 && !showForm && (
                <Typography sx={{ mt: 2 }}>
                    {departmentId ? 'No daily cleaning records found for your department.' : 
                     (currentUser && !authLoading ? 'Department information is required to display records.' : 
                      (!currentUser && !authLoading ? 'Please log in to view records.' : ''))}
                </Typography>
            )}

            {!isLoading && !error && records.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>Submitted Records:</Typography>
                    <List>
                        {records.map((record, index) => (
                            <React.Fragment key={record.id}>
                                <ListItem alignItems="flex-start">
                                    <ListItemText
                                        primary={`${record.cleaning_item_name} - ${new Date(record.date_recorded).toLocaleDateString()}`}
                                        secondaryTypographyProps={{ component: 'div' }} 
                                        secondary={
                                            <>
                                                <Chip 
                                                    label={record.is_completed ? 'Completed' : 'Pending'}
                                                    color={record.is_completed ? 'success' : 'warning'}
                                                    size="small" 
                                                    sx={{ mr: 1 }}
                                                />
                                                <Typography component="span" variant="body2" color="text.primary">
                                                    {record.completed_by_username ? `by ${record.completed_by_username}` : ''}
                                                </Typography>
                                                {record.comment && (
                                                    <Typography component="div" variant="caption" color="text.secondary" sx={{mt: 0.5}}>
                                                        Comment: {record.comment}
                                                    </Typography>
                                                )}
                                            </>
                                        }
                                    />
                                </ListItem>
                                {index < records.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                </Box>
            )}
        </Paper>
    );
};

export default DailyCleaningRecordSection;
