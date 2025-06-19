import React from 'react';
import PropTypes from 'prop-types';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Link as MuiLink,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

function isPdf(fileUrl = '') {
  return fileUrl.toLowerCase().endsWith('.pdf');
}
function isExcel(fileUrl = '') {
  return (
    fileUrl.toLowerCase().endsWith('.xlsx') ||
    fileUrl.toLowerCase().endsWith('.xls')
  );
}

export default function DocumentPreviewDrawer({ open, onClose, doc }) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 400, md: 500 } } }}>
      <Box sx={{ position: 'relative', p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }} aria-label="Close preview drawer">
          <CloseIcon />
        </IconButton>
        {doc ? (
          <>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {doc.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Folder: {doc.folder_name || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Uploaded by: {doc.uploaded_by_username || '—'}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Preview Area */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
              {isPdf(doc.file) ? (
                <iframe
                  title="PDF preview"
                  src={doc.file}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                />
              ) : isExcel(doc.file) ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                  <InsertDriveFileIcon sx={{ fontSize: 64, mb: 2 }} color="action" />
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Inline preview not available for Excel files.
                  </Typography>
                  <Button variant="contained" href={doc.file} target="_blank" rel="noopener">
                    Download File
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                  {isPdf(doc.file) ? (
                    <PictureAsPdfIcon sx={{ fontSize: 64, mb: 2 }} color="action" />
                  ) : (
                    <InsertDriveFileIcon sx={{ fontSize: 64, mb: 2 }} color="action" />
                  )}
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    No inline preview available for this file type.
                  </Typography>
                  <Button variant="contained" href={doc.file} target="_blank" rel="noopener">
                    Open File
                  </Button>
                </Box>
              )}
            </Box>

            {/* Placeholder for version history */}
            <Divider sx={{ mb: 1 }} />
            <Typography variant="subtitle2">Version History</Typography>
            <Typography variant="body2" color="text.secondary">
              Coming soon…
            </Typography>
          </>
        ) : (
          <Typography sx={{ mt: 8 }} align="center">
            No document selected
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}

DocumentPreviewDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  doc: PropTypes.object,
};
