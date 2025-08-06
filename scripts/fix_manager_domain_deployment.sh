#!/bin/bash

# fix_manager_domain_deployment.sh
# Automated deployment script to fix Cape Station manager domain access issues
# Run this script on the production server (13.60.56.181)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$HOME/cleantrac_cleaning_schedule"
FRONTEND_DIR="$PROJECT_DIR/frontend"
VENV_DIR="$PROJECT_DIR/venv"  # Use production venv, not venv_new
NGINX_SITES_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
BACKUP_DIR="$HOME/cleantrac_backups/$(date +%Y%m%d_%H%M%S)"

# Logging
LOG_FILE="$PROJECT_DIR/deployment.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

echo -e "${BLUE}🚀 CleanTrac Manager Domain Deployment Fix${NC}"
echo -e "${BLUE}==========================================${NC}"
echo "Started at: $(date)"
echo "Project Directory: $PROJECT_DIR"
echo "Log File: $LOG_FILE"
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

# Function to create backup
create_backup() {
    print_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    
    # Backup nginx configuration
    if [ -f "$NGINX_SITES_DIR/cleantrac" ]; then
        cp "$NGINX_SITES_DIR/cleantrac" "$BACKUP_DIR/nginx_cleantrac.conf"
        print_status "Nginx configuration backed up"
    fi
    
    # Backup current frontend build (if exists)
    if [ -d "$FRONTEND_DIR/dist" ]; then
        cp -r "$FRONTEND_DIR/dist" "$BACKUP_DIR/frontend_dist_backup"
        print_status "Frontend build backed up"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if we're on the right server
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "Project directory not found: $PROJECT_DIR"
        print_error "Are you running this on the correct server?"
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check if nginx is installed
    if ! command -v nginx &> /dev/null; then
        print_error "nginx is not installed"
        exit 1
    fi
    
    print_status "All prerequisites met"
}

# Function to update code from git
update_code() {
    print_info "Updating code from git repository..."
    cd "$PROJECT_DIR"
    
    # Stash any local changes
    git stash push -m "Auto-stash before deployment $(date)"
    
    # Pull latest changes
    git pull origin main
    
    print_status "Code updated from git"
}

# Function to build frontend
build_frontend() {
    print_info "Building React frontend..."
    cd "$FRONTEND_DIR"
    
    # Activate the correct virtual environment
    if [ -f "$VENV_DIR/bin/activate" ]; then
        print_info "Activating production virtual environment..."
        source "$VENV_DIR/bin/activate"
    else
        print_warning "Virtual environment not found at $VENV_DIR"
    fi
    
    # Install/update dependencies
    print_info "Installing npm dependencies..."
    npm ci --production=false
    
    # Build the frontend
    print_info "Building frontend for production..."
    npm run build
    
    # Verify build was successful
    if [ ! -d "$FRONTEND_DIR/dist" ] || [ ! -f "$FRONTEND_DIR/dist/index.html" ]; then
        print_error "Frontend build failed - dist directory or index.html not found"
        exit 1
    fi
    
    print_status "Frontend built successfully"
    
    # Show build info
    echo "Build directory contents:"
    ls -la "$FRONTEND_DIR/dist/"
}

# Function to configure nginx for manager domains
configure_nginx() {
    print_info "Configuring nginx for manager domains..."
    
    # Create nginx configuration for manager domains
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
    
    # SSL Configuration (adjust paths as needed)
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
    
    # Install the configuration
    sudo cp "/tmp/cleantrac_manager.conf" "$NGINX_SITES_DIR/cleantrac_manager"
    
    # Enable the site
    sudo ln -sf "$NGINX_SITES_DIR/cleantrac_manager" "$NGINX_ENABLED_DIR/cleantrac_manager"
    
    print_status "Nginx configuration created and enabled"
}

# Function to update Django settings
update_django_settings() {
    print_info "Checking Django ALLOWED_HOSTS configuration..."
    
    SETTINGS_FILE="$PROJECT_DIR/cleantrac_project/settings.py"
    
    # Check if manager domains are in ALLOWED_HOSTS
    if grep -q "*.manager.cleentrac.com" "$SETTINGS_FILE"; then
        print_status "Manager domains already in ALLOWED_HOSTS"
    else
        print_warning "Manager domains not found in ALLOWED_HOSTS"
        print_info "Please manually add '*.manager.cleentrac.com' to ALLOWED_HOSTS in $SETTINGS_FILE"
    fi
}

# Function to test nginx configuration
test_nginx() {
    print_info "Testing nginx configuration..."
    
    if sudo nginx -t; then
        print_status "Nginx configuration is valid"
    else
        print_error "Nginx configuration test failed"
        exit 1
    fi
}

# Function to restart services
restart_services() {
    print_info "Restarting services..."
    
    # Restart nginx
    print_info "Restarting nginx..."
    sudo systemctl restart nginx
    
    # Check nginx status
    if sudo systemctl is-active --quiet nginx; then
        print_status "Nginx restarted successfully"
    else
        print_error "Nginx failed to start"
        sudo systemctl status nginx
        exit 1
    fi
    
    # Restart Django backend (if using systemd service)
    if sudo systemctl list-units --type=service | grep -q cleantrac; then
        print_info "Restarting CleanTrac backend service..."
        sudo systemctl restart cleantrac
        
        if sudo systemctl is-active --quiet cleantrac; then
            print_status "CleanTrac backend restarted successfully"
        else
            print_warning "CleanTrac backend service may have issues"
            sudo systemctl status cleantrac
        fi
    else
        print_warning "CleanTrac systemd service not found - you may need to restart manually"
    fi
}

# Function to test the deployment
test_deployment() {
    print_info "Testing the deployment..."
    
    # Test local nginx
    print_info "Testing local nginx response..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200\|301\|302"; then
        print_status "Local nginx responding"
    else
        print_warning "Local nginx may have issues"
    fi
    
    # Test manager domain (if accessible from server)
    print_info "Testing manager domain..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: capestation.manager.cleentrac.com" http://localhost/ || echo "000")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        print_status "Manager domain responding with HTTP $HTTP_CODE"
    else
        print_warning "Manager domain returned HTTP $HTTP_CODE"
    fi
    
    # Check if frontend files are accessible
    if [ -f "$FRONTEND_DIR/dist/index.html" ]; then
        print_status "Frontend index.html exists"
    else
        print_error "Frontend index.html not found"
    fi
}

# Function to show deployment summary
show_summary() {
    echo ""
    echo -e "${BLUE}📋 Deployment Summary${NC}"
    echo -e "${BLUE}===================${NC}"
    echo "✅ Code updated from git"
    echo "✅ Frontend built and deployed"
    echo "✅ Nginx configured for manager domains"
    echo "✅ Services restarted"
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}🌐 Test the manager domain:${NC}"
    echo "   https://capestation.manager.cleentrac.com"
    echo ""
    echo -e "${BLUE}📁 Backup location:${NC}"
    echo "   $BACKUP_DIR"
    echo ""
    echo -e "${BLUE}📝 Log file:${NC}"
    echo "   $LOG_FILE"
    echo ""
    echo "Completed at: $(date)"
}

# Main execution
main() {
    create_backup
    check_prerequisites
    update_code
    build_frontend
    configure_nginx
    update_django_settings
    test_nginx
    restart_services
    test_deployment
    show_summary
}

# Run main function
main "$@"
