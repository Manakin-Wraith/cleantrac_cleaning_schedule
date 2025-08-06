"""
CleanTrac Standalone Receiving Frontend
A simplified version that works without Django dependencies for testing
"""

import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
import sqlite3
import os

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
        padding: 1.5rem;
        border-radius: 15px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    }
    .tenant-badge {
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 25px;
        font-weight: bold;
        border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .metric-card {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        padding: 1rem;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
</style>
""", unsafe_allow_html=True)

def init_database():
    """Initialize SQLite database for testing."""
    conn = sqlite3.connect('test_receiving.db')
    cursor = conn.cursor()
    
    # Create tables if they don't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            product_code TEXT PRIMARY KEY,
            product_name TEXT NOT NULL,
            description TEXT,
            department TEXT,
            supplier_code TEXT,
            supplier_product_code TEXT,
            product_type TEXT,
            sub_department TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS receiving_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT NOT NULL,
            invoice_date DATE,
            department TEXT,
            supplier_code TEXT,
            storage_location TEXT,
            received_date DATE,
            received_time TIME,
            received_by TEXT,
            temperature REAL,
            temperature_status TEXT,
            temperature_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS receiving_products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receiving_record_id INTEGER,
            product_code TEXT,
            quantity REAL,
            unit TEXT,
            batch_number TEXT,
            supplier_product_code TEXT,
            expiry_date DATE,
            best_before_date DATE,
            FOREIGN KEY (receiving_record_id) REFERENCES receiving_records (id)
        )
    ''')
    
    # Insert sample data if empty
    cursor.execute('SELECT COUNT(*) FROM products')
    if cursor.fetchone()[0] == 0:
        sample_products = [
            ('BAKERY001', 'White Bread', 'Fresh white bread loaf', 'BAKERY', 'SUP001', 'WB001', 'Bread', ''),
            ('BAKERY002', 'Croissant', 'Butter croissant', 'BAKERY', 'SUP001', 'CR001', 'Pastry', ''),
            ('BUTCHERY001', 'Beef Mince', 'Fresh beef mince 500g', 'BUTCHERY', 'SUP002', 'BM001', 'Meat', ''),
            ('HMR001', 'Chicken Curry', 'Ready meal chicken curry', 'HMR', 'SUP003', 'CC001', 'Ready Meal', ''),
        ]
        cursor.executemany('''
            INSERT INTO products (product_code, product_name, description, department, 
                                supplier_code, supplier_product_code, product_type, sub_department)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_products)
    
    conn.commit()
    conn.close()

def get_database_connection():
    """Get database connection."""
    return sqlite3.connect('test_receiving.db')

def detect_tenant_from_url():
    """Detect tenant from URL parameters."""
    query_params = st.query_params
    return query_params.get('tenant', 'test_store')

def get_departments():
    """Get departments from database."""
    conn = get_database_connection()
    df = pd.read_sql_query('''
        SELECT DISTINCT department as code, department as name 
        FROM products 
        WHERE department IS NOT NULL 
        ORDER BY department
    ''', conn)
    conn.close()
    
    if not df.empty:
        return [(row['code'], f"{row['code']} - {row['name']}") for _, row in df.iterrows()]
    return [('BAKERY', 'BAKERY - Bakery Department')]

def get_suppliers_for_department(department):
    """Get suppliers for department."""
    conn = get_database_connection()
    df = pd.read_sql_query('''
        SELECT DISTINCT supplier_code as code, supplier_code as name 
        FROM products 
        WHERE department = ? AND supplier_code IS NOT NULL 
        ORDER BY supplier_code
    ''', conn, params=[department])
    conn.close()
    
    if not df.empty:
        return [(row['code'], f"{row['code']} - {row['name']}") for _, row in df.iterrows()]
    return [('SUP001', 'SUP001 - Default Supplier')]

def get_products_for_supplier(supplier_code, department):
    """Get products for supplier and department."""
    conn = get_database_connection()
    df = pd.read_sql_query('''
        SELECT product_code, product_name, description, supplier_code, 
               supplier_product_code, product_type, sub_department
        FROM products 
        WHERE supplier_code = ? AND department = ? 
        ORDER BY product_name
    ''', conn, params=[supplier_code, department])
    conn.close()
    
    return df.to_dict('records') if not df.empty else []

def save_receiving_record(receiving_data):
    """Save receiving record to database."""
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Insert receiving record
        cursor.execute('''
            INSERT INTO receiving_records (
                invoice_number, invoice_date, department, supplier_code,
                storage_location, received_date, received_time, received_by,
                temperature, temperature_status, temperature_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', [
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
            receiving_data.get('temperature_notes')
        ])
        
        receiving_id = cursor.lastrowid
        
        # Insert product entries
        for product_entry in receiving_data['products']:
            cursor.execute('''
                INSERT INTO receiving_products (
                    receiving_record_id, product_code, quantity, unit,
                    batch_number, supplier_product_code, expiry_date, best_before_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', [
                receiving_id,
                product_entry['product']['product_code'],
                product_entry['quantity'],
                product_entry['unit'],
                product_entry['batch_number'],
                product_entry['supplier_product_code'],
                product_entry['expiry_date'],
                product_entry['best_before_date']
            ])
        
        conn.commit()
        conn.close()
        return receiving_id
        
    except Exception as e:
        st.error(f"Error saving receiving record: {str(e)}")
        return None

def initialize_session_state():
    """Initialize session state."""
    if 'product_entries' not in st.session_state:
        st.session_state.product_entries = []

def main():
    """Main application function."""
    # Initialize database and session state
    init_database()
    initialize_session_state()
    
    # Detect tenant
    tenant_slug = detect_tenant_from_url()
    
    # Header
    st.markdown(f"""
    <div class="main-header">
        <h1>📦 CleanTrac Receiving Dashboard</h1>
        <div class="tenant-badge">Tenant: {tenant_slug.upper()}</div>
    </div>
    """, unsafe_allow_html=True)
    
    # Metrics
    col1, col2, col3, col4 = st.columns(4)
    
    conn = get_database_connection()
    
    with col1:
        products_count = pd.read_sql_query('SELECT COUNT(*) as count FROM products', conn).iloc[0]['count']
        st.markdown(f"""
        <div class="metric-card">
            <h3>{products_count}</h3>
            <p>Products</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        suppliers_count = pd.read_sql_query('SELECT COUNT(DISTINCT supplier_code) as count FROM products', conn).iloc[0]['count']
        st.markdown(f"""
        <div class="metric-card">
            <h3>{suppliers_count}</h3>
            <p>Suppliers</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        departments_count = pd.read_sql_query('SELECT COUNT(DISTINCT department) as count FROM products', conn).iloc[0]['count']
        st.markdown(f"""
        <div class="metric-card">
            <h3>{departments_count}</h3>
            <p>Departments</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        today_receiving = pd.read_sql_query('SELECT COUNT(*) as count FROM receiving_records WHERE DATE(created_at) = DATE("now")', conn).iloc[0]['count']
        st.markdown(f"""
        <div class="metric-card">
            <h3>{today_receiving}</h3>
            <p>Today\'s Receiving</p>
        </div>
        """, unsafe_allow_html=True)
    
    conn.close()
    
    st.markdown("---")
    
    # Invoice Information
    st.subheader("📄 Invoice Information")
    col1, col2 = st.columns(2)
    
    with col1:
        invoice_number = st.text_input("Supplier Invoice Number *", key="invoice_number")
    with col2:
        invoice_date = st.date_input("Invoice Date *", value=datetime.now().date(), key="invoice_date")
    
    # Department & Supplier
    st.subheader("🏢 Department & Supplier")
    
    departments = get_departments()
    department_options = [dept[1] for dept in departments]
    selected_dept_display = st.selectbox("Department *", options=department_options, key="department_select")
    department_code = selected_dept_display.split(' - ')[0]
    
    suppliers = get_suppliers_for_department(department_code)
    supplier_options = [sup[1] for sup in suppliers]
    selected_supplier_display = st.selectbox("Supplier *", options=supplier_options, key="supplier_select")
    supplier_code = selected_supplier_display.split(' - ')[0]
    
    # Product Selection
    st.subheader("📦 Product Selection")
    products = get_products_for_supplier(supplier_code, department_code)
    
    if products:
        selected_products = st.multiselect(
            "Select Products",
            options=[f"{p['product_code']} - {p['product_name']}" for p in products],
            key="selected_products"
        )
        
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
            st.rerun()
    
    # Product Entries
    if st.session_state.product_entries:
        st.subheader("📋 Products to Receive")
        
        for index, entry in enumerate(st.session_state.product_entries):
            with st.expander(f"Product {index + 1}: {entry['product']['product_name']}", expanded=True):
                col1, col2, col3 = st.columns([2, 2, 1])
                
                with col1:
                    st.write(f"**Code:** {entry['product']['product_code']}")
                    st.write(f"**Name:** {entry['product']['product_name']}")
                    
                    entry['quantity'] = st.number_input(
                        "Quantity", min_value=0.01, step=0.01, value=entry['quantity'], key=f"quantity_{index}"
                    )
                    entry['unit'] = st.selectbox(
                        "Unit", options=["KG", "L", "EACH", "CASE"], 
                        index=["KG", "L", "EACH", "CASE"].index(entry['unit']), key=f"unit_{index}"
                    )
                
                with col2:
                    entry['batch_number'] = st.text_input("Batch Number", value=entry['batch_number'], key=f"batch_{index}")
                    entry['supplier_product_code'] = st.text_input("Supplier Product Code", value=entry['supplier_product_code'], key=f"supplier_code_{index}")
                    entry['expiry_date'] = st.date_input("Expiry Date", value=entry['expiry_date'], key=f"expiry_{index}")
                    entry['best_before_date'] = st.date_input("Best Before Date", value=entry['best_before_date'], key=f"best_before_{index}")
                
                with col3:
                    if st.button("🗑️ Remove", key=f"remove_{index}"):
                        st.session_state.product_entries.pop(index)
                        st.rerun()
    
    # Receiving Details
    st.subheader("📅 Receiving Details")
    col1, col2 = st.columns(2)
    
    with col1:
        storage_location = st.selectbox("Storage Location *", options=["Bakery", "Butchery", "HMR", "Dry Store"], key="storage_location")
        received_date = st.date_input("Received Date *", value=datetime.now().date(), key="received_date")
    
    with col2:
        received_time = st.time_input("Received Time *", value=datetime.now().time(), key="received_time")
        received_by = st.text_input("Received By *", key="received_by")
    
    # Temperature Check
    st.subheader("🌡️ Temperature Information")
    temperature_required = st.checkbox("Temperature Check Required", key="temp_required")
    
    temperature = None
    temp_status = None
    temp_notes = None
    
    if temperature_required:
        col1, col2 = st.columns([3, 1])
        with col1:
            temperature = st.number_input("Temperature (°C)", value=0.0, format="%.1f", key="temperature")
        with col2:
            temp_status = st.selectbox("Status", options=["Select Status", "PASSED", "FAILED"], key="temp_status")
        temp_notes = st.text_input("Temperature Notes", key="temp_notes")
    
    # Submit
    st.markdown("---")
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        if st.button("📦 Submit Receiving Record", type="primary", use_container_width=True):
            # Validation
            errors = []
            if not invoice_number:
                errors.append("Invoice Number is required")
            if not received_by:
                errors.append("Received By is required")
            if not st.session_state.product_entries:
                errors.append("At least one product must be selected")
            if temperature_required and temp_status == "Select Status":
                errors.append("Temperature status is required")
            
            if errors:
                st.error("❌ Please fix the following errors:")
                for error in errors:
                    st.write(f"• {error}")
            else:
                # Prepare and save data
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
                    'temperature': temperature,
                    'temperature_status': temp_status,
                    'temperature_notes': temp_notes
                }
                
                result = save_receiving_record(form_data)
                
                if result:
                    st.success(f"✅ Receiving record submitted successfully! Record ID: {result}")
                    st.balloons()
                    st.session_state.product_entries = []
                    st.rerun()
                else:
                    st.error("❌ Failed to submit receiving record")

if __name__ == "__main__":
    main()
