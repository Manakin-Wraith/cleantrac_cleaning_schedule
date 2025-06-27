import React from 'react';
import PropTypes from 'prop-types';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import RestaurantMenuOutlinedIcon from '@mui/icons-material/RestaurantMenuOutlined';
import { useTheme } from '@mui/material/styles';
import { Typography, Box } from '@mui/material';

/**
 * Returns an outline icon for pending tasks and a filled icon for tasks awaiting review.
 * Shape conveys task type; fill state conveys status, so colour perception is not required.
 */
export default function TaskTypeIcon({ task, sx = {}, showLabel = true }) {
  const theme = useTheme();
  if (!task) return null;
    const isRecipe = task.__type === 'recipe';
  const status = task.status;
  const needsReview = status === 'pending_review';
  const completed = status === 'completed';

  let Icon;
  if (isRecipe) {
    Icon = needsReview || completed ? RestaurantMenuIcon : RestaurantMenuOutlinedIcon;
  } else {
    Icon = needsReview || completed ? CleaningServicesIcon : CleaningServicesOutlinedIcon;
  }

  const color = completed ? theme.palette.text.disabled : 'inherit';
  const labelStatus = needsReview ? 'awaiting review' : completed ? 'completed' : 'pending';
  const label = `${isRecipe ? 'Recipe' : 'Cleaning'} task ${labelStatus}`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ...sx }} aria-label={label}>
      <Icon sx={{ color, fontSize: 20 }} />
      {showLabel && (
        <Typography variant="caption" sx={{ ml: 0.5 }}>
          {labelStatus.replace(/_/g, ' ')}
        </Typography>
      )}
    </Box>
  );
}

TaskTypeIcon.propTypes = {
  task: PropTypes.object.isRequired,
  sx: PropTypes.object,
  showLabel: PropTypes.bool,
};
