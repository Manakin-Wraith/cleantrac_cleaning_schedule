import React from 'react';
import PropTypes from 'prop-types';
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

// Left border colours by task type
const TYPE_COLOURS = {
  cleaning: '#0097A7', // teal
  recipe: '#FB8C00', // orange
};

const STATUS_COLOURS = {
  pending: '#BDBDBD',
  'in progress': '#FBC02D',
  completed: '#43A047',
  done: '#43A047',
};

const ChipContainer = styled(Box, {
  shouldForwardProp: (prop) => !['typeColour', 'compact'].includes(prop),
})(({ typeColour, compact, theme }) => ({
  position: 'relative',
  backgroundColor: alpha(typeColour, 0.15),
  border: `${compact ? 1 : 2}px solid ${typeColour}`,
  borderRadius: 4,
  padding: compact ? theme.spacing(0, 0.5) : theme.spacing(0.25, 0.75),
  minHeight: 22,
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  overflow:'hidden',
  boxSizing: 'border-box',
}));

const StatusDot = styled(FiberManualRecordIcon)(({ colour }) => ({
  position: 'absolute',
  top: 2,
  right: 2,
  fontSize: 8,
  color: colour,
}));

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join('');
}

export default function EventChip({
  title,
  type,
  status = 'pending',
  time,
  assignee,
  notesCount = 0,
  dense = false,
  compact = false,
  tooltipContent = null,
}) {
  const typeColour = TYPE_COLOURS[type] || '#616161';
  const isCompact = compact; // alias
  const statusColour = STATUS_COLOURS[status.toLowerCase?.() || 'pending'] || '#BDBDBD';

  const primaryLabel = isCompact && time ? `${title} • ${time}` : title;

  const content = (
    <ChipContainer typeColour={typeColour} compact={isCompact}>
      {/* primary row */}
      <Typography variant="caption" fontWeight={600} sx={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
        {primaryLabel}
      </Typography>

      {/* secondary row (hidden in dense) */}
      {!dense && !isCompact && (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
          {time && (
            <Stack direction="row" spacing={0.25} alignItems="center">
              <AccessTimeOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {time}
              </Typography>
            </Stack>
          )}
          {assignee && (
            <Avatar sx={{ width: 18, height: 18, bgcolor: 'grey.300', fontSize: 10 }}>
              {getInitials(assignee)}
            </Avatar>
          )}
          {notesCount > 0 && (
            <Stack direction="row" spacing={0.25} alignItems="center">
              <StickyNote2OutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {notesCount}
              </Typography>
            </Stack>
          )}
        </Stack>
      )}
      <StatusDot colour={statusColour} />
    </ChipContainer>
  );

  return tooltipContent ? (
    <Tooltip title={tooltipContent} arrow placement="top">
      {content}
    </Tooltip>
  ) : (
    content
  );
}

EventChip.propTypes = {
  title: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['cleaning', 'recipe']).isRequired,
  status: PropTypes.string,
  time: PropTypes.string,
  assignee: PropTypes.string,
  notesCount: PropTypes.number,
  dense: PropTypes.bool,
  compact: PropTypes.bool,
  tooltipContent: PropTypes.node,
};
