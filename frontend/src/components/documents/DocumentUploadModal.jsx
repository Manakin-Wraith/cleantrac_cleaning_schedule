import React, { useCallback, useState } from 'react';
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

function DocumentUploadModal({ open, onClose, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

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
    </Dialog>
  );
}

export default DocumentUploadModal;
