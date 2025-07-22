# CleanTrac Multi-Tenant Management & Onboarding Guide

## 📋 Executive Summary

This guide provides comprehensive best practices for managing your CleanTrac multi-tenant SaaS application, covering tenant onboarding, database management, scaling considerations, and operational workflows.

## 🏗️ Current Architecture Overview

### Your Journey So Far
1. **Original Database**: Started with a single database containing all core data
2. **First Tenant Migration**: Migrated original data to "Cape Station" tenant schema
3. **Multi-Tenant Setup**: Implemented django-tenants with schema-based isolation
4. **Unified Admin Interface**: Implemented schema switcher for seamless data access
5. **Current State**: Cape Station is your template tenant with all original data

### Architecture Components
- **Public Schema**: Contains shared models (Store, StoreDomain, Admin settings)
- **Tenant Schemas**: Each tenant has isolated core data (UserProfile, TaskInstance, etc.)
- **Cape Station Schema**: Your first tenant with migrated original data
- **Domain Routing**: Each tenant accessed via unique subdomain
- **Unified Admin**: Single interface with schema switching for all data access

## 🖥️ Admin Interface Management

### Available Admin Interfaces

#### 1. Unified Admin Interface (Recommended)
**URL**: `https://capestation.manager.cleentrac.com/unified-admin/`

**Features**:
- **Schema Switcher**: Dropdown to toggle between tenant and original data
- **Single Interface**: No need to navigate between different URLs
- **Visual Context**: Clear indicators showing which schema is active
- **Session Memory**: Remembers your schema preference across pages
- **Permission Management**: Read-only for original data, full CRUD for tenant data

**Schema Options**:
- **Cape Station Data (Tenant)**: Full access to current tenant data with CRUD operations
- **Original Data (Public Schema)**: Read-only access to source database for comparison

#### 2. Traditional Admin Interfaces
**Tenant Admin**: `https://capestation.manager.cleentrac.com/admin/`
- Direct access to Cape Station tenant data
- Full CRUD operations on tenant-specific models
- Core models: UserProfile, TaskInstance, CleaningItem, etc.

**Original Admin**: `https://capestation.manager.cleentrac.com/original-admin/`
- Read-only access to original database data
- Data comparison and migration verification
- Historical data preservation

### Admin Interface Best Practices

#### Data Management
1. **Use Unified Admin**: Provides the best UX for day-to-day operations
2. **Schema Context Awareness**: Always verify which schema you're viewing
3. **Data Comparison**: Use original admin for migration verification
4. **Bulk Operations**: Perform bulk changes through tenant admin for better performance

#### Security Considerations
1. **Access Control**: Original data is read-only to prevent accidental changes
2. **Audit Trail**: All changes in tenant admin are logged
3. **Schema Isolation**: No cross-tenant data access possible
4. **Permission Verification**: Always verify user permissions before granting admin access

#### Troubleshooting Admin Issues
1. **Schema Routing Problems**: Ensure django-tenants middleware is first in MIDDLEWARE list
2. **Database Backend**: Must use `django_tenants.postgresql_backend` for schema switching
3. **Model Visibility**: Core models must be in TENANT_APPS, not SHARED_APPS
4. **Static Files**: Ensure admin theme static files are properly served

### Admin Tools and Features

#### Data Comparison Tool
**URL**: `https://capestation.manager.cleentrac.com/unified-admin/data-comparison/`
- Compare record counts between schemas
- Verify data migration completeness
- Identify discrepancies between original and tenant data

#### Schema Information Tool
**URL**: `https://capestation.manager.cleentrac.com/unified-admin/schema-info/`
- View current schema context
- List available schemas
- Database connection information

## 🎯 Multi-Tenant Best Practices

### 1. Data Isolation Strategy
- **Schema-Based Isolation**: Each tenant has a separate PostgreSQL schema
- **Shared vs Tenant Apps**: System models in public schema, business data in tenant schemas
- **Domain Routing**: Unique subdomains route to specific tenant schemas
- **Data Security**: No cross-tenant data access possible

### 2. Tenant Onboarding Process

#### Phase 1: Planning & Preparation
1. **Tenant Information Gathering**:
   - Company name and details
   - Desired subdomain (e.g., `newclient.manager.cleentrac.com`)
   - Initial user count and roles
   - Data migration requirements (if any)
   - Custom configuration needs

2. **Technical Prerequisites**:
   - Verify database connection limits
   - Check SSL certificate coverage for new subdomain
   - Ensure sufficient server resources
   - Plan maintenance window if needed

#### Phase 2: Tenant Creation
1. **Create Tenant Record**:
   ```python
   # Via Django admin or management command
   from customers.models import Store, StoreDomain
   
   # Create tenant
   tenant = Store.objects.create(
       name="New Client Name",
       schema_name="newclient"  # Must be valid PostgreSQL identifier
   )
   
   # Create domains
   StoreDomain.objects.create(
       domain="newclient.manager.cleentrac.com",
       tenant=tenant,
       is_primary=True
   )
   StoreDomain.objects.create(
       domain="newclient.receiving.cleentrac.com",
       tenant=tenant,
       is_primary=False
   )
   ```

2. **Schema Creation & Migration**:
   ```bash
   # Migrate tenant schema
   python manage.py migrate_schemas --tenant=newclient
   
   # Verify schema creation
   python manage.py tenant_command shell --schema=newclient
   ```

#### Phase 3: Data Setup
1. **Initial Data Population**:
   - Create admin user for tenant
   - Set up departments and organizational structure
   - Configure thermometers and equipment
   - Import supplier data if needed
   - Set up cleaning schedules and tasks

2. **Configuration**:
   - Tenant-specific settings
   - User roles and permissions
   - Department assignments
   - Equipment calibration schedules

#### Phase 4: Testing & Verification
1. **Access Testing**:
   - Verify admin access via tenant domain
   - Test frontend functionality
   - Validate API endpoints
   - Check authentication flows

2. **Data Integrity Checks**:
   - Verify schema isolation
   - Test CRUD operations
   - Validate data relationships
   - Check migration completeness

#### Phase 5: Go-Live
1. **DNS Configuration**:
   - Update DNS records for new subdomains
   - Verify SSL certificate coverage
   - Test domain routing

2. **User Training & Handoff**:
   - Provide admin credentials
   - Conduct system walkthrough
   - Deliver documentation
   - Set up support channels

### 3. Operational Workflows

#### Daily Operations
- **Tenant Health Monitoring**: Check each tenant's system status
- **User Management**: Handle user additions, role changes, password resets
- **Data Backup**: Ensure tenant data is included in backup routines
- **Performance Monitoring**: Monitor database performance across tenants

#### Weekly Operations
- **Data Integrity Checks**: Run comparison tools to verify data consistency
- **Security Audits**: Review user access and permissions
- **Capacity Planning**: Monitor database growth and resource usage
- **Update Deployment**: Test and deploy updates across all tenants

#### Monthly Operations
- **Tenant Review**: Assess tenant usage and satisfaction
- **Performance Optimization**: Optimize database queries and indexes
- **Security Updates**: Apply security patches and updates
- **Backup Testing**: Verify backup integrity and restore procedures

## 🗄️ Database Management Best Practices

### 1. Schema Management
- **Naming Convention**: Use lowercase, alphanumeric schema names
- **Schema Privileges**: Ensure proper database user permissions
- **Migration Strategy**: Always test migrations on staging first
- **Rollback Plans**: Maintain rollback procedures for failed migrations

### 2. Performance Considerations
- **Connection Pooling**: Configure appropriate connection limits
- **Query Optimization**: Monitor and optimize cross-schema queries
- **Index Management**: Maintain indexes for each tenant schema
- **Resource Monitoring**: Track CPU, memory, and disk usage

### 3. Backup & Recovery
- **Schema-Specific Backups**: Backup each tenant schema separately
- **Point-in-Time Recovery**: Maintain transaction log backups
- **Disaster Recovery**: Test recovery procedures regularly
- **Data Retention**: Implement appropriate retention policies

## ⚠️ Common Database Issues & Solutions

### 1. Schema Creation Issues
**Problem**: `permission denied to create schema`
**Solution**: 
```sql
-- Grant schema creation privileges
GRANT CREATE ON DATABASE cleantrac_db TO cleantrac_app;
```

### 2. Migration Failures
**Problem**: Migrations fail in tenant context
**Solution**:
```bash
# Run migrations for specific tenant
python manage.py migrate_schemas --tenant=tenant_name

# Check migration status
python manage.py showmigrations --tenant=tenant_name
```

### 3. Domain Routing Issues
**Problem**: Tenant domain not resolving to correct schema
**Solution**:
- Verify StoreDomain record exists
- Check DNS configuration
- Validate SSL certificate coverage
- Test domain routing manually

### 4. Data Isolation Breaches
**Problem**: Cross-tenant data access
**Solution**:
- Audit database queries
- Verify middleware configuration
- Check model relationships
- Review API endpoint security

### 5. Performance Degradation
**Problem**: Slow queries across multiple tenants
**Solution**:
- Analyze query execution plans
- Add appropriate indexes
- Optimize database connections
- Consider read replicas for reporting

## 📊 Scaling Considerations

### Database Scaling
- **Vertical Scaling**: Increase server resources as tenant count grows
- **Read Replicas**: Use read replicas for reporting and analytics
- **Connection Pooling**: Implement efficient connection management
- **Query Optimization**: Regular performance tuning

### Application Scaling
- **Load Balancing**: Distribute traffic across multiple app servers
- **Caching Strategy**: Implement tenant-aware caching
- **Static File Management**: Use CDN for static assets
- **Background Tasks**: Queue system for long-running operations

### Infrastructure Scaling
- **Auto-Scaling**: Implement auto-scaling for peak loads
- **Monitoring**: Comprehensive monitoring across all tenants
- **Alerting**: Set up alerts for performance and availability issues
- **Disaster Recovery**: Multi-region backup and recovery

## 🔧 Tenant Onboarding Checklist

### Pre-Onboarding
- [ ] Gather tenant requirements and information
- [ ] Plan subdomain structure
- [ ] Verify technical prerequisites
- [ ] Schedule onboarding window
- [ ] Prepare documentation and training materials

### Technical Setup
- [ ] Create Store record in admin
- [ ] Create StoreDomain records
- [ ] Run schema migrations
- [ ] Verify schema creation
- [ ] Test domain routing
- [ ] Configure SSL certificates

### Data Setup
- [ ] Create initial admin user
- [ ] Set up organizational structure
- [ ] Configure departments and roles
- [ ] Import initial data (if required)
- [ ] Set up equipment and thermometers
- [ ] Configure cleaning schedules

### Testing & Validation
- [ ] Test admin access via tenant domain
- [ ] Verify frontend functionality
- [ ] Test API endpoints
- [ ] Validate authentication flows
- [ ] Check data isolation
- [ ] Run data integrity checks

### Go-Live
- [ ] Update DNS records
- [ ] Verify SSL certificate coverage
- [ ] Test production access
- [ ] Conduct user training
- [ ] Provide documentation
- [ ] Set up support channels
- [ ] Monitor initial usage

### Post-Onboarding
- [ ] Monitor system performance
- [ ] Gather user feedback
- [ ] Address any issues
- [ ] Schedule follow-up training
- [ ] Document lessons learned
- [ ] Update onboarding process

## 🛡️ Security Best Practices

### Data Protection
- **Encryption**: Encrypt data at rest and in transit
- **Access Control**: Implement role-based access control
- **Audit Logging**: Log all administrative actions
- **Regular Audits**: Conduct security audits regularly

### Tenant Isolation
- **Schema Isolation**: Verify complete data isolation
- **API Security**: Ensure tenant-aware API endpoints
- **Authentication**: Implement strong authentication mechanisms
- **Authorization**: Verify proper permission checks

### Compliance
- **Data Retention**: Implement appropriate retention policies
- **Privacy Controls**: Ensure GDPR/privacy compliance
- **Audit Trails**: Maintain comprehensive audit logs
- **Documentation**: Keep security documentation current

## 📈 Monitoring & Alerting

### Key Metrics
- **Tenant Count**: Track active tenants
- **User Activity**: Monitor user engagement per tenant
- **Database Performance**: Query response times, connection counts
- **System Resources**: CPU, memory, disk usage
- **Error Rates**: Application and database errors

### Alert Thresholds
- **High CPU Usage**: > 80% for 5 minutes
- **Database Connections**: > 80% of limit
- **Query Response Time**: > 2 seconds average
- **Error Rate**: > 1% of requests
- **Disk Space**: < 20% free space

### Monitoring Tools
- **Application Monitoring**: Django logging and metrics
- **Database Monitoring**: PostgreSQL performance insights
- **Infrastructure Monitoring**: Server resource monitoring
- **Uptime Monitoring**: External service monitoring

## 🚀 Future Enhancements

### Planned Features
- **Automated Onboarding**: Self-service tenant creation
- **Tenant Analytics**: Usage and performance dashboards
- **Multi-Region Support**: Geographic distribution
- **Advanced Backup**: Automated backup and recovery
- **API Rate Limiting**: Tenant-specific rate limits

### Scaling Roadmap
1. **Phase 1**: Optimize current architecture (1-10 tenants)
2. **Phase 2**: Implement advanced monitoring (10-50 tenants)
3. **Phase 3**: Multi-region deployment (50-100 tenants)
4. **Phase 4**: Microservices architecture (100+ tenants)

## 📞 Support & Troubleshooting

### Common Issues
1. **Tenant Access Problems**: Check domain routing and SSL
2. **Migration Failures**: Verify database permissions
3. **Performance Issues**: Analyze queries and indexes
4. **Data Integrity**: Use comparison tools
5. **Authentication Errors**: Check user permissions

### Support Workflow
1. **Issue Identification**: Use monitoring and logging
2. **Impact Assessment**: Determine affected tenants
3. **Resolution**: Apply appropriate fixes
4. **Communication**: Update affected tenants
5. **Post-Mortem**: Document and improve processes

### Emergency Procedures
- **Service Outage**: Escalation and communication plan
- **Data Loss**: Backup restoration procedures
- **Security Breach**: Incident response plan
- **Performance Crisis**: Load balancing and scaling

## 📝 Documentation Maintenance

### Regular Updates
- **Monthly**: Update operational procedures
- **Quarterly**: Review and update best practices
- **Annually**: Comprehensive documentation review
- **As Needed**: Update for new features or changes

### Version Control
- **Documentation Versioning**: Track changes over time
- **Change Management**: Review and approve updates
- **Distribution**: Ensure all stakeholders have current versions
- **Training**: Update training materials regularly

---

## 🎯 Key Takeaways

1. **Data Isolation**: Schema-based isolation ensures complete tenant separation
2. **Systematic Onboarding**: Follow checklist for consistent tenant setup
3. **Proactive Monitoring**: Monitor performance and issues across all tenants
4. **Security First**: Implement comprehensive security measures
5. **Scalable Architecture**: Plan for growth from the beginning
6. **Documentation**: Keep procedures and best practices current

Your CleanTrac multi-tenant architecture is well-designed for scaling. Cape Station serves as your template tenant, and following these best practices will ensure smooth onboarding of new tenants while maintaining data integrity, security, and performance.

---

*Last Updated: July 21, 2025*
*Version: 1.0*
*Author: CleanTrac Development Team*
