# CleanTrac Tenant Onboarding Checklist

## 📋 Pre-Onboarding Data Collection

### **Required Information**
- [ ] **Store Name**: Official business name for your CleanTrac tenant
- [ ] **Admin Contact**: Primary administrator email and phone number
- [ ] **Desired Subdomain**: Preferred subdomain (e.g., `yourstore.cleentrac.com`)
- [ ] **Business Type**: Confirm you operate BAKERY, BUTCHERY, and/or HMR departments

### **Data Collection Status**
- [ ] **Departments List** ✅ Template: `departments_template.csv`
- [ ] **Staff Roster** ✅ Template: `staff_template.csv`
- [ ] **Cleaning Procedures** ✅ Template: `cleaning_items_template.csv`
- [ ] **Supplier Database** ✅ Template: `suppliers_template.csv`
- [ ] **Recipe Collection** ✅ Template: `recipes_template.csv` + `recipe_ingredients_template.csv`
- [ ] **Temperature Monitoring** ✅ Template: `area_units_template.csv` + `thermometers_template.csv`

---

## 📊 Data Validation Checklist

### **1. Departments (Required)**
- [ ] **Minimum 3 departments**: BAKERY, BUTCHERY, HMR
- [ ] **Unique names**: No duplicate department names
- [ ] **Valid format**: CSV with 'name' column header
- [ ] **Character limit**: Each name ≤ 50 characters

### **2. Staff/Users (Required)**
- [ ] **Minimum 10 users**: At least 10 staff members total
- [ ] **Manager per department**: Each department has at least 1 manager
- [ ] **Unique usernames**: No duplicate usernames
- [ ] **Valid emails**: All email addresses are properly formatted
- [ ] **Phone format**: All phones start with +27 (South African format)
- [ ] **Department matching**: All departments exist in departments list
- [ ] **Role validation**: All roles are either "manager" or "staff"
- [ ] **Admin access**: At least 1 user has `is_staff=true`

### **3. Cleaning Items (Required)**
- [ ] **Minimum 50 items**: At least 50 cleaning tasks total
- [ ] **Department coverage**: Items for all departments
- [ ] **Valid frequencies**: Only approved frequency values used
- [ ] **Detailed methods**: All cleaning methods are descriptive
- [ ] **Department matching**: All departments exist in departments list

### **4. Products (Required for Receiving)**
- [ ] **Master product catalog**: 200+ products covering all received ingredients and recipe outputs
- [ ] **Unique product codes**: No duplicate product codes across entire catalog
- [ ] **Received ingredients**: Products with supplier_code for items received from suppliers
- [ ] **Recipe outputs**: Products for finished goods made in-house (breads, prepared foods)
- [ ] **Complete names**: All products have descriptive names
- [ ] **Supplier linkage**: Received ingredients linked to valid supplier codes

### **5. Suppliers (Required)**
- [ ] **Minimum 20 suppliers**: At least 20 supplier records
- [ ] **Unique codes**: No duplicate supplier codes
- [ ] **Complete names**: All suppliers have business names
- [ ] **Contact info**: Most suppliers have contact information
- [ ] **Product linkage**: Suppliers linked to products they supply

### **6. Recipes (Food Operations)**
- [ ] **Department recipes**: Recipes for each food department
- [ ] **Unique codes**: Recipe product codes exist in master product catalog
- [ ] **Valid departments**: All departments exist in departments list
- [ ] **Positive costs**: All unit costs are positive numbers
- [ ] **Recipe ingredients**: Each recipe has associated ingredients with valid product codes
- [ ] **Ingredient costs**: All ingredient costs are realistic
- [ ] **Product code consistency**: All ingredient codes reference valid products in master catalog

### **7. Temperature Monitoring (Required)**
- [ ] **Area units**: 15-30 monitoring points defined
- [ ] **Thermometers**: 2-5 thermometer devices
- [ ] **Valid ranges**: Min temperature < Max temperature
- [ ] **Recent calibration**: Thermometer calibration within 12 months
- [ ] **Department matching**: All departments exist in departments list

---

## 🔧 Technical Validation

### **File Format Requirements**
- [ ] **CSV format**: All files are valid CSV format
- [ ] **UTF-8 encoding**: Files use UTF-8 character encoding
- [ ] **Header rows**: First row contains column headers
- [ ] **No empty rows**: No blank rows in data
- [ ] **Consistent delimiters**: All files use comma delimiters

### **Data Integrity Checks**
- [ ] **Foreign key validation**: All department references are valid
- [ ] **No circular references**: No self-referencing relationships
- [ ] **Reasonable data volumes**: Data volumes within expected ranges
- [ ] **No special characters**: Avoid problematic characters in names/codes

---

## 🌐 Domain and Infrastructure

### **Domain Configuration**
- [ ] **Subdomain availability**: Requested subdomain is available
- [ ] **DNS requirements**: Understand DNS propagation time (24-48 hours)
- [ ] **SSL certificates**: Automatic SSL provisioning confirmed
- [ ] **Domain format**: Follows pattern `{tenant}.manager.cleentrac.com`

### **Access Requirements**
- [ ] **Internet connectivity**: Reliable internet connection for cloud access
- [ ] **Browser compatibility**: Modern browsers (Chrome, Firefox, Safari, Edge)
- [ ] **Mobile access**: Confirm mobile device compatibility needs
- [ ] **User training**: Plan for staff training on new system

---

## 📋 Onboarding Process Steps

### **Phase 1: Data Preparation (Customer)**
- [ ] **Download templates**: Get CSV templates from CleanTrac team
- [ ] **Populate data**: Fill in all required information
- [ ] **Validate data**: Use validation checklist above
- [ ] **Review completeness**: Ensure all required files are ready

### **Phase 2: Submission and Review (1-2 days)**
- [ ] **Submit data**: Send CSV files to CleanTrac onboarding team
- [ ] **Data validation**: CleanTrac team validates data format and completeness
- [ ] **Feedback provided**: Any data issues communicated back to customer
- [ ] **Data corrections**: Customer makes any required corrections

### **Phase 3: System Setup (2-3 days)**
- [ ] **Tenant creation**: CleanTrac creates tenant database schema
- [ ] **Data import**: Customer data imported into tenant schema
- [ ] **Domain setup**: Subdomain configured with SSL certificates
- [ ] **Admin user creation**: Primary admin account created

### **Phase 4: Testing and Validation (1-2 days)**
- [ ] **System access**: Customer can log into admin interface
- [ ] **Data verification**: Customer verifies all data imported correctly
- [ ] **Functionality testing**: Core features tested and working
- [ ] **User account testing**: All staff can log in successfully

### **Phase 5: Training and Go-Live (1 day)**
- [ ] **Admin training**: 2-hour training session for administrators
- [ ] **Staff overview**: 1-hour system overview for staff
- [ ] **Documentation provided**: User guides and support materials
- [ ] **Go-live confirmation**: System officially launched for production use

---

## 📞 Support and Communication

### **During Onboarding**
- [ ] **Primary contact**: Designated CleanTrac onboarding specialist assigned
- [ ] **Communication channel**: Email/phone contact established
- [ ] **Progress updates**: Regular updates on onboarding progress
- [ ] **Issue escalation**: Clear process for resolving any problems

### **Post Go-Live Support**
- [ ] **30-day support**: Intensive support for first 30 days
- [ ] **Monthly check-ins**: Regular check-ins for first 6 months
- [ ] **Help desk access**: 24/7 help desk via admin interface
- [ ] **Training resources**: Access to video tutorials and documentation

---

## ⚠️ Common Issues and Solutions

### **Data Format Issues**
- **Problem**: CSV files won't import
- **Solution**: Ensure UTF-8 encoding and proper comma delimiters

### **Department Mismatches**
- **Problem**: Staff/items reference non-existent departments
- **Solution**: Verify all department names match exactly (case-sensitive)

### **Phone Number Format**
- **Problem**: Phone numbers rejected during import
- **Solution**: Ensure all numbers start with +27 (South African format)

### **Recipe Cost Calculations**
- **Problem**: Recipe costs don't add up correctly
- **Solution**: Verify ingredient quantities and unit costs are accurate

### **Domain Access Issues**
- **Problem**: Can't access tenant domain after setup
- **Solution**: Wait 24-48 hours for DNS propagation, clear browser cache

---

## 📊 Success Metrics

### **Onboarding Completion Criteria**
- [ ] **All data imported**: 100% of required data successfully imported
- [ ] **All users active**: All staff members can log in and access appropriate features
- [ ] **Core workflows tested**: Cleaning tasks, recipes, temperature monitoring all functional
- [ ] **Admin trained**: Primary administrators comfortable with system management
- [ ] **Support established**: Help desk access confirmed and tested

### **30-Day Success Indicators**
- [ ] **Daily usage**: Staff actively using system for daily operations
- [ ] **Data accuracy**: No major data corrections needed
- [ ] **User satisfaction**: Positive feedback from staff and management
- [ ] **System stability**: No significant technical issues or downtime
- [ ] **Business integration**: System integrated into daily business processes

---

## 📋 Final Go-Live Checklist

### **Technical Readiness**
- [ ] **All systems operational**: Database, web interface, API all functioning
- [ ] **Performance acceptable**: Page load times under 3 seconds
- [ ] **Backup configured**: Daily automated backups scheduled
- [ ] **Monitoring active**: System health monitoring enabled

### **User Readiness**
- [ ] **All staff trained**: Everyone knows how to use relevant features
- [ ] **Passwords distributed**: All users have secure login credentials
- [ ] **Support contacts**: Everyone knows how to get help
- [ ] **Quick reference**: Cheat sheets and guides available

### **Business Readiness**
- [ ] **Processes documented**: New workflows documented and communicated
- [ ] **Old system transition**: Plan for transitioning from old systems
- [ ] **Success metrics defined**: Clear goals for system success
- [ ] **Feedback process**: Method for collecting user feedback and improvements

---

**Estimated Total Onboarding Time: 7-10 business days**

*This checklist ensures a smooth, successful onboarding process for new CleanTrac tenants. Complete each section thoroughly to avoid delays and ensure optimal system performance.*
