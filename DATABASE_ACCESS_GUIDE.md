# 🗄️ Database Developer Access Guide - CleanTrac Multi-Tenant

## 📋 Overview
CleanTrac uses a **multi-tenant architecture** with separate database schemas for each tenant. This guide shows database developers exactly where to go and what they'll see for different access scenarios.

---

## 🔴 **PUBLIC DATABASE (Original/Master) ACCESS**

### **When to Use:**
- Setting up new tenants
- Managing tenant configurations
- Accessing original/master data
- System-wide administration

### **How to Access:**
```bash
# URL Pattern
https://your-domain.com/admin/

# OR via direct server access
python manage.py shell
# This connects to PUBLIC schema by default
```

### **What You'll See in Django Admin:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 CleanTrac Admin                    🔴 PUBLIC SCHEMA      │
│                                          Main/Public Database │
├─────────────────────────────────────────────────────────────┤
│ ⚠️  WARNING: You are in the PUBLIC SCHEMA.                 │
│     User and tenant-specific data may not be visible here. │
│     Current schema: public                                  │
├─────────────────────────────────────────────────────────────┤
│ 🔴 Current Database Schema: public                          │
│    | ⚠️  PUBLIC SCHEMA - Limited tenant data visibility    │
├─────────────────────────────────────────────────────────────┤
│ Available Models:                                           │
│ • Client (Tenant configurations)                           │
│ • Domain (Tenant domains)                                  │
│ • System-wide settings                                     │
│ • Limited user data                                        │
└─────────────────────────────────────────────────────────────┘
```

### **Data Available:**
- ✅ **Tenant configurations** (Client model)
- ✅ **Domain mappings**
- ✅ **System-wide settings**
- ❌ **Limited tenant-specific data** (users, tasks, departments)
- ❌ **Tenant-specific UserProfiles**

---

## 🟢 **TENANT-SPECIFIC ACCESS (Cape Station)**

### **When to Use:**
- Managing Cape Station users and data
- Debugging tenant-specific issues
- Accessing UserProfiles, Tasks, Departments
- Day-to-day tenant operations

### **How to Access:**
```bash
# URL Pattern (Subdomain-based)
https://capestation.your-domain.com/admin/

# OR URL Parameter-based
https://your-domain.com/admin/?tenant=capestation

# OR via server with tenant context
python manage.py tenant_command shell --schema=capestation
```

### **What You'll See in Django Admin:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 CleanTrac Admin                    🟢 CAPE STATION       │
│                                          Cape Station Tenant │
├─────────────────────────────────────────────────────────────┤
│ 🟢 Current Database Schema: capestation                     │
├─────────────────────────────────────────────────────────────┤
│ Available Models:                                           │
│ • UserProfile (42 records)                                 │
│ • Department (BUTCHERY, HMR, BAKERY)                       │
│ • TaskInstance (All tenant tasks)                          │
│ • CleaningItem (Tenant-specific items)                     │
│ • RecurringSchedule                                         │
│ • CompletionLog                                             │
│ • All tenant-specific data                                 │
└─────────────────────────────────────────────────────────────┘
```

### **Data Available:**
- ✅ **All UserProfiles** (42 records for Cape Station)
- ✅ **Departments** (BUTCHERY, HMR, BAKERY)
- ✅ **TaskInstances** (All tenant tasks)
- ✅ **CleaningItems** (Tenant-specific cleaning items)
- ✅ **RecurringSchedules**
- ✅ **CompletionLogs**
- ✅ **All tenant-specific operational data**

---

## 🔵 **OTHER TENANT ACCESS (Future Tenants)**

### **How to Access:**
```bash
# URL Pattern
https://[tenant-name].your-domain.com/admin/

# OR
https://your-domain.com/admin/?tenant=[tenant-name]
```

### **What You'll See:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 CleanTrac Admin                    🔵 [TENANT NAME]      │
│                                          [Tenant Name] Tenant │
├─────────────────────────────────────────────────────────────┤
│ 🔵 Current Database Schema: [tenant-schema]                 │
├─────────────────────────────────────────────────────────────┤
│ Available Models: [Tenant-specific data]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 **CRITICAL SAFETY INDICATORS**

### **Visual Cues to Watch For:**

| Schema Type | Color | Indicator | Warning Level |
|-------------|-------|-----------|---------------|
| **PUBLIC** | 🔴 Red | Blinking badge | ⚠️ HIGH - Limited data |
| **CAPE STATION** | 🟢 Green | Solid badge | ✅ SAFE - Full access |
| **OTHER TENANT** | 🔵 Blue | Solid badge | ✅ SAFE - Tenant data |

### **Red Flags:**
- 🚨 **Blinking red badge** = You're in PUBLIC schema
- 🚨 **"LIMITED TENANT DATA VISIBILITY"** warning
- 🚨 **Missing expected UserProfiles/Tasks**

---

## 📊 **Quick Data Verification Commands**

### **Check Current Schema:**
```python
from django.db import connection
print(f"Current schema: {connection.schema_name}")
```

### **Verify Tenant Data:**
```python
from core.models import UserProfile, Department
print(f"UserProfiles: {UserProfile.objects.count()}")
print(f"Departments: {[d.name for d in Department.objects.all()]}")
```

### **Expected Results:**
- **PUBLIC**: UserProfiles: ~0-5, Limited departments
- **CAPE STATION**: UserProfiles: 42, Departments: BUTCHERY, HMR, BAKERY

---

## 🛠️ **Troubleshooting**

### **"I can't find user data!"**
- ✅ Check the admin header - are you in PUBLIC schema?
- ✅ Look for the red blinking warning
- ✅ Switch to tenant-specific URL

### **"UserProfile 20 doesn't exist!"**
- ✅ This is expected - UserProfile 20 never existed
- ✅ Use correct UserProfile IDs (4-54 with gaps)

### **"I see different data than expected!"**
- ✅ Verify schema with `connection.schema_name`
- ✅ Check the colored badge in admin header
- ✅ Ensure you're in the correct tenant context

---

## 📋 **Quick Reference**

| Need | URL | Schema | Badge Color |
|------|-----|--------|-------------|
| **System Admin** | `/admin/` | `public` | 🔴 Red |
| **Cape Station** | `capestation.domain.com/admin/` | `capestation` | 🟢 Green |
| **Other Tenant** | `[tenant].domain.com/admin/` | `[tenant]` | 🔵 Blue |

**Always check the colored badge in the admin header to confirm which database schema you're accessing!**
