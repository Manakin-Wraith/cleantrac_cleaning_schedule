import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Grid,
  Chip,
  Fade
} from '@mui/material';
import { 
  RocketLaunch as RocketLaunchIcon,
  Timer as TimerIcon,
  Security as SecurityIcon,
  CreditCardOff as CreditCardOffIcon,
  CheckCircle as CheckCircleIcon,
  Restaurant as RestaurantIcon,
  LocalGroceryStore as LocalGroceryStoreIcon,
  Cake as CakeIcon
} from '@mui/icons-material';

const InterestCapture = ({ onNext, onBack, canGoBack }) => {
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  const industries = [
    {
      id: 'bakery',
      name: 'Bakery',
      icon: CakeIcon,
      description: 'Bread, pastries, cakes & baked goods',
      popular: true
    },
    {
      id: 'restaurant',
      name: 'Restaurant',
      icon: RestaurantIcon,
      description: 'Full-service dining & food preparation',
      popular: true
    },
    {
      id: 'grocery',
      name: 'Grocery & Retail Store',
      icon: LocalGroceryStoreIcon,
      description: 'Supermarkets, convenience stores & FMCG retail',
      popular: true
    },
    {
      id: 'deli',
      name: 'Deli & Market',
      icon: LocalGroceryStoreIcon,
      description: 'Prepared foods, sandwiches & retail',
      popular: false
    },
    {
      id: 'catering',
      name: 'Catering',
      icon: RestaurantIcon,
      description: 'Event catering & food service',
      popular: false
    },
    {
      id: 'other',
      name: 'Other Food Business',
      icon: RestaurantIcon,
      description: 'Food manufacturing, processing & more',
      popular: false
    }
  ];

  const benefits = [
    {
      icon: <TimerIcon />,
      title: 'Setup in 10 minutes',
      description: 'Get your system running immediately'
    },
    {
      icon: <SecurityIcon />,
      title: 'Secure & Private',
      description: 'Your data stays completely isolated'
    },
    {
      icon: <CreditCardOffIcon />,
      title: 'No credit card required',
      description: 'Full access during your free trial'
    }
  ];

  const handleIndustrySelect = (industry) => {
    setSelectedIndustry(industry);
  };

  const handleStartTrial = () => {
    if (!selectedIndustry) {
      // Auto-select bakery as default for demo
      setSelectedIndustry(industries[0]);
    }
    
    onNext({
      industry: selectedIndustry || industries[0],
      startedAt: new Date().toISOString()
    });
  };

  return (
    <Fade in={true} timeout={600}>
      <Box className="step-container">
        <RocketLaunchIcon className="step-icon" />
        
        <Typography variant="h4" className="step-title">
          Start Your Free Trial
        </Typography>
        
        <Typography variant="body1" className="step-description">
          Join thousands of food businesses using CleanTrac to streamline their 
          food safety management. Get started in minutes with our guided setup.
        </Typography>

        {/* Benefits - Simplified */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
          maxWidth: 600,
          mx: 'auto'
        }}>
          {benefits.map((benefit, index) => (
            <Box key={index} sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: 1.5,
              borderRadius: 1,
              background: '#f0f9ff',
              border: '1px solid #e0f2fe',
              minWidth: 180
            }}>
              <Box sx={{ color: '#3b82f6', mr: 1, fontSize: '1.25rem' }}>
                {benefit.icon}
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af', mb: 0.25 }}>
                  {benefit.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {benefit.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Industry Selection */}
        <Box sx={{ mb: 3, width: '100%', maxWidth: 700 }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 700, 
            mb: 2, 
            color: '#1a202c',
            textAlign: 'center',
            fontSize: { xs: '1.5rem', sm: '1.75rem' }
          }}>
            What type of food business do you run?
          </Typography>
          <Typography variant="body1" sx={{ 
            mb: 3, 
            color: '#64748b',
            textAlign: 'center',
            maxWidth: 600,
            mx: 'auto',
            lineHeight: 1.5,
            fontSize: '1rem',
            fontWeight: 400
          }}>
            Choose your industry to get personalized templates and recommendations
          </Typography>
          <Grid container spacing={2}>
            {industries.map((industry) => (
              <Grid size={{ xs: 12, sm: 6 }} key={industry.id}>
                <Card
                  onClick={() => handleIndustrySelect(industry.id)}
                  sx={{
                    border: selectedIndustry === industry.id ? '3px solid #3b82f6' : '2px solid #e2e8f0',
                    borderRadius: 3,
                    p: 4,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: selectedIndustry === industry.id 
                      ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                      : '#ffffff',
                    transform: selectedIndustry === industry.id ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: selectedIndustry === industry.id 
                      ? '0 12px 32px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      border: selectedIndustry === industry.id ? '3px solid #2563eb' : '3px solid #60a5fa',
                      transform: 'translateY(-4px) scale(1.02)',
                      boxShadow: '0 16px 40px rgba(59, 130, 246, 0.2)'
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': selectedIndustry === industry.id ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      borderWidth: '0 60px 60px 0',
                      borderColor: 'transparent #10b981 transparent transparent'
                    } : {},
                    '&::after': selectedIndustry === industry.id ? {
                      content: '"✓"',
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      zIndex: 1
                    } : {}
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <industry.icon sx={{ fontSize: 48, color: '#3b82f6', mb: 2 }} />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700, 
                      mb: 1.5, 
                      color: '#1a202c',
                      fontSize: '1.25rem'
                    }}>
                      {industry.name}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#64748b',
                      lineHeight: 1.5,
                      fontSize: '0.95rem',
                      fontWeight: 400
                    }}>
                      {industry.description}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* What You'll Get */}
        <Box sx={{ mb: 4, textAlign: 'left', maxWidth: 500 }}>
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: '#2c3e50' }}>
            What you'll get in your free trial:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              'Complete food safety management system',
              'Temperature monitoring & alerts',
              'Cleaning task scheduling & tracking',
              'Supplier & receiving management',
              'Recipe & production tracking',
              'Compliance reporting & audit trails',
              'Multi-department support',
              'Mobile-friendly interface'
            ].map((feature, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} />
                <Typography variant="body2" color="text.secondary">
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box className="step-actions">
          <Button
            variant="contained"
            size="large"
            onClick={handleStartTrial}
            className="step-button primary"
            sx={{ minWidth: 200 }}
          >
            Start Free Trial
            <RocketLaunchIcon sx={{ ml: 1, fontSize: '1.2rem' }} />
          </Button>
        </Box>

        {/* Trust Indicators */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            ✓ No credit card required • ✓ 14-day free trial • ✓ Cancel anytime
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
};

export default InterestCapture;
