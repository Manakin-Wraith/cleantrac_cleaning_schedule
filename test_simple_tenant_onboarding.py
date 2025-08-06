#!/usr/bin/env python
"""
Simplified test script for onboarding a new "test" tenant in CleanTrac.
This version works with SQLite fallback for development testing.
"""

import os
import sys
import django

# Setup Django first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleantrac_project.settings_local')
django.setup()

# Import after Django setup
from customers.models import Store, StoreDomain
from django.contrib.auth.models import User
from django.conf import settings

# Check if we're using SQLite fallback
USING_SQLITE = 'sqlite' in settings.DATABASES['default']['ENGINE']


def create_test_tenant():
    """
    Create a new test tenant for onboarding demonstration.
    """
    print("🚀 CleanTrac Test Tenant Onboarding")
    print("=" * 50)
    
    if USING_SQLITE:
        print("⚠️  Using SQLite fallback for development")
        print("   In production: AWS RDS PostgreSQL with schema isolation")
        print("   Current mode: Basic tenant registration without schema isolation")
    
    print("\n📋 Step 1: Creating Test Tenant...")
    
    # Check if test tenant already exists
    existing_tenant = Store.objects.filter(schema_name='test_store').first()
    if existing_tenant:
        print(f"⚠️  Test tenant already exists: {existing_tenant}")
        print("🗑️  Deleting existing test tenant for fresh start...")
        existing_tenant.delete()
    
    # Create new test tenant
    try:
        test_tenant = Store.objects.create(
            name='Test Store',
            schema_name='test_store'
        )
        print(f"✅ Created test tenant: {test_tenant}")
        print(f"   - Name: {test_tenant.name}")
        print(f"   - Schema: {test_tenant.schema_name}")
        print(f"   - Created: {test_tenant.created_at}")
        
    except Exception as e:
        print(f"❌ Error creating tenant: {e}")
        return None
    
    print("\n🌐 Step 2: Setting up domains for receiving frontend...")
    
    # Create domains for the test tenant
    domains_to_create = [
        ('test.receiving.cleentrac.com', False, 'Receiving Frontend (Streamlit)'),
        ('test.manager.cleentrac.com', True, 'Manager Dashboard (React)'),
        ('localhost', False, 'Development Access')
    ]
    
    created_domains = []
    for domain_name, is_primary, description in domains_to_create:
        try:
            domain = StoreDomain.objects.create(
                domain=domain_name,
                tenant=test_tenant,
                is_primary=is_primary
            )
            created_domains.append(domain)
            primary_indicator = " (PRIMARY)" if is_primary else ""
            print(f"✅ Created domain: {domain_name}{primary_indicator} - {description}")
            
        except Exception as e:
            print(f"❌ Error creating domain {domain_name}: {e}")
    
    print(f"\n📊 Step 3: Tenant summary...")
    print(f"   - Tenant ID: {test_tenant.id}")
    print(f"   - Domains created: {len(created_domains)}")
    print(f"   - Primary domain: {test_tenant.domains.filter(is_primary=True).first()}")
    
    return test_tenant


def validate_tenant_setup(tenant):
    """
    Validate the tenant setup.
    """
    print("\n🔍 Step 4: Validating tenant setup...")
    
    try:
        # Basic validation
        assert tenant is not None, "Tenant is None"
        print(f"✅ Tenant exists: {tenant.name}")
        
        # Check domains
        domains = tenant.domains.all()
        print(f"✅ Domains created: {domains.count()}")
        
        receiving_domain = domains.filter(domain__contains='receiving').first()
        manager_domain = domains.filter(domain__contains='manager').first()
        
        if receiving_domain:
            print(f"✅ Receiving domain: {receiving_domain.domain}")
        else:
            print("⚠️  No receiving domain found")
            
        if manager_domain:
            print(f"✅ Manager domain: {manager_domain.domain}")
        else:
            print("⚠️  No manager domain found")
        
        return True
        
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        return False


def display_onboarding_summary(tenant):
    """
    Display comprehensive onboarding summary.
    """
    print("\n🎉 Test Tenant Onboarding Complete!")
    print("=" * 50)
    
    print(f"📋 Tenant Details:")
    print(f"   Name: {tenant.name}")
    print(f"   Schema: {tenant.schema_name}")
    print(f"   ID: {tenant.id}")
    print(f"   Created: {tenant.created_at}")
    
    print(f"\n🌐 Configured Domains:")
    for domain in tenant.domains.all():
        primary_indicator = " (PRIMARY)" if domain.is_primary else ""
        print(f"   - {domain.domain}{primary_indicator}")
    
    print(f"\n🔗 Access URLs (once DNS configured):")
    print(f"   - Receiving Frontend: http://test.receiving.cleentrac.com")
    print(f"   - Manager Dashboard: http://test.manager.cleentrac.com")
    
    if USING_SQLITE:
        print(f"\n⚠️  SQLite Development Notes:")
        print(f"   - Schema isolation not available in SQLite mode")
        print(f"   - In production with PostgreSQL:")
        print(f"     * Each tenant gets isolated database schema")
        print(f"     * Complete data separation between tenants")
        print(f"     * Automatic schema migrations")
    
    print(f"\n✅ Next Steps for Production Onboarding:")
    print(f"   1. Configure wildcard DNS: *.receiving.cleentrac.com → Streamlit server")
    print(f"   2. Configure wildcard DNS: *.manager.cleentrac.com → React server")
    print(f"   3. Deploy Streamlit receiving app with tenant detection")
    print(f"   4. Test receiving workflow at: http://test.receiving.cleentrac.com")
    print(f"   5. Populate tenant with business data (departments, users, products)")


def main():
    """
    Main onboarding test function.
    """
    # Create test tenant
    test_tenant = create_test_tenant()
    
    if test_tenant:
        # Validate setup
        if validate_tenant_setup(test_tenant):
            # Display summary
            display_onboarding_summary(test_tenant)
            print(f"\n🎯 Onboarding test completed successfully!")
        else:
            print(f"\n❌ Onboarding validation failed!")
    else:
        print(f"\n❌ Onboarding test failed!")


if __name__ == '__main__':
    main()
