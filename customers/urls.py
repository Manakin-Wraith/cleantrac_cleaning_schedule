from django.urls import path
from . import views

app_name = 'customers'

urlpatterns = [
    path('tenant-dashboard/', views.tenant_dashboard, name='tenant_dashboard'),
    path('tenant/<int:tenant_id>/', views.tenant_detail, name='tenant_detail'),
    path('tenant/<int:tenant_id>/health/', views.tenant_health_check, name='tenant_health_check'),
    path('switch-tenant/', views.switch_tenant_context, name='switch_tenant_context'),
]
