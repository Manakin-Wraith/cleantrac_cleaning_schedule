# Temperature & Thermometer Management System

This document provides a comprehensive overview of all temperature logging and thermometer management functionality in the CleanTrack application.

## Table of Contents
- [Backend Implementation](#backend-implementation)
- [Frontend Implementation](#frontend-implementation)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [User Flows](#user-flows)
- [Documentation & Templates](#documentation--templates)
- [Implementation Plan: Splitting Thermometer Verification from Temperature Checks](#implementation-plan-splitting-thermometer-verification-from-temperature-checks)

## Backend Implementation

### Core Models
1. **Thermometer Model**
   - Location: `core/models.py`
   - Tracks thermometer details (serial number, model, calibration dates, etc.)
   - Related to AreaUnit for location tracking

2. **TemperatureLog Model**
   - Location: `core/models.py`
   - Records temperature readings with timestamps
   - Links to Thermometer and User who recorded the reading

3. **ThermometerVerificationRecord**
   - Location: `core/models.py`
   - Tracks verification/calibration of thermometers
   - Includes verification date, instrument details, and results

4. **TemperatureCheckAssignment**
   - Location: `core/models.py`
   - Assigns temperature checking responsibilities to staff
   - Includes time periods and frequency

### Migrations
- `0007_areaunit_thermometer_and_more.py` - Initial thermometer integration
- `0009_temperaturecheckassignment.py` - Temperature check assignments
- `0010_alter_temperaturecheckassignment_options_and_more.py` - Assignment enhancements
- `0011_thermometerverificationassignment_time_period_and_more.py` - Verification scheduling
- `0012_dailycleaningrecord_weeklytemperaturereview.py` - Review tracking
- `0014_alter_weeklytemperaturereview_unique_together_and_more.py` - Review system improvements

### Document Generation
- `document_template_serializers.py` - Serializers for temperature-related documents
- `document_template_views.py` - API endpoints for document generation
- `test_document_templates.py` - Test commands for document generation

## Frontend Implementation

### Pages
1. **Thermometer Management**
   - Location: `frontend/src/pages/ThermometerManagementPage.jsx`
   - Main dashboard for thermometer-related operations

2. **Document Template Management**
   - Location: `frontend/src/pages/DocumentTemplateManagementPage.jsx`
   - Manages templates for temperature logs and reports

### Components

#### Temperature Logging
- `TemperatureLoggingSection.jsx` - Main component for logging temperatures
- `TemperatureLogsList.jsx` - Displays historical temperature logs
- `TemperatureLoggingSummary.jsx` - Summary view of temperature data

#### Thermometer Management
- `ThermometerList.jsx` - Lists all thermometers in the system
- `ThermometerForm.jsx` - Form for adding/editing thermometers
- `ThermometerStatusDashboard.jsx` - Dashboard showing thermometer statuses

#### Verification System
- `ThermometerVerificationForm.jsx` - Form for recording verifications
- `ThermometerVerificationSection.jsx` - UI for verification tasks
- `ThermometerAssignmentManager.jsx` - Manages staff assignments for verifications

#### Document Templates
- `DocumentTemplateForm.jsx` - Form for document templates
- `DocumentTemplateList.jsx` - Lists available templates
- `TemplateEditor.jsx` - Editor for creating/modifying templates

### Services
- `thermometerService.js` - API client for thermometer-related operations
  - CRUD operations for thermometers
  - Temperature logging functions
  - Verification management
  - Assignment handling

## Database Schema

### Key Tables
1. **core_thermometer**
   - id, serial_number, model, location_id, is_active, last_calibration_date, next_calibration_date

2. **core_temperaturelog**
   - id, thermometer_id, temperature, recorded_at, recorded_by_id, notes

3. **core_thermometerverificationrecord**
   - id, thermometer_id, verified_by_id, verification_date, calibrated_instrument_no, reading_after_verification, result, notes

4. **core_temperaturecheckassignment**
   - id, staff_member_id, area_id, time_period, frequency, is_active

## API Endpoints

### Thermometer Management
- `GET /api/thermometers/` - List all thermometers
- `POST /api/thermometers/` - Create new thermometer
- `GET /api/thermometers/{id}/` - Get thermometer details
- `PATCH /api/thermometers/{id}/` - Update thermometer
- `DELETE /api/thermometers/{id}/` - Delete thermometer

### Temperature Logs
- `GET /api/temperature-logs/` - List temperature logs
- `POST /api/temperature-logs/` - Create new temperature log
- `GET /api/temperature-logs/{id}/` - Get log details
- `GET /api/thermometers/{id}/logs/` - Get logs for specific thermometer

### Verification
- `GET /api/verifications/` - List verifications
- `POST /api/verifications/` - Create verification record
- `GET /api/verifications/{id}/` - Get verification details
- `GET /api/thermometers/{id}/verifications/` - Get verifications for thermometer

## User Flows

### Daily Temperature Logging
1. Staff logs into the system
2. Navigates to Temperature Logging section
3. Selects thermometer and area
4. Records temperature reading
5. System logs the reading with timestamp and user info

### Thermometer Verification
1. Manager schedules verification
2. Staff receives notification/assignment
3. Staff performs verification
4. Records results in the system
5. System updates thermometer status

### Report Generation
1. User navigates to Reports
2. Selects temperature-related report type
3. Configures date range and filters
4. System generates and displays report
5. Option to export to PDF/Excel

## Documentation & Templates

### Reference Documents
- `docs/Food_Safety_File/03. Thermometer verification.xlsx`
- `docs/Food_Safety_File/05. Temperature checklist.xlsx`

### Document Templates
Location: `media/document_templates/`
- Temperature log templates
- Verification report templates
- Compliance documentation

## Integration Points

### With Cleaning System
- Temperature logs can be linked to cleaning tasks
- Non-compliant temperatures can trigger cleaning requirements

### With Staff Management
- Staff assignments for temperature checks
- Verification responsibilities
- Training requirements

### With Reporting System
- Compliance reporting
- Trend analysis
- Audit trails

## Future Enhancements
1. Automated temperature monitoring integration
2. Mobile app for temperature logging
3. Real-time temperature alerts
4. Predictive maintenance for thermometers
5. Enhanced reporting and analytics

## Maintenance Notes
- Regular backup of temperature logs required
- Calibration schedule should be strictly followed
- Access to temperature logging should be restricted to authorized personnel
- Document templates should be version controlled

## Implementation Plan: Splitting Thermometer Verification from Temperature Checks

This implementation plan outlines the steps needed to split the thermometer verification assignment from the temperature (AM/PM) check assignment functionality, allowing managers to assign different staff members to these distinct responsibilities.

### I. Backend Changes

#### 1. Database Schema Updates

- [x] **Create a New Model: `TemperatureCheckAssignment`**
  - [x] Define model fields (staff_member, department, time_period, etc.)
  - [x] Set up appropriate relationships
  - [x] Add unique constraints
  - [x] Implement save method with proper validation

- [x] **Modify Existing Model: `ThermometerVerificationAssignment`**
  - [x] Remove `time_period` field (verification is a single responsibility)
  - [x] Update save method to handle uniqueness constraints
  - [x] Update any related methods that depend on time_period

#### 2. API Endpoints

- [x] **Create New ViewSet: `TemperatureCheckAssignmentViewSet`**
  - [x] Implement CRUD operations
  - [x] Set up appropriate permissions
  - [x] Add to URL router

- [x] **Update Existing ViewSet: `ThermometerVerificationAssignmentViewSet`**
  - [x] Remove time_period handling logic
  - [x] Update queries to reflect the simplified model

#### 3. Serializers

- [x] **Create New Serializer: `TemperatureCheckAssignmentSerializer`**
  - [x] Include validation for unique constraints
  - [x] Include proper related fields

- [x] **Update Existing Serializer: `ThermometerVerificationAssignmentSerializer`**
  - [x] Remove time_period field and related validation

### II. Frontend Changes

#### 1. Component Updates

- [x] **Split `ThermometerAssignmentManager.jsx` into Two Components:**
  - [x] Maintain `ThermometerAssignmentManager.jsx` - For verification assignments only
  - [x] Create `TemperatureCheckAssignmentManager.jsx` - For temperature check assignments
  - [x] Update imports and references in parent components

- [x] **Update UI to Reflect Split Responsibilities:**
  - [x] Add clear section headers to distinguish between verification and temperature checks
  - [x] Create separate forms and assignment displays
  - [x] Update status indicators to show both types of assignments

#### 2. Service Layer Updates

- [x] **Update `thermometerService.js`:**
  - [x] Add new API methods for temperature check assignments
  - [x] Update existing methods to reflect backend changes
  - [x] Create helper functions to check if a user is assigned to either responsibility

#### 3. Page Updates

- [x] **Update `ThermometerManagementPage.jsx`:**
  - [x] Include both assignment managers with clear separation
  - [x] Add tabs or sections to organize the interface

- [x] **Update `StaffTasksPage.jsx`:**
  - [x] Check for both types of assignments to determine what to show
  - [x] Update UI to clearly indicate which responsibility the staff member has

### III. Permission System Updates

- [x] **Create New Permission Class: `CanManageTemperatureCheckAssignments`**
  - [x] Implement permission logic similar to existing `CanManageThermometerAssignments` but for temperature checks

- [x] **Update Existing Permission Class: `CanManageThermometerAssignments`**
  - [x] Simplify to only check for verification assignments

### IV. Migration Strategy

- [x] **Create Database Migration:**
  - [x] Generate migration for new model and model changes
  - [x] Test migration on development environment

- [x] **Create Data Migration Script:**
  - [x] Create a Django management command `migrate_temperature_assignments.py`
  - [x] For each existing `ThermometerVerificationAssignment`:
    - [x] Keep it for verification duties (without time_period)
    - [x] Create corresponding `TemperatureCheckAssignment` records based on time_period
  - [x] Handle edge cases (assignments with BOTH time periods should create two separate records)
  - [x] Add logging and error handling
  - [x] Test data migration on development environment

### V. User Experience Improvements

- [x] **Manager Dashboard:**
  - [x] Create assignment overview card showing both types of assignments
  - [x] Implement color-coded status indicators
  - [x] Add quick action buttons for assignments

- [x] **Staff Dashboard:**
  - [x] Add clear visual indicators for staff responsibilities
  - [x] Create separate sections for verification and temperature check tasks
  - [x] Implement progress tracking for each responsibility

- [x] **Notification System:**
  - [x] Add alerts for unassigned responsibilities
  - [x] Implement staff assignment reminders
  - [x] Create confirmation messages for assignment updates

### VI. Testing & Quality Assurance

- [x] **Unit Tests:**
  - [x] Test new model and updated model
  - [x] Test serializers and viewsets
  - [x] Test permissions

- [x] **Integration Tests:**
  - [x] Test API endpoints
  - [x] Test data migration
  - [x] Test frontend-backend interaction

- [x] **User Acceptance Testing:**
  - [x] Test manager assignment workflow
  - [x] Test staff responsibility visualization
  - [x] Verify all user flows work as expected

### VII. Additional UI Improvements

- [x] **Create Dedicated Pages for Each Function:**
  - [x] Create `ThermometerVerificationPage.jsx` for verification assignments
  - [x] Create `TemperatureChecksPage.jsx` for temperature check assignments
  - [x] Update `ThermometerManagementPage.jsx` to serve as a hub/landing page

- [x] **Navigation Improvements:**
  - [x] Update Sidebar to include separate menu items for each function
  - [x] Create a nested Temperature menu with clear options
  - [x] Add visual indicators to distinguish between functions

- [x] **Fix UI Issues:**
  - [x] Remove deprecated MUI Grid props (item, xs, sm, md)
  - [x] Fix DOM nesting errors with Typography components
  - [x] Add proper error handling for API requests
  - [x] Remove Current Assignments display from Thermometer Status dashboard

- [x] **Fix Assignment Conflicts:**
  - [x] Remove AM/PM buttons from thermometer verification assignments
  - [x] Ensure thermometer verification doesn't override temperature check assignments
  - [x] Update the StaffTasksPage to properly handle both types of assignments

### VIII. Implementation Summary

We have successfully implemented the split between thermometer verification and temperature check assignments, allowing managers to assign different staff members to these distinct responsibilities. The implementation includes:

1. **Backend Changes**:
   - Created a new `TemperatureCheckAssignment` model for AM/PM temperature checks
   - Modified the existing `ThermometerVerificationAssignment` model to focus solely on verification duties
   - Implemented appropriate API endpoints, serializers, and permissions
   - Created a data migration script to transfer existing assignments to the new structure

2. **Frontend Changes**:
   - Created dedicated pages for thermometer verification and temperature checks
   - Transformed the ThermometerManagementPage into a central hub with navigation cards
   - Updated the Sidebar with a nested Temperature menu for better organization
   - Enhanced the StaffTasksPage to correctly display both types of assignments

3. **User Experience Improvements**:
   - Added clear visual indicators for staff responsibilities
   - Fixed UI issues and deprecated component props
   - Removed AM/PM options from thermometer verification to prevent conflicts
   - Improved error handling for API requests
   - Removed redundant assignment displays from the Thermometer Status dashboard

This implementation provides a more flexible and clear separation of duties, allowing managers to assign the most appropriate staff members to each responsibility and ensuring better compliance with food safety requirements. The UI is now more intuitive with dedicated pages for each function and improved navigation.
