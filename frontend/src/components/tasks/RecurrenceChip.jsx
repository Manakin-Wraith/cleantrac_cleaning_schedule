import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import LoopIcon from '@mui/icons-material/Loop';
import { alpha, useTheme } from '@mui/material/styles';

const typeConfig = {
  daily: { label: 'Daily', color: 'success' },
  weekly: { label: 'Weekly', color: 'info' },
  monthly: { label: 'Monthly', color: 'secondary' },
};

export default function RecurrenceChip({ type, sx = {}, ...chipProps }) {
  if (!type || !typeConfig[type]) return null;
  const theme = useTheme();
  const cfg = typeConfig[type];
  const paletteColor = theme.palette[cfg.color] || theme.palette.primary;
  const bg = alpha(paletteColor.main, 0.2);

  return (
    <Chip
      size="small"
      icon={<LoopIcon sx={{ fontSize: 16 }} />}
      label={cfg.label}
      sx={{
        ml: 0.5,
        backgroundColor: bg,
        color: paletteColor.main,
        '& .MuiChip-icon': { color: paletteColor.main, ml: 0 },
        ...sx,
      }}
      {...chipProps}
    />
  );
}

RecurrenceChip.propTypes = {
  type: PropTypes.oneOf(['daily', 'weekly', 'monthly']).isRequired,
  sx: PropTypes.object,
};
