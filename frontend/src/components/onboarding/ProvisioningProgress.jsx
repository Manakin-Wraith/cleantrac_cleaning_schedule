import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Grow,
  Chip
} from '@mui/material';
import { 
  Cloud as CloudIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  PersonAdd as PersonAddIcon,
  Dataset as DatasetIcon,
  Domain as DomainIcon,
  RocketLaunch as RocketLaunchIcon
} from '@mui/icons-material';

const ProvisioningProgress = ({ data, onNext, setLoading }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const provisioningSteps = [
    {
      id: 'domain',
      title: 'Setting up your domain',
      description: 'Configuring your CleanTrac subdomain and SSL certificate',
      icon: <DomainIcon />,
      duration: 2000
    },
    {
      id: 'database',
      title: 'Creating your database',
      description: 'Setting up isolated database schema for your business data',
      icon: <StorageIcon />,
      duration: 3000
    },
    {
      id: 'security',
      title: 'Configuring security',
      description: 'Setting up authentication and data encryption',
      icon: <SecurityIcon />,
      duration: 2500
    },
    {
      id: 'admin',
      title: 'Creating admin account',
      description: 'Setting up your administrator account and permissions',
      icon: <PersonAddIcon />,
      duration: 1500
    },
    {
      id: 'data',
      title: 'Importing your data',
      description: data?.setupChoice === 'demo' 
        ? 'Loading demo bakery & deli data with realistic examples'
        : 'Importing and validating your uploaded business data',
      icon: <DatasetIcon />,
      duration: 4000
    },
    {
      id: 'finalize',
      title: 'Finalizing setup',
      description: 'Completing configuration and preparing your system',
      icon: <SettingsIcon />,
      duration: 2000
    }
  ];

  useEffect(() => {
    setLoading(true);
    startProvisioning();
  }, []);

  const startProvisioning = async () => {
    try {
      for (let i = 0; i < provisioningSteps.length; i++) {
        const step = provisioningSteps[i];
        
        // Update current step
        setCurrentStep(i);
        setProgress((i / provisioningSteps.length) * 100);

        // Simulate provisioning step
        await simulateProvisioningStep(step, i);

        // Mark step as completed
        setCompletedSteps(prev => [...prev, i]);
        setProgress(((i + 1) / provisioningSteps.length) * 100);
      }

      // All steps completed
      setProgress(100);
      setLoading(false);
      
      // Wait a moment to show completion, then proceed
      setTimeout(() => {
        onNext({
          tenantInfo: {
            subdomain: data?.companyInfo?.subdomain,
            domain: `${data?.companyInfo?.subdomain}.manager.cleentrac.com`,
            setupType: data?.setupChoice,
            provisionedAt: new Date().toISOString(),
            adminEmail: data?.companyInfo?.email,
            companyName: data?.companyInfo?.companyName
          }
        });
      }, 2000);

    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const simulateProvisioningStep = async (step, stepIndex) => {
    // Simulate API call to backend provisioning service
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock occasional error for demo (very rare)
        if (Math.random() < 0.02) { // 2% chance of error
          reject(new Error(`Failed to ${step.title.toLowerCase()}`));
        } else {
          resolve();
        }
      }, step.duration);
    });
  };

  const getStepStatus = (stepIndex) => {
    if (completedSteps.includes(stepIndex)) {
      return 'completed';
    } else if (stepIndex === currentStep) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  const getStepIcon = (step, stepIndex) => {
    const status = getStepStatus(stepIndex);
    
    if (status === 'completed') {
      return <CheckCircleIcon sx={{ color: 'success.main' }} />;
    } else if (status === 'active') {
      return <Box sx={{ color: 'primary.main', animation: 'pulse 2s infinite' }}>{step.icon}</Box>;
    } else {
      return <RadioButtonUncheckedIcon sx={{ color: 'text.disabled' }} />;
    }
  };

  if (error) {
    return (
      <Fade in={true} timeout={600}>
        <Box className="step-container">
          <Box sx={{ color: 'error.main', mb: 3 }}>
            <CloudIcon sx={{ fontSize: '4rem' }} />
          </Box>
          <Typography variant="h4" className="step-title" color="error">
            Setup Error
          </Typography>
          <Typography variant="body1" className="step-description">
            We encountered an error while setting up your system: {error}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Please try again or contact support if the problem persists.
          </Typography>
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in={true} timeout={600}>
      <Box className="step-container">
        <Box className="progress-container">
          <CloudIcon className="progress-icon" />
          
          <Typography variant="h4" className="progress-title">
            Setting up your CleanTrac system
          </Typography>
          
          <Typography variant="body1" className="progress-description">
            We're creating your dedicated CleanTrac environment with {data?.setupChoice === 'demo' ? 'demo data' : 'your uploaded data'}. 
            This will take just a few minutes.
          </Typography>

          {/* Overall Progress */}
          <Box sx={{ width: '100%', maxWidth: 400, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Overall Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  background: '#3b82f6'
                }
              }}
            />
          </Box>

          {/* Company Info Display */}
          <Card sx={{ mb: 4, maxWidth: 500, bgcolor: '#f8f9fa' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50' }}>
                Setting up for {data?.companyInfo?.companyName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Chip 
                  label={`${data?.companyInfo?.subdomain}.manager.cleentrac.com`}
                  variant="outlined"
                  size="small"
                  sx={{ borderColor: '#667eea', color: '#667eea' }}
                />
                <Chip 
                  label={data?.setupChoice === 'demo' ? 'Demo Data' : 'Custom Data'}
                  variant="outlined"
                  size="small"
                  sx={{ borderColor: '#764ba2', color: '#764ba2' }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Provisioning Steps */}
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', color: '#2c3e50' }}>
                Provisioning Steps
              </Typography>
              
              <List sx={{ py: 0 }}>
                {provisioningSteps.map((step, index) => {
                  const status = getStepStatus(index);
                  
                  return (
                    <Grow 
                      in={true} 
                      timeout={600 + (index * 200)}
                      key={step.id}
                    >
                      <ListItem 
                        className={`progress-step ${status}`}
                        sx={{ 
                          borderRadius: 2,
                          mb: 1,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <ListItemIcon>
                          {getStepIcon(step, index)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography 
                              variant="body1" 
                              className="progress-step-text"
                              sx={{ 
                                fontWeight: status === 'active' ? 600 : 500,
                                color: status === 'completed' ? 'success.main' : 
                                       status === 'active' ? 'primary.main' : 'text.secondary'
                              }}
                            >
                              {step.title}
                            </Typography>
                          }
                          secondary={
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: status === 'completed' ? 'success.main' : 
                                       status === 'active' ? 'primary.main' : 'text.disabled',
                                mt: 0.5
                              }}
                            >
                              {step.description}
                            </Typography>
                          }
                        />
                        {status === 'active' && (
                          <LinearProgress 
                            sx={{ 
                              width: 60, 
                              height: 4, 
                              borderRadius: 2,
                              ml: 2
                            }} 
                          />
                        )}
                      </ListItem>
                    </Grow>
                  );
                })}
              </List>
            </CardContent>
          </Card>

          {/* Completion Message */}
          {progress === 100 && (
            <Fade in={true} timeout={1000}>
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <RocketLaunchIcon sx={{ fontSize: '3rem', color: 'success.main', mb: 2 }} />
                <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 600, mb: 1 }}>
                  Setup Complete!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your CleanTrac system is ready. Redirecting to your guided tour...
                </Typography>
              </Box>
            </Fade>
          )}

          {/* Technical Details */}
          <Box sx={{ mt: 4, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, maxWidth: 500 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
              🔒 Your data is encrypted and secure • 🌐 SSL certificate configured • 
              📊 Database isolated • 👤 Admin account ready
            </Typography>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};

export default ProvisioningProgress;
