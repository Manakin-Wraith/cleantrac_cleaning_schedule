import React, { useState } from 'react';
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
  Chip,
  Fade
} from '@mui/material';
import { 
  Settings as SettingsIcon,
  RocketLaunch as RocketLaunchIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
  Dataset as DatasetIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

const SetupChoice = ({ data, onNext, onBack, canGoBack }) => {
  const [selectedChoice, setSelectedChoice] = useState(null);

  const setupOptions = [
    {
      id: 'demo',
      title: 'Start with Demo Data',
      subtitle: 'Get up and running instantly',
      icon: <RocketLaunchIcon />,
      recommended: true,
      time: '2 minutes',
      description: 'Perfect for exploring CleanTrac with realistic sample data',
      features: [
        'Pre-configured demo bakery & deli',
        '15+ sample staff members with roles',
        '50+ cleaning tasks and schedules',
        '25+ recipes and ingredients',
        'Temperature monitoring setup',
        'Sample receiving records',
        'Ready-to-use departments'
      ],
      benefits: [
        { icon: <TimerIcon />, text: 'Instant setup - start using immediately' },
        { icon: <DatasetIcon />, text: 'Realistic data to explore all features' },
        { icon: <TrendingUpIcon />, text: 'See CleanTrac in action right away' },
        { icon: <EditIcon />, text: 'Easily customize or replace with your data later' }
      ],
      buttonText: 'Start with Demo Data',
      color: '#667eea'
    },
    {
      id: 'upload',
      title: 'Upload Your Data',
      subtitle: 'Import your existing business data',
      icon: <CloudUploadIcon />,
      recommended: false,
      time: '5-10 minutes',
      description: 'Perfect if you have existing data to import',
      features: [
        'Upload CSV files for each data type',
        'Real-time data validation',
        'Import your staff, suppliers, recipes',
        'Bring your cleaning schedules',
        'Import temperature monitoring setup',
        'Custom department configuration',
        'Preview before importing'
      ],
      benefits: [
        { icon: <SecurityIcon />, text: 'Your actual business data from day one' },
        { icon: <DatasetIcon />, text: 'No need to re-enter existing information' },
        { icon: <CheckCircleIcon />, text: 'Validated import with error checking' },
        { icon: <DownloadIcon />, text: 'CSV templates provided for easy formatting' }
      ],
      buttonText: 'Upload My Data',
      color: '#764ba2'
    }
  ];

  const handleChoiceSelect = (choice) => {
    setSelectedChoice(choice);
  };

  const handleNext = () => {
    if (selectedChoice) {
      onNext({
        setupChoice: selectedChoice.id,
        setupData: selectedChoice
      });
    }
  };

  return (
    <Fade in={true} timeout={600}>
      <Box className="step-container">
        <SettingsIcon className="step-icon" />
        
        <Typography variant="h4" className="step-title">
          How would you like to set up your system?
        </Typography>
        
        <Typography variant="body1" className="step-description">
          Choose the setup method that works best for you. You can always change 
          or add data later.
        </Typography>

        {/* Setup Options */}
        <Grid container spacing={4} sx={{ mb: 4, maxWidth: 900 }}>
          {setupOptions.map((option) => (
            <Grid size={{ xs: 12, md: 6 }} key={option.id}>
                <Card
                  className={`choice-card ${selectedChoice?.id === option.id ? 'selected' : ''}`}
                  onClick={() => handleChoiceSelect(option)}
                  sx={{ 
                    cursor: 'pointer',
                    position: 'relative',
                    height: '100%',
                    minHeight: 450,
                    border: selectedChoice?.id === option.id ? `3px solid ${option.color}` : '2px solid #e2e8f0',
                    borderRadius: 3,
                    background: selectedChoice?.id === option.id 
                      ? `linear-gradient(135deg, ${option.color}08 0%, ${option.color}15 100%)`
                      : '#ffffff',
                    transform: selectedChoice?.id === option.id ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: selectedChoice?.id === option.id 
                      ? `0 12px 32px ${option.color}30, 0 0 0 1px ${option.color}20`
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: option.color,
                      transform: 'translateY(-6px) scale(1.02)',
                      boxShadow: `0 16px 40px ${option.color}25`
                    },
                    '&::before': selectedChoice?.id === option.id ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      borderWidth: '0 65px 65px 0',
                      borderColor: `transparent ${option.color} transparent transparent`,
                      zIndex: 1
                    } : {},
                    '&::after': selectedChoice?.id === option.id ? {
                      content: '"✓"',
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      color: 'white',
                      fontSize: '22px',
                      fontWeight: 'bold',
                      zIndex: 2
                    } : {}
                  }}
              >
                {option.recommended && (
                  <Chip 
                    label="Recommended" 
                    size="small" 
                    sx={{ 
                      position: 'absolute', 
                      top: 16, 
                      right: 16,
                      bgcolor: option.color,
                      color: 'white',
                      fontWeight: 600
                    }} 
                  />
                )}
                
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box sx={{ color: option.color, mb: 2, fontSize: '3rem' }}>
                      {option.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: '#2c3e50' }}>
                      {option.title}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: '#6c757d', mb: 2 }}>
                      {option.subtitle}
                    </Typography>
                    <Chip 
                      icon={<TimerIcon />}
                      label={option.time}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: option.color, color: option.color }}
                    />
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" sx={{ color: '#6c757d', mb: 3, textAlign: 'center' }}>
                    {option.description}
                  </Typography>

                  {/* Features */}
                  <Box sx={{ mb: 3, flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#2c3e50' }}>
                      What's included:
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {option.features.map((feature, index) => (
                        <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircleIcon sx={{ fontSize: '1rem', color: option.color }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature}
                            primaryTypographyProps={{ 
                              variant: 'body2', 
                              color: 'text.secondary',
                              fontSize: '0.875rem'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  {/* Benefits */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#2c3e50' }}>
                      Key benefits:
                    </Typography>
                    {option.benefits.map((benefit, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ color: option.color, mr: 1, fontSize: '1rem' }}>
                          {benefit.icon}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                          {benefit.text}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Selection Button */}
                  <Button
                    variant={selectedChoice?.id === option.id ? "contained" : "outlined"}
                    fullWidth
                    sx={{
                      mt: 'auto',
                      py: 1.5,
                      bgcolor: selectedChoice?.id === option.id ? option.color : 'transparent',
                      borderColor: option.color,
                      color: selectedChoice?.id === option.id ? 'white' : option.color,
                      '&:hover': {
                        bgcolor: selectedChoice?.id === option.id ? option.color : `${option.color}10`,
                        borderColor: option.color
                      }
                    }}
                    onClick={() => handleChoiceSelect(option)}
                  >
                    {selectedChoice?.id === option.id ? 'Selected' : option.buttonText}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Additional Info */}
        {selectedChoice && (
          <Fade in={true} timeout={400}>
            <Box sx={{ mb: 4, p: 3, bgcolor: '#f8f9fa', borderRadius: 2, maxWidth: 600 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50', textAlign: 'center' }}>
                {selectedChoice.id === 'demo' ? '🚀 Great Choice!' : '📊 Perfect for Data Import!'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
                {selectedChoice.id === 'demo' 
                  ? "You'll have a fully functional CleanTrac system with realistic demo data in just 2 minutes. You can explore all features and replace the demo data with your own information anytime."
                  : "We'll guide you through uploading your business data with CSV templates. Our validation system will ensure your data imports correctly and completely."
                }
              </Typography>
              {selectedChoice.id === 'upload' && (
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
                  💡 Tip: You can also start with demo data and import your data later if you prefer to explore first.
                </Typography>
              )}
            </Box>
          </Fade>
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
            disabled={!selectedChoice}
            className="step-button primary"
          >
            Continue
            {selectedChoice && (
              <Box component="span" sx={{ ml: 1 }}>
                {selectedChoice.id === 'demo' ? '🚀' : '📊'}
              </Box>
            )}
          </Button>
        </Box>
      </Box>
    </Fade>
  );
};

export default SetupChoice;
