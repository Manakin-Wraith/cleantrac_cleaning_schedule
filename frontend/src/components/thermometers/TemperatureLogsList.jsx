import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, CircularProgress, Alert, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { getTemperatureLogs, getAreaUnits } from '../../services/thermometerService';

const TemperatureLogsList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [areaUnits, setAreaUnits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(null);
  const [areaFilter, setAreaFilter] = useState('');
  const [timePeriodFilter, setTimePeriodFilter] = useState('');
  const theme = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Apply filters when logs or filter values change
    filterLogs();
  }, [logs, searchTerm, dateFilter, areaFilter, timePeriodFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch temperature logs and area units in parallel
      const [logsData, areasData] = await Promise.all([
        getTemperatureLogs(),
        getAreaUnits()
      ]);
      
      setLogs(logsData);
      setFilteredLogs(logsData);
      setAreaUnits(areasData);
    } catch (err) {
      console.error("Failed to load temperature logs data:", err);
      setError(err.message || 'Failed to load temperature logs data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.area_unit_name.toLowerCase().includes(term) ||
        log.thermometer_serial.toLowerCase().includes(term) ||
        (log.logged_by_username && log.logged_by_username.toLowerCase().includes(term))
      );
    }
    
    // Apply date filter
    if (dateFilter) {
      const filterDate = format(dateFilter, 'yyyy-MM-dd');
      filtered = filtered.filter(log => {
        const logDate = log.log_datetime.split('T')[0];
        return logDate === filterDate;
      });
    }
    
    // Apply area filter
    if (areaFilter) {
      filtered = filtered.filter(log => log.area_unit_id === parseInt(areaFilter));
    }
    
    // Apply time period filter
    if (timePeriodFilter) {
      filtered = filtered.filter(log => log.time_period === timePeriodFilter);
    }
    
    setFilteredLogs(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateFilterChange = (date) => {
    setDateFilter(date);
  };

  const handleAreaFilterChange = (e) => {
    setAreaFilter(e.target.value);
  };

  const handleTimePeriodFilterChange = (e) => {
    setTimePeriodFilter(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFilter(null);
    setAreaFilter('');
    setTimePeriodFilter('');
    setFilteredLogs(logs);
  };

  const getTemperatureStatusChip = (log) => {
    if (log.is_within_target_range === true) {
      return (
        <Chip 
          label="Within Range"
          color="success"
          icon={<CheckCircleIcon />}
          size="small"
        />
      );
    } else if (log.is_within_target_range === false) {
      return (
        <Chip 
          label="Out of Range"
          color="error"
          icon={<WarningIcon />}
          size="small"
        />
      );
    }
    
    return null;
  };

  const formatDateTime = (datetimeString) => {
    try {
      const date = new Date(datetimeString);
      return date.toLocaleString();
    } catch (e) {
      return datetimeString;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, maxWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Filter by Date"
              value={dateFilter}
              onChange={handleDateFilterChange}
              slotProps={{ textField: { size: 'small' } }}
            />
          </LocalizationProvider>
          
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id="area-filter-label">Filter by Area</InputLabel>
            <Select
              labelId="area-filter-label"
              value={areaFilter}
              onChange={handleAreaFilterChange}
              label="Filter by Area"
            >
              <MenuItem value="">
                <em>All Areas</em>
              </MenuItem>
              {areaUnits.map(area => (
                <MenuItem key={area.id} value={area.id}>
                  {area.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel id="time-period-filter-label">Time Period</InputLabel>
            <Select
              labelId="time-period-filter-label"
              value={timePeriodFilter}
              onChange={handleTimePeriodFilterChange}
              label="Time Period"
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value="AM">Morning (AM)</MenuItem>
              <MenuItem value="PM">Afternoon (PM)</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            variant="outlined" 
            onClick={handleClearFilters}
            disabled={!searchTerm && !dateFilter && !areaFilter && !timePeriodFilter}
          >
            Clear Filters
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Showing {filteredLogs.length} of {logs.length} temperature logs
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : filteredLogs.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No temperature logs found.
        </Alert>
      ) : (
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                <TableCell><strong>Date & Time</strong></TableCell>
                <TableCell><strong>Area</strong></TableCell>
                <TableCell><strong>Temperature</strong></TableCell>
                <TableCell><strong>Time Period</strong></TableCell>
                <TableCell><strong>Thermometer</strong></TableCell>
                <TableCell><strong>Logged By</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Corrective Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDateTime(log.log_datetime)}</TableCell>
                  <TableCell>{log.area_unit_name}</TableCell>
                  <TableCell>{log.temperature_reading}°C</TableCell>
                  <TableCell>{log.time_period}</TableCell>
                  <TableCell>{log.thermometer_serial}</TableCell>
                  <TableCell>{log.logged_by_username || 'N/A'}</TableCell>
                  <TableCell>{getTemperatureStatusChip(log)}</TableCell>
                  <TableCell>
                    {log.corrective_action ? (
                      <Typography variant="body2">
                        {log.corrective_action}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        None
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default TemperatureLogsList;
