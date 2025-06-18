import React, { useEffect, useState } from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Box,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { fetchFolders, deleteFolder } from '../../services/folderService';

export default function FolderList({ selectedId, onSelect, refreshToken = 0 }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchFolders();
      setFolders(data);
    } catch (e) {
      console.error('folders load fail', e);
      setError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this folder? Documents will remain unfiled.')) return;
    try {
      await deleteFolder(id);
      load();
      if (selectedId === id) {
        onSelect('');
      }
    } catch (e) {
      console.error('delete folder failed', e);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <List dense sx={{ width: '100%' }}>
      <ListItemButton
        selected={selectedId === ''}
        onClick={() => onSelect('')}
        key="all"
      >
        <ListItemText primary="All Documents" />
      </ListItemButton>
      {folders.map((f) => (
        <ListItemButton
          key={f.id}
          selected={selectedId === f.id}
          onClick={() => onSelect(f.id)}
          secondaryAction={
            <Box>
              <Tooltip title="Delete">
                <IconButton edge="end" size="small" onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}>
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Box>
          }
        >
          <ListItemText primary={f.name} />
        </ListItemButton>
      ))}
    </List>
  );
}
