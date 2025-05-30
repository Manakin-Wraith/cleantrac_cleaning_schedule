# Temperature & Thermometer Management System

This document provides a comprehensive overview of all temperature logging and thermometer management functionality in the CleanTrack application.

## Table of Contents
- [Backend Implementation](#backend-implementation)
- [Frontend Implementation](#frontend-implementation)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [User Flows](#user-flows)
- [Documentation & Templates](#documentation--templates)

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
