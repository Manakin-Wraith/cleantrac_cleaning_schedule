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
  Fade,
  Avatar,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { 
  Tour as TourIcon,
  Dashboard as DashboardIcon,
  Task as TaskIcon,
  Thermostat as ThermometerIcon,
  RestaurantMenu as RestaurantMenuIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Launch as LaunchIcon,
  Celebration as CelebrationIcon
} from '@mui/icons-material';

const GuidedTour = ({ data, onNext, isLastStep }) => {
  const [currentTourStep, setCurrentTourStep] = useState(0);

  const tourSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Your CleenTrac System!',
      subtitle: 'Your food safety management system is ready',
      icon: <CelebrationIcon />,
      content: {
        type: 'welcome',
        highlights: [
          `Your system URL: ${data?.tenantInfo?.domain}`,
          `Admin email: ${data?.tenantInfo?.adminEmail}`,
          `Setup type: ${data?.setupChoice === 'demo' ? 'Demo Data' : 'Custom Data'}`,
          `Company: ${data?.tenantInfo?.companyName}`
        ]
      }
    },
    {
      id: 'dashboard',
      title: 'Manager Dashboard',
      subtitle: 'Your central command center',
      icon: <DashboardIcon />,
      content: {
        type: 'feature',
        description: 'Get a complete overview of your operations with real-time insights.',
        features: [
          'Daily task completion status',
          'Temperature monitoring alerts',
          'Upcoming cleaning schedules',
          'Staff performance metrics',
          'Recent receiving activities',
          'Compliance status overview'
        ],
        screenshot: '/tour/dashboard.png' // Placeholder
      }
    },
    {
      id: 'tasks',
      title: 'Task Management',
      subtitle: 'Schedule and track cleaning tasks',
      icon: <TaskIcon />,
      content: {
        type: 'feature',
        description: 'Manage all your cleaning and maintenance tasks with automated scheduling.',
        features: [
          'Department-specific task lists',
          'Automated recurring schedules',
          'Staff assignment and tracking',
          'Photo verification requirements',
          'Completion timestamps',
          'Performance analytics'
        ],
        screenshot: '/tour/tasks.png' // Placeholder
      }
    },
    {
      id: 'temperature',
      title: 'Temperature Monitoring',
      subtitle: 'Ensure food safety compliance',
      icon: <ThermometerIcon />,
      content: {
        type: 'feature',
        description: 'Monitor and log temperatures across all areas with automated alerts.',
        features: [
          'Multiple monitoring points',
          'Automated alert thresholds',
          'Digital thermometer integration',
          'Historical temperature logs',
          'Compliance reporting',
          'Corrective action tracking'
        ],
        screenshot: '/tour/temperature.png' // Placeholder
      }
    },
    {
      id: 'recipes',
      title: 'Recipe Management',
      subtitle: 'Manage your product formulations',
      icon: <RestaurantMenuIcon />,
      content: {
        type: 'feature',
        description: 'Store and manage all your recipes with ingredient tracking and costing.',
        features: [
          'Detailed ingredient lists',
          'Cost calculations',
          'Nutritional information',
          'Version control',
          'Allergen tracking',
          'Production scaling'
        ],
        screenshot: '/tour/recipes.png' // Placeholder
      }
    },
    {
      id: 'staff',
      title: 'Staff Management',
      subtitle: 'Manage your team effectively',
      icon: <PeopleIcon />,
      content: {
        type: 'feature',
        description: 'Organize your team with role-based access and performance tracking.',
        features: [
          'Department organization',
          'Role-based permissions',
          'Task assignment',
          'Performance tracking',
          'Training records',
          'Contact management'
        ],
        screenshot: '/tour/staff.png' // Placeholder
      }
    },
    {
      id: 'suppliers',
      title: 'Supplier & Receiving',
      subtitle: 'Track your supply chain',
      icon: <InventoryIcon />,
      content: {
        type: 'feature',
        description: 'Manage suppliers and track all incoming products with full traceability.',
        features: [
          'Supplier contact management',
          'Receiving documentation',
          'Batch number tracking',
          'Quality control checks',
          'Expiry date monitoring',
          'Traceability reports'
        ],
        screenshot: '/tour/suppliers.png' // Placeholder
      }
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      subtitle: 'Data-driven insights',
      icon: <AssessmentIcon />,
      content: {
        type: 'feature',
        description: 'Generate comprehensive reports for compliance and business insights.',
        features: [
          'Compliance audit reports',
          'Task completion analytics',
          'Temperature trend analysis',
          'Staff performance reports',
          'Supplier quality metrics',
          'Custom report builder'
        ],
        screenshot: '/tour/reports.png' // Placeholder
      }
    },
    {
      id: 'next-steps',
      title: 'You\'re All Set!',
      subtitle: 'Ready to start using CleanTrac',
      icon: <CheckCircleIcon />,
      content: {
        type: 'completion',
        nextSteps: [
          'Explore your dashboard and familiarize yourself with the interface',
          data?.setupChoice === 'demo' 
            ? 'Review the demo data and customize it for your business'
            : 'Verify your imported data and make any necessary adjustments',
          'Invite your team members and assign appropriate roles',
          'Set up your cleaning schedules and temperature monitoring',
          'Configure alerts and notifications for your preferences',
          'Start logging your daily operations and track compliance'
        ]
      }
    }
  ];

  const currentStep = tourSteps[currentTourStep];

  const handleNext = () => {
    if (currentTourStep < tourSteps.length - 1) {
      setCurrentTourStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentTourStep > 0) {
      setCurrentTourStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Redirect to the actual CleanTrac system
    const tenantUrl = `https://${data?.tenantInfo?.domain}`;
    window.open(tenantUrl, '_blank');
    
    if (onNext) {
      onNext({
        tourCompleted: true,
        completedAt: new Date().toISOString()
      });
    }
  };

  const renderWelcomeContent = () => (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ mb: 4 }}>
        <Avatar
          sx={{ 
            width: 80, 
            height: 80, 
            bgcolor: 'success.main', 
            margin: '0 auto',
            mb: 2
          }}
        >
          <CelebrationIcon sx={{ fontSize: '2.5rem' }} />
        </Avatar>
        <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 600, mb: 2 }}>
          Congratulations!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Your CleanTrac system has been successfully set up and is ready to use.
        </Typography>
      </Box>

      <Card sx={{ mb: 4, bgcolor: '#f8f9fa' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50' }}>
            Your System Details
          </Typography>
          <List dense>
            {currentStep.content.highlights.map((highlight, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={highlight}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Typography variant="body2" color="text.secondary">
        Let's take a quick tour of your new CleanTrac system to get you started.
      </Typography>
    </Box>
  );

  const renderFeatureContent = () => (
    <Box>
      <Grid container spacing={4} alignItems="center">
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {currentStep.content.description}
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50' }}>
              Key Features:
            </Typography>
            <List dense>
              {currentStep.content.features.map((feature, index) => (
                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon sx={{ fontSize: '1rem', color: '#667eea' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={feature}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ bgcolor: '#f8f9fa', textAlign: 'center', p: 4 }}>
            <Box sx={{ color: '#667eea', mb: 2, fontSize: '4rem' }}>
              {currentStep.icon}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Screenshot placeholder for {currentStep.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              You'll see the actual interface when you access your system
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderCompletionContent = () => (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ mb: 4 }}>
        <Avatar
          sx={{ 
            width: 80, 
            height: 80, 
            bgcolor: 'primary.main', 
            margin: '0 auto',
            mb: 2
          }}
        >
          <LaunchIcon sx={{ fontSize: '2.5rem' }} />
        </Avatar>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>
          Ready to Launch!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Your CleanTrac system is fully configured and ready for daily use.
        </Typography>
      </Box>

      <Card sx={{ mb: 4, textAlign: 'left' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50' }}>
            Recommended Next Steps:
          </Typography>
          <List>
            {currentStep.content.nextSteps.map((step, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Chip 
                    label={index + 1} 
                    size="small" 
                    sx={{ 
                      bgcolor: '#667eea', 
                      color: 'white',
                      fontWeight: 600,
                      minWidth: 24,
                      height: 24
                    }} 
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={step}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Box sx={{ p: 3, bgcolor: '#e3f2fd', borderRadius: 2, mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          🎯 Pro Tip:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start with exploring the dashboard to get familiar with the interface, 
          then gradually configure each module according to your business needs.
        </Typography>
      </Box>
    </Box>
  );

  const renderContent = () => {
    switch (currentStep.content.type) {
      case 'welcome':
        return renderWelcomeContent();
      case 'feature':
        return renderFeatureContent();
      case 'completion':
        return renderCompletionContent();
      default:
        return null;
    }
  };

  return (
    <Fade in={true} timeout={600}>
      <Box className="step-container">
        <TourIcon className="step-icon" />
        
        <Typography variant="h4" className="step-title">
          {currentStep.title}
        </Typography>
        
        <Typography variant="body1" className="step-description">
          {currentStep.subtitle}
        </Typography>

        {/* Tour Progress */}
        <Box sx={{ mb: 4, maxWidth: 600 }}>
          <Stepper activeStep={currentTourStep} alternativeLabel>
            {tourSteps.map((step, index) => (
              <Step key={step.id}>
                <StepLabel>
                  <Typography variant="caption">
                    {index === 0 ? 'Welcome' : 
                     index === tourSteps.length - 1 ? 'Complete' : 
                     `Feature ${index}`}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Step Content */}
        <Box sx={{ width: '100%', maxWidth: 900, mb: 4 }}>
          {renderContent()}
        </Box>

        {/* Navigation */}
        <Box className="step-actions">
          {currentTourStep > 0 && (
            <Button
              variant="outlined"
              onClick={handlePrevious}
              className="step-button secondary"
            >
              Previous
            </Button>
          )}
          
          <Button
            variant="contained"
            onClick={handleNext}
            className="step-button primary"
            endIcon={
              currentTourStep === tourSteps.length - 1 ? 
                <LaunchIcon /> : 
                <ArrowForwardIcon />
            }
          >
            {currentTourStep === tourSteps.length - 1 ? 
              'Launch CleanTrac' : 
              'Next'
            }
          </Button>
        </Box>

        {/* Tour Progress Indicator */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Step {currentTourStep + 1} of {tourSteps.length} • 
            {currentTourStep === tourSteps.length - 1 ? 
              ' Ready to launch!' : 
              ` ${tourSteps.length - currentTourStep - 1} more to go`
            }
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
};

export default GuidedTour;
