import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, CircularProgress, Alert, Tabs, Tab,
  Paper, Button, Grid, Card, CardContent, Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import HistoryIcon from '@mui/icons-material/History';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import EditIcon from '@mui/icons-material/Edit';
import { getCurrentUser } from '../services/authService';
import DocumentTemplateList from '../components/documents/DocumentTemplateList';
import DocumentTemplateForm from '../components/documents/DocumentTemplateForm';
import GeneratedDocumentList from '../components/documents/GeneratedDocumentList';
import DocumentGenerationForm from '../components/documents/DocumentGenerationForm';
import TemplateEditor from '../components/documents/TemplateEditor';

function DocumentTemplateManagementPage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('templates');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showGenerationForm, setShowGenerationForm] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingUser(true);
        setError('');
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error("Failed to load user data:", err);
        setError(err.message || 'Failed to load user data. Please try refreshing.');
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    // Reset form visibility when changing tabs
    setShowTemplateForm(false);
    setShowGenerationForm(false);
    setShowTemplateEditor(false);
    setSelectedTemplate(null);
    setEditingTemplateId(null);
  };

  const handleShowTemplateForm = () => {
    setShowTemplateForm(true);
  };

  const handleCancelTemplateForm = () => {
    setShowTemplateForm(false);
  };

  const handleTemplateCreated = () => {
    setShowTemplateForm(false);
    // Refresh data if needed
  };

  const handleGenerateDocument = (template) => {
    setSelectedTemplate(template);
    setShowGenerationForm(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplateId(template.id);
    setShowTemplateEditor(true);
  };

  const handleCreateNewTemplate = () => {
    setEditingTemplateId(null);
    setShowTemplateEditor(true);
  };

  const handleCancelGeneration = () => {
    setShowGenerationForm(false);
    setSelectedTemplate(null);
  };

  const handleCancelTemplateEditor = () => {
    setShowTemplateEditor(false);
    setEditingTemplateId(null);
  };

  const handleDocumentGenerated = () => {
    setShowGenerationForm(false);
    setSelectedTemplate(null);
    setCurrentTab('history');
    // Refresh data if needed
  };

  const handleTemplateSaved = () => {
    setShowTemplateEditor(false);
    setEditingTemplateId(null);
    // Refresh template list
  };

  if (loadingUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Typography variant="h6" color="text.secondary" align="center">
          Could not load document template management page. Please try again later.
        </Typography>
      </Container>
    );
  }

  // Check if user is a manager or superuser
  const isManagerOrAdmin = user && (
    user.is_superuser || 
    (user.profile && user.profile.role === 'manager')
  );

  if (!isManagerOrAdmin) {
    return (
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          You do not have permission to access this page. Only managers can manage document templates.
        </Alert>
      </Container>
    );
  }

  const departmentName = user?.profile?.department_name || 'Your';

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>
        {departmentName} Document Templates
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="document template management tabs">
          <Tab 
            label="Templates" 
            value="templates" 
            icon={<DescriptionIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Generated Documents" 
            value="history" 
            icon={<HistoryIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Template Editor" 
            value="editor" 
            icon={<EditIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {currentTab === 'templates' && (
        <>
          {showTemplateForm ? (
            <DocumentTemplateForm 
              onCancel={handleCancelTemplateForm}
              onSuccess={handleTemplateCreated}
            />
          ) : showGenerationForm && selectedTemplate ? (
            <DocumentGenerationForm 
              template={selectedTemplate}
              onCancel={handleCancelGeneration}
              onSuccess={handleDocumentGenerated}
            />
          ) : showTemplateEditor ? (
            <TemplateEditor
              templateId={editingTemplateId}
              onSave={handleTemplateSaved}
              onCancel={handleCancelTemplateEditor}
            />
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                  Available Templates
                </Typography>
                <Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={handleShowTemplateForm}
                    sx={{ mr: 1 }}
                  >
                    Upload Template
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<EditIcon />}
                    onClick={handleCreateNewTemplate}
                  >
                    Create Template
                  </Button>
                </Box>
              </Box>
              <DocumentTemplateList 
                onGenerateDocument={handleGenerateDocument} 
                onEditTemplate={handleEditTemplate}
              />
            </>
          )}
        </>
      )}

      {currentTab === 'history' && (
        <>
          <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
            Generated Documents History
          </Typography>
          <GeneratedDocumentList />
        </>
      )}

      {currentTab === 'editor' && (
        <TemplateEditor
          templateId={editingTemplateId}
          onSave={handleTemplateSaved}
          onCancel={handleCancelTemplateEditor}
        />
      )}
    </Container>
  );
}

export default DocumentTemplateManagementPage;
