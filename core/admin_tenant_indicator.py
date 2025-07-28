"""
Django Admin Tenant Indicator
Adds clear tenant identification to Django Admin interface
"""

from django.contrib import admin
from django.utils.html import format_html
from django.db import connection
from django.conf import settings

class TenantAwareAdminSite(admin.AdminSite):
    """
    Custom admin site that displays current tenant information
    """
    
    def each_context(self, request):
        """
        Add tenant context to every admin page
        """
        context = super().each_context(request)
        
        # Get current schema/tenant info
        current_schema = getattr(connection, 'schema_name', 'unknown')
        
        # Determine tenant display info
        if current_schema == 'public':
            tenant_info = {
                'name': 'PUBLIC SCHEMA',
                'description': 'Main/Public Database',
                'color': '#dc3545',  # Red
                'warning': True
            }
        elif current_schema == 'capestation':
            tenant_info = {
                'name': 'CAPE STATION',
                'description': 'Cape Station Tenant',
                'color': '#28a745',  # Green
                'warning': False
            }
        else:
            tenant_info = {
                'name': current_schema.upper(),
                'description': f'{current_schema.title()} Tenant',
                'color': '#007bff',  # Blue
                'warning': False
            }
        
        context.update({
            'tenant_info': tenant_info,
            'current_schema': current_schema,
        })
        
        return context

# Create custom admin site instance
tenant_admin_site = TenantAwareAdminSite(name='tenant_admin')

# Template override for admin base
ADMIN_BASE_TEMPLATE = """
{% extends "admin/base.html" %}

{% block title %}
{{ tenant_info.name }} - {{ block.super }}
{% endblock %}

{% block branding %}
<div style="display: flex; align-items: center; padding: 10px 0;">
    <h1 id="site-name" style="margin: 0; margin-right: 20px;">
        <a href="{% url 'admin:index' %}">CleanTrac Admin</a>
    </h1>
    <div style="
        background-color: {{ tenant_info.color }};
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 14px;
        {% if tenant_info.warning %}
        animation: blink 1s infinite;
        {% endif %}
    ">
        🏢 {{ tenant_info.name }}
        <br>
        <small style="font-size: 11px; opacity: 0.9;">{{ tenant_info.description }}</small>
    </div>
</div>

{% if tenant_info.warning %}
<style>
@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.7; }
}
.tenant-warning {
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;
    padding: 10px;
    margin: 10px 0;
    border-radius: 4px;
}
</style>
<div class="tenant-warning">
    ⚠️ <strong>WARNING:</strong> You are in the PUBLIC SCHEMA. 
    User and tenant-specific data may not be visible here.
    <br>
    <small>Current schema: <code>{{ current_schema }}</code></small>
</div>
{% endif %}
{% endblock %}

{% block nav-global %}
<div style="background-color: {{ tenant_info.color }}; padding: 5px 0; text-align: center; color: white; font-size: 12px;">
    Current Database Schema: <strong>{{ current_schema }}</strong>
    {% if tenant_info.warning %}
    | ⚠️ PUBLIC SCHEMA - Limited tenant data visibility
    {% endif %}
</div>
{{ block.super }}
{% endblock %}
"""
