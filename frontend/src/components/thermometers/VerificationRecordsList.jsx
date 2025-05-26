import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, CircularProgress, Alert, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, TextField, InputAdornment
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { getVerificationRecords } from '../../services/thermometerService';

const VerificationRecordsList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    fetchVerificationRecords();
  }, []);

  useEffect(() => {
    // Apply filters when records, searchTerm, or dateFilter changes
    filterRecords();
  }, [records, searchTerm, dateFilter]);

  const fetchVerificationRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getVerificationRecords();
      setRecords(data);
      setFilteredRecords(data);
    } catch (err) {
      console.error("Failed to load verification records:", err);
      setError(err.message || 'Failed to load verification records. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        record.thermometer_serial.toLowerCase().includes(term) ||
        record.thermometer_model.toLowerCase().includes(term) ||
        record.calibrated_instrument_no.toLowerCase().includes(term) ||
        (record.calibrated_by_username && record.calibrated_by_username.toLowerCase().includes(term))
      );
    }
    
    // Apply date filter
    if (dateFilter) {
      const filterDate = format(dateFilter, 'yyyy-MM-dd');
      filtered = filtered.filter(record => record.date_verified === filterDate);
    }
    
    setFilteredRecords(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateFilterChange = (date) => {
    setDateFilter(date);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFilter(null);
    setFilteredRecords(records);
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
          
          <Button 
            variant="outlined" 
            onClick={handleClearFilters}
            disabled={!searchTerm && !dateFilter}
          >
            Clear Filters
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Showing {filteredRecords.length} of {records.length} verification records
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : filteredRecords.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No verification records found.
        </Alert>
      ) : (
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                <TableCell><strong>Date Verified</strong></TableCell>
                <TableCell><strong>Thermometer</strong></TableCell>
                <TableCell><strong>Calibrated Instrument No.</strong></TableCell>
                <TableCell><strong>Reading After Verification</strong></TableCell>
                <TableCell><strong>Calibrated By</strong></TableCell>
                <TableCell><strong>Corrective Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.date_verified}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {record.thermometer_serial}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Model: {record.thermometer_model}
                    </Typography>
                  </TableCell>
                  <TableCell>{record.calibrated_instrument_no}</TableCell>
                  <TableCell>{record.reading_after_verification}°C</TableCell>
                  <TableCell>{record.calibrated_by_username || 'N/A'}</TableCell>
                  <TableCell>
                    {record.corrective_action ? (
                      <Typography variant="body2">
                        {record.corrective_action}
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

export default VerificationRecordsList;
