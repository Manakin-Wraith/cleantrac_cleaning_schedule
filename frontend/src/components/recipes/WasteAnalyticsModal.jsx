import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const WasteAnalyticsModal = ({ open, onClose, departmentColor }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wasteData, setWasteData] = useState({
    byReason: [],
    bySource: [],
    byDate: [],
    topItems: []
  });
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const { currentUser } = useAuth();

  // COLORS for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

  useEffect(() => {
    if (open) {
      // Set default date range based on period
      setDefaultDateRange(period);
      fetchWasteAnalytics();
    }
  }, [open, period, startDate, endDate]);

  const setDefaultDateRange = (selectedPeriod) => {
    const today = new Date();
    let start = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(today.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      default:
        start.setMonth(today.getMonth() - 1);
    }
    
    setStartDate(start);
    setEndDate(today);
  };

  const fetchWasteAnalytics = async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    try {
      const params = {
        department_id: currentUser?.profile?.department?.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      };
      
      const response = await api.get('/api/waste-analytics/', { params });
      setWasteData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching waste analytics:', err);
      setError('Failed to load waste analytics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
    setDefaultDateRange(event.target.value);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatCurrency = (value) => {
    return `R ${parseFloat(value).toFixed(2)}`;
  };

  // Calculate total waste value
  const calculateTotalWasteValue = () => {
    if (!wasteData.byReason || wasteData.byReason.length === 0) return 0;
    
    return wasteData.byReason.reduce((total, item) => {
      return total + (parseFloat(item.value) || 0);
    }, 0);
  };

  // Calculate total waste quantity
  const calculateTotalWasteQuantity = () => {
    if (!wasteData.bySource || wasteData.bySource.length === 0) return 0;
    
    return wasteData.bySource.reduce((total, item) => {
      return total + (parseFloat(item.quantity) || 0);
    }, 0);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1, boxShadow: 2 }}>
          <Typography variant="subtitle2">{label}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Value') ? formatCurrency(entry.value) : entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  // Format date for x-axis
  const formatXAxis = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderTop: `4px solid ${departmentColor}`,
          borderRadius: '4px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Waste Analytics Dashboard
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="period-label">Time Period</InputLabel>
                <Select
                  labelId="period-label"
                  value={period}
                  label="Time Period"
                  onChange={handlePeriodChange}
                >
                  <MenuItem value="week">Last 7 Days</MenuItem>
                  <MenuItem value="month">Last 30 Days</MenuItem>
                  <MenuItem value="quarter">Last 3 Months</MenuItem>
                  <MenuItem value="year">Last 12 Months</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {period === 'custom' && (
              <>
                <Grid item xs={12} sm={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={handleStartDateChange}
                      slotProps={{
                        textField: { 
                          fullWidth: true, 
                          size: "small" 
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={handleEndDateChange}
                      slotProps={{
                        textField: { 
                          fullWidth: true, 
                          size: "small" 
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
        
        {/* Summary Cards */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Waste Value
                </Typography>
                <Typography variant="h5" color="error.main">
                  {loading ? <CircularProgress size={20} /> : formatCurrency(calculateTotalWasteValue())}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Waste Quantity
                </Typography>
                <Typography variant="h5">
                  {loading ? <CircularProgress size={20} /> : calculateTotalWasteQuantity().toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Top Waste Reason
                </Typography>
                <Typography variant="h5">
                  {loading ? <CircularProgress size={20} /> : 
                    wasteData.byReason && wasteData.byReason.length > 0 ? 
                    wasteData.byReason[0].name : 'N/A'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Most Wasted Item
                </Typography>
                <Typography variant="h5">
                  {loading ? <CircularProgress size={20} /> : 
                    wasteData.topItems && wasteData.topItems.length > 0 ? 
                    wasteData.topItems[0].name : 'N/A'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
              },
              '& .Mui-selected': {
                color: departmentColor,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: departmentColor,
              },
            }}
          >
            <Tab icon={<BarChartIcon />} label="By Reason" />
            <Tab icon={<PieChartIcon />} label="By Source" />
            <Tab icon={<TimelineIcon />} label="Trend Over Time" />
            <Tab icon={<TrendingUpIcon />} label="Top Wasted Items" />
          </Tabs>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {/* Tab 1: Waste by Reason */}
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Waste by Reason
                </Typography>
                <Box sx={{ height: 400 }}>
                  {wasteData.byReason && wasteData.byReason.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={wasteData.byReason}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end"
                          height={70} 
                        />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="value" name="Value (R)" fill={departmentColor} />
                        <Bar yAxisId="right" dataKey="count" name="Count" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography variant="body1">No data available for the selected period</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
            
            {/* Tab 2: Waste by Source */}
            {tabValue === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Waste by Source Type
                </Typography>
                <Box sx={{ height: 400 }}>
                  {wasteData.bySource && wasteData.bySource.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={wasteData.bySource}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {wasteData.bySource.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography variant="body1">No data available for the selected period</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
            
            {/* Tab 3: Trend Over Time */}
            {tabValue === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Waste Trend Over Time
                </Typography>
                <Box sx={{ height: 400 }}>
                  {wasteData.byDate && wasteData.byDate.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={wasteData.byDate}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatXAxis} 
                        />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="value" 
                          name="Value (R)" 
                          stroke={departmentColor} 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="count" 
                          name="Count" 
                          stroke="#82ca9d" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography variant="body1">No data available for the selected period</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
            
            {/* Tab 4: Top Wasted Items */}
            {tabValue === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Top Wasted Items
                </Typography>
                <Box sx={{ height: 400 }}>
                  {wasteData.topItems && wasteData.topItems.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={wasteData.topItems}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 150, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={140}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="value" name="Value (R)" fill={departmentColor} />
                        <Bar dataKey="quantity" name="Quantity" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography variant="body1">No data available for the selected period</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WasteAnalyticsModal;
