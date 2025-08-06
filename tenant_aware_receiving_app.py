"""
CleanTrac Multi-Tenant Receiving Frontend
A comprehensive Streamlit app for tenant-aware product receiving
"""

import streamlit as st
import pandas as pd
from datetime import datetime, timedelta, date, time
from urllib.parse import urlparse
import re
import os
import sys

# Add Django project to path
project_path = '/Users/thecasterymedia/Desktop/PORTFOLIO/SaaS/cleantrac_cleaning_schedule'
if project_path not in sys.path:
    sys.path.insert(0, project_path)

# Set Django settings with explicit path
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleantrac_project.settings_local')

# Force reload of sys.modules to ensure clean import
import importlib
if 'django' in sys.modules:
    importlib.reload(sys.modules['django'])

# Try to setup Django with enhanced error handling
try:
    # Test critical imports first
    import dj_database_url
    import django
    from django.conf import settings
    
    # Setup Django
    if not settings.configured:
        django.setup()
    
    DJANGO_AVAILABLE = True
    st.success("✅ Django setup completed successfully")
    
except ImportError as e:
    st.error(f"❌ Django import failed: {e}")
    st.error("Please ensure you're running from the correct virtual environment with all dependencies installed.")
    st.info(f"Current Python: {sys.executable}")
    st.info(f"Current working directory: {os.getcwd()}")
    st.stop()
except Exception as e:
    st.error(f"❌ Django setup failed: {e}")
    st.error("Please check your Django configuration and database settings.")
    import traceback
    st.code(traceback.format_exc())
    st.stop()

# Import Django components with error handling
try:
    from django.db import connection
    from django_tenants.utils import schema_context
    from customers.models import Store, StoreDomain
except ImportError as e:
    st.error(f"❌ Failed to import Django components: {e}")
    st.error("Please ensure all Django apps and dependencies are properly installed.")
    st.stop()

# Configure Streamlit page
st.set_page_config(
    page_title="CleanTrac Receiving",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for modern UI
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
    }
    .tenant-badge {
        background: #4CAF50;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: bold;
    }
    .success-toast {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
        padding: 1rem;
        border-radius: 5px;
        margin: 1rem 0;
    }
    .error-toast {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 1rem;
        border-radius: 5px;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

def detect_tenant_from_url():
    """
    Detect tenant from the current URL subdomain.
    Expected format: [tenant].receiving.cleentrac.com
    """
    try:
        # Get query params for tenant detection in development
        query_params = st.query_params
        if 'tenant' in query_params:
            return query_params['tenant'][0]
        
        # In production, extract from hostname
        # This would be implemented based on actual deployment
        return 'test'  # Default tenant for development
    except:
        return 'test'

def get_tenant_by_slug(tenant_slug):
    """Get tenant object by slug."""
    try:
        return Store.objects.get(schema_name=tenant_slug)
    except Store.DoesNotExist:
        return None

def execute_tenant_query(tenant_slug, query, params=None):
    """Execute a query within tenant schema context."""
    try:
        with schema_context(tenant_slug):
            with connection.cursor() as cursor:
                cursor.execute(query, params or [])
                columns = [col[0] for col in cursor.description] if cursor.description else []
                rows = cursor.fetchall()
                return pd.DataFrame(rows, columns=columns) if rows else pd.DataFrame()
    except Exception as e:
        st.error(f"Database query error: {str(e)}")
        return pd.DataFrame()

def initialize_session_state():
    """Initialize session state variables."""
    if 'product_entries' not in st.session_state:
        st.session_state.product_entries = []
    if 'show_add_product_dialog' not in st.session_state:
        st.session_state.show_add_product_dialog = False
    if 'form_reset_trigger' not in st.session_state:
        st.session_state.form_reset_trigger = False

def get_departments(tenant_slug):
    """Get departments for the tenant."""
    query = """
        SELECT DISTINCT department as code, department as name 
        FROM products 
        WHERE department IS NOT NULL 
        ORDER BY department
    """
    df = execute_tenant_query(tenant_slug, query)
    if not df.empty:
        return [(row['code'], f"{row['code']} - {row['name']}") for _, row in df.iterrows()]
    return [('BAKERY', 'BAKERY - Bakery Department')]

def get_suppliers_for_department(department, tenant_slug):
    """Get suppliers for a specific department."""
    query = """
        SELECT DISTINCT supplier_code as code, supplier_code as name 
        FROM products 
        WHERE department = %s AND supplier_code IS NOT NULL 
        ORDER BY supplier_code
    """
    df = execute_tenant_query(tenant_slug, query, [department])
    if not df.empty:
        return [(row['code'], f"{row['code']} - {row['name']}") for _, row in df.iterrows()]
    return [('SUP001', 'SUP001 - Default Supplier')]

def get_products_for_supplier(supplier_code, department, tenant_slug):
    """Get products for supplier and department."""
    query = """
        SELECT product_code, product_name, description, supplier_code, 
               supplier_product_code, product_type, sub_department
        FROM products 
        WHERE supplier_code = %s AND department = %s 
        ORDER BY product_name
    """
    df = execute_tenant_query(tenant_slug, query, [supplier_code, department])
    return df.to_dict('records') if not df.empty else []

def get_quality_checks(department, tenant_slug):
    """Get quality checks for department."""
    query = """
        SELECT check_id, check_name, required, department
        FROM quality_checks 
        WHERE department = %s 
        ORDER BY check_name
    """
    df = execute_tenant_query(tenant_slug, query, [department])
    return df.to_dict('records') if not df.empty else []

def add_product_entry():
    """Add a new product entry."""
    st.session_state.product_entries.append({
        'product': None,
        'quantity': 1.0,
        'unit': 'KG',
        'batch_number': '',
        'supplier_product_code': '',
        'expiry_date': datetime.now().date() + timedelta(days=30),
        'best_before_date': datetime.now().date() + timedelta(days=7)
    })

def remove_product_entry(index):
    """Remove a product entry."""
    if 0 <= index < len(st.session_state.product_entries):
        st.session_state.product_entries.pop(index)

def render_main_header(tenant_slug, tenant):
    """Render the main header with tenant info."""
    st.markdown(f"""
    <div class="main-header">
        <h1>📦 CleanTrac Receiving Dashboard</h1>
        <div class="tenant-badge">
            {tenant.name if tenant else tenant_slug.upper()} 
            ({tenant_slug})
        </div>
    </div>
    """, unsafe_allow_html=True)

def render_invoice_section():
    """Render invoice information section."""
    st.subheader("📄 Invoice Information")
    col1, col2 = st.columns(2)
    
    with col1:
        invoice_number = st.text_input(
            "Supplier Invoice Number *",
            key="invoice_number",
            help="Enter the supplier's invoice number"
        )
    
    with col2:
        invoice_date = st.date_input(
            "Invoice Date *",
            key="invoice_date",
            value=datetime.now().date(),
            min_value=datetime.now().date() - timedelta(days=30),
            max_value=datetime.now().date()
        )
    
    return invoice_number, invoice_date

def render_department_supplier_section(tenant_slug):
    """Render department and supplier selection."""
    st.subheader("🏢 Department & Supplier")
    
    # Department selection
    departments = get_departments(tenant_slug)
    department_options = [dept[1] for dept in departments]
    
    selected_dept_display = st.selectbox(
        "Department *",
        options=department_options,
        key="department_select"
    )
    
    # Extract department code
    department_code = selected_dept_display.split(' - ')[0]
    
    # Supplier selection
    suppliers = get_suppliers_for_department(department_code, tenant_slug)
    supplier_options = [sup[1] for sup in suppliers]
    
    selected_supplier_display = st.selectbox(
        "Supplier *",
        options=supplier_options,
        key="supplier_select"
    )
    
    supplier_code = selected_supplier_display.split(' - ')[0]
    
    return department_code, supplier_code

def render_add_new_product_dialog(department_code, supplier_code, tenant_slug):
    """Render the add new product dialog."""
    if st.session_state.show_add_product_dialog:
        with st.expander("➕ Add New Product", expanded=True):
            with st.form("add_new_product_form"):
                st.subheader("New Product Details")
                
                col1, col2 = st.columns(2)
                
                with col1:
                    new_product_code = st.text_input(
                        "Product Code *",
                        help="Unique product identifier"
                    )
                    new_product_name = st.text_input(
                        "Product Name *",
                        help="Full product name"
                    )
                    st.write(f"**Department:** {department_code}")
                    new_sub_department = st.text_input("Sub-Department")
                
                with col2:
                    st.write(f"**Supplier:** {supplier_code}")
                    new_supplier_product_code = st.text_input(
                        "Supplier Product Code",
                        help="The product code used by the supplier"
                    )
                    new_product_type = st.text_input("Product Type")
                
                new_description = st.text_area("Description")
                
                col1, col2 = st.columns(2)
                with col1:
                    submit_new_product = st.form_submit_button("✅ Add Product")
                with col2:
                    cancel_new_product = st.form_submit_button("❌ Cancel")
                
                if submit_new_product:
                    if new_product_code and new_product_name:
                        # Create new product via API
                        product_data = {
                            'product_code': new_product_code,
                            'product_name': new_product_name,
                            'description': new_description,
                            'department': department_code,
                            'sub_department': new_sub_department,
                            'product_type': new_product_type,
                            'supplier_code': supplier_code,
                            'supplier_product_code': new_supplier_product_code
                        }
                        
                        result = make_api_request('products/', method='POST', data=product_data, tenant_slug=tenant_slug)
                        if result:
                            st.success(f"✅ Product {new_product_code} added successfully!")
                            st.session_state.show_add_product_dialog = False
                            st.rerun()
                        else:
                            st.error("❌ Failed to add product")
                    else:
                        st.error("❌ Product Code and Name are required")
                
                if cancel_new_product:
                    st.session_state.show_add_product_dialog = False
                    st.experimental_rerun()

def render_product_selection(department_code, supplier_code, tenant_slug):
    """Render product selection and entries."""
    st.subheader("📦 Product Selection")
    
    # Get products for supplier
    products = get_products_for_supplier(supplier_code, department_code, tenant_slug)
    
    col1, col2 = st.columns([3, 1])
    with col1:
        st.write("Select products from the list or add a new product:")
    with col2:
        if st.button("➕ Add New Product"):
            st.session_state.show_add_product_dialog = True
            st.experimental_rerun()
    
    # Render add product dialog
    render_add_new_product_dialog(department_code, supplier_code, tenant_slug)
    
    # Product entries
    if products:
        selected_products = st.multiselect(
            "Select Products",
            options=[f"{p['product_code']} - {p['product_name']}" for p in products],
            key="selected_products"
        )
        
        # Add selected products to entries
        if st.button("Add Selected Products"):
            for product_display in selected_products:
                product_code = product_display.split(' - ')[0]
                product = next(p for p in products if p['product_code'] == product_code)
                
                # Check if already added
                existing = any(entry['product'] and entry['product']['product_code'] == product_code 
                             for entry in st.session_state.product_entries)
                
                if not existing:
                    st.session_state.product_entries.append({
                        'product': product,
                        'quantity': 1.0,
                        'unit': 'KG',
                        'batch_number': '',
                        'supplier_product_code': product.get('supplier_product_code', ''),
                        'expiry_date': datetime.now().date() + timedelta(days=30),
                        'best_before_date': datetime.now().date() + timedelta(days=7)
                    })
            st.experimental_rerun()

def render_product_entries():
    """Render product entries for receiving."""
    if st.session_state.product_entries:
        st.subheader("📋 Products to Receive")
        
        for index, entry in enumerate(st.session_state.product_entries):
            with st.expander(f"Product {index + 1}: {entry['product']['product_name'] if entry['product'] else 'New Product'}", expanded=True):
                col1, col2, col3 = st.columns([2, 2, 1])
                
                with col1:
                    if entry['product']:
                        st.write(f"**Code:** {entry['product']['product_code']}")
                        st.write(f"**Name:** {entry['product']['product_name']}")
                    
                    entry['quantity'] = st.number_input(
                        f"Quantity",
                        min_value=0.01,
                        step=0.01,
                        value=entry['quantity'],
                        key=f"quantity_{index}"
                    )
                    
                    entry['unit'] = st.selectbox(
                        f"Unit",
                        options=["KG", "L", "EACH", "CASE"],
                        index=["KG", "L", "EACH", "CASE"].index(entry['unit']),
                        key=f"unit_{index}"
                    )
                
                with col2:
                    entry['batch_number'] = st.text_input(
                        f"Batch Number",
                        value=entry['batch_number'],
                        key=f"batch_{index}"
                    )
                    
                    entry['supplier_product_code'] = st.text_input(
                        f"Supplier Product Code",
                        value=entry['supplier_product_code'],
                        key=f"supplier_code_{index}"
                    )
                    
                    entry['expiry_date'] = st.date_input(
                        f"Expiry Date",
                        value=entry['expiry_date'],
                        key=f"expiry_{index}"
                    )
                    
                    entry['best_before_date'] = st.date_input(
                        f"Best Before Date",
                        value=entry['best_before_date'],
                        key=f"best_before_{index}"
                    )
                
                with col3:
                    if st.button("🗑️ Remove", key=f"remove_{index}"):
                        remove_product_entry(index)
                        st.rerun()

def render_temperature_section():
    """Render temperature check section."""
    st.subheader("🌡️ Temperature Information")
    
    temperature_required = st.checkbox("Temperature Check Required", key="temp_required")
    
    if temperature_required:
        col1, col2 = st.columns([3, 1])
        with col1:
            temperature = st.number_input(
                "Temperature (°C)",
                value=0.0,
                format="%.1f",
                key="temperature"
            )
        with col2:
            temp_status = st.selectbox(
                "Status",
                options=["Select Status", "PASSED", "FAILED"],
                key="temp_status"
            )
        
        temp_notes = st.text_input("Temperature Notes", key="temp_notes")
        return temperature, temp_status, temp_notes
    
    return None, None, None

def render_receiving_details():
    """Render receiving details section."""
    st.subheader("📅 Receiving Details")
    
    col1, col2 = st.columns(2)
    
    with col1:
        storage_location = st.selectbox(
            "Storage Location *",
            options=["Bakery", "Butchery", "HMR", "Dry Store", "Freezer", "Chiller"],
            key="storage_location"
        )
        
        received_date = st.date_input(
            "Received Date *",
            value=datetime.now().date(),
            key="received_date"
        )
    
    with col2:
        received_time = st.time_input(
            "Received Time *",
            value=datetime.now().time(),
            key="received_time"
        )
        
        received_by = st.text_input(
            "Received By *",
            key="received_by",
            help="Name of person receiving the products"
        )
    
    return storage_location, received_date, received_time, received_by

def render_quality_checks(department_code, tenant_slug):
    """Render quality checks section."""
    st.subheader("✅ Quality Checks")
    
    quality_checks = get_quality_checks(department_code, tenant_slug)
    check_results = []
    
    if quality_checks:
        for check in quality_checks:
            col1, col2 = st.columns([3, 1])
            
            with col1:
                st.write(f"**{check['check_name']}**")
                if check.get('required', False):
                    st.write("(Required)")
            
            with col2:
                status = st.selectbox(
                    "Status",
                    options=["Select Status", "PASSED", "FAILED"],
                    key=f"check_status_{check['check_id']}"
                )
            
            notes = st.text_input(
                f"Notes for {check['check_name']}",
                key=f"check_notes_{check['check_id']}"
            )
            
            check_results.append({
                'check_id': check['check_id'],
                'check_name': check['check_name'],
                'status': status,
                'notes': notes,
                'required': check.get('required', False)
            })
    
    return check_results

def validate_form(invoice_number, invoice_date, department_code, supplier_code, 
                 storage_location, received_by, check_results, temp_status):
    """Validate the receiving form."""
    errors = []
    
    # Required field validation
    if not invoice_number:
        errors.append("Invoice Number is required")
    if not invoice_date:
        errors.append("Invoice Date is required")
    if not department_code:
        errors.append("Department is required")
    if not supplier_code:
        errors.append("Supplier is required")
    if not storage_location:
        errors.append("Storage Location is required")
    if not received_by:
        errors.append("Received By is required")
    if not st.session_state.product_entries:
        errors.append("At least one product must be selected")
    
    # Quality checks validation
    for check in check_results:
        if check['required'] and check['status'] == "Select Status":
            errors.append(f"Quality check '{check['check_name']}' is required")
    
    # Temperature validation
    if 'temp_required' in st.session_state and st.session_state.temp_required:
        if temp_status == "Select Status":
            errors.append("Temperature status is required when temperature check is enabled")
    
    return errors

def create_new_product(product_data, tenant_slug):
    """Create a new product in the tenant database."""
    query = """
        INSERT INTO products (
            product_code, product_name, description, department, 
            sub_department, product_type, supplier_code, supplier_product_code
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    try:
        with schema_context(tenant_slug):
            with connection.cursor() as cursor:
                cursor.execute(query, [
                    product_data['product_code'],
                    product_data['product_name'],
                    product_data.get('description', ''),
                    product_data['department'],
                    product_data.get('sub_department', ''),
                    product_data.get('product_type', ''),
                    product_data['supplier_code'],
                    product_data.get('supplier_product_code', '')
                ])
        return True
    except Exception as e:
        st.error(f"Error creating product: {str(e)}")
        return False

def save_receiving_record(receiving_data, tenant_slug):
    """Save receiving record to the tenant database."""
    try:
        with schema_context(tenant_slug):
            # Create receiving record
            query = """
                INSERT INTO receiving_records (
                    invoice_number, invoice_date, department, supplier_code,
                    storage_location, received_date, received_time, received_by,
                    temperature, temperature_status, temperature_notes,
                    created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            
            with connection.cursor() as cursor:
                cursor.execute(query, [
                    receiving_data['invoice_number'],
                    receiving_data['invoice_date'],
                    receiving_data['department'],
                    receiving_data['supplier_code'],
                    receiving_data['storage_location'],
                    receiving_data['received_date'],
                    receiving_data['received_time'],
                    receiving_data['received_by'],
                    receiving_data.get('temperature'),
                    receiving_data.get('temperature_status'),
                    receiving_data.get('temperature_notes'),
                    datetime.now(),
                    datetime.now()
                ])
                
                receiving_id = cursor.fetchone()[0]
                
                # Save product entries
                for product_entry in receiving_data['products']:
                    product_query = """
                        INSERT INTO receiving_products (
                            receiving_record_id, product_code, quantity, unit,
                            batch_number, supplier_product_code, expiry_date, best_before_date
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    cursor.execute(product_query, [
                        receiving_id,
                        product_entry['product']['product_code'],
                        product_entry['quantity'],
                        product_entry['unit'],
                        product_entry['batch_number'],
                        product_entry['supplier_product_code'],
                        product_entry['expiry_date'],
                        product_entry['best_before_date']
                    ])
                
                # Save quality checks
                for check in receiving_data['quality_checks']:
                    if check['status'] != "Select Status":
                        check_query = """
                            INSERT INTO receiving_quality_checks (
                                receiving_record_id, check_id, check_name, status, notes
                            ) VALUES (%s, %s, %s, %s, %s)
                        """
                        cursor.execute(check_query, [
                            receiving_id,
                            check['check_id'],
                            check['check_name'],
                            check['status'],
                            check['notes']
                        ])
        
        return receiving_id
    except Exception as e:
        st.error(f"Error saving receiving record: {str(e)}")
        return None

def main():
    """Main application function."""
    initialize_session_state()
    
    # Detect tenant
    tenant_slug = detect_tenant_from_url()
    tenant = get_tenant_by_slug(tenant_slug)
    
    if not tenant:
        st.error(f"❌ Tenant '{tenant_slug}' not found. Please check the URL or contact support.")
        st.stop()
    
    # Render header
    render_main_header(tenant_slug, tenant)
    
    # Main form
    with st.form("receiving_form", clear_on_submit=False):
        # Invoice section
        invoice_number, invoice_date = render_invoice_section()
        
        # Department and supplier section
        department_code, supplier_code = render_department_supplier_section(tenant_slug)
        
        # Product selection (outside form to allow dynamic updates)
        st.form_submit_button("Update Selections", help="Click to update product lists")
    
    # Product selection and entries (outside main form)
    render_product_selection(department_code, supplier_code, tenant_slug)
    render_product_entries()
    
    # Temperature section
    temperature, temp_status, temp_notes = render_temperature_section()
    
    # Receiving details
    storage_location, received_date, received_time, received_by = render_receiving_details()
    
    # Quality checks
    check_results = render_quality_checks(department_code, tenant_slug)
    
    # Submit button
    st.markdown("---")
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        if st.button("📦 Submit Receiving Record", type="primary", use_container_width=True):
            # Validate form
            errors = validate_form(invoice_number, invoice_date, department_code, 
                                 supplier_code, storage_location, received_by, 
                                 check_results, temp_status)
            
            if errors:
                st.error("❌ Please fix the following errors:")
                for error in errors:
                    st.write(f"• {error}")
            else:
                # Prepare form data
                form_data = {
                    'invoice_number': invoice_number,
                    'invoice_date': invoice_date.isoformat(),
                    'department': department_code,
                    'supplier_code': supplier_code,
                    'storage_location': storage_location,
                    'received_date': received_date.isoformat(),
                    'received_time': received_time.isoformat(),
                    'received_by': received_by,
                    'products': st.session_state.product_entries,
                    'quality_checks': check_results,
                    'temperature': temperature,
                    'temperature_status': temp_status,
                    'temperature_notes': temp_notes
                }
                
                # Submit to database
                result = save_receiving_record(form_data, tenant_slug)
                
                if result:
                    st.success(f"✅ Receiving record submitted successfully! Record ID: {result}")
                    st.balloons()
                    
                    # Clear form
                    st.session_state.product_entries = []
                    st.rerun()
                else:
                    st.error("❌ Failed to submit receiving record")

if __name__ == "__main__":
    main()
