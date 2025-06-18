import React, { useCallback, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Box,
  Typography,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import apiClient from '../../services/api';
import { fetchFolders } from '../../services/folderService';
import CreateFolderDialog from './CreateFolderDialog';

function DocumentUploadModal({ open, onClose, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFolders();
        setFolders(data);
      } catch (e) {
        console.error('Failed to load folders', e);
      }
    })();
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const handleUpload = async () => {
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    if (selectedFolder) {
      formData.append('folder_id', selectedFolder);
    }

    setUploading(true);
    try {
      await apiClient.post('/documents/bulk_upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        },
      });
      if (onSuccess) onSuccess();
      setFiles([]);
    } catch (err) {
      console.error('Upload failed', err);
      // Simple error feedback; could add snackbar
    } finally {
      setUploading(false);
      setProgress(0);
      onClose();
    }
  };

  const removeFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Documents</DialogTitle>
      <DialogContent>
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.400',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <Typography>Drop the files here ...</Typography>
          ) : (
            <Typography>
              Drag & drop files here, or click to select files
            </Typography>
          )}
        </Box>
        <Box sx={{ mt:2 }}>
            <Box sx={{ display:'flex', alignItems:'center', mb:1 }}>
              <Typography variant="subtitle2" sx={{ mr:1 }}>Destination Folder</Typography>
              <Button size="small" onClick={()=>setCreateOpen(true)}>+ New</Button>
            </Box>
            <select
              value={selectedFolder}
              onChange={(e)=>setSelectedFolder(e.target.value)}
              style={{ width:'100%', padding:'8px' }}
            >
              <option value="">-- None (Unfiled) --</option>
              {folders.map((f)=> (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </Box>

          {files.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {files.map((file) => (
              <Box
                key={file.name}
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="body2">{file.name}</Typography>
                <Button size="small" onClick={() => removeFile(file.name)}>
                  Remove
                </Button>
              </Box>
            ))}
          </Box>
        )}
        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption">{progress}%</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>Cancel</Button>
        <Button onClick={handleUpload} variant="contained" disabled={!files.length || uploading}>
          Upload
        </Button>
      </DialogActions>
          <CreateFolderDialog
        open={createOpen}
        onClose={()=>setCreateOpen(false)}
        onCreated={(folder)=>{
          setFolders(prev=>[...prev, folder]);
          setSelectedFolder(folder.id.toString());
          setCreateOpen(false);
        }}
      />
    </Dialog>
  );
}

export default DocumentUploadModal;
