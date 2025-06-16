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
import Paper from '@mui/material/Paper';
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
    { name: 'timeGridDay', label: 'Day' },
  ],
}) {
  // Format the displayed date range based on the current view
  const formattedDate = () => {
    if (!currentDate) return '';
    if (currentView.includes('Day')) {
      // Day views – show full date
      return format(currentDate, 'EEEE, MMM d yyyy');
    }
    if (currentView.includes('Week')) {
      // Week views – show week range (start – end)
      const start = currentDate;
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const sameMonth = start.getMonth() === end.getMonth();
      return sameMonth
        ? `${format(start, 'MMM d')} – ${format(end, 'd yyyy')}`
        : `${format(start, 'MMM d')} – ${format(end, 'MMM d yyyy')}`;
    }
    // Default: Month view
    return format(currentDate, 'MMMM yyyy');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        pl: { xs: 7 }, // ensure left nav buttons are pushed away from sidebar
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
        <Paper elevation={1} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <ButtonGroup disableElevation size="small">
            {availableViews.map((view, idx) => (
              <Button
                key={view.name}
                onClick={() => onViewChange(view.name)}
                sx={{
                  textTransform: 'none',
                  px: 2,
                  bgcolor: currentView === view.name ? 'primary.main' : 'transparent',
                  color: currentView === view.name ? 'primary.contrastText' : 'text.secondary',
                  borderRight: idx !== availableViews.length - 1 ? '1px solid rgba(0,0,0,0.12)' : 'none',
                  '&:hover': {
                    bgcolor: currentView === view.name ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                {view.label}
              </Button>
            ))}
          </ButtonGroup>
        </Paper>

        <IconButton
          color="primary"
          aria-label="toggle filters"
          onClick={onToggleFilters}
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
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
