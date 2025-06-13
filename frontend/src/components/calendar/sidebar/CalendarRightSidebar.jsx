import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

/**
 * A container component for the right-hand sidebar.
 * It structures and displays the different sections passed in as props.
 */
export default function CalendarRightSidebar({
  quickActionsContent,
  listContent,
  resourceFilterContent,
  legendContent,
}) {
  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Section for Quick Actions */}
      <Box mb={2}>
        <Typography variant="h6" gutterBottom component="div">
          Actions
        </Typography>
        {quickActionsContent}
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Section for Schedule List */}
      {listContent && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box my={2} sx={{ maxHeight: '35vh', overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom component="div">
              Scheduled Tasks
            </Typography>
            {listContent}
          </Box>
        </>
      )}

      <Divider sx={{ my: 1 }} />

      {/* Section for Resource Filtering */}
      <Box my={2} sx={{ flex: 1, overflowY: 'auto' }}>
        <Typography variant="h6" gutterBottom component="div">
          Filter by Staff
        </Typography>
        {resourceFilterContent}
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Section for Calendar Legend */}
      <Box mt={2}>
        <Typography variant="h6" gutterBottom component="div">
          Legend
        </Typography>
        {legendContent}
      </Box>
    </Box>
  );
}

CalendarRightSidebar.propTypes = {
  /**
   * The component to render in the resource filter section.
   */
  resourceFilterContent: PropTypes.node,
  /**
   * The component to render in the quick actions section.
   */
  quickActionsContent: PropTypes.node,
  /**
   * The component to render in the scheduled list section.
   */
  listContent: PropTypes.node,
  /**
   * The component to render in the legend section.
   */
  legendContent: PropTypes.node,
};
