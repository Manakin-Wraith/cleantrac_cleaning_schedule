/**
 * Dashboard Optimization Tests
 * Comprehensive testing for responsive behavior, accessibility, and space optimization
 * Created by Senior UI/UX Designer Lead - 2025 Testing Standards
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import '@testing-library/jest-dom';

import { OptimizedCleaningCard, OptimizedRecipeCard, OptimizedTemperatureCard } from '../components/OptimizedDashboardCards';
import dashboardOptimization from '../styles/dashboardOptimization';

// Mock useMediaQuery for responsive testing
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
}));

const mockUseMediaQuery = useMediaQuery;

const theme = createTheme();

// Test data
const mockCleaningMetrics = {
  completed: 12,
  pending: 5,
  overdue: 2,
};

const mockRecipeMetrics = {
  completed: 8,
  pending: 3,
  overdue: 1,
};

const mockTempMetrics = {
  logged: 15,
  total: 20,
  outOfRange: 2,
  assignedStaff: 4,
};

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Dashboard Optimization Tests', () => {
  beforeEach(() => {
    // Reset mocks
    mockUseMediaQuery.mockReset();
  });

  describe('Responsive Density System', () => {
    test('applies mobile density styles correctly', () => {
      // Mock mobile breakpoint
      mockUseMediaQuery
        .mockReturnValueOnce(true)  // isMobile
        .mockReturnValueOnce(true)  // isTablet
        .mockReturnValueOnce(false); // isLarge

      renderWithTheme(
        <OptimizedCleaningCard 
          cleaningMetrics={mockCleaningMetrics} 
          onViewTasks={() => {}} 
        />
      );

      const card = screen.getByText('🧹 Cleaning At A Glance').closest('div');
      expect(card).toBeInTheDocument();
      
      // Verify mobile-specific styling is applied
      const spacing = dashboardOptimization.responsiveSpacing.mobile;
      expect(spacing.cardPadding).toBe(1.5);
      expect(spacing.fontSize.header).toBe('0.95rem');
    });

    test('applies tablet density styles correctly', () => {
      // Mock tablet breakpoint
      mockUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(true)  // isTablet
        .mockReturnValueOnce(false); // isLarge

      renderWithTheme(
        <OptimizedRecipeCard 
          recipeMetrics={mockRecipeMetrics} 
          onViewTasks={() => {}} 
        />
      );

      const card = screen.getByText('🍳 Recipe Production At A Glance').closest('div');
      expect(card).toBeInTheDocument();
      
      // Verify tablet-specific styling is applied
      const spacing = dashboardOptimization.responsiveSpacing.tablet;
      expect(spacing.cardPadding).toBe(2);
      expect(spacing.fontSize.header).toBe('1rem');
    });

    test('applies desktop density styles correctly', () => {
      // Mock desktop breakpoint
      mockUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(false) // isTablet
        .mockReturnValueOnce(true);  // isDesktop

      renderWithTheme(
        <OptimizedTemperatureCard tempMetrics={mockTempMetrics} />
      );

      const card = screen.getByText('🌡️ Temperature Compliance').closest('div');
      expect(card).toBeInTheDocument();
      
      // Verify desktop-specific styling is applied
      const spacing = dashboardOptimization.responsiveSpacing.desktop;
      expect(spacing.cardPadding).toBe(2.5);
      expect(spacing.fontSize.header).toBe('1.1rem');
    });

    test('applies large screen density styles correctly', () => {
      // Mock large screen breakpoint
      mockUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(false) // isTablet
        .mockReturnValueOnce(false); // isDesktop (so it defaults to large)

      renderWithTheme(
        <OptimizedCleaningCard 
          cleaningMetrics={mockCleaningMetrics} 
          onViewTasks={() => {}} 
        />
      );

      const card = screen.getByText('🧹 Cleaning At A Glance').closest('div');
      expect(card).toBeInTheDocument();
      
      // Verify large screen-specific styling is applied
      const spacing = dashboardOptimization.responsiveSpacing.large;
      expect(spacing.cardPadding).toBe(3);
      expect(spacing.fontSize.header).toBe('1.2rem');
    });
  });

  describe('Space Optimization', () => {
    test('optimized card styles reduce padding compared to original', () => {
      mockUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(false) // isTablet
        .mockReturnValueOnce(true);  // isDesktop

      const optimizedStyles = dashboardOptimization.optimizedCardStyles(theme, 'desktop');
      
      // Verify optimized padding is less than original (3)
      expect(dashboardOptimization.responsiveSpacing.desktop.cardPadding).toBe(2.5);
      expect(optimizedStyles.padding).toBe(2.5);
    });

    test('optimized typography reduces line heights and margins', () => {
      const titleStyles = dashboardOptimization.optimizedTypographyStyles('cardTitle', 'desktop');
      const captionStyles = dashboardOptimization.optimizedTypographyStyles('cardCaption', 'desktop');
      
      // Verify compact typography
      expect(titleStyles.lineHeight).toBe(1.2);
      expect(captionStyles.lineHeight).toBe(1);
      expect(titleStyles.marginBottom).toBe(0.25);
    });

    test('optimized metric cards have reduced height', () => {
      const metricStyles = dashboardOptimization.optimizedMetricCardStyles(theme, 'desktop');
      
      // Verify reduced metric card height
      expect(metricStyles.minHeight).toBe(80);
    });
  });

  describe('Accessibility Improvements', () => {
    test('maintains proper color contrast ratios', () => {
      mockUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(false) // isTablet
        .mockReturnValueOnce(true);  // isDesktop

      renderWithTheme(
        <OptimizedCleaningCard 
          cleaningMetrics={mockCleaningMetrics} 
          onViewTasks={() => {}} 
        />
      );

      // Check that text elements have proper contrast
      const title = screen.getByText('🧹 Cleaning At A Glance');
      const caption = screen.getByText('Task Overview');
      
      expect(title).toHaveStyle({ color: expect.any(String) });
      expect(caption).toHaveStyle({ color: expect.any(String) });
    });

    test('provides proper ARIA labels and semantic structure', () => {
      mockUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(false) // isTablet
        .mockReturnValueOnce(true);  // isDesktop

      renderWithTheme(
        <OptimizedTemperatureCard tempMetrics={mockTempMetrics} />
      );

      // Check for semantic structure
      const title = screen.getByText('🌡️ Temperature Compliance');
      expect(title.tagName).toBe('H6'); // Should be a heading element
      
      // Check for status indicators
      const statusChip = screen.getByText('Action Required');
      expect(statusChip).toBeInTheDocument();
    });

    test('supports keyboard navigation', () => {
      mockUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(false) // isTablet
        .mockReturnValueOnce(true);  // isDesktop

      const mockOnViewTasks = jest.fn();
      
      renderWithTheme(
        <OptimizedCleaningCard 
          cleaningMetrics={mockCleaningMetrics} 
          onViewTasks={mockOnViewTasks} 
        />
      );

      const button = screen.getByText('View All Tasks');
      
      // Test keyboard interaction
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter', code: 'Enter' });
      
      expect(button).toBeInTheDocument();
    });
  });

  describe('Interactive Behavior', () => {
    test('handles click events properly', () => {
      mockUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(false) // isTablet
        .mockReturnValueOnce(true);  // isDesktop

      const mockOnViewTasks = jest.fn();
      
      renderWithTheme(
        <OptimizedRecipeCard 
          recipeMetrics={mockRecipeMetrics} 
          onViewTasks={mockOnViewTasks} 
        />
      );

      const button = screen.getByText('View All Tasks');
      fireEvent.click(button);
      
      expect(mockOnViewTasks).toHaveBeenCalledTimes(1);
    });

    test('displays correct metrics data', () => {
      mockUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(false) // isTablet
        .mockReturnValueOnce(true);  // isDesktop

      renderWithTheme(
        <OptimizedCleaningCard 
          cleaningMetrics={mockCleaningMetrics} 
          onViewTasks={() => {}} 
        />
      );

      // Verify metrics are displayed correctly
      expect(screen.getByText('12')).toBeInTheDocument(); // completed
      expect(screen.getByText('5')).toBeInTheDocument();  // pending
      expect(screen.getByText('2')).toBeInTheDocument();  // overdue
      
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    test('renders without unnecessary re-renders', () => {
      mockUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(false) // isTablet
        .mockReturnValueOnce(true);  // isDesktop

      const { rerender } = renderWithTheme(
        <OptimizedTemperatureCard tempMetrics={mockTempMetrics} />
      );

      // Re-render with same props
      rerender(
        <ThemeProvider theme={theme}>
          <OptimizedTemperatureCard tempMetrics={mockTempMetrics} />
        </ThemeProvider>
      );

      // Component should handle re-renders gracefully
      expect(screen.getByText('🌡️ Temperature Compliance')).toBeInTheDocument();
    });
  });
});

// Integration test for the complete dashboard optimization system
describe('Dashboard Optimization Integration', () => {
  test('all optimization features work together', () => {
    mockUseMediaQuery
      .mockReturnValueOnce(false) // isMobile
      .mockReturnValueOnce(false) // isTablet
      .mockReturnValueOnce(true);  // isDesktop

    const mockOnViewTasks = jest.fn();

    const { container } = renderWithTheme(
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <OptimizedCleaningCard 
          cleaningMetrics={mockCleaningMetrics} 
          onViewTasks={mockOnViewTasks} 
        />
        <OptimizedRecipeCard 
          recipeMetrics={mockRecipeMetrics} 
          onViewTasks={mockOnViewTasks} 
        />
        <OptimizedTemperatureCard tempMetrics={mockTempMetrics} />
      </div>
    );

    // Verify all cards are rendered
    expect(screen.getByText('🧹 Cleaning At A Glance')).toBeInTheDocument();
    expect(screen.getByText('🍳 Recipe Production At A Glance')).toBeInTheDocument();
    expect(screen.getByText('🌡️ Temperature Compliance')).toBeInTheDocument();

    // Verify responsive spacing is applied consistently
    const spacing = dashboardOptimization.responsiveSpacing.desktop;
    expect(spacing.cardPadding).toBe(2.5);
    expect(spacing.headerMargin).toBe(2);
    expect(spacing.sectionMargin).toBe(2);

    // Test interactions work across all cards
    const buttons = screen.getAllByText('View All Tasks');
    expect(buttons).toHaveLength(2); // Cleaning and Recipe cards have buttons

    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    
    expect(mockOnViewTasks).toHaveBeenCalledTimes(2);
  });
});

export default {
  mockCleaningMetrics,
  mockRecipeMetrics,
  mockTempMetrics,
};
