import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  Breadcrumbs,
  Link
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import { fetchFolders } from '../services/folderService';
import FolderDropdown from '../components/documents/FolderDropdown';
import DocumentList from '../components/documents/DocumentList';
import { getCurrentUser } from '../services/authService';

function DocumentsManagementPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [search, setSearch] = useState('');
  const [folders, setFolders] = useState([]);
  const [bulkCount, setBulkCount] = useState(0);
  const [bulkDownloadFn, setBulkDownloadFn] = useState(null);

  const loadFolders = async () => {
    try {
      const data = await fetchFolders();
      setFolders(data);
    } catch (e) {
      console.error('folder load failed', e);
    }
  };

  useEffect(()=>{ loadFolders(); }, []);

  const handleUploadSuccess = () => {
    setRefreshToken((prev) => prev + 1);
  };

  const openModal = () => setUploadOpen(true);
  const closeModal = () => setUploadOpen(false);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, position: 'relative' }}>
      <Paper elevation={1} sx={(theme)=>({ position: 'sticky', top: theme.spacing(8), zIndex: theme.zIndex.appBar + 1, p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'background.paper', border: 1, borderColor: 'divider' })}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mr: 2 }}>
          <Link underline="hover" color="inherit" onClick={()=> setSelectedFolder('')} sx={{ cursor: 'pointer' }}>
            All Documents
          </Link>
          {selectedFolder && (
            <Typography color="text.primary">{folders.find(f=> String(f.id)===String(selectedFolder))?.name || '...'}</Typography>
          )}
        </Breadcrumbs>
        <TextField size="small" placeholder="Quick find…" value={search} onChange={(e)=> setSearch(e.target.value)} sx={{ minWidth: 220 }} />
        <FolderDropdown value={selectedFolder} onChange={setSelectedFolder} />
        {bulkCount > 0 && (
          <Button
            variant="contained" color="success"
            startIcon={<CloudDownloadIcon />}
            onClick={() => bulkDownloadFn && bulkDownloadFn()}
            sx={{ mr: 1, zIndex: (theme) => theme.zIndex.appBar + 2 }}
          >
            Download ({bulkCount})
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={openModal}
        >
          Upload Documents
        </Button>
      </Paper>
      <DocumentList
         refreshTrigger={refreshToken}
         folderId={selectedFolder}
         searchQuery={search}
         folders={folders}
         onBulkSelectionChange={(count, fn)=>{ setBulkCount(count); setBulkDownloadFn(()=>fn); }}
       />
      <DocumentUploadModal
        open={uploadOpen}
        onClose={closeModal}
        onSuccess={handleUploadSuccess}
      />
    </Container>
  );
}

export default DocumentsManagementPage;
