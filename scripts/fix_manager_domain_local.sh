#!/bin/bash

# fix_manager_domain_local.sh
# Simplified deployment script to run from the production server directly
# Run this from: (venv) ubuntu@ip-172-31-42-178:~/cleantrac_cleaning_schedule$

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - using current directory
PROJECT_DIR="$(pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKUP_DIR="$HOME/cleantrac_backups/$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}🚀 CleanTrac Manager Domain Fix (Local)${NC}"
echo -e "${BLUE}=====================================${NC}"
echo "Running from: $PROJECT_DIR"
echo "Frontend dir: $FRONTEND_DIR"
echo "Virtual env: $(which python)"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Create backup
print_info "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup nginx configuration if it exists
if [ -f "/etc/nginx/sites-available/cleantrac" ]; then
    sudo cp "/etc/nginx/sites-available/cleantrac" "$BACKUP_DIR/nginx_cleantrac.conf"
    print_status "Nginx configuration backed up"
fi

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    print_error "Not in Django project directory. Please run from ~/cleantrac_cleaning_schedule"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

# Update code from git
print_info "Updating code from git..."
git stash push -m "Auto-stash before deployment $(date)" || true
git pull origin main
print_status "Code updated"

# Build frontend
print_info "Building React frontend..."
cd "$FRONTEND_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in frontend directory"
    exit 1
fi

# Install dependencies and build
print_info "Installing npm dependencies..."
npm ci --production=false

print_info "Building frontend for production..."
npm run build

# Verify build was successful
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    print_error "Frontend build failed - dist directory or index.html not found"
    exit 1
fi

print_status "Frontend built successfully"
ls -la dist/

# Configure nginx for manager domains
print_info "Configuring nginx for manager domains..."

cat > "/tmp/cleantrac_manager.conf" << 'EOF'
# CleanTrac Manager Domain Configuration
server {
    listen 80;
    server_name *.manager.cleentrac.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name *.manager.cleentrac.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/cleentrac.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cleentrac.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Document root for React frontend
    root /home/ubuntu/cleantrac_cleaning_schedule/frontend/dist;
    index index.html;
    
    # Handle React Router (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy to Django backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }
    
    # Static files with caching
    location /static/ {
        alias /home/ubuntu/cleantrac_cleaning_schedule/frontend/dist/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Assets with caching
    location /assets/ {
        alias /home/ubuntu/cleantrac_cleaning_schedule/frontend/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Install the nginx configuration
sudo cp "/tmp/cleantrac_manager.conf" "/etc/nginx/sites-available/cleantrac_manager"
sudo ln -sf "/etc/nginx/sites-available/cleantrac_manager" "/etc/nginx/sites-enabled/cleantrac_manager"

print_status "Nginx configuration installed"

# Test nginx configuration
print_info "Testing nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Restart services
print_info "Restarting nginx..."
sudo systemctl restart nginx

if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx restarted successfully"
else
    print_error "Nginx failed to start"
    sudo systemctl status nginx
    exit 1
fi

# Restart Django backend
print_info "Restarting CleanTrac backend..."
sudo systemctl restart cleantrac

if sudo systemctl is-active --quiet cleantrac; then
    print_status "CleanTrac backend restarted successfully"
else
    print_warning "CleanTrac backend may have issues"
    sudo systemctl status cleantrac
fi

# Test the deployment
print_info "Testing deployment..."

# Test local nginx
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    print_status "Local nginx responding with HTTP $HTTP_CODE"
else
    print_warning "Local nginx returned HTTP $HTTP_CODE"
fi

# Test manager domain
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: capestation.manager.cleentrac.com" http://localhost/ || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    print_status "Manager domain responding with HTTP $HTTP_CODE"
else
    print_warning "Manager domain returned HTTP $HTTP_CODE"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo -e "${BLUE}🌐 Test the manager domain:${NC}"
echo "   https://capestation.manager.cleentrac.com"
echo ""
echo -e "${BLUE}📁 Backup location:${NC}"
echo "   $BACKUP_DIR"
echo ""
echo "Completed at: $(date)"
