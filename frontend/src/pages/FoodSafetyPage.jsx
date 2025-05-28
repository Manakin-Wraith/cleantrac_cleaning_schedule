import React, { useState } from 'react';
import { Typography, Container, Paper, Box, Tabs, Tab } from '@mui/material'; 
import WeeklyTemperatureReviewSection from '../components/FoodSafety/WeeklyTemperatureReviewSection';
import DailyCleaningRecordSection from '../components/FoodSafety/DailyCleaningRecordSection';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`food-safety-tabpanel-${index}`}
      aria-labelledby={`food-safety-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}> 
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `food-safety-tab-${index}`,
    'aria-controls': `food-safety-tabpanel-${index}`,
  };
}

const FoodSafetyPage = () => {
  const [activeTab, setActiveTab] = useState(0); 

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 1 }}> 
          Food Safety Files & Forms
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="food safety form categories">
            <Tab label="Overview" {...a11yProps(0)} />
            <Tab label="Temperature Reviews" {...a11yProps(1)} />
            <Tab label="Cleaning Records" {...a11yProps(2)} />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Typography variant="body1">
            This section provides access to digitized food safety forms and submitted records. 
            Please select a form category from the tabs above to fill out or view past submissions.
          </Typography>
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <WeeklyTemperatureReviewSection />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <DailyCleaningRecordSection />
        </TabPanel>
        
      </Paper>
    </Container>
  );
};

export default FoodSafetyPage;
