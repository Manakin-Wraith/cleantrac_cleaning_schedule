from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django_tenants.utils import get_tenant_model, get_tenant
from django.db import connection


class EnhancedObtainAuthToken(ObtainAuthToken):
    """
    Enhanced authentication view that returns token along with user profile
    and tenant information for frontend tenant distinction.
    """
    
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        # Get user profile information
        profile_data = {}
        try:
            if hasattr(user, 'profile'):
                profile = user.profile
                profile_data = {
                    'department': profile.department.name if profile.department else None,
                    'role': profile.role,
                    'phone_number': profile.phone_number,
                    'employee_id': profile.employee_id,
                    'is_active': profile.is_active,
                }
        except Exception:
            # Handle case where profile doesn't exist
            profile_data = {
                'department': None,
                'role': 'staff',
                'phone_number': None,
                'employee_id': None,
                'is_active': True,
            }
        
        # Get tenant information
        tenant_data = {}
        try:
            # Get current tenant from connection
            tenant = get_tenant(request)
            if tenant:
                tenant_data = {
                    'tenant_id': tenant.pk,
                    'tenant_name': tenant.name,
                    'tenant_schema': tenant.schema_name,
                }
            else:
                # Fallback: try to get tenant from schema name
                schema_name = connection.schema_name
                if schema_name and schema_name != 'public':
                    TenantModel = get_tenant_model()
                    try:
                        tenant = TenantModel.objects.get(schema_name=schema_name)
                        tenant_data = {
                            'tenant_id': tenant.pk,
                            'tenant_name': tenant.name,
                            'tenant_schema': tenant.schema_name,
                        }
                    except TenantModel.DoesNotExist:
                        pass
        except Exception:
            # Handle any tenant-related errors gracefully
            pass
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'profile': profile_data,
            'tenant': tenant_data,
        })
