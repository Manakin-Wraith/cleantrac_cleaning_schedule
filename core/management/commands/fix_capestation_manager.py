# core/management/commands/fix_capestation_manager.py
"""
Management command to diagnose and fix Cape Station manager domain access issues
"""

from django.core.management.base import BaseCommand
from customers.models import Store, StoreDomain
from django_tenants.utils import tenant_context, schema_context
from django.contrib.auth.models import User
from core.models import UserProfile, Department
import json


class Command(BaseCommand):
    help = 'Diagnose and fix Cape Station manager domain access issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Apply fixes automatically'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed information'
        )

    def handle(self, *args, **options):
        fix_mode = options['fix']
        verbose = options['verbose']

        self.stdout.write(
            self.style.SUCCESS('🔍 Diagnosing Cape Station Manager Domain Access Issues')
        )
        self.stdout.write('=' * 70)

        try:
            # Step 1: Find Cape Station tenant
            self.stdout.write('\n📋 Step 1: Locating Cape Station tenant...')
            
            capestation = None
            try:
                capestation = Store.objects.get(name__icontains='cape')
                self.stdout.write(f'✅ Found: {capestation.name} (schema: {capestation.schema_name})')
            except Store.DoesNotExist:
                self.stdout.write(self.style.ERROR('❌ Cape Station tenant not found'))
                # List available tenants
                tenants = Store.objects.all()
                self.stdout.write(f'Available tenants: {[t.name for t in tenants]}')
                return
            except Store.MultipleObjectsReturned:
                tenants = Store.objects.filter(name__icontains='cape')
                self.stdout.write(f'Multiple Cape Station tenants found: {[t.name for t in tenants]}')
                capestation = tenants.first()
                self.stdout.write(f'Using: {capestation.name}')

            # Step 2: Check domain configuration
            self.stdout.write('\n📋 Step 2: Checking domain configuration...')
            domains = capestation.domains.all()
            
            manager_domain = None
            receiving_domain = None
            
            for domain in domains:
                self.stdout.write(f'  - {domain.domain} (primary: {domain.is_primary})')
                if 'manager' in domain.domain:
                    manager_domain = domain
                elif 'receiving' in domain.domain:
                    receiving_domain = domain
            
            if not manager_domain:
                self.stdout.write(self.style.WARNING('⚠️ Manager domain not found'))
                if fix_mode:
                    self.stdout.write('🔧 Creating manager domain...')
                    manager_domain = StoreDomain.objects.create(
                        domain='capestation.manager.cleentrac.com',
                        tenant=capestation,
                        is_primary=False
                    )
                    self.stdout.write('✅ Manager domain created')
                else:
                    self.stdout.write('Use --fix to create missing manager domain')
            else:
                self.stdout.write(f'✅ Manager domain found: {manager_domain.domain}')

            # Step 3: Check tenant data integrity
            self.stdout.write('\n📋 Step 3: Checking tenant data integrity...')
            
            with tenant_context(capestation):
                # Check basic data
                users_count = User.objects.count()
                departments_count = Department.objects.count()
                profiles_count = UserProfile.objects.count()
                
                self.stdout.write(f'  - Users: {users_count}')
                self.stdout.write(f'  - Departments: {departments_count}')
                self.stdout.write(f'  - Profiles: {profiles_count}')
                
                if verbose:
                    # List departments
                    departments = Department.objects.all()
                    self.stdout.write(f'  - Department names: {[d.name for d in departments]}')
                    
                    # List users with profiles
                    for user in User.objects.all()[:5]:  # Limit to first 5
                        try:
                            profile = user.userprofile
                            self.stdout.write(f'    • {user.username} ({profile.role}, {profile.department.name})')
                        except:
                            self.stdout.write(f'    • {user.username} (no profile)')

            # Step 4: Test domain routing
            self.stdout.write('\n📋 Step 4: Testing domain routing...')
            
            from django.test import Client
            from django.conf import settings
            
            client = Client()
            
            # Test manager domain routing
            test_urls = [
                '/admin/',
                '/api/health/',
                '/',
            ]
            
            for url in test_urls:
                try:
                    response = client.get(url, HTTP_HOST='capestation.manager.cleentrac.com')
                    self.stdout.write(f'  - {url}: {response.status_code}')
                    if verbose and response.status_code != 200:
                        self.stdout.write(f'    Content: {response.content[:200]}')
                except Exception as e:
                    self.stdout.write(f'  - {url}: ERROR - {str(e)}')

            # Step 5: Check settings configuration
            self.stdout.write('\n📋 Step 5: Checking Django settings...')
            
            # Check ALLOWED_HOSTS
            allowed_hosts = getattr(settings, 'ALLOWED_HOSTS', [])
            manager_host_patterns = [host for host in allowed_hosts if 'manager' in host]
            self.stdout.write(f'  - Manager host patterns: {manager_host_patterns}')
            
            # Check CORS settings
            cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
            manager_cors = [origin for origin in cors_origins if 'manager' in origin]
            self.stdout.write(f'  - Manager CORS origins: {manager_cors}')

            # Step 6: Check for common issues
            self.stdout.write('\n📋 Step 6: Checking for common issues...')
            
            issues_found = []
            
            # Check if manager domain is primary (it shouldn't be)
            if manager_domain and manager_domain.is_primary:
                issues_found.append('Manager domain is set as primary (should be receiving)')
                if fix_mode:
                    manager_domain.is_primary = False
                    manager_domain.save()
                    if receiving_domain:
                        receiving_domain.is_primary = True
                        receiving_domain.save()
                    self.stdout.write('🔧 Fixed domain primary settings')

            # Check for missing ALLOWED_HOSTS entry
            if 'capestation.manager.cleentrac.com' not in allowed_hosts and '*.manager.cleentrac.com' not in allowed_hosts:
                issues_found.append('Manager domain not in ALLOWED_HOSTS')

            if issues_found:
                self.stdout.write(self.style.WARNING('⚠️ Issues found:'))
                for issue in issues_found:
                    self.stdout.write(f'  - {issue}')
            else:
                self.stdout.write('✅ No obvious configuration issues found')

            # Step 7: Recommendations
            self.stdout.write('\n📋 Step 7: Recommendations...')
            
            recommendations = []
            
            if not manager_domain:
                recommendations.append('Create manager domain record for Cape Station')
            
            if 'capestation.manager.cleentrac.com' not in allowed_hosts:
                recommendations.append('Add capestation.manager.cleentrac.com to ALLOWED_HOSTS in settings')
            
            if not any('manager' in origin for origin in cors_origins):
                recommendations.append('Add manager domain to CORS_ALLOWED_ORIGINS')
            
            if recommendations:
                self.stdout.write('📝 Recommended actions:')
                for i, rec in enumerate(recommendations, 1):
                    self.stdout.write(f'  {i}. {rec}')
            else:
                self.stdout.write('✅ Configuration appears correct')

            self.stdout.write(
                self.style.SUCCESS('\n🎉 Cape Station diagnosis completed!')
            )
            
            # Final test recommendation
            self.stdout.write('\n🌐 Test the manager domain:')
            self.stdout.write('   curl -I https://capestation.manager.cleentrac.com/')
            self.stdout.write('   Expected: HTTP 200 or 302 (not 404)')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Diagnosis failed: {str(e)}'))
            import traceback
            if verbose:
                self.stdout.write(traceback.format_exc())
