import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RecurrenceChip from './RecurrenceChip';

/**
 * Accordion-based section with count badge & compact task rows.
 * Row click calls onSelect(task).
 */
const TaskSection = ({ title, tasks, icon: SectionIcon, defaultExpanded = false, onSelect }) => {
  const theme = useTheme();
  return (
    <Accordion defaultExpanded={defaultExpanded}> 
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap:1 }}>
          {SectionIcon && <SectionIcon fontSize="small" />} 
          <Typography sx={{ flexGrow: 1 }} variant="h6">
            {title}
          </Typography>
          <Chip label={tasks.length} color="primary" size="small" />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <List disablePadding>
          {tasks.map((t) => (
            <ListItemButton key={t.id} onClick={() => onSelect(t)} divider sx={{ display:'flex', alignItems:'center', gap:1 }}>
              
              <Typography sx={{ flexGrow:1 }}>
                {t.__type === 'recipe'
                  ? t.recipe_details?.name || t.recipe?.name || 'Unnamed Recipe'
                  : t.cleaning_item?.name || 'Unnamed Task'}
                {t.recurrence_type && (
                  <RecurrenceChip type={t.recurrence_type} sx={{ ml: 0.5 }} />
                )}
              </Typography>
              <Chip
                label={(t.status || '').replace(/_/g, ' ')}
                size="small"
                variant={['pending','scheduled'].includes(t.status) ? 'outlined' : 'filled'}
                color={t.status === 'completed' ? 'success' : t.status === 'pending' ? 'warning' : t.status === 'scheduled' ? 'info' : 'default'}
                sx={{
                  textTransform: 'capitalize',
                  ...(t.status === 'pending' && {
                    bgcolor: theme.palette.warning.light,
                    color: theme.palette.getContrastText(theme.palette.warning.light),
                  }),
                  ...(t.status === 'scheduled' && {
                    bgcolor: theme.palette.info.light,
                    color: theme.palette.getContrastText(theme.palette.info.light),
                  }),
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
};

export default TaskSection;
