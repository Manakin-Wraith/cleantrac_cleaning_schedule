# CleanTrac System Architecture

## 🏗️ **System Overview**

CleanTrac is a multi-tenant SaaS cleaning management system with separate frontend applications and a unified backend API.

## 🌐 **Production Architecture**

### **Frontend Applications**
- **Manager Frontend** (`cleantrac`)
  - **Deployment**: EC2 Server (`13.60.56.181`)
  - **Domain**: `www.cleentrac.com`, `manager.cleentrac.com`
  - **Purpose**: Main management interface for cleaning operations
  - **Technology**: React.js
  - **Access**: SSH via `ssh -i ~/.ssh/cleantrac.pem ubuntu@13.60.56.181`

- **Receiving Frontend** (`receiving`)
  - **Deployment**: AWS ECS/Fargate (`spatrac-receiving-service`)
  - **Cluster**: `spatrac-prod`
  - **Domain**: `receiving.cleentrac.com`
  - **Purpose**: Specialized receiving operations interface
  - **Technology**: Streamlit
  - **Access**: ECS Exec via AWS CLI

### **Backend API**
- **Domain**: `api.cleentrac.com`
- **Technology**: Django REST Framework
- **Database**: AWS RDS PostgreSQL (multi-tenant with django-tenants)
- **Architecture**: Multi-tenant with schema separation
- **Load Balancer**: AWS Application Load Balancer
- **Deployment**: Shared between EC2 and ECS (needs clarification)

### **Database**
- **Type**: AWS RDS PostgreSQL
- **Multi-tenancy**: Schema-based separation using django-tenants
- **Tenants**: 
  - `public` schema (original/legacy data)
  - `capestation` schema (Cape Station tenant)
  - Additional tenant schemas as needed

## 🔧 **Development & Deployment**

### **Local Development**
- **Frontend**: Vite dev server (`npm run dev`)
- **Backend**: Django dev server (`python manage.py runserver`)
- **Database**: Local PostgreSQL or SQLite fallback

### **Production Deployment**

#### **Manager Frontend (EC2)**
```bash
# Connect to EC2 server
ssh -i ~/.ssh/cleantrac.pem ubuntu@13.60.56.181

# Update code
cd ~/cleantrac_cleaning_schedule
git pull origin main

# Restart services (service names TBD)
sudo systemctl restart cleantrac-backend
sudo systemctl restart nginx
```

#### **Receiving Frontend (ECS)**
```bash
# List tasks
aws ecs list-tasks --cluster spatrac-prod --service-name spatrac-receiving-service

# Update service (force new deployment)
aws ecs update-service --cluster spatrac-prod --service spatrac-receiving-service --force-new-deployment

# Access container
TASK_ID=$(aws ecs list-tasks --cluster spatrac-prod --service-name spatrac-receiving-service --query 'taskArns[0]' --output text | cut -d'/' -f3)
aws ecs execute-command --cluster spatrac-prod --task $TASK_ID --container spatrac-receiving --interactive --command "/bin/bash"
```

## 🌍 **Domain & DNS Configuration**

### **Production Domains**
- `www.cleentrac.com` → Manager Frontend (EC2)
- `manager.cleentrac.com` → Manager Frontend (EC2)
- `receiving.cleentrac.com` → Receiving Frontend (ECS)
- `api.cleentrac.com` → Backend API (Load Balancer)

### **Development Domains**
- `api.13-60-56-181.nip.io` → Development/staging backend
- `capestation.manager.cleentrac.com` → Tenant-specific admin
- `capestation.receiving.cleentrac.com` → Tenant-specific receiving

## 🔐 **Authentication & Multi-tenancy**

### **Authentication**
- **Method**: Token-based authentication
- **Endpoints**: `/api/token-auth/`, `/api/auth/`
- **CORS**: Configured for all frontend domains

### **Multi-tenancy**
- **Method**: Schema-based separation (django-tenants)
- **Tenant Model**: `customers.Store`
- **Domain Model**: `customers.StoreDomain`
- **Admin Access**: Tenant-specific admin interfaces

## 📊 **Monitoring & Logs**

### **ECS Logs**
```bash
# View ECS logs
aws logs tail /ecs/spatrac-receiving --follow

# View logs for specific time range
aws logs tail /ecs/spatrac-receiving --since 1h
```

### **EC2 Logs**
```bash
# SSH to EC2 server
ssh -i ~/.ssh/cleantrac.pem ubuntu@13.60.56.181

# View service logs
sudo journalctl -u cleantrac-backend -f
sudo journalctl -u nginx -f
```

## 🚨 **Common Issues & Troubleshooting**

### **500 Server Errors**
1. **Check backend service status** on EC2 server
2. **Verify database connectivity** and tenant configuration
3. **Check environment variables** and settings
4. **Review application logs** for specific error details

### **CORS Issues**
1. **Verify CORS_ALLOWED_ORIGINS** includes all frontend domains
2. **Check CSRF_TRUSTED_ORIGINS** for admin access
3. **Ensure proper headers** in API responses

### **Deployment Issues**
1. **ECS**: Check task definition and service configuration
2. **EC2**: Verify service status and restart if needed
3. **Database**: Ensure migrations are applied and permissions are correct

## 🔄 **CI/CD Pipeline**

### **Current State**
- **Manual deployment** for both EC2 and ECS
- **Git-based** code synchronization
- **Service restarts** required after code updates

### **Future Improvements**
- Automated CI/CD pipeline
- Docker image building and pushing
- Blue-green deployments
- Automated testing integration

## 📝 **Environment Variables**

### **Frontend (.env.production)**
```env
VITE_API_BASE=https://api.cleentrac.com/api
```

### **Backend (systemd environment)**
```env
DATABASE_CLEANTRAC_URL=postgresql://user:pass@host:port/dbname
DJANGO_SETTINGS_MODULE=cleantrac.settings
TENANT_DOMAIN_MODEL=customers.StoreDomain
```

## 🎯 **Next Steps**

1. **Clarify backend deployment** (EC2 vs ECS vs both)
2. **Implement automated CI/CD** pipeline
3. **Add health check endpoints** for better monitoring
4. **Document service names** and restart procedures
5. **Implement proper logging** and monitoring solutions
