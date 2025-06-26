import React from 'react';
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

/**
 * Accordion-based section with count badge & compact task rows.
 * Row click calls onSelect(task).
 */
const TaskSection = ({ title, tasks, defaultExpanded = false, onSelect }) => {
  return (
    <Accordion defaultExpanded={defaultExpanded}> 
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography sx={{ flexGrow: 1 }} variant="h6">
            {title}
          </Typography>
          <Chip label={tasks.length} color="primary" size="small" />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <List disablePadding>
          {tasks.map((t) => (
            <ListItemButton key={t.id} onClick={() => onSelect(t)} divider>
              <ListItemText
                primary={
                  t.__type === 'recipe'
                    ? t.recipe_details?.name || t.recipe?.name || 'Unnamed Recipe'
                    : t.cleaning_item?.name || 'Unnamed Task'
                }
                secondary={(t.status || '').replace(/_/g, ' ')}
              />
              {/* simple colored dot using chip */}
              <Chip
                size="small"
                color={
                  t.status === 'completed'
                    ? 'success'
                    : t.status === 'pending'
                    ? 'warning'
                    : 'default'
                }
                label=""
                sx={{ width: 8, height: 8, borderRadius: '50%' }}
              />
            </ListItemButton>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
};

export default TaskSection;
