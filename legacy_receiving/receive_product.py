"""
Product receiving form component.
"""
import streamlit as st
from datetime import datetime, timedelta
import uuid
from data_access.database import load_data, execute_query, db_session
from sqlalchemy import text
import pandas as pd

class SupplierModel:
    def __init__(self, code: str, name: str):
        """
        Initialize a SupplierModel instance.

        Args:
            code (str): Supplier code.
            name (str): Supplier name.
        """
        self.code = code
        self.name = name
        
    @staticmethod
    def from_row(row) -> 'SupplierModel':
        """Create a SupplierModel instance from a database row."""
        return SupplierModel(str(row['supplier_code']), row['supplier_name'])
    
    def __str__(self) -> str:
        # Ensure supplier code is always displayed properly
        return f"{self.code} - {self.name}"

class ProductModel:
    """Model class for products."""
    def __init__(self, code, name, supplier_product_code=None):
        self.code = code
        self.name = name
        self.supplier_product_code = supplier_product_code
    
    def __str__(self):
        """Return string representation of product."""
        return f"{self.code} - {self.name}"

def get_department_options():
    """
    Retrieve available department options for selection.

    Returns:
        list[str]: List of department options in the format "code - name".
    """
    query = """
        SELECT department_code, department_name 
        FROM departments 
        ORDER BY department_code
    """
    df = load_data(query)
    return [f"{code} - {name}" for code, name in zip(df['department_code'], df['department_name'])]

def extract_department_code(department_full: str) -> str:
    """
    Extract the department code from a full department string.

    Args:
        department_full (str): Full department string in the format "code - name".

    Returns:
        str: Department code.
    """
    return department_full.split(' - ')[0].strip()

def get_suppliers_for_department(department: str) -> list[SupplierModel]:
    """
    Retrieve suppliers for a given department.

    Args:
        department (str): Department code.

    Returns:
        list[SupplierModel]: List of suppliers for the given department.
    """
    # Modified query to include suppliers from both supplier_departments table AND suppliers with department directly set
    query = """
        SELECT DISTINCT s.supplier_code, s.supplier_name 
        FROM suppliers s
        LEFT JOIN supplier_departments sd ON s.supplier_code = sd.supplier_code 
        WHERE sd.department = %(dept)s OR s.department = %(dept)s
        ORDER BY s.supplier_name
    """
    df = load_data(query, {'dept': department})
    return [SupplierModel.from_row(row) for _, row in df.iterrows()]

def get_products_for_supplier_and_department(supplier_code, department):
    """Get products for a supplier and department."""
    query = """
    SELECT p.product_code, p.product_name, p.supplier_product_code
    FROM products p
    WHERE p.supplier_code = %(supplier_code)s
    AND p.department = %(department)s
    ORDER BY p.product_name
    """
    
    products_df = load_data(query, {
        'supplier_code': supplier_code,
        'department': department
    })
    
    if products_df.empty:
        return []
    
    products = []
    for _, row in products_df.iterrows():
        product = ProductModel(
            str(row['product_code']),
            row['product_name'],
            row.get('supplier_product_code', None)
        )
        products.append(product)
    
    return products

def get_required_checks(department):
    """
    Get required quality checks for a department.

    Args:
        department (str): Department code.

    Returns:
        pd.DataFrame: DataFrame containing required quality checks for the given department.
    """
    query = """
        SELECT check_id, check_name, required 
        FROM quality_check_types 
        WHERE department = %(department)s
    """
    return load_data(query, {'department': department})

def validate_product_data(data):
    # Add your validation logic here
    return True

def save_received_products(product_data_list):
    """
    Save received products to the database.
    
    Args:
        product_data_list (list): List of product data dictionaries.
        
    Returns:
        bool: True if successful, False otherwise.
    """
    try:
        # Start transaction
        with db_session.begin():
            # Save each product
            for product_data in product_data_list:
                # Extract product data
                product_code = product_data.get('product_code').code
                supplier_code = product_data.get('supplier_code')
                batch_number = product_data.get('batch_number')
                quantity = product_data.get('quantity')
                unit = product_data.get('unit')
                received_date = product_data.get('received_date')
                expiry_date = product_data.get('expiry_date')
                best_before_date = product_data.get('best_before_date')
                temperature_required = product_data.get('temperature_required', False)
                temperature_received = product_data.get('temperature_received')
                storage_location = product_data.get('storage_location', '')
                received_by = product_data.get('received_by', '')
                department_manager = product_data.get('department_manager', '')
                quality_status = product_data.get('quality_status', 'PENDING')
                notes = product_data.get('notes', '')
                supplier_invoice_number = product_data.get('supplier_invoice_number', '')
                supplier_invoice_date = product_data.get('supplier_invoice_date')
                supplier_product_code = product_data.get('supplier_product_code', '')
                department = product_data.get('department', '')
                quality_checks = product_data.get('quality_checks', [])
                
                # Generate tracking ID
                tracking_id = f"{product_code}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:4]}"
                
                # Insert into received_products
                query = """
                    INSERT INTO received_products (
                        tracking_id, product_code, supplier_code, batch_number, 
                        quantity, unit, received_date, expiry_date, best_before_date,
                        temperature_received, temperature_required, storage_location,
                        received_by, department_manager, quality_status, notes,
                        created_at, updated_at, supplier_invoice_number, supplier_invoice_date
                    ) VALUES (
                        :tracking_id, :product_code, :supplier_code, :batch_number,
                        :quantity, :unit, :received_date, :expiry_date, :best_before_date,
                        :temperature_received, :temperature_required, :storage_location,
                        :received_by, :department_manager, :quality_status, :notes,
                        NOW(), NOW(), :supplier_invoice_number, :supplier_invoice_date
                    )
                """
                execute_query(query, {
                    'tracking_id': tracking_id,
                    'product_code': product_code,
                    'supplier_code': supplier_code,
                    'batch_number': batch_number,
                    'quantity': quantity,
                    'unit': unit,
                    'received_date': received_date,
                    'expiry_date': expiry_date,
                    'best_before_date': best_before_date,
                    'temperature_received': temperature_received,
                    'temperature_required': temperature_required,
                    'storage_location': storage_location,
                    'received_by': received_by,
                    'department_manager': department_manager,
                    'quality_status': quality_status,
                    'notes': notes,
                    'supplier_invoice_number': supplier_invoice_number,
                    'supplier_invoice_date': supplier_invoice_date
                })

                # Insert quality checks from the UI selections
                for check in quality_checks:
                    check_id = check['check_id']
                    status = check['status']
                    # Convert UI status to database status
                    if status == 'Select Status':
                        status = 'N/A'
                    notes = check['notes'] or ''
                    quality_check_query = """
                        INSERT INTO quality_checks (tracking_id, check_id, status, notes, checked_by, checked_at)
                        VALUES (:tracking_id, :check_id, :status, :notes, :checked_by, NOW())
                    """
                    execute_query(quality_check_query, {
                        'tracking_id': tracking_id,
                        'check_id': check_id,
                        'status': status,
                        'notes': notes,
                        'checked_by': received_by
                    })

                # Update quality status based on quality checks
                # Query to check if any quality check has failed
                check_status_query = """
                    SELECT 
                        CASE 
                            WHEN COUNT(*) = 0 THEN 'No Checks'
                            WHEN SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) > 0 THEN 'FAILED'
                            ELSE 'PASSED'
                        END as overall_status
                    FROM quality_checks
                    WHERE tracking_id = :tracking_id
                """
                result_df = load_data(check_status_query, {'tracking_id': tracking_id})
                quality_status = result_df['overall_status'].iloc[0] if not result_df.empty else 'No Checks'
                
                # Update the quality status in received_products
                update_quality_status_query = """
                    UPDATE received_products
                    SET quality_status = :quality_status
                    WHERE tracking_id = :tracking_id
                """
                execute_query(update_quality_status_query, {
                    'quality_status': quality_status,
                    'tracking_id': tracking_id
                })
                
                # Update supplier product code in products table if it's provided and different
                if supplier_product_code and supplier_product_code != product_data['product_code'].supplier_product_code:
                    update_query = """
                        UPDATE products
                        SET supplier_product_code = :supplier_product_code
                        WHERE product_code = :product_code AND supplier_code = :supplier_code
                    """
                    db_session.execute(text(update_query), {
                        'supplier_product_code': supplier_product_code,
                        'product_code': product_code,
                        'supplier_code': supplier_code
                    })
                
                # Set success message
                if len(product_data_list) == 1:
                    st.session_state.receive_success = {
                        'tracking_id': tracking_id,
                        'product_name': product_data['product_code'].name
                    }
                
        # Commit transaction
        db_session.commit()
        
        # If multiple products, set generic success message
        if len(product_data_list) > 1:
            st.session_state.receive_success = {
                'tracking_id': 'Multiple',
                'product_name': f"{len(product_data_list)} products"
            }
            
        return True
    
    except Exception as e:
        st.error(f"Error saving received products: {str(e)}")
        # Rollback transaction
        db_session.rollback()
        return False

def render_receive_product_form():
    """Render the product receiving form."""
    st.header("Receive New Product")
    
    # Check for success message from previous submission
    if 'receive_success' in st.session_state:
        success_data = st.session_state.receive_success
        st.toast(f"✅ Product received: {success_data['product_name']}", icon="✅")
        st.success(f"Product received successfully! Tracking ID: {success_data['tracking_id']}")
        
        # Clear the success data
        del st.session_state.receive_success
    
    # Initialize form state
    initialize_form_state()
    
    # Get department selection
    department_options = get_department_options()
    
    # If form was just reset, select the first department
    if 'form_reset_trigger' in st.session_state and st.session_state.form_reset_trigger:
        department_index = 0
    else:
        # Keep the current selection if it exists
        current_dept = st.session_state.get('receive_form_department_select')
        department_index = department_options.index(current_dept) if current_dept in department_options else 0
    
    department_full = st.selectbox(
        "Department",
        options=department_options,
        index=department_index,
        key="receive_form_department_select"
    )
    department = extract_department_code(department_full)
    
    st.subheader("Invoice Information")
    col1, col2 = st.columns(2)
    with col1:
        invoice_number = st.text_input(
            "Supplier Invoice Number",
            key="receive_form_invoice_number",
            help="Enter the supplier's invoice number"
        )
    with col2:
        invoice_date = st.date_input(
            "Invoice Date",
            key="receive_form_invoice_date",
            value=datetime.now().date(),  # Default to today
            min_value=datetime.now().date() - timedelta(days=30),  # Allow dates up to 30 days in the past
            max_value=datetime.now().date()  # Don't allow future dates
        )
    
    # Validate invoice information
    if invoice_number:
        # Standardize invoice number format
        invoice_number = invoice_number.strip().upper()
        
        # Basic invoice number validation
        if len(invoice_number) < 1:
            st.error("Invoice number cannot be empty")
            return
        
        # Validate invoice date is not in future
        if invoice_date > datetime.now().date():
               st.error("Invoice date cannot be in the future")
               return

    if department:
        # Get suppliers for department
        suppliers = get_suppliers_for_department(department)
        
        if suppliers:
            # Create supplier selection
            supplier_options = [str(s) for s in suppliers]
            selected_supplier = st.selectbox(
                "Supplier",
                options=supplier_options,
                key="receive_form_supplier"
            )
            
            # Parse selected supplier
            supplier_code = selected_supplier.split(' - ')[0]
            supplier = next(s for s in suppliers if s.code == supplier_code)
            
            # Get products for supplier
            products = get_products_for_supplier_and_department(supplier_code, department)
            
            # Initialize session state for add_new_product dialog
            if 'show_add_product_dialog' not in st.session_state:
                st.session_state.show_add_product_dialog = False
                
            # Function to toggle the new product dialog
            def toggle_add_product_dialog():
                st.session_state.show_add_product_dialog = not st.session_state.show_add_product_dialog
                
            # Button to add a new product
            col1, col2 = st.columns([3, 1])
            with col1:
                st.write("Select products from the list or add a new product:")
            with col2:
                st.button("➕ Add New Product", on_click=toggle_add_product_dialog, key="add_new_product_btn")
            
            # Show the add product dialog if triggered
            if st.session_state.show_add_product_dialog:
                with st.expander("Add New Product", expanded=True):
                    # Initialize new product form state
                    if 'new_product_code' not in st.session_state:
                        st.session_state.new_product_code = ""
                    if 'new_product_name' not in st.session_state:
                        st.session_state.new_product_name = ""
                    if 'new_product_description' not in st.session_state:
                        st.session_state.new_product_description = ""
                    if 'new_department_selectbox' not in st.session_state:
                        st.session_state.new_department_selectbox = department
                    if 'new_sub_department' not in st.session_state:
                        st.session_state.new_sub_department = ""
                    if 'new_product_type' not in st.session_state:
                        st.session_state.new_product_type = ""
                    if 'new_supplier_selectbox' not in st.session_state:
                        st.session_state.new_supplier_selectbox = supplier_code
                    if 'new_supplier_product_code' not in st.session_state:
                        st.session_state.new_supplier_product_code = ""
                    
                    # Generate next product code
                    if 'suggested_product_code' not in st.session_state:
                        # Get highest product code with numeric suffix for the department
                        existing_codes_query = """
                            SELECT product_code FROM products 
                            WHERE department = %(dept)s
                            ORDER BY product_code DESC
                        """
                        existing_codes = load_data(existing_codes_query, {'dept': department})
                        
                        if not existing_codes.empty:
                            dept_prefix = department
                            highest_code = existing_codes.iloc[0]['product_code']
                            
                            # Try to extract numeric suffix
                            import re
                            numeric_part = re.search(r'(\d+)$', highest_code)
                            
                            if numeric_part:
                                # Increment the numeric part
                                next_num = int(numeric_part.group(1)) + 1
                                next_code = f"{dept_prefix}{next_num:04d}"
                            else:
                                # If no numeric suffix, start with 1000
                                next_code = f"{department}1000"
                        else:
                            # No existing codes, start with 1000
                            next_code = f"{department}1000"
                            
                        st.session_state.suggested_product_code = next_code
                        st.session_state.new_product_code = next_code
                    
                    # Function to generate next supplier product code
                    def get_next_supplier_product_code(supplier_code):
                        query = """
                            SELECT supplier_product_code 
                            FROM products 
                            WHERE supplier_code = %(supplier)s
                            AND supplier_product_code ~ '^\d+$'
                            ORDER BY CAST(supplier_product_code AS INTEGER) DESC
                            LIMIT 1
                        """
                        result = load_data(query, {'supplier': supplier_code})
                        
                        if not result.empty:
                            try:
                                last_code = int(result['supplier_product_code'].iloc[0])
                                return str(last_code + 1).zfill(len(str(last_code)))
                            except (ValueError, TypeError):
                                pass
                        
                        # If no numeric codes or conversion failed, try to get the most recent code
                        query = """
                            SELECT supplier_product_code 
                            FROM products 
                            WHERE supplier_code = %(supplier)s
                            AND supplier_product_code IS NOT NULL
                            ORDER BY id DESC
                            LIMIT 1
                        """
                        recent_codes = load_data(query, {'supplier': supplier_code})
                        
                        if not recent_codes.empty and not pd.isna(recent_codes.iloc[0]['supplier_product_code']):
                            return recent_codes.iloc[0]['supplier_product_code'] + "_new"
                        
                        # Default if nothing else works
                        return "1000"
                    
                    # Generate next supplier product code
                    if 'suggested_supplier_code' not in st.session_state:
                        st.session_state.suggested_supplier_code = get_next_supplier_product_code(supplier_code)
                        st.session_state.new_supplier_product_code = st.session_state.suggested_supplier_code
                    
                    # Create form for adding new product
                    with st.form("add_new_product_form"):
                        st.subheader("New Product Details")
                        
                        col1, col2 = st.columns(2)
                        with col1:
                            new_product_code = st.text_input(
                                "Product Code *", 
                                value=st.session_state.suggested_product_code,
                                key="new_product_code"
                            )
                            
                            new_product_name = st.text_input(
                                "Product Name *", 
                                key="new_product_name"
                            )
                            
                            # Use a hidden field for department code and display the full department name
                            st.write(f"**Department:** {department_full}")
                            # Store the department code in session state
                            st.session_state.new_department_code = department
                            
                            new_sub_department = st.text_input(
                                "Sub-Department", 
                                key="new_sub_department"
                            )
                        with col2:
                            new_supplier = st.selectbox(
                                "Supplier *",
                                options=[selected_supplier],
                                index=0,
                                disabled=True,
                                key="new_supplier_display"
                            )
                            
                            new_supplier_product_code = st.text_input(
                                "Supplier Product Code",
                                value=st.session_state.suggested_supplier_code,
                                key="new_supplier_product_code",
                                help="The product code used by the supplier"
                            )
                            
                            product_type_options = load_data(
                                "SELECT DISTINCT product_type FROM products ORDER BY product_type"
                            )
                            product_type_list = [''] + product_type_options['product_type'].dropna().tolist()
                            
                            new_product_type = st.selectbox(
                                "Product Type",
                                options=product_type_list,
                                key="new_product_type"
                            )
                            
                        new_product_description = st.text_area(
                            "Description",
                            key="new_product_description"
                        )
                        
                        col1, col2 = st.columns(2)
                        with col1:
                            submit_product = st.form_submit_button("Add Product")
                        with col2:
                            cancel_button = st.form_submit_button("Cancel")
                        
                        if submit_product:
                            # Set hidden supplier code field from the main form
                            st.session_state.new_supplier_selectbox = supplier_code
                            
                            # Validate required fields
                            if not new_product_code or not new_product_name:
                                st.error("Product Code and Product Name are required fields")
                            else:
                                # Check if product code already exists
                                existing_product = load_data(
                                    """
                                    SELECT product_code 
                                    FROM products 
                                    WHERE product_code = %(code)s 
                                    """,
                                    {'code': new_product_code}
                                )
                                
                                if not existing_product.empty:
                                    st.error("A product with this code already exists")
                                else:
                                    try:
                                        # Extract department code from the selected department
                                        dept_code = st.session_state.new_department_code
                                        
                                        # Insert new product
                                        query = """
                                            INSERT INTO products (
                                                product_code, product_name, description,
                                                department, sub_department, product_type,
                                                supplier_code, supplier_product_code
                                            )
                                            VALUES (
                                                %(product_code)s, %(product_name)s, %(description)s,
                                                %(department)s, %(sub_department)s, %(product_type)s,
                                                %(supplier_code)s, %(supplier_product_code)s
                                            )
                                        """
                                        execute_query(query, {
                                            'product_code': new_product_code,
                                            'product_name': new_product_name,
                                            'description': new_product_description,
                                            'department': dept_code,
                                            'sub_department': new_sub_department,
                                            'product_type': new_product_type,
                                            'supplier_code': supplier_code,
                                            'supplier_product_code': new_supplier_product_code
                                        })
                                        
                                        # Success! Now close the dialog and refresh the product list
                                        st.session_state.show_add_product_dialog = False
                                        
                                        # Create a new ProductModel for the created product
                                        new_product = ProductModel(
                                            new_product_code, 
                                            new_product_name,
                                            new_supplier_product_code
                                        )
                                        
                                        # Add the new product to the products list
                                        products.append(new_product)
                                        
                                        # Show success message
                                        st.success(f"Product '{new_product_name}' added successfully!")
                                        
                                        # Reset suggestion fields for next use
                                        if 'suggested_product_code' in st.session_state:
                                            del st.session_state.suggested_product_code
                                        if 'suggested_supplier_code' in st.session_state:
                                            del st.session_state.suggested_supplier_code
                                            
                                        # Force a rerun to update the UI
                                        st.experimental_rerun()
                                        
                                    except Exception as e:
                                        st.error(f"Error adding product: {str(e)}")
                        
                        if cancel_button:
                            st.session_state.show_add_product_dialog = False
                            st.experimental_rerun()
            
            if products:
                product_options = [str(p) for p in products]
                selected_products = st.multiselect(
                    "Products",
                    options=product_options,
                    key="receive_form_products"
                )
                
                # Parse selected products
                selected_product_codes = [p.split(' - ')[0] for p in selected_products]
                selected_products_details = [next(p for p in products if p.code == code) for code in selected_product_codes]
                
                # Initialize product entries in session state
                if 'product_entries' not in st.session_state:
                    st.session_state.product_entries = []

                # Update product entries based on selected products
                current_products = {entry['product_code'] for entry in st.session_state.product_entries if entry['product_code']}
                selected_products_set = set(selected_products_details)
                
                # Remove entries for unselected products
                st.session_state.product_entries = [
                    entry for entry in st.session_state.product_entries 
                    if entry['product_code'] in selected_products_set
                ]
                
                # Add new entries for newly selected products
                for product in selected_products_details:
                    if product not in current_products:
                        st.session_state.product_entries.append({
                            'product_code': product,
                            'quantity': 0.01,
                            'unit': 'KG',
                            'batch_number': '',
                            'supplier_product_code': product.supplier_product_code or '',
                            'expiry_date': datetime.now().date() + timedelta(days=30),
                            'best_before_date': datetime.now().date() + timedelta(days=7)
                        })

                # Function to remove a product entry
                def remove_product_entry(index):
                    if 0 <= index < len(st.session_state.product_entries):
                        removed_product = st.session_state.product_entries[index]['product_code']
                        st.session_state.product_entries.pop(index)
                        # Update the multiselect to remove the product
                        new_selection = [p for p in selected_products if removed_product.code not in p]
                        st.session_state.receive_form_products = new_selection

                # Render product entry fields for each selected product
                for index, entry in enumerate(st.session_state.product_entries):
                    st.container()
                    col1, col2, col3 = st.columns([4, 4, 1])
                    with col1:
                        st.text(f"Product {index + 1}: {entry['product_code']}")
                        if entry['product_code'].supplier_product_code:
                            st.text(f"Supplier Product Code: {entry['product_code'].supplier_product_code}")
                    with col2:
                        entry['quantity'] = st.number_input(f"Quantity {index + 1}", min_value=0.01, step=0.01, format="%.2f", key=f"quantity_{index}")
                        entry['unit'] = st.selectbox(f"Unit {index + 1}", options=["KG", "L", "EACH", "CASE"], key=f"unit_{index}")
                        entry['batch_number'] = st.text_input(f"Batch Number {index + 1}", key=f"batch_number_{index}")
                        # Allow editing supplier product code if needed
                        entry['supplier_product_code'] = st.text_input(
                            f"Supplier Product Code {index + 1}", 
                            value=entry['supplier_product_code'] or entry['product_code'].supplier_product_code or '',
                            key=f"supplier_product_code_{index}",
                            help="The product code used by the supplier"
                        )
                        entry['expiry_date'] = st.date_input(f"Expiry Date {index + 1}", value=datetime.now().date() + timedelta(days=30), key=f"expiry_date_{index}")
                        entry['best_before_date'] = st.date_input(f"Best Before Date {index + 1}", value=datetime.now().date() + timedelta(days=7), key=f"best_before_date_{index}")
                    with col3:
                        st.button("🗑️", key=f"remove_{index}", on_click=remove_product_entry, args=(index,), help="Remove this product")
                
                # Temperature Check - moved outside form
                st.subheader("Temperature Information")
                temperature_required = st.checkbox("Temperature Check Required", value=False, key="receive_form_temperature_required")
                
                if temperature_required:
                    col1, col2 = st.columns([3, 1])
                    with col1:
                        temperature_received = st.number_input(
                            "Temperature (°C)",
                            value=0.0,
                            format="%.1f",
                            key="receive_form_temperature"
                        )
                    with col2:
                        temp_status = st.selectbox(
                            "Status",
                            options=["Select Status", "PASSED", "FAILED"],
                            index=0,
                            key="receive_form_temperature_status"
                        )
                    temp_notes = st.text_input("Notes for Temperature Check", key="receive_form_temp_notes")
                else:
                    temperature_received = None
                    temp_status = None
                    temp_notes = None
                
                # Start the form here after all selections are made
                with st.form("receive_product_form", clear_on_submit=True):
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        # Initialize batch_number with None
                        batch_number = None
                        # Only show batch number field if there's a single product
                        if len(st.session_state.product_entries) == 1:
                            batch_number = st.text_input("Batch Number", key="receive_form_batch_number")
                        storage_location = st.selectbox(
                            "Storage Location",
                            options=["Bakery", "Butchery", "HMR"],
                            key="receive_form_storage_location"
                        )
                    
                    with col2:
                        received_date = st.date_input("Received Date", value=datetime.now().date())
                        received_time = st.time_input("Received Time", value=datetime.now().time())
                        expiry_date = st.date_input("Expiry Date", 
                            value=datetime.now().date() + timedelta(days=30),
                            min_value=datetime.now().date()
                        )
                        best_before_date = st.date_input("Best Before Date",
                            value=datetime.now().date() + timedelta(days=7),
                            min_value=datetime.now().date()
                        )
                    
                    # Quality Checks
                    st.subheader("Quality Checks")
                    quality_checks = get_required_checks(department)
                    check_results = []
                    
                    for _, check in quality_checks.iterrows():
                        col1, col2 = st.columns([3, 1])
                        with col1:
                            st.write(f"**{check['check_name']}**")
                            if check['required']:
                                st.write("(Required)")
                        with col2:
                            status = st.selectbox(
                                "Status",
                                options=["Select Status", "PASSED", "FAILED"],
                                index=0,
                                key=f"receive_form_check_{check['check_id']}"
                            )
                        notes = st.text_input(f"Notes for {check['check_name']}", key=f"receive_form_notes_{check['check_id']}")
                        check_results.append({
                            'check_id': check['check_id'],
                            'status': status,
                            'notes': notes
                        })
                    
                    # Store quality checks in session state
                    st.session_state.receive_form_quality_checks = check_results
                    
                    # Validate that all required checks have a status selected
                    def validate_checks():
                        if 'receive_form_temperature_required' in st.session_state and st.session_state.receive_form_temperature_required:
                            if temp_status == "Select Status":
                                st.error("Please select a status for the Temperature Check")
                                return False
                        for check in check_results:
                            if check['status'] == "Select Status":
                                st.error("Please select a status for all quality checks")
                                return False
                        return True
                    
                    # Personnel Information
                    st.subheader("Personnel Information")
                    col1, col2 = st.columns(2)
                    with col1:
                        received_by = st.text_input("Received By", value="Aphiwe", key="receive_form_received_by")
                    with col2:
                        department_manager = st.text_input("Department Manager", value="Receiving", key="receive_form_department_manager")
                    
                    # Additional Notes
                    notes = st.text_area("Additional Notes", key="receive_form_notes")
                    
                    # Submit button
                    submitted = st.form_submit_button("Record Received Product")
                    
                    if submitted:
                        # For single product entry, check the general batch number
                        if len(st.session_state.product_entries) == 1:
                            if not batch_number:
                                st.error("Batch Number is required")
                                return
                        # For multiple products, ensure each product has a batch number
                        else:
                            for index, entry in enumerate(st.session_state.product_entries):
                                if not entry.get('batch_number'):
                                    st.error(f"Batch Number for Product {index + 1} is required")
                                    return
                        
                        if not received_by or not department_manager:
                            st.error("Received By and Department Manager are required")
                            return
                        
                        if invoice_number and not invoice_date:
                            st.error("Invoice date is required when invoice number is provided")
                            return
                        
                        if not validate_checks():
                            return
                        
                        # Determine quality status based on all checks
                        all_checks_passed = True
                        
                        # Check temperature status if required
                        if 'receive_form_temperature_required' in st.session_state and st.session_state.receive_form_temperature_required and temp_status != "PASSED":
                            all_checks_passed = False
                        
                        # Check all other quality checks
                        for check in check_results:
                            if check['status'] != "PASSED":
                                all_checks_passed = False
                                break
                        
                        # Create a dictionary with the product data for each selected product
                        product_data_list = []
                        for index, selected_product in enumerate(selected_products_details):
                            product_data = {
                                'product_code': selected_product,
                                'supplier_code': supplier_code,
                                'batch_number': st.session_state.product_entries[index]['batch_number'],
                                'quantity': st.session_state.product_entries[index]['quantity'],
                                'unit': st.session_state.product_entries[index]['unit'],
                                'storage_location': storage_location,
                                'received_by': received_by,
                                'received_date': datetime.combine(received_date, received_time),
                                'expiry_date': st.session_state.product_entries[index]['expiry_date'],
                                'best_before_date': st.session_state.product_entries[index]['best_before_date'],
                                'temperature_required': 'receive_form_temperature_required' in st.session_state and st.session_state.receive_form_temperature_required,
                                'temperature_received': temperature_received if 'receive_form_temperature_required' in st.session_state and st.session_state.receive_form_temperature_required else None,
                                'department_manager': department_manager,
                                'quality_status': 'PASSED' if all_checks_passed else 'FAILED',
                                'notes': notes,
                                'supplier_invoice_number': invoice_number if invoice_number else None,
                                'supplier_invoice_date': invoice_date if invoice_number else None,
                                'quality_checks': [],  # Initialize empty list for quality checks
                                'department': department
                            }
                            
                            # Append quality checks
                            for check in check_results:
                                product_data['quality_checks'].append({
                                    'check_id': check['check_id'],
                                    'tracking_id': selected_product.code + '_' + datetime.now().strftime('%Y%m%d%H%M%S') + '_' + uuid.uuid4().hex[:4],  # Generate tracking ID
                                    'status': check['status'],
                                    'notes': check['notes'],
                                    'checked_by': received_by  # Add checked_by field
                                })
                            
                            product_data_list.append(product_data)
                        
                        # Call the modified save function
                        save_received_products(product_data_list)
                        
                        # Set form reset trigger to true after successful submission
                        st.session_state.form_reset_trigger = True
            else:
                st.warning("No products found for selected supplier in this department")
        else:
            st.warning("No suppliers found for selected department")

def initialize_form_state():
    """Initialize the form state with default values."""
    if 'form_reset_trigger' not in st.session_state:
        st.session_state.form_reset_trigger = False
    
    # Only set default values if they don't exist or reset is triggered
    if st.session_state.form_reset_trigger:
        if 'receive_form_invoice_number' in st.session_state:
            del st.session_state.receive_form_invoice_number
        if 'receive_form_invoice_date' in st.session_state:
            del st.session_state.receive_form_invoice_date
        if 'receive_form_department_select' in st.session_state:
            del st.session_state.receive_form_department_select
        if 'receive_form_batch_number' in st.session_state:
            del st.session_state.receive_form_batch_number
        if 'receive_form_storage_location' in st.session_state:
            del st.session_state.receive_form_storage_location
        if 'receive_form_notes' in st.session_state:
            del st.session_state.receive_form_notes
        if 'receive_form_temperature' in st.session_state:
            del st.session_state.receive_form_temperature
        if 'receive_form_expiry_date' in st.session_state:
            del st.session_state.receive_form_expiry_date
        if 'receive_form_best_before_date' in st.session_state:
            del st.session_state.receive_form_best_before_date
        if 'receive_form_quantity' in st.session_state:
            del st.session_state.receive_form_quantity
        if 'receive_form_unit' in st.session_state:
            del st.session_state.receive_form_unit
        if 'receive_form_supplier_select' in st.session_state:
            del st.session_state.receive_form_supplier_select
        if 'receive_form_product_select' in st.session_state:
            del st.session_state.receive_form_product_select
        if 'receive_form_received_by' in st.session_state:
            del st.session_state.receive_form_received_by
        if 'receive_form_department_manager' in st.session_state:
            del st.session_state.receive_form_department_manager
        if 'receive_form_quality_checks' in st.session_state:
            del st.session_state.receive_form_quality_checks
        
        # Reset the trigger
        st.session_state.form_reset_trigger = False

def reset_form_state():
    # Clear session state variables related to the form
    keys_to_clear = [
        'receive_form_invoice_number',
        'receive_form_invoice_date',
        'receive_form_department_select',
        'receive_form_supplier',
        'receive_form_products',
        'product_entries',
        'receive_form_temperature_required',
        'receive_form_temperature',
        'receive_form_temperature_status',
        'receive_form_temp_notes',
        'receive_form_batch_number',
        'receive_form_storage_location',
        'receive_form_received_by',
        'receive_form_department_manager',
        'receive_form_notes'
    ]
    
    for key in keys_to_clear:
        if key in st.session_state:
            del st.session_state[key]

def receive_product_page():
    """Display the receive product page."""
    st.title("Receive Products")
    
    # Initialize form state
    initialize_form_state()
    
    # Display success message if product was received
    if 'receive_success' in st.session_state and st.session_state.receive_success:
        success_data = st.session_state.receive_success
        st.success(f"Product {success_data['product_name']} received successfully with tracking ID: {success_data['tracking_id']}")
        # Clear success message after displaying
        st.session_state.receive_success = None
        # Trigger form reset on successful submission
        st.session_state.form_reset_trigger = True
        # Rerun to apply the reset
        st.rerun()
    
    render_receive_product_form()

if __name__ == "__main__":
    st.set_page_config(page_title="Receive Product", layout="wide")
    st.title("Product Receiving")
    
    receive_product_page()
