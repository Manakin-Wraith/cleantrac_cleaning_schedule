import React, { useEffect, useState } from 'react';
import {
  Paper,
  CircularProgress,
  Box,
  Alert,
  IconButton,
  Tooltip,
  Button,
  Stack,
  Snackbar,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { DataGrid } from '@mui/x-data-grid';
import apiClient from '../../services/api';
import DocumentPreviewDrawer from './DocumentPreviewDrawer';
import Link from '@mui/material/Link';
import { saveAs } from 'file-saver';

function DocumentList({ refreshTrigger, folderId = '', searchQuery = '', folders = [], onBulkSelectionChange = () => {} }) {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectionModel, setSelectionModel] = useState([]);

  // Notify parent when selection changes
  useEffect(()=>{
    onBulkSelectionChange(selectionModel.length, handleBulkDownload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionModel]);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [error, setError] = useState('');

  const handleBulkDownload = async () => {
    try {
      const res = await apiClient.post('/documents/bulk-download/', { ids: selectionModel }, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/zip' });
      saveAs(blob, 'documents.zip');
      setSnackbarMsg(`${selectionModel.length} file(s) downloading…`);
      setSelectionModel([]);
    } catch (e) {
      console.error('Bulk download failed', e);
      setSnackbarMsg('Bulk download failed');
    }
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, folderId]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/documents/');
      const docsRaw = res.data;
      const filtered = folderId ? docsRaw.filter((d) => String(d.folder_id || '') === String(folderId)) : docsRaw;
      setDocs(filtered);
      console.log('sample row', filtered[0]);
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

  const displayedDocs = docs.filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (displayedDocs.length === 0) {
    return <Alert severity="info">No documents uploaded yet.</Alert>;
  }

  const columns = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Link
          component="button"
          underline="hover"
          onClick={() => {
            setSelectedDoc(params.row);
            setDrawerOpen(true);
          }}
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: 'folder_name',
      headerName: 'Folder',
      width: 180,
    },
    {
      field: 'uploaded_by_username',
      headerName: 'Uploaded By',
      width: 160,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Download / View">
          <IconButton size="small" onClick={() => window.open(params.row.file, '_blank')} color="primary">
            <CloudDownloadIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      
      <DataGrid
        selectionModel={selectionModel}
        onSelectionModelChange={(newSel) => { setSelectionModel(newSel); onBulkSelectionChange(newSel.length, handleBulkDownload); }}
        autoHeight
        rows={displayedDocs}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        checkboxSelection
        disableSelectionOnClick
        onRowDoubleClick={(params) => {
          setSelectedDoc(params.row);
          setDrawerOpen(true);
        }}
        loading={loading}
        getRowId={(row) => row.id}
      />
      <DocumentPreviewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} doc={selectedDoc} />
      {selectionModel.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ my: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            onClick={handleBulkDownload}
          >
            Download ({selectionModel.length})
          </Button>
          {/* Future: Move / Delete */}
        </Stack>
      )}
      <Snackbar
        open={Boolean(snackbarMsg)}
        autoHideDuration={3000}
        onClose={() => setSnackbarMsg('')}
        message={snackbarMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Paper>
  );
}

export default DocumentList;
