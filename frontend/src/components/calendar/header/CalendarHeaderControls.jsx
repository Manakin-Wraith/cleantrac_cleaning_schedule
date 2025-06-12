import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FilterListIcon from '@mui/icons-material/FilterList';
import { format } from 'date-fns'; // A robust library for date formatting

/**
 * Renders the primary controls for the calendar header, including date navigation,
 * view selection, and a toggle for the filters bar.
 */
export default function CalendarHeaderControls({
  currentDate,
  currentView,
  onNavigate,
  onViewChange,
  onToggleFilters,
  availableViews = [
    { name: 'dayGridMonth', label: 'Month' },
    { name: 'timeGridWeek', label: 'Week' },
    { name: 'resourceTimeGridDay', label: 'Day' },
  ],
}) {
  // Format the displayed date range based on the current view
  const formattedDate = () => {
    if (!currentDate) return '';
    // This can be expanded with more sophisticated logic for week/day ranges
    return format(currentDate, 'MMMM yyyy');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}
    >
      {/* Left side: Navigation and Date */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ButtonGroup variant="outlined" aria-label="date navigation group">
          <Button onClick={() => onNavigate('prev')}>
            <ArrowBackIosNewIcon fontSize="small" />
          </Button>
          <Button onClick={() => onNavigate('today')}>Today</Button>
          <Button onClick={() => onNavigate('next')}>
            <ArrowForwardIosIcon fontSize="small" />
          </Button>
        </ButtonGroup>
        <Typography variant="h6" component="div" sx={{ ml: 2 }}>
          {formattedDate()}
        </Typography>
      </Box>

      {/* Right side: View Selectors and Filters */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ButtonGroup variant="contained" aria-label="view selection group">
          {availableViews.map((view) => (
            <Button
              key={view.name}
              onClick={() => onViewChange(view.name)}
              variant={currentView === view.name ? 'contained' : 'outlined'}
            >
              {view.label}
            </Button>
          ))}
        </ButtonGroup>

        <IconButton
          color="inherit"
          aria-label="toggle filters"
          onClick={onToggleFilters}
        >
          <FilterListIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

CalendarHeaderControls.propTypes = {
  /**
   * The current date the calendar is focused on.
   */
  currentDate: PropTypes.instanceOf(Date).isRequired,
  /**
   * The name of the current active view (e.g., 'dayGridMonth').
   */
  currentView: PropTypes.string.isRequired,
  /**
   * Callback function for date navigation. Called with 'prev', 'next', or 'today'.
   */
  onNavigate: PropTypes.func.isRequired,
  /**
   * Callback function for changing the calendar view. Called with the new view name.
   */
  onViewChange: PropTypes.func.isRequired,
  /**
   * Callback function to toggle the visibility of the filters bar.
   */
  onToggleFilters: PropTypes.func.isRequired,
  /**
   * An array of available view objects, each with a 'name' and 'label'.
   */
  availableViews: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
};
