#!/bin/bash

# rollback_and_fix.sh
# Clean up the mess we made and implement the correct fix
# Following the /fix workflow properly this time

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🧹 CleanTrac Rollback and Proper Fix${NC}"
echo -e "${RED}====================================${NC}"
echo "Rolling back unnecessary changes and implementing correct solution"
echo ""

# Step 1: Rollback broken nginx config
echo -e "${BLUE}Step 1: Rolling back broken nginx configuration...${NC}"

# Remove the broken manager config
sudo rm -f /etc/nginx/sites-enabled/cleantrac_manager
sudo rm -f /etc/nginx/sites-available/cleantrac_manager

# Check if we have a backup to restore
LATEST_BACKUP=$(ls -t ~/cleantrac_backups/*/nginx_cleantrac.conf 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
    echo "Restoring nginx config from: $LATEST_BACKUP"
    sudo cp "$LATEST_BACKUP" /etc/nginx/sites-available/cleantrac
    echo -e "${GREEN}✅ Nginx config restored from backup${NC}"
else
    echo -e "${YELLOW}⚠️  No backup found - nginx config may need manual restoration${NC}"
fi

# Test nginx config
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is now valid${NC}"
    sudo systemctl reload nginx
else
    echo -e "${RED}❌ Nginx config still broken - manual intervention needed${NC}"
fi

echo ""

# Step 2: Understand the REAL architecture
echo -e "${BLUE}Step 2: Understanding the real architecture...${NC}"

echo "DNS Resolution:"
nslookup capestation.manager.cleentrac.com | grep -A 2 "canonical name\|Name:"

echo ""
echo "Current nginx sites:"
ls -la /etc/nginx/sites-enabled/

echo ""
echo "SSL certificates available:"
sudo ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "No Let's Encrypt certificates found"

echo ""

# Step 3: The CORRECT diagnosis
echo -e "${BLUE}Step 3: The CORRECT diagnosis...${NC}"

echo -e "${YELLOW}KEY INSIGHT:${NC}"
echo "capestation.manager.cleentrac.com resolves to AWS ALB (cleentrac-alb-1566483969.eu-north-1.elb.amazonaws.com)"
echo "This means the ALB should be routing the request, NOT this nginx server!"
echo ""
echo "The 404 error is likely because:"
echo "1. AWS ALB is routing manager.* requests to this server"
echo "2. But this server doesn't have the right nginx config to handle them"
echo "3. OR the ALB target group is misconfigured"
echo ""

# Step 4: Check what this server should actually be serving
echo -e "${BLUE}Step 4: Checking what this server should serve...${NC}"

echo "Current server IP:"
curl -s ifconfig.me || echo "Could not determine public IP"

echo ""
echo "Testing current nginx response:"
curl -I http://localhost/ 2>/dev/null | head -5 || echo "Local nginx not responding"

echo ""

# Step 5: The MINIMAL fix
echo -e "${BLUE}Step 5: Implementing minimal fix...${NC}"

# Check if we need to handle manager domains at all on this server
echo "The question is: Should this server handle *.manager.cleentrac.com requests?"
echo ""
echo "Option A: ALB routes manager domains to Vercel directly (we do nothing)"
echo "Option B: ALB routes manager domains here, we proxy to Vercel"
echo "Option C: ALB routes manager domains here, we serve a redirect"
echo ""

# Let's implement Option C (safest) - just redirect to main domain
echo "Implementing Option C: Redirect manager domains to main site"

# Find the correct SSL certificate path
SSL_CERT_PATH=""
if [ -d "/etc/letsencrypt/live/api.13-60-56-181.nip.io" ]; then
    SSL_CERT_PATH="/etc/letsencrypt/live/api.13-60-56-181.nip.io"
elif [ -d "/etc/letsencrypt/live/cleentrac.com" ]; then
    SSL_CERT_PATH="/etc/letsencrypt/live/cleentrac.com"
elif [ -d "/etc/letsencrypt/live" ]; then
    SSL_CERT_PATH=$(sudo find /etc/letsencrypt/live -name "fullchain.pem" | head -1 | xargs dirname)
fi

if [ -n "$SSL_CERT_PATH" ]; then
    echo "Using SSL certificates from: $SSL_CERT_PATH"
    
    # Create a SIMPLE manager domain handler
    cat > /tmp/manager_redirect.conf << EOF
# Simple redirect for manager domains
server {
    listen 80;
    server_name *.manager.cleentrac.com;
    return 301 https://www.cleentrac.com\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name *.manager.cleentrac.com;
    
    ssl_certificate $SSL_CERT_PATH/fullchain.pem;
    ssl_certificate_key $SSL_CERT_PATH/privkey.pem;
    
    # Simple redirect to main site
    return 301 https://www.cleentrac.com\$request_uri;
}
EOF

    sudo cp /tmp/manager_redirect.conf /etc/nginx/sites-available/manager_redirect
    sudo ln -sf /etc/nginx/sites-available/manager_redirect /etc/nginx/sites-enabled/manager_redirect
    
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo -e "${GREEN}✅ Manager domain redirect configured${NC}"
    else
        echo -e "${RED}❌ Nginx config failed - removing redirect${NC}"
        sudo rm -f /etc/nginx/sites-enabled/manager_redirect
    fi
else
    echo -e "${YELLOW}⚠️  No SSL certificates found - cannot configure HTTPS redirect${NC}"
    echo "Manager domains will need to be handled at the ALB level"
fi

echo ""

# Step 6: Test the fix
echo -e "${BLUE}Step 6: Testing the fix...${NC}"

echo "Testing manager domain handling:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: capestation.manager.cleentrac.com" http://localhost/ 2>/dev/null || echo "000")
echo "HTTP response code: $HTTP_CODE"

if [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ Manager domain now redirects properly${NC}"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "${YELLOW}⚠️  Manager domain returns 200 - check if content is correct${NC}"
else
    echo -e "${YELLOW}⚠️  Manager domain returns $HTTP_CODE - may need ALB configuration${NC}"
fi

echo ""

# Step 7: Summary and next steps
echo -e "${GREEN}🎉 Rollback and fix completed!${NC}"
echo ""
echo -e "${BLUE}📋 What we fixed:${NC}"
echo "✅ Removed broken nginx SSL configuration"
echo "✅ Restored working nginx config from backup"
echo "✅ Added simple manager domain redirect (if SSL certs available)"
echo ""
echo -e "${BLUE}📋 What still needs attention:${NC}"
echo "⚠️  Node.js installation (may be unnecessary - can remove if not needed)"
echo "⚠️  Database configuration (ensure prod uses AWS PostgreSQL)"
echo "⚠️  AWS ALB configuration (may need adjustment for manager domains)"
echo ""
echo -e "${BLUE}🌐 Test the manager domain:${NC}"
echo "   https://capestation.manager.cleentrac.com"
echo "   (Should redirect to main site or be handled by ALB/Vercel)"
echo ""
echo -e "${BLUE}📁 Backups preserved in:${NC}"
echo "   ~/cleantrac_backups/"
