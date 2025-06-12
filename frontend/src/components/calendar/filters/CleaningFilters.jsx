import React from 'react';
import PropTypes from 'prop-types';
import { Box, TextField, Chip, Stack, Typography, FormControl, InputLabel, Select, OutlinedInput, MenuItem, Checkbox, ListItemText } from '@mui/material';

const CleaningFilters = ({ statuses, selectedStatuses, onStatusChange, searchTerm, onSearchChange, departments, selectedDepartments, onDepartmentChange }) => {
  const handleStatusClick = (status) => {
    const newSelection = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    onStatusChange(newSelection);
  };

  return (
    <Box sx={{ p: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
      <TextField
        label="Search Tasks"
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ flexGrow: 1, maxWidth: '400px' }}
      />
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
          Filter by Status
        </Typography>
        <Stack direction="row" spacing={1}>
          {statuses.map((status) => (
            <Chip
              key={status}
              label={status}
              clickable
              onClick={() => handleStatusClick(status)}
              color={selectedStatuses.includes(status) ? 'primary' : 'default'}
              variant={selectedStatuses.includes(status) ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      </Box>
      <FormControl sx={{ minWidth: 200, maxWidth: 300 }} size="small">
        <InputLabel id="department-filter-label">Department</InputLabel>
        <Select
          labelId="department-filter-label"
          multiple
          value={selectedDepartments}
          onChange={(e) => onDepartmentChange(e.target.value)}
          input={<OutlinedInput label="Department" />}
          renderValue={(selected) => selected.join(', ')}
        >
          {departments.map((dept) => (
            <MenuItem key={dept} value={dept}>
              <Checkbox checked={selectedDepartments.includes(dept)} />
              <ListItemText primary={dept} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

CleaningFilters.propTypes = {
  statuses: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedStatuses: PropTypes.arrayOf(PropTypes.string).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  departments: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedDepartments: PropTypes.arrayOf(PropTypes.string).isRequired,
  onDepartmentChange: PropTypes.func.isRequired,
};

export default CleaningFilters;
