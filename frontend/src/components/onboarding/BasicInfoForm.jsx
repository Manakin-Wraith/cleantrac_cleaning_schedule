import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid,
  InputAdornment,
  Alert,
  Fade,
  Chip
} from '@mui/material';
import { 
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const BasicInfoForm = ({ data, onNext, onBack, canGoBack, onError }) => {
  // Helper function to get industry name from ID
  const getIndustryName = (industryId) => {
    const industries = {
      'bakery': 'Bakery',
      'restaurant': 'Restaurant',
      'grocery': 'Grocery & Retail Store',
      'deli': 'Deli & Market',
      'catering': 'Catering',
      'other': 'Other Food Business'
    };
    return industries[industryId] || 'Unknown Industry';
  };

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    subdomain: ''
  });
  const [errors, setErrors] = useState({});
  const [subdomainStatus, setSubdomainStatus] = useState(null); // null, 'checking', 'available', 'taken'
  const [subdomainCheckTimeout, setSubdomainCheckTimeout] = useState(null);

  useEffect(() => {
    // Pre-populate with any existing data
    if (data?.companyInfo) {
      setFormData(data.companyInfo);
    }
  }, [data]);

  // Auto-generate subdomain from company name
  useEffect(() => {
    if (formData.companyName && !formData.subdomain) {
      const generatedSubdomain = formData.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
      
      if (generatedSubdomain) {
        setFormData(prev => ({
          ...prev,
          subdomain: generatedSubdomain
        }));
      }
    }
  }, [formData.companyName]);

  // Debounced subdomain availability check
  useEffect(() => {
    if (formData.subdomain && formData.subdomain.length >= 3) {
      // Clear existing timeout
      if (subdomainCheckTimeout) {
        clearTimeout(subdomainCheckTimeout);
      }

      // Set checking status
      setSubdomainStatus('checking');

      // Set new timeout for checking
      const timeout = setTimeout(() => {
        checkSubdomainAvailability(formData.subdomain);
      }, 500);

      setSubdomainCheckTimeout(timeout);
    } else {
      setSubdomainStatus(null);
    }

    return () => {
      if (subdomainCheckTimeout) {
        clearTimeout(subdomainCheckTimeout);
      }
    };
  }, [formData.subdomain]);

  const checkSubdomainAvailability = async (subdomain) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/onboarding/check-subdomain/?subdomain=${subdomain}`);
      // const result = await response.json();
      
      // Mock check for demo - simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock logic: subdomains with 'test' or 'demo' are taken
      const isTaken = subdomain.includes('test') || subdomain.includes('demo');
      
      setSubdomainStatus(isTaken ? 'taken' : 'available');
    } catch (error) {
      console.error('Error checking subdomain:', error);
      setSubdomainStatus('available'); // Default to available on error
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Subdomain is required';
    } else if (formData.subdomain.length < 3) {
      newErrors.subdomain = 'Subdomain must be at least 3 characters';
    } else if (!/^[a-z0-9]+$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Subdomain can only contain lowercase letters and numbers';
    } else if (subdomainStatus === 'taken') {
      newErrors.subdomain = 'This subdomain is already taken';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    
    // Special handling for subdomain
    if (field === 'subdomain') {
      const cleanValue = value.toLowerCase().replace(/[^a-z0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [field]: cleanValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleNext = () => {
    if (validateForm() && subdomainStatus === 'available') {
      onNext({
        companyInfo: formData
      });
    }
  };

  const getSubdomainHelperText = () => {
    if (subdomainStatus === 'checking') {
      return 'Checking availability...';
    } else if (subdomainStatus === 'available') {
      return '✓ Available';
    } else if (subdomainStatus === 'taken') {
      return '✗ This subdomain is already taken';
    }
    return `Your CleanTrac URL will be: ${formData.subdomain || 'yourcompany'}.manager.cleentrac.com`;
  };

  const getSubdomainColor = () => {
    if (subdomainStatus === 'available') return 'success';
    if (subdomainStatus === 'taken') return 'error';
    return 'primary';
  };

  return (
    <Fade in={true} timeout={600}>
      <Box className="step-container">
        <BusinessIcon className="step-icon" />
        
        <Typography variant="h4" className="step-title">
          Tell us about your business
        </Typography>
        
        <Typography variant="body1" className="step-description">
          We'll use this information to set up your personalized CleanTrac system.
          All information is kept secure and private.
        </Typography>

        <Box className="wizard-form">
          <Grid container spacing={3}>
            {/* Company Name */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.companyName}
                onChange={handleInputChange('companyName')}
                error={!!errors.companyName}
                helperText={errors.companyName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="e.g. Fresh Bakery & Deli"
              />
            </Grid>

            {/* Contact Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Your Name"
                value={formData.contactName}
                onChange={handleInputChange('contactName')}
                error={!!errors.contactName}
                helperText={errors.contactName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="e.g. John Smith"
              />
            </Grid>

            {/* Email */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="e.g. john@freshbakery.com"
              />
            </Grid>

            {/* Phone (Optional) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone Number (Optional)"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="e.g. +1 (555) 123-4567"
              />
            </Grid>

            {/* Address (Optional) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Business Address (Optional)"
                value={formData.address}
                onChange={handleInputChange('address')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="e.g. 123 Main St, City, State"
              />
            </Grid>

            {/* Subdomain */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Choose Your CleanTrac URL"
                value={formData.subdomain}
                onChange={handleInputChange('subdomain')}
                error={!!errors.subdomain}
                helperText={errors.subdomain || getSubdomainHelperText()}
                color={getSubdomainColor()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography variant="body2" color="text.secondary">
                        https://
                      </Typography>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="body2" color="text.secondary">
                        .manager.cleentrac.com
                      </Typography>
                      {subdomainStatus === 'available' && (
                        <CheckCircleIcon sx={{ color: 'success.main', ml: 1 }} />
                      )}
                      {subdomainStatus === 'taken' && (
                        <ErrorIcon sx={{ color: 'error.main', ml: 1 }} />
                      )}
                    </InputAdornment>
                  ),
                }}
                placeholder="yourcompany"
              />
            </Grid>
          </Grid>

          {/* Privacy Notice */}
          <Alert severity="info" sx={{ mt: 3, mb: 3 }}>
            <Typography variant="body2">
              🔒 Your information is encrypted and secure. We'll never share your data with third parties.
            </Typography>
          </Alert>

          {/* Selected Industry Display */}
          {data?.selectedIndustry && (
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Chip 
                label={`Industry: ${getIndustryName(data.selectedIndustry)}`}
                variant="outlined"
                sx={{ borderColor: '#667eea', color: '#667eea' }}
              />
            </Box>
          )}
        </Box>

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
            disabled={subdomainStatus !== 'available' || Object.keys(errors).length > 0}
            className="step-button primary"
          >
            Continue
          </Button>
        </Box>
      </Box>
    </Fade>
  );
};

export default BasicInfoForm;
