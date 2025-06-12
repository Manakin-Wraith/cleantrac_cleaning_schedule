import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CleaningFilters from './CleaningFilters';
import RecipeFilters from './RecipeFilters';

/**
 * A unified filtering component that provides a top-level event type selector
 * and dynamically displays the appropriate filters for the selected event type.
 */
const UnifiedFilters = ({
  // Event type filter
  selectedEventType,
  onEventTypeChange,

  // Common filters
  searchTerm,
  onSearchChange,
  selectedDepartments,
  onDepartmentChange,
  allDepartments,

  // Cleaning-specific filters
  cleaningStatuses,
  selectedCleaningStatuses,
  onCleaningStatusChange,

  // Recipe-specific filters
  recipeStatuses,
  selectedRecipeStatuses,
  onRecipeStatusChange,
}) => {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Card elevation={1} sx={{ mb: 2, transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>Filters</Typography>

        <Grid container spacing={isMdUp ? 2 : 1}>
          <Grid item xs={12} md={4}>
            {/* Event Type Selector */}
            <FormControl fullWidth size="small">
              <InputLabel>Event Type</InputLabel>
              <Select value={selectedEventType} onChange={(e) => onEventTypeChange(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="cleaning">Cleaning Tasks</MenuItem>
                <MenuItem value="recipe">Recipe Production</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Common Search Filter */}
            <TextField
              fullWidth
              label="Search by keyword"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              size="small"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Department Filter */}
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Department</InputLabel>
              <Select
                multiple
                value={selectedDepartments}
                onChange={(e) => onDepartmentChange(e.target.value)}
                renderValue={(selected) => (
                  <Stack gap={1} direction="row" flexWrap="wrap">
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Stack>
                )}
              >
                {allDepartments.map((department) => (
                  <MenuItem key={department} value={department}>
                    {department}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Type-Specific Filters */}
        {selectedEventType === 'cleaning' && (
          <CleaningFilters
            statuses={cleaningStatuses}
            departments={allDepartments}
            selectedStatuses={selectedCleaningStatuses}
            onStatusChange={onCleaningStatusChange}
            searchTerm={searchTerm} // Pass down for consistency, though handled above
            onSearchChange={onSearchChange}
            selectedDepartments={selectedDepartments}
            onDepartmentChange={onDepartmentChange}
          />
        )}

        {selectedEventType === 'recipe' && (
          <RecipeFilters
            statuses={recipeStatuses}
            departments={allDepartments}
            selectedStatuses={selectedRecipeStatuses}
            onStatusChange={onRecipeStatusChange}
            searchTerm={searchTerm} // Pass down for consistency
            onSearchChange={onSearchChange}
            selectedDepartments={selectedDepartments}
            onDepartmentChange={onDepartmentChange}
          />
        )}

        {/* When 'all' is selected, we might want a simplified filter set */}
        {selectedEventType === 'all' && (
          <Box>
            {/* Department filter for 'all' view */}
            <FormControl fullWidth margin="normal">
              <InputLabel>Filter by Department</InputLabel>
              <Select
                multiple
                value={selectedDepartments}
                onChange={(e) => onDepartmentChange(e.target.value)}
                renderValue={(selected) => (
                  <Stack gap={1} direction="row" flexWrap="wrap">
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Stack>
                )}
              >
                {allDepartments.map((department) => (
                  <MenuItem key={department} value={department}>
                    {department}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

UnifiedFilters.propTypes = {
  selectedEventType: PropTypes.oneOf(['all', 'cleaning', 'recipe']).isRequired,
  onEventTypeChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func,
  selectedDepartments: PropTypes.array,
  onDepartmentChange: PropTypes.func,
  allDepartments: PropTypes.array,
  cleaningStatuses: PropTypes.array,
  selectedCleaningStatuses: PropTypes.array,
  onCleaningStatusChange: PropTypes.func,
  recipeStatuses: PropTypes.array,
  selectedRecipeStatuses: PropTypes.array,
  onRecipeStatusChange: PropTypes.func,
};

export default UnifiedFilters;
