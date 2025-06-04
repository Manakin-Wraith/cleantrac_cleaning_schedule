# Production Task Dashboard Design

## Overview

The Production Task Dashboard is a critical component of the CleanTrac system, enabling production managers and staff to efficiently schedule, monitor, and manage recipe production tasks. This document outlines the design and implementation approach for the dashboard's frontend components.

## 1. Core Components

### 1.1 Task Calendar View

A comprehensive calendar interface that visualizes production tasks across time periods.

#### Key Features:
- **Multiple View Options**: Day, week, month, and agenda views
- **Color Coding**: Visual differentiation of tasks by status, department, or recipe type
- **Filtering**: Filter tasks by department, recipe, status, or assigned staff
- **Quick Preview**: Hover tooltips showing key task details without opening the full view
- **Resource View**: Option to view calendar by equipment or staff allocation

#### Implementation Approach:
We'll implement this using **React Big Calendar**, a robust and flexible calendar component with excellent support for all our required features.

```jsx
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

const ProductionCalendar = ({ tasks, onSelectTask, onRangeChange }) => {
  return (
    <Calendar
      localizer={localizer}
      events={tasks}
      startAccessor="scheduled_start_time"
      endAccessor="scheduled_end_time"
      titleAccessor="recipe.name"
      views={['day', 'week', 'month', 'agenda']}
      onSelectEvent={onSelectTask}
      onRangeChange={onRangeChange}
      eventPropGetter={event => ({
        className: `status-${event.status.toLowerCase()}`,
        style: {
          backgroundColor: getDepartmentColor(event.department.id)
        }
      })}
    />
  )
}
```

### 1.2 Task Detail View

A comprehensive interface for viewing and managing all aspects of a production task.

#### Key Features:
- **Recipe Information**: Display recipe details and version information
- **Scaling Controls**: Adjust production quantity with real-time ingredient scaling
- **Ingredient Tracking**: List of ingredients with quantities, usage tracking, and inventory status
- **Output Recording**: Interface for recording actual production output and quality metrics
- **Status Management**: Update task status with appropriate workflow transitions
- **Staff Assignment**: Assign or reassign staff to the task
- **Notes and Attachments**: Add production notes and attach relevant files (e.g., QC reports)

#### Implementation Approach:
We'll use a tabbed interface with React components for different aspects of task management:

```jsx
import { Tabs, Tab } from 'react-bootstrap'
import { useQuery, useMutation } from '@apollo/client'
import { GET_TASK_DETAILS, UPDATE_TASK_STATUS } from '../graphql/queries'

const TaskDetailView = ({ taskId, onClose }) => {
  const { data, loading } = useQuery(GET_TASK_DETAILS, {
    variables: { id: taskId }
  })
  
  const [updateStatus] = useMutation(UPDATE_TASK_STATUS)
  
  if (loading) return <LoadingSpinner />
  
  const { task } = data
  
  return (
    <div className="task-detail-container">
      <header className="task-header">
        <h2>{task.recipe.name}</h2>
        <div className="task-meta">
          <span className="badge status-badge">{task.status}</span>
          <span className="version-tag">v{task.recipe_version.version_number}</span>
        </div>
      </header>
      
      <Tabs defaultActiveKey="details">
        <Tab eventKey="details" title="Details">
          <TaskDetailsTab task={task} />
        </Tab>
        <Tab eventKey="ingredients" title="Ingredients">
          <IngredientsTab task={task} />
        </Tab>
        <Tab eventKey="output" title="Output">
          <OutputRecordingTab task={task} />
        </Tab>
        <Tab eventKey="notes" title="Notes">
          <NotesTab task={task} />
        </Tab>
      </Tabs>
      
      <footer className="task-actions">
        <StatusUpdateButtons 
          currentStatus={task.status}
          onUpdateStatus={(status) => updateStatus({ 
            variables: { id: taskId, status } 
          })}
        />
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </footer>
    </div>
  )
}
```

### 1.3 Drag-and-Drop Scheduling Interface

An intuitive interface for scheduling and rescheduling tasks through drag-and-drop interactions.

#### Key Features:
- **Task Rescheduling**: Drag tasks to new times/dates on the calendar
- **Duration Adjustment**: Resize tasks to change their duration
- **Conflict Detection**: Visual indicators and warnings for scheduling conflicts
- **Resource Constraints**: Respect equipment and staff availability constraints
- **Quick Create**: Drag from a task template to quickly create new tasks
- **Batch Operations**: Select and move multiple tasks together

#### Implementation Approach:
We'll enhance React Big Calendar with drag-and-drop capabilities:

```jsx
import { Calendar } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { useMutation } from '@apollo/client'
import { UPDATE_TASK_SCHEDULE } from '../graphql/queries'

const DnDCalendar = withDragAndDrop(Calendar)

const SchedulingCalendar = ({ tasks, onSelectTask }) => {
  const [updateTaskSchedule] = useMutation(UPDATE_TASK_SCHEDULE)
  
  const handleEventDrop = ({ event, start, end }) => {
    updateTaskSchedule({
      variables: {
        id: event.id,
        scheduled_start_time: start,
        scheduled_end_time: end
      }
    })
  }
  
  const handleEventResize = ({ event, start, end }) => {
    updateTaskSchedule({
      variables: {
        id: event.id,
        scheduled_start_time: start,
        scheduled_end_time: end
      }
    })
  }
  
  return (
    <DnDCalendar
      localizer={localizer}
      events={tasks}
      onEventDrop={handleEventDrop}
      onEventResize={handleEventResize}
      onSelectEvent={onSelectTask}
      resizable
      selectable
    />
  )
}
```

## 2. Advanced Features

### 2.1 Task Template System

Enable quick creation of common production tasks from templates.

#### Key Features:
- **Template Library**: Save and reuse common production task configurations
- **Default Values**: Pre-configured durations, staff requirements, and equipment needs
- **Drag to Create**: Drag templates onto calendar to create new tasks
- **Department-Specific**: Templates organized by department

### 2.2 Resource Visualization

View and manage resource allocation across production tasks.

#### Key Features:
- **Equipment Timeline**: View equipment usage across time
- **Staff Allocation**: Visualize staff assignments and workload
- **Capacity Indicators**: Show when resources are over or under capacity
- **Conflict Resolution**: Identify and resolve resource conflicts

### 2.3 Production Analytics Dashboard

Integrated analytics to monitor production performance.

#### Key Features:
- **Completion Rate**: Track task completion against schedule
- **Yield Analysis**: Compare expected vs. actual production output
- **Quality Metrics**: Monitor quality ratings across production runs
- **Efficiency Trends**: Identify patterns in production efficiency

## 3. Technical Architecture

### 3.1 Frontend Stack

- **React**: Core UI library
- **React Big Calendar**: Calendar visualization
- **Apollo Client**: GraphQL data fetching and state management
- **React Bootstrap**: UI component library
- **Chart.js**: Production analytics visualization
- **React Context API**: Application state management

### 3.2 Data Flow

```
┌─────────────┐      ┌──────────────┐      ┌────────────┐
│ React       │      │ Apollo       │      │ Django     │
│ Components  │<────>│ GraphQL      │<────>│ REST API   │
└─────────────┘      └──────────────┘      └────────────┘
```

### 3.3 API Integration

- **GraphQL Endpoints**: Efficient data fetching with Apollo Client
- **Real-time Updates**: WebSocket integration for live task updates
- **Optimistic UI**: Immediate UI updates with background synchronization

## 4. User Experience Considerations

### 4.1 Responsive Design

- **Desktop-First**: Optimized for production management on larger screens
- **Tablet Support**: Essential functionality on tablet devices for on-floor use
- **Mobile View**: Limited but critical functionality on mobile devices

### 4.2 Accessibility

- **Keyboard Navigation**: Full keyboard support for calendar navigation
- **Screen Reader Support**: ARIA attributes for accessibility
- **Color Contrast**: Ensuring sufficient contrast for status indicators

### 4.3 Performance Optimization

- **Virtualized Lists**: For handling large numbers of tasks
- **Lazy Loading**: Load task details only when needed
- **Pagination**: Paginate historical task data

## 5. Implementation Roadmap

### Phase 1: Core Calendar View
1. Basic calendar implementation with React Big Calendar
2. Task data integration with backend API
3. Filtering and view options

### Phase 2: Task Detail View
1. Comprehensive task detail component
2. Ingredient tracking interface
3. Output recording functionality

### Phase 3: Drag-and-Drop Scheduling
1. Implement drag-and-drop functionality
2. Add conflict detection
3. Integrate with backend for persistence

### Phase 4: Advanced Features
1. Resource visualization
2. Template system
3. Analytics dashboard

## 6. Library Recommendations

### 6.1 Calendar and Scheduling

- **React Big Calendar**: Comprehensive calendar component with excellent customization
  - Supports multiple views (day, week, month)
  - Built-in drag-and-drop support
  - Extensible event rendering

### 6.2 UI Components

- **React Bootstrap**: Robust UI component library
  - Responsive grid system
  - Accessible components
  - Consistent styling

### 6.3 Data Management

- **Apollo Client**: GraphQL client for efficient data fetching
  - Caching and state management
  - Optimistic UI updates
  - Real-time subscription support

### 6.4 Visualization

- **Chart.js**: Lightweight charting library
  - Production analytics visualization
  - Responsive charts
  - Animation support

## 7. Code Examples

### 7.1 Task Filtering Component

```jsx
const TaskFilterBar = ({ departments, onFilterChange }) => {
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    dateRange: [null, null]
  })
  
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }
  
  return (
    <div className="filter-bar">
      <Form.Select 
        value={filters.department}
        onChange={e => handleFilterChange('department', e.target.value)}
      >
        <option value="">All Departments</option>
        {departments.map(dept => (
          <option key={dept.id} value={dept.id}>{dept.name}</option>
        ))}
      </Form.Select>
      
      <Form.Select
        value={filters.status}
        onChange={e => handleFilterChange('status', e.target.value)}
      >
        <option value="">All Statuses</option>
        <option value="scheduled">Scheduled</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </Form.Select>
      
      <DateRangePicker
        value={filters.dateRange}
        onChange={range => handleFilterChange('dateRange', range)}
        placeholder="Filter by date"
      />
    </div>
  )
}
```

### 7.2 Ingredient Requirements Component

```jsx
const IngredientRequirements = ({ taskId }) => {
  const { data, loading } = useQuery(GET_INGREDIENT_REQUIREMENTS, {
    variables: { taskId }
  })
  
  if (loading) return <LoadingSpinner />
  
  const { ingredients, inventoryStatus } = data.ingredientRequirements
  
  return (
    <div className="ingredient-requirements">
      <h3>Ingredient Requirements</h3>
      
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Required Quantity</th>
            <th>Available</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map(ingredient => (
            <tr key={ingredient.id}>
              <td>{ingredient.name}</td>
              <td>
                {ingredient.quantity} {ingredient.unit}
              </td>
              <td>
                {ingredient.available_quantity} {ingredient.unit}
              </td>
              <td>
                <InventoryStatusBadge status={ingredient.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {!inventoryStatus.sufficient && (
        <Alert variant="warning">
          Some ingredients have insufficient inventory.
        </Alert>
      )}
    </div>
  )
}
```

## 8. Design Mockups

[Include links to design mockups or wireframes here]

## 9. References

- React Big Calendar: https://github.com/jquense/react-big-calendar
- Apollo Client: https://www.apollographql.com/docs/react/
- React Bootstrap: https://react-bootstrap.github.io/
- Chart.js: https://www.chartjs.org/
