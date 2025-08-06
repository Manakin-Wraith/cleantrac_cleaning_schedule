# Cape Station Manager Domain Deployment Guide

## 🎯 **Problem**
Cape Station's manager domain `https://capestation.manager.cleentrac.com` returns HTTP 404 despite having correct DNS resolution and domain records in the database.

## 🔍 **Root Cause**
The React frontend is not properly deployed/configured to serve manager subdomain requests.

## 🚀 **Automated Fix**

### **Step 1: Upload and Run Deployment Script**

1. **Upload the script to production server:**
   ```bash
   # From your local machine
   scp -i ~/.ssh/cleantrac.pem scripts/fix_manager_domain_deployment.sh ubuntu@13.60.56.181:~/
   ```

2. **SSH to production server:**
   ```bash
   ssh -i ~/.ssh/cleantrac.pem ubuntu@13.60.56.181
   ```

3. **Make script executable and run:**
   ```bash
   chmod +x ~/fix_manager_domain_deployment.sh
   ./fix_manager_domain_deployment.sh
   ```

### **What the Script Does**

1. **Creates Backup** - Backs up current nginx config and frontend build
2. **Updates Code** - Pulls latest changes from git repository
3. **Builds Frontend** - Runs `npm ci` and `npm run build` for React app
4. **Configures Nginx** - Creates proper nginx config for `*.manager.cleentrac.com`
5. **Tests Configuration** - Validates nginx config before applying
6. **Restarts Services** - Restarts nginx and CleanTrac backend
7. **Validates Deployment** - Tests that the manager domain responds correctly

### **Expected Output**
```
🚀 CleanTrac Manager Domain Deployment Fix
==========================================
✅ Backup created
✅ Prerequisites checked
✅ Code updated from git
✅ Frontend built successfully
✅ Nginx configured for manager domains
✅ Services restarted
✅ Deployment tested

🎉 Deployment completed successfully!

🌐 Test the manager domain:
   https://capestation.manager.cleentrac.com
```

## 🔧 **Manual Verification Steps**

After running the script, verify the fix:

### **1. Test Manager Domain Access**
```bash
curl -I https://capestation.manager.cleentrac.com
# Expected: HTTP 200 or 302 (not 404)
```

### **2. Check Nginx Configuration**
```bash
sudo nginx -t
sudo systemctl status nginx
```

### **3. Check Frontend Build**
```bash
ls -la ~/cleantrac_cleaning_schedule/frontend/dist/
# Should contain index.html and assets
```

### **4. Check Service Status**
```bash
sudo systemctl status cleantrac
sudo systemctl status nginx
```

## 🛠️ **Troubleshooting**

### **If Script Fails:**

1. **Check the log file:**
   ```bash
   tail -f ~/cleantrac_cleaning_schedule/deployment.log
   ```

2. **Restore from backup if needed:**
   ```bash
   # Backup location will be shown in script output
   sudo cp ~/cleantrac_backups/TIMESTAMP/nginx_cleantrac.conf /etc/nginx/sites-available/cleantrac_manager
   sudo systemctl restart nginx
   ```

### **Common Issues:**

- **Node.js/npm not found**: Install Node.js on production server
- **Permission errors**: Ensure script runs with proper sudo access
- **SSL certificate issues**: Update SSL paths in nginx config
- **Port conflicts**: Ensure port 8000 is available for Django backend

## 📋 **Manual Steps (if script fails)**

### **1. Build Frontend Manually**
```bash
cd ~/cleantrac_cleaning_schedule/frontend
npm ci
npm run build
```

### **2. Create Nginx Config Manually**
```bash
sudo nano /etc/nginx/sites-available/cleantrac_manager
# Copy the nginx configuration from the script
sudo ln -s /etc/nginx/sites-available/cleantrac_manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### **3. Update Django Settings**
Add to `ALLOWED_HOSTS` in `cleantrac_project/settings.py`:
```python
ALLOWED_HOSTS = [
    # ... existing hosts ...
    "*.manager.cleentrac.com",
    "capestation.manager.cleentrac.com",
]
```

## ✅ **Success Criteria**

After deployment, you should be able to:
1. Access `https://capestation.manager.cleentrac.com` without 404 error
2. See the React frontend loading properly
3. Login and access the manager dashboard
4. API calls to `/api/` endpoints work correctly

## 📞 **Support**

If issues persist after running the script:
1. Check the deployment log: `~/cleantrac_cleaning_schedule/deployment.log`
2. Verify DNS still resolves correctly: `nslookup capestation.manager.cleentrac.com`
3. Check AWS Load Balancer health checks in AWS Console
4. Review nginx error logs: `sudo tail -f /var/log/nginx/error.log`
