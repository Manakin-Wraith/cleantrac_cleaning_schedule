"""
URL configuration for cleantrac_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from rest_framework.authtoken import views as authtoken_views
from core.auth_views import EnhancedObtainAuthToken
from customers.views import tenant_dashboard, tenant_detail, tenant_health_check
from core.original_admin import original_admin_site
from core.unified_admin import unified_admin_site
from core.admin_scalable import scalable_admin
import os

urlpatterns = [
    path('admin/', scalable_admin.urls),  # Scalable multi-tenant admin for many tenants
    path('django-admin/', admin.site.urls),  # Original Django admin (fallback)
    path('unified-admin/', unified_admin_site.urls),
    path('original-admin/', original_admin_site.urls),
    path('admin/tenant-dashboard/', tenant_dashboard, name='tenant_dashboard'),
    path('admin/tenant/<int:tenant_id>/', tenant_detail, name='tenant_detail'),
    path('admin/tenant/<int:tenant_id>/health/', tenant_health_check, name='tenant_health_check'),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')), 
    path('api/token-auth/', EnhancedObtainAuthToken.as_view(), name='api_token_auth'),
    path('api/', include('core.urls')), 
    path('customers/', include('customers.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve static files in production as fallback when nginx fails
# This ensures admin interface theme CSS/JS loads properly
if not settings.DEBUG and settings.STATIC_ROOT:
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', serve, {
            'document_root': settings.STATIC_ROOT,
        }),
    ]
