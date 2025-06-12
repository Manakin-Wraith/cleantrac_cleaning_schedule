import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  CompareArrows as CompareIcon
} from '@mui/icons-material';
import api from '../../services/api';

const RecipeVersionHistoryModal = ({ open, onClose, recipe, departmentColor }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState({ older: null, newer: null });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (open && recipe) {
      fetchVersionHistory();
    }
  }, [open, recipe]);

  const fetchVersionHistory = async () => {
    if (!recipe) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/recipe-versions/`, {
        params: { recipe: recipe.id }
      });
      
      // Sort versions by version number in descending order
      const sortedVersions = response.data.sort((a, b) => b.version_number - a.version_number);
      setVersions(sortedVersions);
      
      // Select the latest version by default
      if (sortedVersions.length > 0) {
        setSelectedVersion(sortedVersions[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading recipe version history:', err);
      setError('Failed to load version history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (version) => {
    if (compareMode) {
      // In compare mode, select versions for comparison
      if (!compareVersions.older) {
        setCompareVersions({ older: version, newer: null });
      } else if (!compareVersions.newer) {
        // Ensure newer version is actually newer than older version
        if (version.version_number > compareVersions.older.version_number) {
          setCompareVersions({ ...compareVersions, newer: version });
        } else {
          setCompareVersions({ older: compareVersions.older, newer: version });
          setCompareVersions({ newer: compareVersions.older, older: version });
        }
      } else {
        // Reset and start new selection
        setCompareVersions({ older: version, newer: null });
      }
    } else {
      // Normal mode - just view the selected version
      setSelectedVersion(version);
    }
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setCompareVersions({ older: null, newer: null });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Function to highlight differences between versions
  const highlightDifferences = (olderValue, newerValue) => {
    if (olderValue === newerValue) return false;
    return true;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderTop: `4px solid ${departmentColor}`,
          borderRadius: '4px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Recipe Version History
        </Typography>
        <Box>
          <Button
            startIcon={<CompareIcon />}
            onClick={toggleCompareMode}
            size="small"
            sx={{ mr: 1 }}
          >
            {compareMode ? 'Exit Compare' : 'Compare Versions'}
          </Button>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : versions.length === 0 ? (
          <Alert severity="info">
            No version history found for this recipe.
          </Alert>
        ) : (
          <Box>
            {compareMode ? (
              <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {!compareVersions.older && !compareVersions.newer ? (
                    'Select two versions to compare. Select the older version first, then the newer version.'
                  ) : !compareVersions.newer ? (
                    `Selected older version: ${compareVersions.older.version_number}. Now select a newer version to compare with.`
                  ) : (
                    `Comparing version ${compareVersions.older.version_number} with version ${compareVersions.newer.version_number}`
                  )}
                </Alert>
              </Box>
            ) : null}
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              {/* Version List */}
              <Box sx={{ width: { xs: '100%', md: '30%' } }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Versions
                </Typography>
                <Paper variant="outlined" sx={{ maxHeight: '400px', overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                        <TableCell>Version</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {versions.map((version) => (
                        <TableRow 
                          key={version.id} 
                          hover 
                          onClick={() => handleVersionSelect(version)}
                          selected={
                            (!compareMode && selectedVersion?.id === version.id) ||
                            (compareMode && (compareVersions.older?.id === version.id || compareVersions.newer?.id === version.id))
                          }
                          sx={{ 
                            cursor: 'pointer',
                            ...(compareMode && compareVersions.older?.id === version.id && {
                              bgcolor: 'rgba(255, 152, 0, 0.1)',
                              '&.Mui-selected': {
                                bgcolor: 'rgba(255, 152, 0, 0.2)',
                              },
                              '&:hover': {
                                bgcolor: 'rgba(255, 152, 0, 0.3)',
                              }
                            }),
                            ...(compareMode && compareVersions.newer?.id === version.id && {
                              bgcolor: 'rgba(76, 175, 80, 0.1)',
                              '&.Mui-selected': {
                                bgcolor: 'rgba(76, 175, 80, 0.2)',
                              },
                              '&:hover': {
                                bgcolor: 'rgba(76, 175, 80, 0.3)',
                              }
                            })
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2">
                                {version.version_number}
                              </Typography>
                              {version.version_number === versions[0].version_number && (
                                <Chip label="Latest" size="small" color="primary" sx={{ ml: 1, height: '20px' }} />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(version.changed_at)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Box>
              
              {/* Version Details */}
              <Box sx={{ width: { xs: '100%', md: '70%' } }}>
                {compareMode && compareVersions.older && compareVersions.newer ? (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                      Version Comparison
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                          <Typography variant="subtitle2" color="warning.main">
                            Version {compareVersions.older.version_number}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(compareVersions.older.changed_at)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="success.main" align="right">
                            Version {compareVersions.newer.version_number}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" align="right">
                            {formatDate(compareVersions.newer.changed_at)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Field</TableCell>
                              <TableCell>Old Value</TableCell>
                              <TableCell>New Value</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.keys(compareVersions.older.recipe_data || {}).map((key) => {
                              const olderValue = compareVersions.older.recipe_data[key];
                              const newerValue = compareVersions.newer.recipe_data[key];
                              const isDifferent = highlightDifferences(olderValue, newerValue);
                              
                              return (
                                <TableRow key={key}>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={isDifferent ? { bgcolor: 'rgba(255, 152, 0, 0.1)' } : {}}>
                                    <Typography variant="body2">
                                      {typeof olderValue === 'boolean' 
                                        ? olderValue ? 'Yes' : 'No'
                                        : olderValue || '-'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={isDifferent ? { bgcolor: 'rgba(76, 175, 80, 0.1)' } : {}}>
                                    <Typography variant="body2">
                                      {typeof newerValue === 'boolean' 
                                        ? newerValue ? 'Yes' : 'No'
                                        : newerValue || '-'}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Box>
                ) : !compareMode && selectedVersion ? (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                      Version {selectedVersion.version_number} Details
                    </Typography>
                    <Paper variant="outlined">
                      <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                          borderBottom: 1,
                          borderColor: 'divider',
                          '& .Mui-selected': {
                            color: departmentColor,
                          },
                          '& .MuiTabs-indicator': {
                            backgroundColor: departmentColor,
                          }
                        }}
                      >
                        <Tab label="Recipe Information" id="tab-0" />
                        <Tab label="Ingredients" id="tab-1" />
                        <Tab label="Change Notes" id="tab-2" />
                      </Tabs>
                      
                      <Box sx={{ p: 2 }}>
                        {tabValue === 0 && (
                          <TableContainer>
                            <Table size="small">
                              <TableBody>
                                {Object.entries(selectedVersion.recipe_data || {})
                                  .filter(([key]) => !key.includes('ingredients'))
                                  .map(([key, value]) => (
                                    <TableRow key={key}>
                                      <TableCell component="th" scope="row" sx={{ width: '30%' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2">
                                          {typeof value === 'boolean' 
                                            ? value ? 'Yes' : 'No'
                                            : value || '-'}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                        
                        {tabValue === 1 && (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                                  <TableCell>Name</TableCell>
                                  <TableCell>Quantity</TableCell>
                                  <TableCell>Unit Cost</TableCell>
                                  <TableCell>Total Cost</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {selectedVersion.recipe_data?.ingredients?.length > 0 ? (
                                  selectedVersion.recipe_data.ingredients.map((ingredient, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{ingredient.ingredient_name}</TableCell>
                                      <TableCell>{`${ingredient.quantity} ${ingredient.unit}`}</TableCell>
                                      <TableCell>R {parseFloat(ingredient.cost).toFixed(2)}</TableCell>
                                      <TableCell>R {parseFloat(ingredient.total_cost).toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={4} align="center">
                                      <Typography variant="body2" sx={{ py: 2 }}>
                                        No ingredients found in this version.
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                        
                        {tabValue === 2 && (
                          <Box sx={{ p: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Changed By
                            </Typography>
                            <Typography variant="body2" paragraph>
                              {selectedVersion.changed_by_name || 'Unknown'}
                            </Typography>
                            
                            <Typography variant="subtitle2" gutterBottom>
                              Change Notes
                            </Typography>
                            <Typography variant="body2" paragraph>
                              {selectedVersion.change_notes || 'No notes provided for this change.'}
                            </Typography>
                            
                            <Typography variant="subtitle2" gutterBottom>
                              Changed At
                            </Typography>
                            <Typography variant="body2">
                              {formatDate(selectedVersion.changed_at)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      {compareMode 
                        ? 'Select versions to compare' 
                        : 'Select a version to view details'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecipeVersionHistoryModal;
