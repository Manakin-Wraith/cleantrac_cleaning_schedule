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
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken import views as authtoken_views
from core.auth_views import EnhancedObtainAuthToken
from customers.views import tenant_dashboard, tenant_detail, tenant_health_check

urlpatterns = [
    path('admin/', admin.site.urls),
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
