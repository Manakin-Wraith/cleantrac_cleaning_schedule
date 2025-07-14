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
    <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Section for Quick Actions */}
      <Box mb={1}>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }} component="div">
          Actions
        </Typography>
        {quickActionsContent}
      </Box>

      <Divider sx={{ my: 0.5, opacity: 0.6 }} />

      {/* Section for Schedule List */}
      {listContent && (
        <>
          <Divider sx={{ my: 0.5 }} />
          <Box mt={0.5} sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }} component="div">
              Scheduled Tasks
            </Typography>
            {listContent}
          </Box>
        </>
      )}

      {/* Removed Staff filter and Legend per latest UX */}
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
