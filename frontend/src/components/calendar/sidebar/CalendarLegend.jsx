import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

/**
 * Renders a color-coded legend for the calendar.
 */
export default function CalendarLegend({ legendItems = [] }) {
  return (
    <List dense>
      {legendItems.map((item, index) => (
        <ListItem key={index} disablePadding>
          <ListItemIcon sx={{ minWidth: '32px' }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '4px',
                backgroundColor: item.color,
              }}
            />
          </ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItem>
      ))}
    </List>
  );
}

CalendarLegend.propTypes = {
  /**
   * An array of legend item objects.
   */
  legendItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
};
