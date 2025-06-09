import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Container,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import RecipeList from '../components/recipes/RecipeList';
import InventoryList from '../components/recipes/InventoryList';
import WasteRecordList from '../components/recipes/WasteRecordList';
import { useTheme } from '@mui/material/styles';

const RecipeManagementPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const theme = useTheme();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Department-specific styling
  const getDepartmentColor = () => {
    if (!currentUser?.profile?.department?.name) return theme.palette.primary.main;
    
    const deptName = currentUser.profile.department.name.toLowerCase();
    if (deptName.includes('bakery')) return '#F9A825'; // Yellow for Bakery
    if (deptName.includes('butchery')) return '#D32F2F'; // Red for Butchery
    if (deptName.includes('hmr') || deptName.includes('home meal')) return '#757575'; // Grey for HMR
    return theme.palette.primary.main;
  };

  const departmentColor = getDepartmentColor();

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: departmentColor, fontWeight: 'bold' }}>
          Recipe Management
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Manage recipes, production schedules, inventory, and waste records for your department.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontWeight: 'medium',
              fontSize: '0.95rem',
            },
            '& .Mui-selected': {
              color: departmentColor,
            },
            '& .MuiTabs-indicator': {
              backgroundColor: departmentColor,
            }
          }}
        >
          <Tab label="Recipes" id="tab-0" />
          <Tab label="Inventory" id="tab-1" />
          <Tab label="Waste Records" id="tab-2" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {tabValue === 0 && <RecipeList departmentColor={departmentColor} />}
              {tabValue === 1 && <InventoryList departmentColor={departmentColor} />}
              {tabValue === 2 && <WasteRecordList departmentColor={departmentColor} />}
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default RecipeManagementPage;
