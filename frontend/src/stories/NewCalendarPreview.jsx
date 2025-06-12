import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Import all the new components
import CalendarPageLayout from '../components/calendar/layout/CalendarPageLayout';
import CalendarHeaderControls from '../components/calendar/header/CalendarHeaderControls';
import CalendarRightSidebar from '../components/calendar/sidebar/CalendarRightSidebar';
import QuickActionsMenu from '../components/calendar/sidebar/QuickActionsMenu';
import CalendarLegend from '../components/calendar/sidebar/CalendarLegend';
import ResourceFilterList from '../components/calendar/sidebar/ResourceFilterList';
import CollapsibleFiltersDisplay from '../components/calendar/filters/CollapsibleFiltersDisplay';

// Mock Data
const mockLegendItems = [
  { label: 'Completed', color: '#4caf50' },
  { label: 'In Progress', color: '#ff9800' },
  { label: 'Pending', color: '#2196f3' },
  { label: 'Missed', color: '#f44336' },
];

const mockResources = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Peter Jones' },
  { id: '4', name: 'Mary Williams' },
];

// Placeholder functions for callbacks
const handleAction = (action) => () => alert(`${action} clicked!`);

const theme = createTheme();

/**
 * A story/preview page to assemble and test the new calendar layout and its components.
 */
export default function NewCalendarPreview() {
  const [isFiltersOpen, setFiltersOpen] = useState(false);
  const [selectedResources, setSelectedResources] = useState(['1', '3']);

  const headerControls = (
    <CalendarHeaderControls
      currentDate={new Date()}
      currentView="dayGridMonth"
      onNavigate={handleAction('Navigate')}
      onViewChange={handleAction('View Change')}
      onToggleFilters={() => setFiltersOpen(!isFiltersOpen)}
    />
  );

  const sidebarContent = (
    <CalendarRightSidebar
      quickActionsContent={
        <QuickActionsMenu
          onNewTaskClick={handleAction('New Task')}
          onNewRecipeClick={handleAction('New Recipe')}
        />
      }
      legendContent={<CalendarLegend legendItems={mockLegendItems} />}
      resourceFilterContent={
        <ResourceFilterList
          resources={mockResources}
          selectedResourceIds={selectedResources}
          onResourceSelectionChange={setSelectedResources}
          onSelectAllResources={() => setSelectedResources(mockResources.map(r => r.id))}
          onClearAllResources={() => setSelectedResources([])}
        />
      }
    />
  );

  const filtersBarContent = (
    <CollapsibleFiltersDisplay isOpen={isFiltersOpen}>
      <Typography>This is where filter controls will go.</Typography>
    </CollapsibleFiltersDisplay>
  );

  return (
    <ThemeProvider theme={theme}>
      <CalendarPageLayout
        headerContent={headerControls}
        sidebarContent={sidebarContent}
        filtersBarContent={filtersBarContent}
      >
        <Box sx={{ p: 3, border: '2px dashed grey', borderRadius: '8px', height: '80vh' }}>
          <Typography variant="h4">Main Content Area</Typography>
          <Typography>The FullCalendar component will be rendered here.</Typography>
        </Box>
      </CalendarPageLayout>
    </ThemeProvider>
  );
}
