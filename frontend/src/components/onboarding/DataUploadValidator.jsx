import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Alert,
  Chip,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  Dataset as DatasetIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

const DataUploadValidator = ({ data, onNext, onBack, canGoBack, onError, setLoading }) => {
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [validationResults, setValidationResults] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [previewData, setPreviewData] = useState({});

  const requiredFiles = [
    {
      id: 'departments',
      name: 'Departments',
      description: 'Your business departments (simple name list)',
      required: true,
      example: 'BAKERY, BUTCHERY, HMR, Admin',
      fields: ['name']
    },
    {
      id: 'staff',
      name: 'Staff Members',
      description: 'Your team members with user profiles and department assignments (email optional)',
      required: true,
      example: 'admin, Store, Administrator, , +27123456789, Admin, manager, true, true',
      fields: ['username', 'first_name', 'last_name', 'email', 'phone_number', 'department', 'role', 'is_staff', 'is_active'],
      optionalFields: ['email']
    },
    {
      id: 'cleaning_items',
      name: 'Cleaning Tasks',
      description: 'Your cleaning schedules with detailed procedures, frequency, and equipment requirements',
      required: true,
      example: 'Clean prep surfaces, BAKERY, daily, Wipe down with sanitizer solution, Microfiber cloths, Food-safe sanitizer',
      fields: ['name', 'department', 'frequency', 'method', 'equipment', 'chemical']
    },
    {
      id: 'suppliers',
      name: 'Suppliers',
      description: 'Your vendor and supplier information with codes, names, contact details, and country of origin',
      required: false,
      example: '1001, ABC Bakery Supplies, +27214567890, South Africa',
      fields: ['supplier_code', 'supplier_name', 'contact_info', 'country_of_origin']
    },
    {
      id: 'recipes',
      name: 'Recipes',
      description: 'Your product recipes with detailed ingredient breakdown, product codes, costs, and usage amounts (JSON format)',
      required: false,
      fileType: 'json',
      example: `{
        "department": "BAKERY",
        "product_code": "26710",
        "description": "WHITE BREAD",
        "cost_excl_per_each_kg": "6.89",
        "ingredients": [
          {
            "prod_code": "15736",
            "description": "W/CAPE MILL MIX WHT BRD",
            "pack_size": "9.5KG",
            "weight": "47.500",
            "cost": "12.29",
            "recipe_use": "47.500",
            "total_cost": "584.00"
          }
        ]
      }`,
      fields: {
        recipe: ['department', 'product_code', 'description', 'cost_excl_per_each_kg'],
        ingredients: ['prod_code', 'description', 'pack_size', 'weight', 'cost', 'recipe_use', 'total_cost']
      }
    }
  ];

  const onDrop = useCallback((acceptedFiles, rejectedFiles, fileType) => {
    if (rejectedFiles.length > 0) {
      onError('Please upload only CSV files');
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: file
      }));

      // Start validation
      validateFile(file, fileType);
    }
  }, [onError]);

  const validateFile = async (file, fileType) => {
    setIsValidating(true);
    
    try {
      // Read file content
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('File is empty');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim())
      );

      // Mock validation logic
      const validation = await mockValidateData(fileType, headers, dataRows);
      
      setValidationResults(prev => ({
        ...prev,
        [fileType]: validation
      }));

      // Set preview data
      setPreviewData(prev => ({
        ...prev,
        [fileType]: {
          headers,
          rows: dataRows.slice(0, 5) // First 5 rows for preview
        }
      }));

    } catch (error) {
      setValidationResults(prev => ({
        ...prev,
        [fileType]: {
          valid: false,
          errors: [error.message],
          warnings: [],
          rowCount: 0
        }
      }));
    }
    
    setIsValidating(false);
  };

  const mockValidateData = async (fileType, headers, dataRows) => {
    // Simulate API validation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      rowCount: dataRows.length
    };

    // Mock validation rules
    const expectedHeaders = {
      departments: ['name', 'code', 'description'],
      staff: ['first_name', 'last_name', 'email', 'department', 'role'],
      cleaning_items: ['name', 'department', 'frequency', 'description'],
      suppliers: ['name', 'contact_email', 'phone', 'address'],
      recipes: ['name', 'department', 'description', 'ingredients']
    };

    const expected = expectedHeaders[fileType] || [];
    
    // Check headers
    const missingHeaders = expected.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      validation.errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
      validation.valid = false;
    }

    // Check data quality
    if (dataRows.length === 0) {
      validation.errors.push('No data rows found');
      validation.valid = false;
    } else if (dataRows.length < 3) {
      validation.warnings.push('Very few records - consider adding more data');
    }

    // Check for empty cells in required columns
    const requiredColumns = expected.slice(0, 2); // First 2 columns are usually required
    let emptyCount = 0;
    dataRows.forEach((row, index) => {
      requiredColumns.forEach(col => {
        const colIndex = headers.indexOf(col);
        if (colIndex >= 0 && (!row[colIndex] || row[colIndex].trim() === '')) {
          emptyCount++;
        }
      });
    });

    if (emptyCount > 0) {
      validation.warnings.push(`${emptyCount} empty required fields found`);
    }

    return validation;
  };

  const downloadTemplate = (fileType) => {
    // Mock CSV template download
    const templates = {
      departments: 'name,code,description\nBakery,BAKERY,Bread and pastry production\nDeli,DELI,Prepared foods and sandwiches',
      staff: 'first_name,last_name,email,department,role\nJohn,Smith,john@company.com,BAKERY,Manager\nJane,Doe,jane@company.com,DELI,Staff',
      cleaning_items: 'name,department,frequency,description\nDaily Sanitizing,BAKERY,Daily,Sanitize all surfaces\nEquipment Cleaning,DELI,Weekly,Deep clean equipment',
      suppliers: 'name,contact_email,phone,address\nABC Foods,contact@abcfoods.com,555-0123,123 Main St\nXYZ Supplies,info@xyzsupplies.com,555-0456,456 Oak Ave',
      recipes: 'name,department,description,ingredients\nWhite Bread,BAKERY,Classic white bread,Flour;Water;Yeast;Salt\nChicken Sandwich,DELI,Grilled chicken sandwich,Chicken;Bread;Lettuce;Mayo'
    };

    const content = templates[fileType] || 'No template available';
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const FileUploadZone = ({ fileType, fileInfo }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (accepted, rejected) => onDrop(accepted, rejected, fileType),
      accept: {
        'text/csv': ['.csv']
      },
      maxFiles: 1
    });

    const file = uploadedFiles[fileType];
    const validation = validationResults[fileType];
    const hasFile = !!file;
    const isValid = validation?.valid;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {fileInfo.name}
                {fileInfo.required && <Chip label="Required" size="small" color="primary" />}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {fileInfo.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Example: {fileInfo.example}
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => downloadTemplate(fileType)}
            >
              Template
            </Button>
          </Box>

          {!hasFile ? (
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? '#f5f5f5' : 'transparent',
                '&:hover': { borderColor: '#667eea', bgcolor: '#f8f9ff' }
              }}
            >
              <input {...getInputProps()} />
              <CloudUploadIcon sx={{ fontSize: '2rem', color: '#ccc', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {isDragActive ? 'Drop CSV file here' : 'Click or drag CSV file here'}
              </Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DescriptionIcon color="primary" />
                <Typography variant="body2">{file.name}</Typography>
                {isValidating ? (
                  <Chip label="Validating..." size="small" color="info" />
                ) : validation ? (
                  <Chip 
                    label={isValid ? 'Valid' : 'Invalid'} 
                    size="small" 
                    color={isValid ? 'success' : 'error'}
                    icon={isValid ? <CheckCircleIcon /> : <ErrorIcon />}
                  />
                ) : null}
              </Box>

              {validation && (
                <Box sx={{ mt: 2 }}>
                  {validation.errors.length > 0 && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Errors found:
                      </Typography>
                      {validation.errors.map((error, index) => (
                        <Typography key={index} variant="body2">• {error}</Typography>
                      ))}
                    </Alert>
                  )}

                  {validation.warnings.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Warnings:
                      </Typography>
                      {validation.warnings.map((warning, index) => (
                        <Typography key={index} variant="body2">• {warning}</Typography>
                      ))}
                    </Alert>
                  )}

                  {isValid && (
                    <Alert severity="success">
                      <Typography variant="body2">
                        ✓ File validated successfully! {validation.rowCount} records ready to import.
                      </Typography>
                    </Alert>
                  )}

                  {/* Data Preview */}
                  {previewData[fileType] && (
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VisibilityIcon />
                          <Typography variant="body2">Preview Data</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {previewData[fileType].headers.map((header, index) => (
                                  <TableCell key={index} sx={{ fontWeight: 600 }}>
                                    {header}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {previewData[fileType].rows.map((row, index) => (
                                <TableRow key={index}>
                                  {row.map((cell, cellIndex) => (
                                    <TableCell key={cellIndex}>{cell}</TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Showing first 5 rows of {validation.rowCount} total records
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              )}

              <Button
                size="small"
                onClick={() => {
                  setUploadedFiles(prev => {
                    const newFiles = { ...prev };
                    delete newFiles[fileType];
                    return newFiles;
                  });
                  setValidationResults(prev => {
                    const newResults = { ...prev };
                    delete newResults[fileType];
                    return newResults;
                  });
                }}
                sx={{ mt: 1 }}
              >
                Remove File
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const handleNext = () => {
    const requiredFileTypes = requiredFiles.filter(f => f.required).map(f => f.id);
    const uploadedRequiredFiles = requiredFileTypes.filter(type => uploadedFiles[type]);
    const validRequiredFiles = uploadedRequiredFiles.filter(type => validationResults[type]?.valid);

    if (validRequiredFiles.length !== requiredFileTypes.length) {
      onError('Please upload and validate all required files before continuing');
      return;
    }

    onNext({
      uploadedData: {
        files: uploadedFiles,
        validationResults,
        previewData
      }
    });
  };

  const getUploadProgress = () => {
    const totalRequired = requiredFiles.filter(f => f.required).length;
    const uploadedValid = requiredFiles
      .filter(f => f.required)
      .filter(f => validationResults[f.id]?.valid).length;
    
    return (uploadedValid / totalRequired) * 100;
  };

  return (
    <Fade in={true} timeout={600}>
      <Box className="step-container">
        <CloudUploadIcon className="step-icon" />
        
        <Typography variant="h4" className="step-title">
          Upload Your Business Data
        </Typography>
        
        <Typography variant="body1" className="step-description">
          Upload your CSV files to import your existing business data. 
          We'll validate each file and show you a preview before importing.
        </Typography>

        {/* Progress */}
        <Box sx={{ mb: 4, maxWidth: 400 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Upload Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(getUploadProgress())}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getUploadProgress()} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* File Upload Zones */}
        <Box sx={{ maxWidth: 800, width: '100%' }}>
          {requiredFiles.map((fileInfo) => (
            <FileUploadZone
              key={fileInfo.id}
              fileType={fileInfo.id}
              fileInfo={fileInfo}
            />
          ))}
        </Box>

        {/* Validation Summary */}
        {Object.keys(validationResults).length > 0 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, maxWidth: 600 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Validation Summary
            </Typography>
            {Object.entries(validationResults).map(([fileType, result]) => (
              <Box key={fileType} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {result.valid ? (
                  <CheckCircleIcon sx={{ color: 'success.main' }} />
                ) : (
                  <ErrorIcon sx={{ color: 'error.main' }} />
                )}
                <Typography variant="body2">
                  {requiredFiles.find(f => f.id === fileType)?.name}: {result.rowCount} records
                  {result.valid ? ' ✓' : ` (${result.errors.length} errors)`}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Action Buttons */}
        <Box className="step-actions">
          {canGoBack && (
            <Button
              variant="outlined"
              onClick={onBack}
              className="step-button secondary"
            >
              Back
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={getUploadProgress() < 100}
            className="step-button primary"
          >
            Continue with Upload
            <DatasetIcon sx={{ ml: 1 }} />
          </Button>
        </Box>
      </Box>
    </Fade>
  );
};

export default DataUploadValidator;
