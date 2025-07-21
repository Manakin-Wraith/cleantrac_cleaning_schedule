# CleanTrac Multi-Tenant Admin Interface Guide

## 📋 Overview

This guide provides comprehensive documentation for the CleanTrac multi-tenant Django admin interface, which provides access to both tenant-specific core data and original database (public schema) core data through a beautiful dark theme UI.

## 🎯 Purpose

The CleanTrac admin interface was designed to provide administrators with:

1. **Complete access to tenant core data** for operational management
2. **Access to original database core data** for verification and auditing
3. **Data integrity verification tools** for migration monitoring
4. **Beautiful dark theme UI/UX** for enhanced user experience
5. **Multi-tenant management capabilities** with clear navigation

## 🏗️ Architecture

### Multi-Tenant Structure
- **Django-Tenants**: Uses isolated database schemas for each tenant
- **Cape Station**: Primary tenant with domains `capestation.receiving.cleentrac.com` and `capestation.manager.cleentrac.com`
- **Public Schema**: Contains original production data from Streamlit application
- **Tenant Schemas**: Isolated data for each store/tenant

### Database Schemas
- **Public Schema**: Original production data (read-only access)
- **Cape Station Schema**: Tenant-specific operational data (full CRUD)
- **Future Tenant Schemas**: Additional tenants will have isolated schemas

## 🎨 Admin Interfaces

### 1. Main Admin Interface (Tenant Data)

**URL**: `https://api.cleentrac.com/admin/`

**Purpose**: Day-to-day operations and tenant-specific data management

**Features**:
- Beautiful dark theme UI with professional styling
- Full CRUD operations on tenant data
- Multi-tenant management dashboard
- Enhanced navigation with dual data access

**Core Models Available**:
- **UserProfile** - Tenant user profiles, roles, and department assignments
- **TaskInstance** - Cleaning tasks, assignments, and completion tracking
- **TemperatureLog** - Temperature monitoring data and compliance records
- **Supplier** - Supplier information and department associations
- **CleaningItem** - Cleaning items, schedules, and frequency settings
- **Thermometer** - Thermometer verification and calibration data
- **Department** - Organizational departments and structure
- **AreaUnit** - Temperature monitoring areas and target ranges
- **ThermometerVerificationRecord** - Verification history and compliance
- **TemperatureCheckAssignment** - Staff temperature monitoring assignments

### 2. Original Database Admin Interface (Public Schema)

**URL**: `https://api.cleentrac.com/original-admin/`

**Purpose**: Data verification, auditing, and access to source of truth data

**Features**:
- Read-only access to prevent accidental modifications
- Same dark theme UI for consistency
- Data comparison and schema information tools
- Complete access to original production data

**Core Models Available** (Read-Only):
- All the same models as tenant admin but from the original database
- Source data from the Streamlit application migration
- Historical data for compliance and auditing purposes

## 🔧 Data Management Tools

### Data Comparison Tool

**URL**: `https://api.cleentrac.com/original-admin/data-comparison/`

**Purpose**: Monitor migration status and verify data integrity

**Features**:
- Side-by-side comparison of data counts
- Public schema vs Cape Station tenant comparison
- Migration percentage calculations
- Data integrity verification

**Information Displayed**:
- Table-by-table record counts
- Migration completion percentages
- Data discrepancy identification
- Quick action links for further investigation

### Schema Information Tool

**URL**: `https://api.cleentrac.com/original-admin/schema-info/`

**Purpose**: Technical database structure and architecture information

**Features**:
- Complete table listings for both schemas
- Model-to-table mappings
- Multi-tenant architecture overview
- Technical documentation for developers

## 🚀 Usage Guide

### Daily Operations Workflow

1. **Access Tenant Admin**: Go to `https://api.cleentrac.com/admin/`
2. **Login**: Use your admin credentials
3. **Navigate**: Use the enhanced dashboard to access core models
4. **Manage Data**: Perform CRUD operations on tenant-specific data
5. **Monitor**: Use built-in health checks and user counts

### Data Verification Workflow

1. **Access Original Admin**: Go to `https://api.cleentrac.com/original-admin/`
2. **Login**: Use the same admin credentials
3. **Compare Data**: Use the data comparison tool to verify migration integrity
4. **Audit Records**: Review original data for compliance purposes
5. **Investigate**: Use schema information for technical analysis

### Migration Monitoring Workflow

1. **Run Data Comparison**: Check migration status regularly
2. **Verify Counts**: Ensure data counts match expectations
3. **Identify Gaps**: Look for missing or incomplete migrations
4. **Document Issues**: Use the information for troubleshooting
5. **Validate Integrity**: Confirm data consistency across schemas

## 🎨 UI/UX Features

### Dark Theme Implementation

**Technology**: django-admin-interface with custom CleanTrac styling

**Features**:
- Professional dark header (`#1a1a1a` background)
- Clean white text and navigation elements
- Styled module cards with proper contrast
- Custom CleanTrac branding integration
- Enhanced visual hierarchy with proper spacing
- Interactive elements (modals, dropdowns, forms)
- Modern button styling (save/delete buttons)

### Navigation Enhancements

**Dual Access Dashboard**:
- Clear separation between tenant and original data
- Visual indicators for different data contexts
- Quick action links for common tasks
- Comprehensive usage guide built into interface

**Enhanced Admin Index**:
- Multi-tenant data access section
- Side-by-side comparison of data contexts
- Direct links to all core models
- Usage guide and best practices

## 🔐 Security & Safety

### Access Control

**Tenant Data (Full Access)**:
- Create, Read, Update, Delete operations
- Real-time operational data management
- User profile and role management
- Task assignment and completion tracking

**Original Data (Read-Only)**:
- View-only access to prevent accidental modifications
- Data integrity preservation
- Audit trail maintenance
- Source of truth protection

### Authentication

- Both admin interfaces require proper Django admin authentication
- Same user credentials work for both interfaces
- Session management across both admin sites
- Secure login/logout functionality

## 🛠️ Technical Implementation

### Core Components

**Files Created/Modified**:
- `core/original_admin.py` - Original database admin site implementation
- `cleantrac_project/urls.py` - URL routing for dual admin access
- `customers/admin.py` - Enhanced tenant admin with navigation
- `templates/admin/index.html` - Enhanced admin dashboard
- `templates/admin/original_admin/` - Original admin templates
- `core/templatetags/admin_extras.py` - Template filters for admin functionality

### Database Configuration

**Static File Serving**:
- Production-ready Django static file serving fallback
- nginx configuration for optimal performance
- All admin interface assets (CSS/JS) loading correctly

**Multi-Tenant Setup**:
- django-tenants configuration for schema isolation
- Proper tenant domain routing
- Database connection management across schemas

## 📊 Data Models Overview

### Core Business Models

**UserProfile**:
- User authentication and profile information
- Department assignments and role management
- Phone numbers and contact information

**TaskInstance**:
- Cleaning task assignments and scheduling
- Status tracking and completion logging
- Department-specific task management

**TemperatureLog**:
- Temperature monitoring and compliance
- Thermometer verification requirements
- Time-based logging with target range validation

**Supplier**:
- Supplier information and contact details
- Department associations and country of origin
- Supply chain management data

**CleaningItem**:
- Cleaning tasks and frequency requirements
- Estimated duration and department assignments
- Recurring schedule management

**Thermometer**:
- Thermometer inventory and verification status
- Serial numbers and model identification
- Verification expiry tracking and alerts

### Compliance & Verification Models

**ThermometerVerificationRecord**:
- Verification history and calibration data
- Compliance tracking and audit trails
- Verification expiry management

**TemperatureCheckAssignment**:
- Staff assignments for temperature monitoring
- Department-specific monitoring schedules
- Time period and frequency management

## 🔄 Migration & Data Integrity

### Data Migration Status

**Original to Tenant Migration**:
- UserProfile: Migrated with department assignments restored
- TaskInstance: Complete migration of 492+ records
- TemperatureLog: Complete migration of 375+ records
- Supplier: Complete migration of supplier data
- CleaningItem: Complete migration of 109+ records
- Thermometer: Complete migration of thermometer inventory

### Data Verification Process

1. **Pre-Migration**: Original data preserved in public schema
2. **Migration**: Data copied to tenant schema with field mapping
3. **Verification**: Data comparison tools validate migration integrity
4. **Ongoing**: Regular monitoring ensures data consistency

## 🎯 Best Practices

### Operational Guidelines

**For Daily Operations**:
- Use tenant admin (`/admin/`) for all operational tasks
- Regularly monitor user counts and tenant health
- Use multi-tenant dashboard for overview information
- Maintain proper user roles and department assignments

**For Data Verification**:
- Use original admin (`/original-admin/`) for auditing purposes
- Run data comparison regularly to verify integrity
- Document any discrepancies for investigation
- Use schema information for technical troubleshooting

**For System Maintenance**:
- Monitor both admin interfaces for performance
- Keep static files properly collected and served
- Maintain proper authentication and access controls
- Regular backups of both tenant and original data

### Troubleshooting Guide

**Common Issues**:
- Static file 404 errors: Ensure Django static file serving is enabled
- Migration discrepancies: Use data comparison tool to identify gaps
- Authentication issues: Verify user permissions and admin access
- Performance issues: Monitor database connections and query performance

**Resolution Steps**:
1. Check Django service status and logs
2. Verify database connectivity and schema access
3. Ensure static files are properly collected
4. Use admin tools for data verification
5. Consult technical documentation for advanced issues

## 📝 Future Enhancements

### Planned Features

**Additional Tenants**:
- Support for multiple tenant schemas
- Tenant-specific admin customization
- Cross-tenant data analysis tools

**Enhanced Reporting**:
- Data export functionality
- Advanced filtering and search
- Custom report generation

**Improved UI/UX**:
- Additional theme customization options
- Mobile-responsive admin interface
- Enhanced navigation and user experience

## 📞 Support & Maintenance

### Contact Information

For technical support or questions about the multi-tenant admin interface:
- Review this documentation first
- Check Django admin logs for error details
- Use data comparison tools for migration issues
- Consult EC2 server reference documentation for deployment issues

### Maintenance Schedule

**Regular Tasks**:
- Weekly data integrity verification
- Monthly static file cleanup
- Quarterly admin interface updates
- Annual security review and updates

---

## 🎉 Conclusion

The CleanTrac multi-tenant admin interface provides comprehensive access to both tenant core data and original database core data through a beautiful, professional dark theme UI. This implementation ensures data integrity, operational efficiency, and excellent user experience while maintaining proper security and multi-tenant isolation.

**Ready to use for comprehensive multi-tenant core data management!** ✨

---

*Last Updated: July 21, 2025*
*Version: 1.0*
*Author: CleanTrac Development Team*
