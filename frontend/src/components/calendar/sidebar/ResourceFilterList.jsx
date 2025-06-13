import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';

/**
 * Renders a searchable and selectable list of resources (e.g., staff).
 */
export default function ResourceFilterList({
  resources = [],
  selectedResourceIds = [],
  onResourceSelectionChange,
  onSelectAllResources,
  onClearAllResources,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggle = (resourceId) => () => {
    const currentIndex = selectedResourceIds.indexOf(resourceId);
    const newSelectedResourceIds = [...selectedResourceIds];

    if (currentIndex === -1) {
      newSelectedResourceIds.push(resourceId);
    } else {
      newSelectedResourceIds.splice(currentIndex, 1);
    }
    onResourceSelectionChange(newSelectedResourceIds);
  };

  // Support resources having either `name` or `title` fields.
  const filteredResources = useMemo(
    () =>
      resources.filter((resource) => {
        const label = (resource.name || resource.title || '').toLowerCase();
        return label.includes(searchTerm.toLowerCase());
      }),
    [resources, searchTerm],
  );

  return (
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Search staff..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 1 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Button size="small" onClick={onSelectAllResources}>Select All</Button>
        <Button size="small" onClick={onClearAllResources}>Clear All</Button>
      </Box>
      <List dense sx={{ width: '100%', bgcolor: 'background.paper', overflow: 'auto', maxHeight: 300 }}>
        {filteredResources.map((resource) => {
          const labelId = `checkbox-list-label-${resource.id}`;
          return (
            <ListItem key={resource.id} disablePadding>
              <ListItemButton role={undefined} onClick={handleToggle(resource.id)} dense>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedResourceIds.indexOf(resource.id) !== -1}
                    tabIndex={-1}
                    disableRipple
                    inputProps={{ 'aria-labelledby': labelId }}
                  />
                </ListItemIcon>
                <ListItemText id={labelId} primary={resource.name || resource.title} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

ResourceFilterList.propTypes = {
  /**
   * An array of available resource objects.
   */
  resources: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      title: PropTypes.string,
    })
  ).isRequired,
  /**
   * An array of the IDs of currently selected resources.
   */
  selectedResourceIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
  /**
   * Callback function when resource selection changes. Passes the new array of selected IDs.
   */
  onResourceSelectionChange: PropTypes.func.isRequired,
  /**
   * Callback function for the 'Select All' action.
   */
  onSelectAllResources: PropTypes.func.isRequired,
  /**
   * Callback function for the 'Clear All' action.
   */
  onClearAllResources: PropTypes.func.isRequired,
};
