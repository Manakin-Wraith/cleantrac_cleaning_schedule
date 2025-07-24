# Production Deployment – Quick Reference

> **Production URL**: `api.cleentrac.com`  
> **Architecture**: AWS ECS/Fargate + Application Load Balancer  
> **Region**: `eu-north-1`  
> **Load Balancer**: `cleentrac-alb-1566483969.eu-north-1.elb.amazonaws.com`  
> **IPs**: `13.61.250.221`, `13.49.54.82`

---

## 🏗️ **Architecture Overview**

- **Manager Frontend**: EC2 Server (`13.60.56.181`) - Traditional server deployment
- **Receiving Frontend**: AWS ECS/Fargate (`spatrac-receiving-service`) - Containerized deployment  
- **Backend API**: `api.cleentrac.com` - Serves both frontends
- **Database**: AWS RDS PostgreSQL - Multi-tenant with schema separation

---

## 1. AWS ECS/Fargate Management (Receiving Frontend)

### ✅ **Recommended: AWS CLI (ECS Management)**
```bash
# Check service status
aws ecs describe-services --cluster spatrac-prod --services spatrac-receiving-service

# Force new deployment (restart with latest code)
aws ecs update-service --cluster spatrac-prod --service spatrac-receiving-service --force-new-deployment

# List running tasks
aws ecs list-tasks --cluster spatrac-prod --service-name spatrac-receiving-service

# Check task health
aws ecs describe-tasks --cluster spatrac-prod --tasks <task-id>
```

### 📊 **Monitor Deployment Status**
```bash
# Check deployment progress
aws ecs describe-services --cluster spatrac-prod --services spatrac-receiving-service \
  --query 'services[0].deployments[*].{Status:status,CreatedAt:createdAt,RunningCount:runningCount}'
```

### 📝 **View Application Logs**
```bash
# View recent logs
aws logs tail /ecs/spatrac-receiving --follow

# View logs for specific time range
aws logs tail /ecs/spatrac-receiving --since 1h
```

---

## 2. Alternative: ECS Exec (Container SSH)

### **Enable ECS Exec** (if not already enabled)
```bash
aws ecs update-service --cluster spatrac-prod --service spatrac-receiving-service --enable-execute-command
```

### **Connect to Running Container**
```bash
# Get task ID first
TASK_ID=$(aws ecs list-tasks --cluster spatrac-prod --service-name spatrac-receiving-service --query 'taskArns[0]' --output text | cut -d'/' -f3)

# Connect to container
aws ecs execute-command --cluster spatrac-prod --task $TASK_ID --container spatrac-receiving --interactive --command "/bin/bash"
```

---

## 2. EC2 Server Management (Manager Frontend)

> **🎯 PRODUCTION**: This EC2 server hosts the Manager Frontend and backend services.

**Instance hostname**: `api.13-60-56-181.nip.io` (legacy)  
**Public IPv4**: `13.60.56.181`  
**Purpose**: Manager Frontend (`www.cleentrac.com`, `manager.cleentrac.com`)  
**Backend API**: Also serves `api.cleentrac.com` endpoints

### SSH Access (Production Manager Frontend)
```bash
# Connect to production EC2 server
ssh ubuntu@13.60.56.181

# Or with explicit key
ssh -i ~/.ssh/cleantrac.pem ubuntu@13.60.56.181
```

### **Update Code and Restart Services**
```bash
# 1. Navigate to project directory
cd ~/cleantrac_cleaning_schedule

# 2. Pull latest code
git pull origin main

# 3. Check current commit
git log --oneline -1

# 4. Restart backend services (adjust service names as needed)
sudo systemctl restart cleantrac
sudo systemctl restart gunicorn
sudo systemctl restart nginx

# 5. Check service status
sudo systemctl status cleantrac --no-pager -l
sudo systemctl status nginx --no-pager -l
```

### **View Service Logs**
```bash
# View backend service logs
sudo journalctl -u cleantrac -f

# View nginx logs
sudo journalctl -u nginx -f

# View recent logs
sudo journalctl -u cleantrac --since "1 hour ago"
```

### **Troubleshooting**
```bash
# Check running services
sudo systemctl status --no-pager | grep -i clean
sudo systemctl status --no-pager | grep -i django
sudo systemctl status --no-pager | grep -i gunicorn

# Check port usage
sudo netstat -tlnp | grep :8000
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Test API endpoint
curl -I https://api.cleentrac.com/api/
```

### **SSH Connection Troubleshooting**
3. **Add verbosity to debug authentication failures**:
   ```bash
   ssh -vvv -i ~/.ssh/cleantrac.pem ubuntu@13.60.56.181
   ```

4. **Verify server-side key**: Check `/home/ubuntu/.ssh/authorized_keys`

5. **Confirm correct login user**:
   * Ubuntu images → `ubuntu`
   * Amazon Linux 2 → `ec2-user`
   * Debian → `admin` or `debian`

---

## 3. Development/Legacy Server Reference

> **⚠️ Note**: Legacy development server information for reference only.

The default project directory lives in the Ubuntu home folder.

## 2. Activate the project environment
```bash
cd ~/cleantrac_cleaning_schedule   # project root
source venv/bin/activate           # prompt becomes (venv) ubuntu@ip-…:~/cleantrac_cleaning_schedule$
```

## 3. Manage the production Gunicorn service
The Django backend runs via **systemd** under the service name `cleantrac`.

```bash
sudo systemctl start   cleantrac   # start if stopped
sudo systemctl restart cleantrac   # reload newer code / config
sudo systemctl stop    cleantrac   # stop the service
sudo systemctl status  cleantrac   # view health & recent logs
```

### Tail live logs
```bash
journalctl -u cleantrac -f -n 100   # follow last 100 lines
```

## 4. Local development server (optional)
Inside the virtualenv you can still run:
```bash
python manage.py runserver 0.0.0.0:8000
```
This is **only** for quick debugging; the production site should always use the systemd service.

## 5. Environment variables
All sensitive settings are stored in `/etc/cleantrac.env`.
Load them in a one-off shell with:
```bash
sudo bash -c 'set -a && source /etc/cleantrac.env && set +a && bash'
```

## 6. Confirm the machine’s public IP
```bash
curl -s http://checkip.amazonaws.com
```
(Should return `13.60.56.181`.)

---

### Handy Django management snippets
```bash
# count ReceivingRecord rows
python manage.py shell -c 'from core.receiving_models import ReceivingRecord as R; print(R.objects.count())'
```

---

_Last updated: 2025-07-04_
