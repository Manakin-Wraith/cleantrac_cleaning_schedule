"""
Management command to restore missing phone numbers from original data to Cape Station tenant.

This command carefully restores phone numbers that were lost during the UserProfile migration,
while preserving any existing correct phone numbers in the tenant schema.
"""

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Restore missing phone numbers from original data to Cape Station tenant'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be restored without actually making changes',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed restoration progress',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verbose = options['verbose']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be changed'))
        
        self.stdout.write(self.style.SUCCESS('Starting phone number restoration...'))
        
        # Get phone number data from both schemas
        original_phones = self.get_phone_data('public')
        tenant_phones = self.get_phone_data('capestation')
        
        self.stdout.write(f'Found {len(original_phones)} users with phone data in original schema')
        self.stdout.write(f'Found {len(tenant_phones)} users with phone data in Cape Station schema')
        
        # Analyze and restore phone numbers
        restored_count = self.restore_phone_numbers(original_phones, tenant_phones, dry_run, verbose)
        
        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n=== RESTORATION SUMMARY ==='))
        self.stdout.write(f'Phone numbers restored: {restored_count}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('This was a DRY RUN - no data was actually changed'))
        else:
            self.stdout.write(self.style.SUCCESS('Phone number restoration completed successfully!'))

    def get_phone_data(self, schema_name):
        """Get phone number data from specified schema"""
        phone_data = {}
        
        with connection.cursor() as cursor:
            if schema_name == 'public':
                cursor.execute('SET search_path TO public')
                cursor.execute('''
                    SELECT u.username, up.phone_number
                    FROM auth_user u
                    LEFT JOIN core_userprofile up ON u.id = up.user_id
                    WHERE u.is_active = true
                    ORDER BY u.username
                ''')
            else:
                # For tenant schema, auth_user is in public, UserProfile is in tenant schema
                cursor.execute('''
                    SELECT u.username, up.phone_number
                    FROM public.auth_user u
                    LEFT JOIN {}.core_userprofile up ON u.id = up.user_id
                    WHERE u.is_active = true
                    ORDER BY u.username
                '''.format(schema_name))
            
            results = cursor.fetchall()
            for username, phone in results:
                phone_data[username] = phone
        
        return phone_data

    def restore_phone_numbers(self, original_phones, tenant_phones, dry_run, verbose):
        """Restore missing phone numbers from original to tenant schema"""
        self.stdout.write('\n--- Analyzing Phone Number Differences ---')
        
        restored_count = 0
        changes_to_make = []
        
        for username in original_phones:
            original_phone = original_phones.get(username)
            tenant_phone = tenant_phones.get(username)
            
            # Skip if no phone number in original
            if not original_phone or original_phone == 'None':
                continue
            
            # Determine if we should restore
            should_restore = False
            reason = ""
            
            if tenant_phone is None:
                should_restore = True
                reason = "missing in tenant"
            elif tenant_phone == 'None':
                should_restore = True
                reason = "None in tenant"
            elif tenant_phone == '':
                should_restore = True
                reason = "empty in tenant"
            elif tenant_phone != original_phone:
                # Only restore if tenant phone looks invalid or is clearly wrong
                if len(tenant_phone) < 10 or not tenant_phone.startswith('+27'):
                    should_restore = True
                    reason = f"invalid format in tenant ('{tenant_phone}')"
                else:
                    # Both have valid-looking phone numbers - keep tenant version
                    if verbose:
                        self.stdout.write(f'  - Keeping tenant phone for {username}: "{tenant_phone}" (original: "{original_phone}")')
            
            if should_restore:
                changes_to_make.append({
                    'username': username,
                    'original_phone': original_phone,
                    'tenant_phone': tenant_phone,
                    'reason': reason
                })
        
        # Show what will be changed
        if changes_to_make:
            self.stdout.write(f'\n📱 PHONE NUMBERS TO RESTORE ({len(changes_to_make)}):')
            for change in changes_to_make:
                tenant_display = change['tenant_phone'] if change['tenant_phone'] else 'None'
                self.stdout.write(f'  - {change["username"]}: "{tenant_display}" → "{change["original_phone"]}" ({change["reason"]})')
        else:
            self.stdout.write('\n✅ No phone numbers need restoration')
            return 0
        
        if dry_run:
            return len(changes_to_make)
        
        # Apply the changes
        self.stdout.write('\n--- Applying Phone Number Restorations ---')
        
        with connection.cursor() as cursor:
            for change in changes_to_make:
                try:
                    # Update the phone number in Cape Station schema
                    cursor.execute('''
                        UPDATE capestation.core_userprofile 
                        SET phone_number = %s 
                        WHERE user_id = (
                            SELECT id FROM public.auth_user 
                            WHERE username = %s AND is_active = true
                        )
                    ''', [change['original_phone'], change['username']])
                    
                    if cursor.rowcount > 0:
                        restored_count += 1
                        if verbose:
                            self.stdout.write(f'  ✅ Restored {change["username"]}: {change["original_phone"]}')
                    else:
                        self.stdout.write(self.style.ERROR(f'  ❌ Failed to update {change["username"]} - user not found'))
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  ❌ Error updating {change["username"]}: {e}'))
        
        return restored_count

    def verify_restoration(self):
        """Verify that the restoration was successful"""
        self.stdout.write('\n--- Verification ---')
        
        # Re-run the comparison to check results
        original_phones = self.get_phone_data('public')
        tenant_phones = self.get_phone_data('capestation')
        
        mismatches = 0
        for username in original_phones:
            original_phone = original_phones.get(username)
            tenant_phone = tenant_phones.get(username)
            
            if original_phone and original_phone != 'None':
                if tenant_phone != original_phone:
                    mismatches += 1
        
        if mismatches == 0:
            self.stdout.write(self.style.SUCCESS('✅ All phone numbers now match between schemas'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠️ {mismatches} phone number mismatches still remain'))
        
        return mismatches == 0
