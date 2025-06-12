import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

/**
 * A collapsible display area for various filter controls related to the calendar.
 */
export default function CollapsibleFiltersDisplay({
  isOpen,
  filterConfig,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  children,
}) {
  return (
    <Collapse in={isOpen} timeout="auto" unmountOnExit>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Filters</Typography>
          {/* Placeholder for Apply/Clear buttons if needed at top level */}
        </Box>
        {/* 
          The actual filter controls will be passed as children 
          or generated based on filterConfig.
          For now, we'll render children if provided, else a placeholder.
        */}
        {children ? (
          children
        ) : (
          <Typography variant="body2" color="text.secondary">
            Filter controls will be displayed here based on configuration.
            Example: Department, Status, Search, etc.
          </Typography>
        )}
        {/* 
          Alternatively, map over filterConfig to render specific filter components:
          {filterConfig && filterConfig.map(filter => (
            <div key={filter.id}>Render filter based on filter.type</div>
          ))}
        */}
      </Paper>
    </Collapse>
  );
}

CollapsibleFiltersDisplay.propTypes = {
  /**
   * Controls the visibility of the filters display.
   */
  isOpen: PropTypes.bool.isRequired,
  /**
   * Configuration for different filters (e.g., type, options, current values).
   * This prop can be used to dynamically render filter components.
   */
  filterConfig: PropTypes.array,
  /**
   * Callback function when a filter value changes.
   */
  onFilterChange: PropTypes.func,
  /**
   * Callback function to apply all selected filters.
   */
  onApplyFilters: PropTypes.func,
  /**
   * Callback function to clear/reset filters.
   */
  onClearFilters: PropTypes.func,
  /**
   * Allows passing custom filter components directly as children.
   */
  children: PropTypes.node,
};
