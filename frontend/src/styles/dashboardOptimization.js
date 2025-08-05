/**
 * Dashboard Space Optimization Styles
 * Comprehensive CSS optimization for eliminating empty space and improving content density
 * Created by Senior UI/UX Designer Lead - 2025 Modern Dashboard Standards
 */

// Responsive spacing system based on screen size
export const responsiveSpacing = {
  // Mobile-first approach with progressive enhancement
  mobile: {
    cardPadding: 1.5,
    sectionMargin: 1,
    headerMargin: 1,
    metricPadding: 1,
    iconSize: '1rem',
    fontSize: {
      header: '0.95rem',
      caption: '0.65rem',
      metric: '1.2rem',
    }
  },
  tablet: {
    cardPadding: 2,
    sectionMargin: 1.5,
    headerMargin: 1.5,
    metricPadding: 1.25,
    iconSize: '1.1rem',
    fontSize: {
      header: '1rem',
      caption: '0.7rem',
      metric: '1.3rem',
    }
  },
  desktop: {
    cardPadding: 2.5,
    sectionMargin: 2,
    headerMargin: 2,
    metricPadding: 1.5,
    iconSize: '1.25rem',
    fontSize: {
      header: '1.1rem',
      caption: '0.7rem',
      metric: '1.4rem',
    }
  },
  large: {
    cardPadding: 3,
    sectionMargin: 2.5,
    headerMargin: 2.5,
    metricPadding: 1.75,
    iconSize: '1.5rem',
    fontSize: {
      header: '1.2rem',
      caption: '0.75rem',
      metric: '1.5rem',
    }
  }
};

// Optimized card base styles
export const optimizedCardStyles = (theme, density = 'desktop') => {
  const spacing = responsiveSpacing[density];
  
  return {
    padding: spacing.cardPadding,
    borderRadius: 4,
    height: '100%',
    width: '100%',
    flex: 1,
    minWidth: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    },
  };
};

// Optimized header styles
export const optimizedHeaderStyles = (theme, density = 'desktop') => {
  const spacing = responsiveSpacing[density];
  
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.headerMargin,
    position: 'relative',
    zIndex: 2,
    minHeight: 'auto', // Prevent unnecessary height expansion
  };
};

// Optimized typography styles
export const optimizedTypographyStyles = (variant, density = 'desktop') => {
  const spacing = responsiveSpacing[density];
  
  const styles = {
    cardTitle: {
      fontWeight: 700,
      color: 'text.primary',
      marginBottom: 0.25,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      fontSize: spacing.fontSize.header,
      lineHeight: 1.2,
    },
    cardCaption: {
      color: 'text.secondary',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontSize: spacing.fontSize.caption,
      lineHeight: 1,
    },
    metricValue: {
      fontWeight: 800,
      fontSize: spacing.fontSize.metric,
      marginBottom: 0.25,
      lineHeight: 1,
    },
    metricLabel: {
      color: 'text.secondary',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontSize: spacing.fontSize.caption,
      lineHeight: 1,
    }
  };
  
  return styles[variant] || {};
};

// Optimized metric card styles
export const optimizedMetricCardStyles = (theme, density = 'desktop') => {
  const spacing = responsiveSpacing[density];
  
  return {
    padding: spacing.metricPadding,
    borderRadius: 3,
    textAlign: 'center',
    height: '100%',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: density === 'mobile' ? 60 : density === 'tablet' ? 70 : 80,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  };
};

// Temperature Compliance Card Optimized Layout
export const temperatureCardOptimizedStyles = (theme, density = 'desktop') => {
  const spacing = responsiveSpacing[density];
  
  return {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: density === 'mobile' ? 2 : density === 'tablet' ? 3 : 4,
      flexWrap: density === 'mobile' ? 'wrap' : 'nowrap',
      marginBottom: spacing.sectionMargin,
    },
    dateSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: density === 'mobile' ? 100 : density === 'tablet' ? 120 : 140,
      padding: spacing.metricPadding,
      borderRadius: 3,
      background: 'rgba(0,0,0,0.04)',
      border: '1px solid rgba(0,0,0,0.08)',
    },
    metricsSection: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: density === 'mobile' ? 2 : density === 'tablet' ? 2.5 : 3,
      borderRadius: 3,
      border: '2px solid rgba(76, 175, 80, 0.2)',
    },
    statusSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.sectionMargin,
      minWidth: density === 'mobile' ? 150 : density === 'tablet' ? 180 : 200,
      padding: spacing.metricPadding,
      borderRadius: 3,
      background: 'rgba(0,0,0,0.02)',
      border: '1px solid rgba(0,0,0,0.08)',
    }
  };
};

// Icon optimization styles
export const optimizedIconStyles = (theme, density = 'desktop') => {
  const spacing = responsiveSpacing[density];
  
  return {
    cardIcon: {
      padding: density === 'mobile' ? 0.75 : 1,
      borderRadius: 2,
      background: 'rgba(76, 175, 80, 0.1)',
      border: '1px solid rgba(76, 175, 80, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: density === 'mobile' ? 32 : density === 'tablet' ? 36 : 40,
      height: density === 'mobile' ? 32 : density === 'tablet' ? 36 : 40,
      fontSize: spacing.iconSize,
    }
  };
};

// Button optimization styles
export const optimizedButtonStyles = (theme, density = 'desktop') => {
  return {
    padding: density === 'mobile' ? '8px 16px' : '10px 20px',
    borderRadius: 3,
    fontSize: density === 'mobile' ? '0.8rem' : '0.875rem',
    fontWeight: 600,
    textTransform: 'none',
    boxShadow: 'none',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }
  };
};

// Grid spacing optimization
export const optimizedGridSpacing = (density = 'desktop') => {
  return density === 'mobile' ? 1 : density === 'tablet' ? 1.5 : 2;
};

// Responsive breakpoints for density system
export const densityBreakpoints = {
  mobile: '(max-width: 599px)',
  tablet: '(min-width: 600px) and (max-width: 959px)',
  desktop: '(min-width: 960px) and (max-width: 1279px)',
  large: '(min-width: 1280px)',
};

// Hook for responsive density
export const useResponsiveDensity = () => {
  // This would typically use useMediaQuery from MUI
  // For now, returning desktop as default
  return 'desktop';
};

// Utility function to get optimized styles based on density
export const getOptimizedStyles = (component, theme, density = 'desktop') => {
  const styleMap = {
    card: optimizedCardStyles,
    header: optimizedHeaderStyles,
    metricCard: optimizedMetricCardStyles,
    temperatureCard: temperatureCardOptimizedStyles,
    icon: optimizedIconStyles,
    button: optimizedButtonStyles,
  };
  
  return styleMap[component]?.(theme, density) || {};
};

export default {
  responsiveSpacing,
  optimizedCardStyles,
  optimizedHeaderStyles,
  optimizedTypographyStyles,
  optimizedMetricCardStyles,
  temperatureCardOptimizedStyles,
  optimizedIconStyles,
  optimizedButtonStyles,
  optimizedGridSpacing,
  densityBreakpoints,
  useResponsiveDensity,
  getOptimizedStyles,
};
