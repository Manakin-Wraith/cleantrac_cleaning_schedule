import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import FolderDropdown from '../components/documents/FolderDropdown';
import DocumentList from '../components/documents/DocumentList';
import { getCurrentUser } from '../services/authService';

function DocumentsManagementPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState('');

  const handleUploadSuccess = () => {
    setRefreshToken((prev) => prev + 1);
  };

  const openModal = () => setUploadOpen(true);
  const closeModal = () => setUploadOpen(false);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Department Documents</Typography>
          <FolderDropdown value={selectedFolder} onChange={setSelectedFolder} />
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={openModal}
        >
          Upload Documents
        </Button>
      </Box>
      <DocumentList refreshTrigger={refreshToken} folderId={selectedFolder} />
      <DocumentUploadModal
        open={uploadOpen}
        onClose={closeModal}
        onSuccess={handleUploadSuccess}
      />
    </Container>
  );
}

export default DocumentsManagementPage;
