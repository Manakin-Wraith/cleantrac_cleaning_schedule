/**
 * Optimized Dashboard Cards Component
 * Space-efficient, responsive dashboard cards with modern UI/UX
 * Created by Senior UI/UX Designer Lead - 2025 Dashboard Standards
 */

import React from 'react';
import {
    Paper,
    Typography,
    Box,
    Button,
    LinearProgress,
    Chip,
    Grid,
    useTheme,
    useMediaQuery
} from '@mui/material';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningIcon from '@mui/icons-material/Warning';
import dashboardOptimization from '../styles/dashboardOptimization';

// Optimized Cleaning At A Glance Card
export const OptimizedCleaningCard = ({ cleaningMetrics, onViewTasks }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    
    const getDensityLevel = () => {
        if (isMobile) return 'mobile';
        if (isTablet) return 'tablet';
        if (useMediaQuery(theme.breakpoints.down('lg'))) return 'desktop';
        return 'large';
    };
    
    const densityLevel = getDensityLevel();
    const spacing = dashboardOptimization.responsiveSpacing[densityLevel];

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                ...dashboardOptimization.optimizedCardStyles(theme, densityLevel),
                p: spacing.cardPadding,
                flex: 1,
                minWidth: 0,
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    '& .card-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                    },
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #4CAF50, #8BC34A, #CDDC39)',
                    borderRadius: '16px 16px 0 0',
                },
            }}
        >
            {/* Optimized Header */}
            <Box sx={{ 
                ...dashboardOptimization.optimizedHeaderStyles(theme, densityLevel),
                mb: spacing.headerMargin,
            }}>
                <Box>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            ...dashboardOptimization.optimizedTypographyStyles('cardTitle', densityLevel),
                            fontSize: spacing.fontSize.header,
                        }}
                    >
                        🧹 Cleaning At A Glance
                    </Typography>
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            ...dashboardOptimization.optimizedTypographyStyles('cardCaption', densityLevel),
                            fontSize: spacing.fontSize.caption,
                        }}
                    >
                        Task Overview
                    </Typography>
                </Box>
                <Box 
                    className="card-icon" 
                    sx={{ 
                        ...dashboardOptimization.optimizedIconStyles(theme, densityLevel).cardIcon,
                        minWidth: densityLevel === 'mobile' ? 32 : densityLevel === 'tablet' ? 36 : 40,
                        height: densityLevel === 'mobile' ? 32 : densityLevel === 'tablet' ? 36 : 40,
                    }}
                >
                    <CleaningServicesIcon sx={{ color: 'success.main', fontSize: spacing.iconSize }} />
                </Box>
            </Box>

            {/* Optimized Metrics Grid */}
            <Grid container spacing={densityLevel === 'mobile' ? 1 : 1.5} sx={{ mb: spacing.sectionMargin }}>
                <Grid item xs={4}>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            ...dashboardOptimization.optimizedMetricCardStyles(theme, densityLevel),
                            background: 'rgba(76, 175, 80, 0.1)',
                            border: '1px solid rgba(76, 175, 80, 0.2)',
                        }}
                    >
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                ...dashboardOptimization.optimizedTypographyStyles('metricValue', densityLevel),
                                color: 'success.main',
                                fontSize: spacing.fontSize.metric,
                            }}
                        >
                            {cleaningMetrics.completed}
                        </Typography>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                ...dashboardOptimization.optimizedTypographyStyles('metricLabel', densityLevel),
                                fontSize: spacing.fontSize.caption,
                            }}
                        >
                            Completed
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            ...dashboardOptimization.optimizedMetricCardStyles(theme, densityLevel),
                            background: 'rgba(255, 152, 0, 0.1)',
                            border: '1px solid rgba(255, 152, 0, 0.2)',
                        }}
                    >
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                ...dashboardOptimization.optimizedTypographyStyles('metricValue', densityLevel),
                                color: 'warning.main',
                                fontSize: spacing.fontSize.metric,
                            }}
                        >
                            {cleaningMetrics.pending}
                        </Typography>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                ...dashboardOptimization.optimizedTypographyStyles('metricLabel', densityLevel),
                                fontSize: spacing.fontSize.caption,
                            }}
                        >
                            Pending
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            ...dashboardOptimization.optimizedMetricCardStyles(theme, densityLevel),
                            background: 'rgba(244, 67, 54, 0.1)',
                            border: '1px solid rgba(244, 67, 54, 0.2)',
                        }}
                    >
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                ...dashboardOptimization.optimizedTypographyStyles('metricValue', densityLevel),
                                color: 'error.main',
                                fontSize: spacing.fontSize.metric,
                            }}
                        >
                            {cleaningMetrics.overdue}
                        </Typography>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                ...dashboardOptimization.optimizedTypographyStyles('metricLabel', densityLevel),
                                fontSize: spacing.fontSize.caption,
                            }}
                        >
                            Overdue
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Optimized Action Button */}
            <Button
                variant="contained"
                onClick={onViewTasks}
                sx={{
                    ...dashboardOptimization.optimizedButtonStyles(theme, densityLevel),
                    width: '100%',
                    background: 'linear-gradient(45deg, #4CAF50, #66BB6A)',
                    color: 'white',
                    fontWeight: 600,
                    mt: 'auto', // Push to bottom
                }}
            >
                View All Tasks
            </Button>
        </Paper>
    );
};

// Optimized Recipe Production At A Glance Card
export const OptimizedRecipeCard = ({ recipeMetrics, onViewTasks }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    
    const getDensityLevel = () => {
        if (isMobile) return 'mobile';
        if (isTablet) return 'tablet';
        if (useMediaQuery(theme.breakpoints.down('lg'))) return 'desktop';
        return 'large';
    };
    
    const densityLevel = getDensityLevel();
    const spacing = dashboardOptimization.responsiveSpacing[densityLevel];

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                ...dashboardOptimization.optimizedCardStyles(theme, densityLevel),
                p: spacing.cardPadding,
                flex: 1,
                minWidth: 0,
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    '& .card-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                    },
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #FF9800, #FFC107, #FFEB3B)',
                    borderRadius: '16px 16px 0 0',
                },
            }}
        >
            {/* Optimized Header */}
            <Box sx={{ 
                ...dashboardOptimization.optimizedHeaderStyles(theme, densityLevel),
                mb: spacing.headerMargin,
            }}>
                <Box>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            ...dashboardOptimization.optimizedTypographyStyles('cardTitle', densityLevel),
                            fontSize: spacing.fontSize.header,
                        }}
                    >
                        🍳 Recipe Production At A Glance
                    </Typography>
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            ...dashboardOptimization.optimizedTypographyStyles('cardCaption', densityLevel),
                            fontSize: spacing.fontSize.caption,
                        }}
                    >
                        Production Overview
                    </Typography>
                </Box>
                <Box 
                    className="card-icon" 
                    sx={{ 
                        ...dashboardOptimization.optimizedIconStyles(theme, densityLevel).cardIcon,
                        background: 'rgba(255, 152, 0, 0.1)',
                        border: '1px solid rgba(255, 152, 0, 0.2)',
                        minWidth: densityLevel === 'mobile' ? 32 : densityLevel === 'tablet' ? 36 : 40,
                        height: densityLevel === 'mobile' ? 32 : densityLevel === 'tablet' ? 36 : 40,
                    }}
                >
                    <RestaurantIcon sx={{ color: 'warning.main', fontSize: spacing.iconSize }} />
                </Box>
            </Box>

            {/* Optimized Metrics Grid */}
            <Grid container spacing={densityLevel === 'mobile' ? 1 : 1.5} sx={{ mb: spacing.sectionMargin }}>
                <Grid item xs={4}>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            ...dashboardOptimization.optimizedMetricCardStyles(theme, densityLevel),
                            background: 'rgba(76, 175, 80, 0.1)',
                            border: '1px solid rgba(76, 175, 80, 0.2)',
                        }}
                    >
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                ...dashboardOptimization.optimizedTypographyStyles('metricValue', densityLevel),
                                color: 'success.main',
                                fontSize: spacing.fontSize.metric,
                            }}
                        >
                            {recipeMetrics.completed}
                        </Typography>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                ...dashboardOptimization.optimizedTypographyStyles('metricLabel', densityLevel),
                                fontSize: spacing.fontSize.caption,
                            }}
                        >
                            Completed
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            ...dashboardOptimization.optimizedMetricCardStyles(theme, densityLevel),
                            background: 'rgba(255, 152, 0, 0.1)',
                            border: '1px solid rgba(255, 152, 0, 0.2)',
                        }}
                    >
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                ...dashboardOptimization.optimizedTypographyStyles('metricValue', densityLevel),
                                color: 'warning.main',
                                fontSize: spacing.fontSize.metric,
                            }}
                        >
                            {recipeMetrics.pending}
                        </Typography>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                ...dashboardOptimization.optimizedTypographyStyles('metricLabel', densityLevel),
                                fontSize: spacing.fontSize.caption,
                            }}
                        >
                            Pending
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            ...dashboardOptimization.optimizedMetricCardStyles(theme, densityLevel),
                            background: 'rgba(244, 67, 54, 0.1)',
                            border: '1px solid rgba(244, 67, 54, 0.2)',
                        }}
                    >
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                ...dashboardOptimization.optimizedTypographyStyles('metricValue', densityLevel),
                                color: 'error.main',
                                fontSize: spacing.fontSize.metric,
                            }}
                        >
                            {recipeMetrics.overdue}
                        </Typography>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                ...dashboardOptimization.optimizedTypographyStyles('metricLabel', densityLevel),
                                fontSize: spacing.fontSize.caption,
                            }}
                        >
                            Overdue
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Optimized Action Button */}
            <Button
                variant="contained"
                onClick={onViewTasks}
                sx={{
                    ...dashboardOptimization.optimizedButtonStyles(theme, densityLevel),
                    width: '100%',
                    background: 'linear-gradient(45deg, #FF9800, #FFB74D)',
                    color: 'white',
                    fontWeight: 600,
                    mt: 'auto', // Push to bottom
                }}
            >
                View All Tasks
            </Button>
        </Paper>
    );
};

// Optimized Temperature Compliance Card
export const OptimizedTemperatureCard = ({ tempMetrics = {} }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    
    // Defensive programming: provide defaults for tempMetrics
    const safeMetrics = {
        logged: 0,
        total: 0,
        outOfRange: 0,
        staffName: '',
        period: 'AM',
        ...tempMetrics
    };
    
    const getDensityLevel = () => {
        if (isMobile) return 'mobile';
        if (isTablet) return 'tablet';
        if (useMediaQuery(theme.breakpoints.down('lg'))) return 'desktop';
        return 'large';
    };
    
    const densityLevel = getDensityLevel();
    const spacing = dashboardOptimization.responsiveSpacing[densityLevel];
    const tempStyles = dashboardOptimization.temperatureCardOptimizedStyles(theme, densityLevel);

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                ...dashboardOptimization.optimizedCardStyles(theme, densityLevel),
                p: spacing.cardPadding,
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    '& .card-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                    },
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: safeMetrics.outOfRange ? 
                        'linear-gradient(90deg, #f44336, #ff5722, #ff9800)' :
                        'linear-gradient(90deg, #2196F3, #00BCD4, #4CAF50)',
                    borderRadius: '16px 16px 0 0',
                },
            }}
        >
            {/* Optimized Header */}
            <Box sx={{ 
                ...dashboardOptimization.optimizedHeaderStyles(theme, densityLevel),
                mb: spacing.headerMargin,
            }}>
                <Box>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            ...dashboardOptimization.optimizedTypographyStyles('cardTitle', densityLevel),
                            fontSize: spacing.fontSize.header,
                        }}
                    >
                        🌡️ Temperature Compliance
                    </Typography>
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            ...dashboardOptimization.optimizedTypographyStyles('cardCaption', densityLevel),
                            fontSize: spacing.fontSize.caption,
                        }}
                    >
                        Today's Monitoring
                    </Typography>
                </Box>
                <Box 
                    className="card-icon" 
                    sx={{ 
                        ...dashboardOptimization.optimizedIconStyles(theme, densityLevel).cardIcon,
                        background: safeMetrics.outOfRange ? 'rgba(244, 67, 54, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                        border: safeMetrics.outOfRange ? '1px solid rgba(244, 67, 54, 0.2)' : '1px solid rgba(33, 150, 243, 0.2)',
                        minWidth: densityLevel === 'mobile' ? 32 : densityLevel === 'tablet' ? 36 : 40,
                        height: densityLevel === 'mobile' ? 32 : densityLevel === 'tablet' ? 36 : 40,
                    }}
                >
                    <ThermostatIcon sx={{ 
                        color: safeMetrics.outOfRange ? 'error.main' : 'primary.main', 
                        fontSize: spacing.iconSize 
                    }} />
                </Box>
            </Box>

            {/* Optimized Three-Section Layout */}
            <Box sx={tempStyles.container}>
                {/* Date/Time Section */}
                <Box sx={tempStyles.dateSection}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: spacing.fontSize.caption }}>
                        Date
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: spacing.fontSize.caption }}>
                        {new Date().toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: spacing.fontSize.caption }}>
                        Time
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: spacing.fontSize.caption }}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                </Box>

                {/* Main Metrics Section */}
                <Box sx={tempStyles.metricsSection}>
                    <Typography 
                        variant="h2" 
                        sx={{ 
                            fontWeight: 800, 
                            color: 'text.primary', 
                            mb: 1,
                            fontSize: densityLevel === 'mobile' ? '1.5rem' : densityLevel === 'tablet' ? '1.75rem' : '2rem',
                        }}
                    >
                        {safeMetrics.logged} / {safeMetrics.total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, fontSize: spacing.fontSize.caption }}>
                        Temperature Logs
                    </Typography>
                    <LinearProgress 
                        variant="determinate" 
                        value={(safeMetrics.logged / safeMetrics.total) * 100} 
                        sx={{ 
                            height: densityLevel === 'mobile' ? 6 : 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                                background: safeMetrics.outOfRange ? 
                                    'linear-gradient(90deg, #f44336, #ff5722)' :
                                    'linear-gradient(90deg, #4CAF50, #66BB6A)',
                            }
                        }} 
                    />
                </Box>

                {/* Status Section */}
                <Box sx={tempStyles.statusSection}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {safeMetrics.outOfRange ? (
                            <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: spacing.iconSize }} />
                        ) : (
                            <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: spacing.iconSize }} />
                        )}
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: spacing.fontSize.caption }}>
                            Out of range: {safeMetrics.outOfRange}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: spacing.fontSize.caption }}>
                        Assigned staff: {safeMetrics.staffName}
                    </Typography>
                    <Chip 
                        label={safeMetrics.outOfRange ? "Action Required" : "All Good"} 
                        size="small"
                        sx={{ 
                            mt: 1,
                            fontSize: spacing.fontSize.caption,
                            height: densityLevel === 'mobile' ? 24 : 28,
                            backgroundColor: safeMetrics.outOfRange ? 'error.light' : 'success.light',
                            color: safeMetrics.outOfRange ? 'error.contrastText' : 'success.contrastText',
                        }}
                    />
                </Box>
            </Box>
        </Paper>
    );
};

// Optimized Receiving KPI Components

// Today's Deliveries KPI Card
export const OptimizedTodaysDeliveriesCard = ({ deliveryMetrics = {}, onViewDetails }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    
    // Defensive programming: provide defaults for deliveryMetrics
    const safeMetrics = {
        todaysDeliveries: 0,
        totalDeliveries: 0,
        ...deliveryMetrics
    };
    
    const getDensityLevel = () => {
        if (isMobile) return 'mobile';
        if (isTablet) return 'tablet';
        if (useMediaQuery(theme.breakpoints.down('lg'))) return 'desktop';
        return 'large';
    };
    
    const densityLevel = getDensityLevel();
    const spacing = dashboardOptimization.responsiveSpacing[densityLevel];

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                ...dashboardOptimization.optimizedCardStyles(theme, densityLevel),
                p: spacing.cardPadding,
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    '& .card-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                    },
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #4CAF50, #66BB6A, #81C784)',
                    borderRadius: '16px 16px 0 0',
                },
            }}
        >
            {/* Optimized Header */}
            <Box sx={{ 
                ...dashboardOptimization.optimizedHeaderStyles(theme, densityLevel),
                mb: spacing.headerMargin,
            }}>
                <Box>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            ...dashboardOptimization.optimizedTypographyStyles('cardTitle', densityLevel),
                            fontSize: spacing.fontSize.header,
                        }}
                    >
                        📦 Today's Deliveries
                    </Typography>
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            ...dashboardOptimization.optimizedTypographyStyles('cardCaption', densityLevel),
                            fontSize: spacing.fontSize.caption,
                        }}
                    >
                        Received Today
                    </Typography>
                </Box>
                <Box 
                    className="card-icon" 
                    sx={{ 
                        ...dashboardOptimization.optimizedIconStyles(theme, densityLevel).cardIcon,
                        background: 'rgba(76, 175, 80, 0.1)',
                        border: '1px solid rgba(76, 175, 80, 0.2)',
                        minWidth: densityLevel === 'mobile' ? 32 : densityLevel === 'tablet' ? 36 : 40,
                        height: densityLevel === 'mobile' ? 32 : densityLevel === 'tablet' ? 36 : 40,
                    }}
                >
                    <LocalShippingIcon sx={{ 
                        color: 'success.main', 
                        fontSize: spacing.iconSize 
                    }} />
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.contentGap,
                flex: 1,
            }}>
                {/* Primary Metric */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography 
                        variant="h3" 
                        sx={{ 
                            fontWeight: 'bold',
                            color: 'success.main',
                            fontSize: densityLevel === 'mobile' ? '2rem' : densityLevel === 'tablet' ? '2.25rem' : '2.5rem',
                        }}
                    >
                        {safeMetrics.todaysDeliveries}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: spacing.fontSize.caption }}>
                        Deliveries Today
                    </Typography>
                </Box>

                {/* Status Section */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 1,
                    mt: 'auto'
                }}>
                    <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: spacing.iconSize }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: spacing.fontSize.caption }}>
                        All deliveries processed
                    </Typography>
                </Box>
            </Box>

            {/* Action Button */}
            <Button
                variant="contained"
                size="small"
                onClick={onViewDetails}
                sx={{
                    ...dashboardOptimization.optimizedButtonStyles(theme, densityLevel),
                    width: '100%',
                    background: 'linear-gradient(45deg, #4CAF50, #66BB6A)',
                    color: 'white',
                    fontWeight: 600,
                    mt: 'auto',
                }}
            >
                View All Deliveries
            </Button>
        </Paper>
    );
};

// Expiring Soon KPI Card
export const OptimizedExpiringSoonCard = ({ expiringMetrics = {}, onViewDetails }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    
    // Defensive programming: provide defaults for expiringMetrics
    const safeMetrics = {
        expiringSoon: 0,
        daysThreshold: 7,
        ...expiringMetrics
    };
    
    const getDensityLevel = () => {
        if (isMobile) return 'mobile';
        if (isTablet) return 'tablet';
        if (useMediaQuery(theme.breakpoints.down('lg'))) return 'desktop';
        return 'large';
    };
    
    const densityLevel = getDensityLevel();
    const spacing = dashboardOptimization.responsiveSpacing[densityLevel];
    const isUrgent = safeMetrics.expiringSoon > 0;

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                ...dashboardOptimization.optimizedCardStyles(theme, densityLevel),
                p: spacing.cardPadding,
                cursor: onViewDetails ? 'pointer' : 'default',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    '& .card-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                    },
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: isUrgent ? 
                        'linear-gradient(90deg, #FF9800, #FFB74D, #FFCC02)' :
                        'linear-gradient(90deg, #4CAF50, #66BB6A, #81C784)',
                    borderRadius: '16px 16px 0 0',
                },
            }}
            onClick={onViewDetails}
        >
            {/* Optimized Header */}
            <Box sx={{ 
                ...dashboardOptimization.optimizedHeaderStyles(theme, densityLevel),
                mb: spacing.headerMargin,
            }}>
                <Box>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            ...dashboardOptimization.optimizedTypographyStyles('cardTitle', densityLevel),
                            fontSize: spacing.fontSize.header,
                        }}
                    >
                        ⏰ Expiring Soon
                    </Typography>
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            ...dashboardOptimization.optimizedTypographyStyles('cardCaption', densityLevel),
                            fontSize: spacing.fontSize.caption,
                        }}
                    >
                        ≤{safeMetrics.daysThreshold} days
                    </Typography>
                </Box>
                <Box 
                    className="card-icon" 
                    sx={{ 
                        ...dashboardOptimization.optimizedIconStyles(theme, densityLevel).cardIcon,
                        background: isUrgent ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                        border: isUrgent ? '1px solid rgba(255, 152, 0, 0.2)' : '1px solid rgba(76, 175, 80, 0.2)',
                        minWidth: densityLevel === 'mobile' ? 32 : densityLevel === 'tablet' ? 36 : 40,
                        height: densityLevel === 'mobile' ? 32 : densityLevel === 'tablet' ? 36 : 40,
                    }}
                >
                    <ScheduleIcon sx={{ 
                        color: isUrgent ? 'warning.main' : 'success.main', 
                        fontSize: spacing.iconSize 
                    }} />
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.contentGap,
                flex: 1,
            }}>
                {/* Primary Metric */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography 
                        variant="h3" 
                        sx={{ 
                            fontWeight: 'bold',
                            color: isUrgent ? 'warning.main' : 'success.main',
                            fontSize: densityLevel === 'mobile' ? '2rem' : densityLevel === 'tablet' ? '2.25rem' : '2.5rem',
                        }}
                    >
                        {safeMetrics.expiringSoon}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: spacing.fontSize.caption }}>
                        Items Expiring
                    </Typography>
                </Box>

                {/* Status Section */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 1,
                    mt: 'auto'
                }}>
                    {isUrgent ? (
                        <WarningIcon sx={{ color: 'warning.main', fontSize: spacing.iconSize }} />
                    ) : (
                        <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: spacing.iconSize }} />
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: spacing.fontSize.caption }}>
                        {isUrgent ? 'Attention needed' : 'All items fresh'}
                    </Typography>
                </Box>

                {/* Urgency Chip */}
                <Chip 
                    label={isUrgent ? "Review Required" : "All Good"} 
                    size="small"
                    sx={{ 
                        mt: 1,
                        fontSize: spacing.fontSize.caption,
                        height: densityLevel === 'mobile' ? 24 : 28,
                        backgroundColor: isUrgent ? 'warning.light' : 'success.light',
                        color: isUrgent ? 'warning.contrastText' : 'success.contrastText',
                    }}
                />
            </Box>

            {/* Action Button */}
            {onViewDetails && (
                <Button
                    variant="contained"
                    size="small"
                    sx={{
                        ...dashboardOptimization.optimizedButtonStyles(theme, densityLevel),
                        width: '100%',
                        background: isUrgent ? 
                            'linear-gradient(45deg, #FF9800, #FFB74D)' :
                            'linear-gradient(45deg, #4CAF50, #66BB6A)',
                        color: 'white',
                        fontWeight: 600,
                        mt: 2,
                    }}
                >
                    {isUrgent ? 'Review Expiring Items' : 'View All Items'}
                </Button>
            )}
        </Paper>
    );
};

export default {
    OptimizedCleaningCard,
    OptimizedRecipeCard,
    OptimizedTemperatureCard,
    OptimizedTodaysDeliveriesCard,
    OptimizedExpiringSoonCard,
};
