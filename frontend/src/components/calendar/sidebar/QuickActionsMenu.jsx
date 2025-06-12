import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

/**
 * Renders a menu with quick action buttons, such as 'New Task' and 'New Recipe'.
 */
export default function QuickActionsMenu({ onNewTaskClick, onNewRecipeClick }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Button
        variant="outlined"
        startIcon={<AddCircleOutlineIcon />}
        onClick={onNewTaskClick}
      >
        New Task
      </Button>
      <Button
        variant="outlined"
        startIcon={<AddCircleOutlineIcon />}
        onClick={onNewRecipeClick}
      >
        New Recipe
      </Button>
    </Box>
  );
}

QuickActionsMenu.propTypes = {
  /**
   * Callback function to be executed when the 'New Task' button is clicked.
   */
  onNewTaskClick: PropTypes.func.isRequired,
  /**
   * Callback function to be executed when the 'New Recipe' button is clicked.
   */
  onNewRecipeClick: PropTypes.func.isRequired,
};
