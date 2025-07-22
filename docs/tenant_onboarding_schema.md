# CleanTrac Tenant Onboarding Schema Documentation

## Overview

This document provides comprehensive data requirements and schema specifications for onboarding new CleanTrac tenants. Each new shop/customer/tenant must provide data in the specified formats to ensure proper system functionality.

## Core Business Data Requirements

### 1. 📁 **Departments** (Required)

**Purpose**: Organizational structure for staff, cleaning items, recipes, and operations.

**Required Departments**:
- **BAKERY**: Bread, pastries, baked goods operations
- **BUTCHERY**: Meat processing, cutting, packaging operations  
- **HMR**: Hot Meals Ready - prepared food operations

**Optional Departments**:
- **Admin**: Administrative functions
- **All Dept.**: Cross-departmental items
- **UNKNOWN**: Temporary classification

**Data Format**:
```csv
name
BAKERY
BUTCHERY
HMR
Admin
```

**Validation Rules**:
- Department names must be unique
- Minimum 3 departments required (BAKERY, BUTCHERY, HMR)
- Maximum 50 characters per department name

---

### 2. 👥 **Staff/Users** (Required)

**Purpose**: User accounts, roles, and department assignments for system access and task management.

**Required Fields**:
- **Username**: Unique identifier for login
- **First Name**: Staff member's first name
- **Last Name**: Staff member's last name  
- **Email**: Contact email address
- **Phone Number**: Contact phone number (South African format: +27...)
- **Department**: Must match department names from Department list
- **Role**: Either "manager" or "staff"
- **Is Staff**: Boolean - can access admin interface
- **Is Active**: Boolean - account is active

**Staff Structure Requirements**:
- **Each department must have at least 1 manager**
- **Each department should have multiple staff members**
- **At least 1 superuser/admin required for system management**

**Data Format**:
```csv
username,first_name,last_name,email,phone_number,department,role,is_staff,is_active
gerhard,Gerhard,Mostert,gerhard@example.com,+27670108938,BUTCHERY,manager,true,true
monica_bakery,Monica,Nkota,monica.b@example.com,+27670108938,BAKERY,manager,true,true
sipho,Sipho,Mthembu,sipho@example.com,+27623048446,BUTCHERY,staff,false,true
```

**Validation Rules**:
- Username must be unique and alphanumeric
- Email must be valid format
- Phone numbers must start with +27 (South African format)
- Department must exist in Departments list
- Role must be "manager" or "staff"
- Each department requires at least 1 manager

---

### 3. 🧹 **Cleaning Items** (Required)

**Purpose**: Department-specific cleaning tasks, schedules, and procedures for food safety compliance.

**Required Fields**:
- **Name**: Descriptive name of cleaning task
- **Department**: Department responsible (must match Departments)
- **Frequency**: How often task is performed
- **Method**: Detailed cleaning procedure
- **Equipment**: Tools/equipment needed (optional)
- **Chemical**: Cleaning chemicals used (optional)

**Frequency Options**:
- `daily`: Daily tasks (most common)
- `weekly`: Weekly tasks
- `monthly`: Monthly deep cleaning
- `quarterly`: Quarterly maintenance
- `annually`: Annual maintenance
- `as_needed`: Ad-hoc cleaning

**Expected Volume by Department**:
- **BAKERY**: ~40 items (34 daily, 4 monthly, 2 weekly)
- **BUTCHERY**: ~30 items (mostly daily)
- **HMR**: ~40 items (mostly daily)

**Data Format**:
```csv
name,department,frequency,method,equipment,chemical
Clean prep surfaces,BAKERY,daily,"Wipe down with sanitizer solution, rinse with clean water","Microfiber cloths, spray bottles","Food-safe sanitizer"
Deep clean ovens,BAKERY,weekly,"Remove racks, scrub interior, clean heating elements","Oven cleaner, brushes, cloths","Heavy-duty oven cleaner"
```

**Validation Rules**:
- Name must be unique within department
- Department must exist in Departments list
- Frequency must be from approved list
- Method is required and should be detailed
- Maximum 500 characters for method description

---

### 4. 📦 **Suppliers** (Required)

**Purpose**: Vendor management for ingredient sourcing, equipment, and supplies.

**Required Fields**:
- **Supplier Code**: Unique identifier (usually numeric)
- **Supplier Name**: Full business name
- **Contact Info**: Phone, email, or address
- **Country of Origin**: Source country (optional)

**Expected Volume**: 50-100 suppliers typical for full operations

**Data Format**:
```csv
supplier_code,supplier_name,contact_info,country_of_origin
1297,ACE PACKAGING (CAPE),+27214567890,South Africa
806,AIRPORT INTERNATIONAL TRADING,info@ait.co.za,South Africa
5,ANCHOR YEAST (BULK BAKERY),orders@anchor.co.za,South Africa
```

**Validation Rules**:
- Supplier code must be unique
- Supplier name required (max 255 characters)
- Contact info recommended but optional
- Country of origin optional

---

### 5. 📦 **Products** (Critical for Receiving)

**Purpose**: Universal master catalog of ALL products in the business ecosystem - both received ingredients from suppliers AND finished recipe outputs. This is the foundation for the receiving workflow.

**Expected Volume**: 200-500 products

### Universal Product Code System
**CRITICAL CONCEPT**: Product codes are universal identifiers that work across:
- **Receiving Records**: When ingredients arrive from suppliers
- **Recipe Ingredients**: When recipes reference ingredient product codes
- **Recipe Outputs**: When recipes produce finished goods with product codes
- **Inventory Tracking**: For complete traceability

### Required Fields
- `product_code` (Primary Key, max 50 chars) - **Universal unique identifier**
- `name` (max 255 chars) - Product name
- `description` (optional) - Detailed description
- `supplier_code` (optional) - Links to supplier for **received ingredients only**

### Product Types
1. **Received Ingredients** (have supplier_code):
   - Raw materials that arrive from suppliers
   - Examples: Flour mixes, yeast, meat, spices, packaging
   - Must have valid supplier_code linking to Suppliers table
   - Tracked through Receiving Records when delivered

2. **Recipe Outputs** (no supplier_code):
   - Finished goods produced in-house
   - Examples: Breads, sausages, prepared meals
   - Created through Recipe production processes
   - May use received ingredients as components

### Receiving Workflow Context
```
1. Supplier delivers ingredient → Receiving Record created with product_code
2. Recipe uses ingredient → Recipe Ingredient references same product_code
3. Recipe produces output → Recipe Output has its own product_code
4. All product_codes exist in master Products catalog
```

### Data Requirements
- **Product codes must be unique across entire system** (ingredients AND outputs)
- Names should be descriptive and consistent
- Supplier codes must reference valid suppliers (ingredients only)
- **No confusion between ingredient codes and recipe codes** - all are products
- Complete coverage: every received item and recipe output must have a product code

### Cape Station Analysis
- **Total Products**: 200+ products in system
- **Received Ingredients**: 120+ items with supplier codes (flour, yeast, meat, packaging)
- **Recipe Outputs**: 80+ finished products (breads, sausages, prepared foods)
- **Product Code Range**: Mix of numeric codes (15736, 28779) and alphanumeric (WB001, BS001)
- **Supplier Integration**: Ingredients properly linked to 60+ suppliers)
- **BUTCHERY**: ~30 recipes (meat products, sausages, prepared items)
- **HMR**: ~15 recipes (prepared meals, hot foods)

**Data Format**:
```csv
product_code,name,description,supplier_code
WB001,WHITE BREAD,Standard white bread loaf,
BB001,BROWN BREAD,Whole wheat bread loaf,
RL001,RAISIN LOAF,Sweet bread with raisins,
```

**Validation Rules**:
- Product code must be unique
- Name required (max 255 characters)
- Supplier code must reference valid supplier (ingredients only)

---

### 6. 🍞 **Recipes** (Required for Food Operations)

**Purpose**: Recipe management for consistent product quality and cost control.

**Required Fields**:
- **Product Code**: Unique identifier for the recipe
- **Name**: Recipe/product name
- **Department**: Department responsible (BAKERY, BUTCHERY, HMR)
- **Description**: Recipe description (optional)
- **Yield Quantity**: How much the recipe produces
- **Yield Unit**: Unit of measurement (kg, pieces, liters)
- **Unit Cost**: Cost per unit produced
- **Is Active**: Whether recipe is currently in use

**Expected Volume by Department**:
- **BAKERY**: ~30 recipes (breads, pastries, baked goods)
- **BUTCHERY**: ~30 recipes (meat products, sausages, prepared items)
- **HMR**: ~15 recipes (prepared meals, hot foods)

**Data Format**:
```csv
product_code,name,department,description,yield_quantity,yield_unit,unit_cost,is_active
WB001,WHITE BREAD,BAKERY,Standard white bread loaf,1,loaf,12.50,true
BB001,BROWN BREAD,BAKERY,Whole wheat bread loaf,1,loaf,14.00,true
RL001,RAISIN LOAF,BAKERY,Sweet bread with raisins,1,loaf,18.50,true
```

**Recipe Ingredients** (Sub-table):
```csv
recipe_product_code,ingredient_code,ingredient_name,quantity,unit,unit_cost,total_cost
WB001,WM001,W/CAPE MILL MIX WHT BRD,1,kg,15.50,15.50
WB001,YW001,YEAST WET,0.05,kg,45.00,2.25
WB001,SW001,SPAR WATER,0.6,liters,0.00,0.00
```

**Validation Rules**:
- Product code must be unique
- Name required (max 255 characters)
- Department must exist in Departments list
- Yield quantity must be positive number
- Unit cost must be positive number
- Each recipe should have associated ingredients

---

### 6. 🌡️ **Temperature Monitoring** (Required for Food Safety)

**Purpose**: Food safety compliance through temperature monitoring and verification.

**Required Components**:

**Area Units** (Monitoring Points):
- **Name**: Location/equipment name
- **Department**: Department responsible
- **Temperature Range**: Safe operating range
- **Monitoring Frequency**: How often to check

**Thermometers**:
- **Serial Number**: Unique device identifier
- **Model**: Thermometer model/type
- **Department**: Department assigned
- **Status**: Active/inactive
- **Calibration Date**: Last calibration

**Expected Volume**:
- **Area Units**: 20-30 monitoring points
- **Thermometers**: 2-5 devices
- **Temperature Logs**: Daily readings per area unit

**Data Format**:
```csv
# Area Units
name,department,min_temp,max_temp,monitoring_frequency
Cold Room 1,BUTCHERY,0,4,daily
Freezer A,BAKERY,-18,-15,daily
Hot Display,HMR,60,65,hourly

# Thermometers  
serial_number,model_identifier,department,status,last_calibration
TH001,Digital Pro 2000,BUTCHERY,active,2024-01-15
TH002,Infrared Quick,BAKERY,active,2024-01-20
```

**Validation Rules**:
- Area unit names must be unique
- Temperature ranges must be logical (min < max)
- Thermometer serial numbers must be unique
- Calibration dates should be recent (within 12 months)

---

### 7. 📋 **Receiving Records** (Optional - Historical Data)

**Purpose**: Product receiving history, quality control, and traceability.

**Required Fields** (if providing historical data):
- **Supplier**: Must match Supplier list
- **Product**: Product received
- **Quantity**: Amount received
- **Receive Date**: When product was received
- **Quality Status**: Pass/fail quality check
- **Received By**: Staff member who processed

**Note**: This is typically empty for new tenants and will be populated as operations begin.

---

## 2. 📋 **Onboarding Workflow Documentation**

### **Pre-Onboarding Checklist**

**Data Collection Requirements**:
- [ ] **Departments list** - Confirm BAKERY, BUTCHERY, HMR structure
- [ ] **Staff roster** - All employees with contact info and roles
- [ ] **Cleaning procedures** - Current cleaning tasks and schedules
- [ ] **Supplier database** - All vendors and contact information
- [ ] **Recipe collection** - All current recipes with ingredients and costs
- [ ] **Equipment inventory** - Thermometers and monitoring equipment
- [ ] **Domain preference** - Desired subdomain (e.g., yourstore.cleentrac.com)

**Data Format Requirements**:
- [ ] **CSV files** prepared according to templates
- [ ] **Data validation** completed using provided tools
- [ ] **Contact information** verified for all staff
- [ ] **Department assignments** confirmed for all staff and items

---

### **Schema Setup Process**

**1. Tenant Creation**:
- [ ] **Store record** created with unique schema name
- [ ] **Database schema** automatically provisioned
- [ ] **Domain configuration** set up with SSL certificates
- [ ] **Initial admin user** created

**2. Data Import Process**:
- [ ] **Departments** imported first (required for all other data)
- [ ] **Staff/Users** imported with proper role assignments
- [ ] **Suppliers** imported for recipe and receiving dependencies
- [ ] **Cleaning Items** imported with department assignments
- [ ] **Recipes and Ingredients** imported for food operations
- [ ] **Temperature Monitoring** setup with area units and thermometers

**3. Data Validation**:
- [ ] **Referential integrity** verified (all foreign keys valid)
- [ ] **Department assignments** confirmed for all entities
- [ ] **User permissions** tested (managers can access admin)
- [ ] **Recipe calculations** verified (ingredient costs match totals)

---

### **User Setup Process**

**1. Admin User Creation**:
- [ ] **Superuser account** created for tenant admin
- [ ] **Admin access** verified via tenant domain
- [ ] **Password policy** enforced and communicated
- [ ] **Two-factor authentication** configured (if required)

**2. Staff Account Provisioning**:
- [ ] **User accounts** created for all staff
- [ ] **Department assignments** applied
- [ ] **Role-based permissions** configured
- [ ] **Login credentials** securely distributed

**3. Training and Documentation**:
- [ ] **Admin training** provided for tenant administrators
- [ ] **User guides** provided for staff members
- [ ] **Support contacts** established
- [ ] **System overview** presentation completed

---

### **Domain Configuration**

**1. Subdomain Setup**:
- [ ] **Domain availability** verified
- [ ] **DNS records** configured
- [ ] **SSL certificates** provisioned and installed
- [ ] **Domain routing** tested and verified

**2. Integration Points**:
- [ ] **Manager interface** accessible via tenant domain
- [ ] **Receiving interface** accessible via tenant domain
- [ ] **API endpoints** responding correctly
- [ ] **CORS configuration** updated for tenant domains

---

### **Integration Testing**

**1. System Functionality**:
- [ ] **User authentication** working across all interfaces
- [ ] **Data access** properly isolated to tenant schema
- [ ] **Admin interface** fully functional
- [ ] **API endpoints** returning correct tenant data

**2. Business Process Testing**:
- [ ] **Cleaning task management** workflow tested
- [ ] **Recipe management** functionality verified
- [ ] **Temperature logging** process tested
- [ ] **Receiving process** workflow verified (if applicable)

**3. Performance Testing**:
- [ ] **Page load times** acceptable
- [ ] **Database queries** optimized for tenant data
- [ ] **Concurrent user** access tested
- [ ] **Data backup** and recovery tested

---

### **Go-Live Checklist**

**Final Verification**:
- [ ] **All data** imported and validated
- [ ] **All users** can log in successfully
- [ ] **All business processes** tested and working
- [ ] **Documentation** provided to tenant
- [ ] **Support channels** established

**Launch Activities**:
- [ ] **DNS propagation** completed (24-48 hours)
- [ ] **SSL certificates** active and valid
- [ ] **Monitoring** enabled for new tenant
- [ ] **Backup schedules** configured

**Post-Launch Support**:
- [ ] **Initial support period** (first 30 days)
- [ ] **User feedback** collection process
- [ ] **Issue escalation** procedures established
- [ ] **Success metrics** tracking initiated

---

## 📊 **Data Volume Guidelines**

Based on Cape Station analysis, new tenants should expect:

| Data Type | Minimum | Typical | Maximum |
|-----------|---------|---------|---------|
| Departments | 3 | 6 | 10 |
| Staff/Users | 10 | 42 | 100 |
| Cleaning Items | 50 | 109 | 200 |
| Suppliers | 20 | 60 | 150 |
| Recipes | 30 | 74 | 150 |
| Area Units | 15 | 26 | 50 |
| Thermometers | 1 | 2 | 10 |

---

## 🔧 **Technical Requirements**

**System Requirements**:
- **Database**: PostgreSQL with django-tenants support
- **Schema Isolation**: Each tenant gets isolated database schema
- **Domain Structure**: `{tenant}.manager.cleentrac.com` and `{tenant}.receiving.cleentrac.com`
- **SSL**: Automatic SSL certificate provisioning
- **Backup**: Daily automated backups per tenant

**Integration Requirements**:
- **API Access**: RESTful API for all business data
- **Authentication**: Django-based user authentication
- **Permissions**: Role-based access control (manager/staff)
- **Multi-tenancy**: Complete data isolation between tenants

---

## 📞 **Support and Resources**

**Documentation**:
- **User Guides**: Available in tenant admin interface
- **API Documentation**: Available at `/api/docs/`
- **Video Tutorials**: Available in knowledge base

**Support Channels**:
- **Email**: support@cleentrac.com
- **Phone**: +27 (0)67 010-XXXX
- **Help Desk**: Available via tenant admin interface

**Training Resources**:
- **Admin Training**: 2-hour onboarding session
- **Staff Training**: 1-hour system overview
- **Ongoing Support**: Monthly check-ins for first 6 months

---

*This document serves as the complete reference for CleenTrac tenant onboarding. All new tenants must provide data according to these specifications to ensure successful system deployment and operation.*
