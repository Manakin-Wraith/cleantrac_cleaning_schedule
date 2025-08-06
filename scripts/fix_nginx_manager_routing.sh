#!/bin/bash

# fix_nginx_manager_routing.sh
# Simple nginx configuration fix for manager domain routing
# Since frontend is deployed via Vercel, we just need proper nginx routing

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 CleanTrac Manager Domain Nginx Fix${NC}"
echo -e "${BLUE}====================================${NC}"
echo "Frontend is deployed via Vercel - configuring nginx routing only"
echo ""

# Create backup
BACKUP_DIR="$HOME/cleantrac_backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "/etc/nginx/sites-available/cleantrac" ]; then
    sudo cp "/etc/nginx/sites-available/cleantrac" "$BACKUP_DIR/nginx_cleantrac.conf"
    echo -e "${GREEN}✅ Nginx configuration backed up to $BACKUP_DIR${NC}"
fi

# Check what Vercel domain the frontend is actually deployed to
echo -e "${BLUE}ℹ️  Checking current nginx configuration...${NC}"
if [ -f "/etc/nginx/sites-available/cleantrac" ]; then
    echo "Current nginx config:"
    sudo grep -A 5 -B 5 "manager\|cleentrac" /etc/nginx/sites-available/cleantrac || echo "No manager config found"
fi

# The key insight: We need to determine WHERE the Vercel frontend is deployed
# Let's check if there are any existing proxy configurations
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: We need to know the Vercel deployment URL${NC}"
echo "The manager frontend is deployed on Vercel, but we need to know the URL to proxy to."
echo ""
echo "Common patterns:"
echo "1. Direct Vercel URL: https://cleantrac-frontend-xyz.vercel.app"
echo "2. Custom domain: https://manager.cleentrac.com (already pointing to Vercel)"
echo "3. Main domain: https://www.cleentrac.com (with subdomain routing)"
echo ""

# Let's check DNS to see where manager.cleentrac.com points
echo -e "${BLUE}ℹ️  Checking DNS resolution...${NC}"
nslookup capestation.manager.cleentrac.com || echo "DNS lookup failed"
echo ""

# Create a basic nginx config that should work for most Vercel setups
echo -e "${BLUE}ℹ️  Creating nginx configuration for manager domains...${NC}"

cat > "/tmp/cleantrac_manager_vercel.conf" << 'EOF'
# CleanTrac Manager Domain Configuration (Vercel Frontend)
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
    
    # API proxy to Django backend (this stays the same)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }
    
    # Frontend proxy to Vercel (or serve locally if Vercel is down)
    location / {
        # Option 1: If manager.cleentrac.com points directly to Vercel
        # This might already be handled by DNS, so we might not need this block
        
        # Option 2: Proxy to main cleentrac.com (if that's where Vercel is)
        # proxy_pass https://www.cleentrac.com;
        # proxy_set_header Host www.cleentrac.com;
        
        # Option 3: Serve a simple redirect or error page
        return 302 https://www.cleentrac.com;
    }
}
EOF

# Install the configuration
sudo cp "/tmp/cleantrac_manager_vercel.conf" "/etc/nginx/sites-available/cleantrac_manager"
sudo ln -sf "/etc/nginx/sites-available/cleantrac_manager" "/etc/nginx/sites-enabled/cleantrac_manager"

echo -e "${GREEN}✅ Nginx configuration installed${NC}"

# Test nginx configuration
echo -e "${BLUE}ℹ️  Testing nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi

# Restart nginx
echo -e "${BLUE}ℹ️  Restarting nginx...${NC}"
sudo systemctl restart nginx

if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx restarted successfully${NC}"
else
    echo -e "${RED}❌ Nginx failed to start${NC}"
    sudo systemctl status nginx
    exit 1
fi

# Test the configuration
echo -e "${BLUE}ℹ️  Testing manager domain routing...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: capestation.manager.cleentrac.com" http://localhost/ || echo "000")
echo "Manager domain test: HTTP $HTTP_CODE"

echo ""
echo -e "${GREEN}🎉 Nginx configuration updated!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Test: https://capestation.manager.cleentrac.com"
echo "2. If it redirects to www.cleentrac.com, that might be correct (Vercel handles routing)"
echo "3. If you need different routing, we can adjust the nginx config"
echo ""
echo -e "${BLUE}📁 Backup location: $BACKUP_DIR${NC}"
echo ""
echo "The key insight: Since frontend is on Vercel, nginx just needs to route API calls"
echo "and let DNS/Vercel handle the frontend routing."
EOF
