import React from 'react';
import { Container, Typography, Box } from '@mui/material';

function DashboardPage() {
    return (
        <Container component="main" maxWidth="md">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    Welcome to your Dashboard!
                </Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                    This is a placeholder page. More features to come!
                </Typography>
            </Box>
        </Container>
    );
}

export default DashboardPage;
