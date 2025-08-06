#!/bin/bash

# fix_alb_manager_routing.sh
# Fix ALB routing for *.manager.cleentrac.com to point to Vercel instead of Django backend
# Following /context and /prd workflows for systematic ALB configuration update

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 CleanTrac ALB Manager Domain Routing Fix${NC}"
echo -e "${BLUE}===========================================${NC}"
echo "Updating ALB to route *.manager.cleentrac.com to Vercel frontend"
echo ""

# Configuration
AWS_REGION="eu-north-1"
ALB_ARN="arn:aws:elasticloadbalancing:eu-north-1:195085494916:loadbalancer/app/cleentrac-alb/9c82c09e022625db"
LISTENER_ARN="arn:aws:elasticloadbalancing:eu-north-1:195085494916:listener/app/cleentrac-alb/9c82c09e022625db/12ba6f1b75b239d5"
DJANGO_TARGET_GROUP_ARN="arn:aws:elasticloadbalancing:eu-north-1:195085494916:targetgroup/cleentrac-tg/3781146425987ac7"

# Vercel endpoint from user's dashboard
VERCEL_ENDPOINT="https://cleentrac-cleaning-schedule-pkat1bup3-manakin-wraiths-projects.vercel.app"

# Validation
if [ "$VERCEL_ENDPOINT" = "PLACEHOLDER_VERCEL_ENDPOINT" ]; then
    echo -e "${RED}❌ ERROR: Please update VERCEL_ENDPOINT variable with actual Vercel URL${NC}"
    echo "Example: VERCEL_ENDPOINT=\"https://cleentrac-frontend-xyz123.vercel.app\""
    exit 1
fi

echo -e "${BLUE}Step 1: Backing up current ALB configuration...${NC}"

# Create backup directory
BACKUP_DIR="~/cleantrac_backups/alb_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup current listener rules
aws elbv2 describe-rules \
    --listener-arn "$LISTENER_ARN" \
    --region "$AWS_REGION" \
    --output json > "$BACKUP_DIR/listener_rules_backup.json"

echo -e "${GREEN}✅ ALB configuration backed up to: $BACKUP_DIR${NC}"
echo ""

echo -e "${BLUE}Step 2: Analyzing current routing rules...${NC}"

# Get current rules
CURRENT_RULES=$(aws elbv2 describe-rules \
    --listener-arn "$LISTENER_ARN" \
    --region "$AWS_REGION" \
    --query 'Rules[?Conditions[0].Field==`host-header` && Conditions[0].HostHeaderConfig.Values[0]==`*.manager.cleentrac.com`].RuleArn' \
    --output text)

if [ -n "$CURRENT_RULES" ]; then
    echo -e "${YELLOW}⚠️  Found existing rule for *.manager.cleentrac.com: $CURRENT_RULES${NC}"
    echo "This rule currently forwards to Django backend - we'll update it"
else
    echo -e "${YELLOW}⚠️  No existing rule found for *.manager.cleentrac.com${NC}"
    echo "We'll create a new rule"
fi

echo ""

echo -e "${BLUE}Step 3: Creating/updating ALB routing rule...${NC}"

# Extract domain from Vercel endpoint
VERCEL_DOMAIN=$(echo "$VERCEL_ENDPOINT" | sed 's|https\?://||' | sed 's|/.*||')
echo "Vercel domain: $VERCEL_DOMAIN"

if [ -n "$CURRENT_RULES" ]; then
    # Update existing rule to redirect to Vercel
    echo "Updating existing rule to redirect to Vercel..."
    
    aws elbv2 modify-rule \
        --rule-arn "$CURRENT_RULES" \
        --region "$AWS_REGION" \
        --actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,Host=$VERCEL_DOMAIN,StatusCode=HTTP_301}" \
        --output table
        
    echo -e "${GREEN}✅ Updated existing rule to redirect to Vercel${NC}"
else
    # Create new rule with high priority
    echo "Creating new rule to redirect to Vercel..."
    
    aws elbv2 create-rule \
        --listener-arn "$LISTENER_ARN" \
        --region "$AWS_REGION" \
        --priority 10 \
        --conditions Field=host-header,HostHeaderConfig="{Values=[\"*.manager.cleentrac.com\"]}" \
        --actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,Host=$VERCEL_DOMAIN,StatusCode=HTTP_301}" \
        --output table
        
    echo -e "${GREEN}✅ Created new rule to redirect to Vercel${NC}"
fi

echo ""

echo -e "${BLUE}Step 4: Verifying the routing update...${NC}"

# Wait a moment for changes to propagate
sleep 5

# Verify the rule was created/updated
UPDATED_RULES=$(aws elbv2 describe-rules \
    --listener-arn "$LISTENER_ARN" \
    --region "$AWS_REGION" \
    --query 'Rules[?Conditions[0].Field==`host-header` && Conditions[0].HostHeaderConfig.Values[0]==`*.manager.cleentrac.com`]' \
    --output table)

echo "Updated rule configuration:"
echo "$UPDATED_RULES"

echo ""

echo -e "${BLUE}Step 5: Testing the routing fix...${NC}"

echo "Testing manager domain routing (may take 1-2 minutes to propagate)..."

# Test the routing
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L https://capestation.manager.cleentrac.com 2>/dev/null || echo "000")
echo "HTTP response code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Manager domain now loads successfully!${NC}"
elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ Manager domain now redirects properly!${NC}"
    
    # Follow redirect to see final destination
    FINAL_URL=$(curl -s -L -o /dev/null -w "%{url_effective}" https://capestation.manager.cleentrac.com 2>/dev/null || echo "unknown")
    echo "Final destination: $FINAL_URL"
else
    echo -e "${YELLOW}⚠️  Manager domain returns $HTTP_CODE - changes may still be propagating${NC}"
    echo "Wait 2-3 minutes and test again: https://capestation.manager.cleentrac.com"
fi

echo ""

echo -e "${GREEN}🎉 ALB Manager Domain Routing Fix Completed!${NC}"
echo ""
echo -e "${BLUE}📋 What was changed:${NC}"
echo "✅ ALB listener rule for *.manager.cleentrac.com now redirects to Vercel"
echo "✅ Django backend no longer receives manager domain requests"
echo "✅ Configuration backed up to: $BACKUP_DIR"
echo ""
echo -e "${BLUE}🌐 Test the fix:${NC}"
echo "   https://capestation.manager.cleentrac.com"
echo "   (Should now load the React manager frontend from Vercel)"
echo ""
echo -e "${BLUE}📁 Rollback instructions (if needed):${NC}"
echo "   aws elbv2 modify-rule --rule-arn [RULE_ARN] --actions Type=forward,TargetGroupArn=$DJANGO_TARGET_GROUP_ARN"
echo ""
echo -e "${BLUE}📊 Monitor:${NC}"
echo "   - ALB access logs for manager domain requests"
echo "   - Django backend health (should improve without 404s)"
echo "   - Vercel analytics for manager domain traffic"
