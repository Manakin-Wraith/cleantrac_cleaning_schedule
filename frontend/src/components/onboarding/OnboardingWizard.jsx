import React, { useState, useEffect } from 'react';
import { 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Box, 
  Typography, 
  Container,
  Paper,
  LinearProgress,
  Alert,
  Fade
} from '@mui/material';
import { 
  RocketLaunch as RocketLaunchIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  CloudUpload as CloudUploadIcon,
  Tour as TourIcon
} from '@mui/icons-material';
import InterestCapture from './InterestCapture';
import BasicInfoForm from './BasicInfoForm';
import SetupChoice from './SetupChoice';
import DataUploadValidator from './DataUploadValidator';
import ProvisioningProgress from './ProvisioningProgress';
import GuidedTour from './GuidedTour';
import './OnboardingWizard.css';

const OnboardingWizard = ({ onComplete, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    selectedIndustry: null,
    companyInfo: null,
    setupChoice: null,
    uploadedData: null,
    tenantInfo: null,
    sessionId: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = [
    {
      label: 'Get Started',
      icon: <RocketLaunchIcon />,
      component: InterestCapture,
      title: 'Welcome to CleenTrac',
      subtitle: 'Start your free trial in under 10 minutes'
    },
    {
      label: 'Company Info',
      icon: <BusinessIcon />,
      component: BasicInfoForm,
      title: 'Tell us about your business',
      subtitle: 'Basic information to set up your account'
    },
    {
      label: 'Setup Choice',
      icon: <SettingsIcon />,
      component: SetupChoice,
      title: 'Choose your setup method',
      subtitle: 'Demo data or upload your own'
    },
    {
      label: 'Data Upload',
      icon: <CloudUploadIcon />,
      component: DataUploadValidator,
      title: 'Upload your data',
      subtitle: 'Validate and import your business data'
    },
    {
      label: 'Provisioning',
      icon: <CloudUploadIcon />,
      component: ProvisioningProgress,
      title: 'Setting up your system',
      subtitle: 'Creating your dedicated CleenTrac environment'
    },
    {
      label: 'Welcome Tour',
      icon: <TourIcon />,
      component: GuidedTour,
      title: 'Welcome to your CleenTrac system!',
      subtitle: 'Let us show you around'
    }
  ];

  // Ensure activeStep is within bounds
  const safeActiveStep = Math.max(0, Math.min(activeStep, steps.length - 1));
  const currentStep = steps[safeActiveStep] || steps[0]; // Safety fallback
  
  // Debug logging
  console.log('OnboardingWizard render:', {
    activeStep,
    safeActiveStep,
    currentStepLabel: currentStep?.label,
    totalSteps: steps.length
  });

  const handleNext = (stepData) => {
    setError(null);
    
    console.log('OnboardingWizard handleNext called:', {
      currentStep: activeStep,
      stepData,
      totalSteps: steps.length
    });
    
    // Update onboarding data with step-specific data
    const updatedData = { ...stepData };
    
    // Fix industry data mapping from InterestCapture
    if (stepData.industry) {
      updatedData.selectedIndustry = stepData.industry;
      delete updatedData.industry; // Remove the old key
    }
    
    setOnboardingData(prev => ({
      ...prev,
      ...updatedData
    }));

    // Move to next step
    if (activeStep < steps.length - 1) {
      console.log('Advancing to next step:', activeStep + 1);
      setActiveStep(prev => prev + 1);
    } else {
      // Onboarding complete - only call this from the final step (GuidedTour)
      console.log('Onboarding complete - calling handleComplete');
      handleComplete();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(onboardingData);
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setLoading(false);
  };

  // Skip data upload step if using demo data
  const shouldSkipDataUpload = onboardingData.setupChoice === 'demo';

  useEffect(() => {
    // Skip data upload step if demo was chosen
    if (activeStep === 3 && shouldSkipDataUpload) {
      setActiveStep(4); // Jump to provisioning
    }
  }, [activeStep, shouldSkipDataUpload]);

  const CurrentStepComponent = currentStep.component;

  return (
    <div className="onboarding-wizard-overlay">
      <div className="onboarding-wizard-container">
        {/* Header */}
        <div className="onboarding-wizard-header">
          {/* Close Button */}
          {onClose && (
            <button 
              onClick={onClose}
              className="wizard-close-x-btn"
              aria-label="Close wizard"
            >
              ×
            </button>
          )}
          
          <Typography variant="h4" component="h1" className="wizard-title">
            {currentStep.title}
          </Typography>
          <Typography variant="subtitle1" className="wizard-subtitle">
            {currentStep.subtitle}
          </Typography>
          
          {/* Progress Stepper */}
          <Stepper 
            activeStep={activeStep}
            alternativeLabel
            className="wizard-stepper"
            sx={{
              backgroundColor: 'transparent !important',
              backdropFilter: 'none !important',
              '& .MuiStepConnector-root': {
                top: 22,
              },
              '& .MuiStepConnector-line': {
                borderTopWidth: 2,
              },
              '& .MuiStepLabel-label': {
                fontSize: '0.75rem',
                marginTop: 1,
              },
            }}
          >
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel 
                  icon={step.icon}
                  className={activeStep === index ? 'active-step' : ''}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <Box className="loading-container">
            <LinearProgress />
            <Typography variant="body2" className="loading-text">
              Processing...
            </Typography>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Fade in={true}>
            <Alert severity="error" className="wizard-error">
              {error}
            </Alert>
          </Fade>
        )}

        {/* Content */}
        <div className="onboarding-wizard-content">
          <CurrentStepComponent
            data={onboardingData}
            onNext={handleNext}
            onBack={handleBack}
            onError={handleError}
            setLoading={setLoading}
            canGoBack={activeStep > 0}
            isLastStep={activeStep === steps.length - 1}
          />
        </div>

        {/* Footer */}
        <div className="onboarding-wizard-footer">
          <Typography variant="caption" className="wizard-footer-text">
            Step {activeStep + 1} of {steps.length} • Secure & Private • Cancel Anytime
          </Typography>
          <Button 
            variant="text" 
            onClick={onClose || (() => console.log('Close button clicked'))}
            className="wizard-close-btn"
            sx={{ 
              backgroundColor: 'transparent !important', 
              backdropFilter: 'none !important',
              display: 'inline-flex !important',
              visibility: 'visible !important',
              opacity: '1 !important'
            }}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
