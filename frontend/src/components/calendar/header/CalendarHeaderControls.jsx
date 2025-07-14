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
import { alpha } from '@mui/material/styles';
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
        justifyContent: { xs: 'center', md: 'space-between' },
        alignItems: 'center',
        width: '100%',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
        py: 1,
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      {/* Left side: Navigation and Date */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <ButtonGroup 
          variant="outlined" 
          aria-label="date navigation group"
          sx={{
            '& .MuiButton-root': {
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
              color: 'primary.main',
              px: { xs: 1.5, sm: 2 },
              py: 0.75,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              },
            },
          }}
        >
          <Button 
            onClick={() => onNavigate('prev')}
            sx={{ borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </Button>
          <Button onClick={() => onNavigate('today')}>
            <Typography variant="button" fontWeight="medium">Today</Typography>
          </Button>
          <Button 
            onClick={() => onNavigate('next')}
            sx={{ borderTopRightRadius: 20, borderBottomRightRadius: 20 }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </Button>
        </ButtonGroup>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 500,
            color: 'text.primary',
            minWidth: { xs: '100%', sm: 'auto' },
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          {formattedDate()}
        </Typography>
      </Box>

      {/* Right side: View Selectors and Filters */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          mt: { xs: 1, sm: 0 },
        }}
      >
        <Paper 
          elevation={1} 
          sx={{ 
            borderRadius: 20, 
            overflow: 'hidden',
            background: (theme) => alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(8px)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <ButtonGroup disableElevation size="small">
            {availableViews.map((view, idx) => (
              <Button
                key={view.name}
                onClick={() => onViewChange(view.name)}
                sx={{
                  textTransform: 'none',
                  px: { xs: 1.5, sm: 2 },
                  py: 0.75,
                  minWidth: { xs: 'auto', sm: '60px' },
                  bgcolor: currentView === view.name 
                    ? 'primary.main' 
                    : 'transparent',
                  color: currentView === view.name 
                    ? 'primary.contrastText' 
                    : 'text.secondary',
                  borderRight: idx !== availableViews.length - 1 
                    ? '1px solid rgba(0,0,0,0.08)' 
                    : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: currentView === view.name 
                      ? 'primary.dark' 
                      : (theme) => alpha(theme.palette.action.hover, 0.8),
                  },
                  fontWeight: currentView === view.name ? 500 : 400,
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
          sx={{ 
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(8px)',
            border: '1px solid', 
            borderColor: 'divider',
            borderRadius: 2,
            p: 1,
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
            },
            transition: 'all 0.2s ease',
          }}
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
