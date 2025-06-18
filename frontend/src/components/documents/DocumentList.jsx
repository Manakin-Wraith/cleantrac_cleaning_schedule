import React, { useEffect, useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, CircularProgress, Box, Alert, IconButton, Tooltip
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import apiClient from '../../services/api';

function DocumentList({ refreshTrigger, folderId = '' }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, folderId]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
            const res = await apiClient.get('/documents/');
      const docsRaw = res.data;
      const filtered = folderId ? docsRaw.filter((d)=> String(d.folder_id || '') === String(folderId)) : docsRaw;
      setDocs(filtered);
    } catch (err) {
      console.error('Failed to fetch documents', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (docs.length === 0) {
    return <Alert severity="info">No documents uploaded yet.</Alert>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>

            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {docs.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{doc.title}</TableCell>

              <TableCell align="right">
                <Tooltip title="Download / View">
                  <IconButton
                    size="small"
                    onClick={() => window.open(doc.file, '_blank')}
                    color="primary"
                  >
                    <CloudDownloadIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DocumentList;
