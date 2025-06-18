import React, { useEffect, useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { fetchFolders } from '../../services/folderService';

export default function FolderDropdown({ value, onChange, refreshToken = 0 }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchFolders();
      setFolders(data);
    } catch (e) {
      console.error('folder load failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel>Folder</InputLabel>
      {loading ? (
        <CircularProgress size={20} sx={{ mt: 1 }} />
      ) : (
        <Select
          label="Folder"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <MenuItem value="">All Documents</MenuItem>
          {folders.map((f) => (
            <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
          ))}
        </Select>
      )}
    </FormControl>
  );
}
