"""
Database utility functions.
"""
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config.settings import DATABASE_URL

# Create database engine
engine = create_engine(DATABASE_URL)

# Create a session factory
Session = sessionmaker(bind=engine)

# Create a session instance
db_session = Session()

def load_data(query, params=None):
    """Load data from database using the provided query."""
    try:
        if params is not None:
            # Handle list of parameters for positional binding
            if isinstance(params, list):
                # Check if this is an IN clause with %s placeholders
                if '%s' in query and 'IN (' in query.upper():
                    # For IN clauses, we need to expand the placeholders
                    placeholders = ', '.join([f':param{i}' for i in range(len(params))])
                    # Replace the first occurrence of (%s) or (%s, %s, ...) with our named parameters
                    start_idx = query.find('IN (')
                    if start_idx != -1:
                        # Find the closing parenthesis
                        start_idx += 3  # Move past 'IN ('
                        end_idx = query.find(')', start_idx)
                        if end_idx != -1:
                            # Replace the content between parentheses
                            modified_query = query[:start_idx+1] + placeholders + query[end_idx:]
                        else:
                            # Fallback if we can't find the closing parenthesis
                            modified_query = query.replace('%s', ':param')
                    else:
                        # Fallback if we can't find 'IN ('
                        modified_query = query.replace('%s', ':param')
                else:
                    # Standard replacement for non-IN queries
                    modified_query = query.replace('%s', ':param')
                
                # Create a dictionary of parameters
                param_dict = {f'param{i}': val for i, val in enumerate(params)}
                with engine.connect() as conn:
                    return pd.read_sql_query(text(modified_query), conn, params=param_dict)
            # Handle dictionary of parameters
            elif isinstance(params, dict):
                # Convert psycopg2 style parameters to SQLAlchemy style
                modified_query = query.replace('%(', ':').replace(')s', '')
                with engine.connect() as conn:
                    return pd.read_sql_query(text(modified_query), conn, params=params)
        with engine.connect() as conn:
            return pd.read_sql_query(text(query), conn)
    except Exception as e:
        print(f"Database error: {e}")
        return pd.DataFrame()

def execute_query(query, params=None):
    """Execute a database query without returning results."""
    with engine.begin() as conn:
        if params:
            # Handle list of parameters for positional binding
            if isinstance(params, list):
                # For positional parameters, directly replace %s with named parameters
                modified_query = query
                param_dict = {}
                
                for i, param in enumerate(params):
                    param_name = f"param{i}"
                    # Replace only the first occurrence of %s
                    modified_query = modified_query.replace('%s', f":{param_name}", 1)
                    param_dict[param_name] = param
                
                result = conn.execute(text(modified_query), param_dict)
                if result.returns_rows:
                    return result.fetchall()  # Return results for SELECT queries
            # Handle dictionary of parameters
            elif isinstance(params, dict):
                # Convert psycopg2 style parameters to SQLAlchemy style
                modified_query = query.replace('%(', ':').replace(')s', '')
                result = conn.execute(text(modified_query), params)
                if result.returns_rows:
                    return result.fetchall()  # Return results for SELECT queries
            else:
                raise ValueError("Parameters must be a list or dictionary")
        else:
            result = conn.execute(text(query))
            if result.returns_rows:
                return result.fetchall()  # Return results for SELECT queries

def save_received_product(data):
    """Save received product data to database."""
    # Validate invoice number if provided
    if data.get('supplier_invoice_number'):
        if not isinstance(data['supplier_invoice_number'], str) or len(data['supplier_invoice_number'].strip()) == 0:
            raise ValueError("Invalid supplier invoice number")
        
        # Standardize invoice number format
        data['supplier_invoice_number'] = data['supplier_invoice_number'].strip().upper()
        
        # Validate invoice date
        if not data.get('supplier_invoice_date'):
            raise ValueError("Supplier invoice date is required when invoice number is provided")
        
        # Validate invoice date is not in future
        if data['supplier_invoice_date'] > pd.Timestamp.now().date():
            raise ValueError("Supplier invoice date cannot be in the future")
            
        # Check for duplicate invoice
        if not validate_supplier_invoice(data['supplier_code'], data['supplier_invoice_number']):
            raise ValueError(f"Invoice number {data['supplier_invoice_number']} already exists for this supplier")
    
    # Extract quality checks and create a copy of data without them
    quality_checks = data.pop('quality_checks', [])
    
    # Start transaction
    with db_session.begin():
        # Insert received product
        product_query = """
            INSERT INTO received_products (
                tracking_id,
                product_code,
                supplier_code,
                batch_number,
                quantity,
                unit,
                storage_location,
                received_by,
                received_date,
                expiry_date,
                best_before_date,
                temperature_required,
                temperature_received,
                department_manager,
                quality_status,
                notes,
                supplier_invoice_number,
                supplier_invoice_date
            ) VALUES (
                %(tracking_id)s,
                %(product_code)s,
                %(supplier_code)s,
                %(batch_number)s,
                %(quantity)s,
                %(unit)s,
                %(storage_location)s,
                %(received_by)s,
                %(received_date)s,
                %(expiry_date)s,
                %(best_before_date)s,
                %(temperature_required)s,
                %(temperature_received)s,
                %(department_manager)s,
                %(quality_status)s,
                %(notes)s,
                %(supplier_invoice_number)s,
                %(supplier_invoice_date)s
            )
        """
        # Convert psycopg2 style parameters to SQLAlchemy style
        product_query = product_query.replace('%(', ':').replace(')s', '')
        db_session.execute(text(product_query), data)
        
        # Insert quality checks
        if quality_checks:
            check_query = """
                INSERT INTO quality_checks (
                    check_id,
                    tracking_id,
                    status,
                    notes,
                    checked_by
                ) VALUES (
                    %(check_id)s,
                    %(tracking_id)s,
                    %(status)s,
                    %(notes)s,
                    %(checked_by)s
                )
            """
            # Convert psycopg2 style parameters to SQLAlchemy style
            check_query = check_query.replace('%(', ':').replace(')s', '')
            # Execute each quality check insert
            for check in quality_checks:
                db_session.execute(text(check_query), check)


def search_supplier_invoices(search_params: dict) -> pd.DataFrame:
    """
    Search for supplier invoices with multiple parameters.
    
    Args:
        search_params: Dictionary containing search parameters:
            - invoice_number: str (optional)
            - supplier_code: str (optional)
            - date_from: date (optional)
            - date_to: date (optional)
    """
    conditions = []
    params = {}
    
    query = """
        SELECT 
            rp.tracking_id,
            rp.supplier_invoice_number,
            rp.supplier_invoice_date,
            rp.received_date,
            rp.product_code,
            p.product_name,
            s.supplier_name,
            rp.quantity,
            rp.unit,
            rp.quality_status
        FROM received_products rp
        JOIN products p ON rp.product_code = p.product_code
        JOIN suppliers s ON rp.supplier_code = s.supplier_code
        WHERE 1=1
    """
    
    if search_params.get('invoice_number'):
        conditions.append("rp.supplier_invoice_number ILIKE %(invoice_number)s")
        params['invoice_number'] = f"%{search_params['invoice_number']}%"
    
    if search_params.get('supplier_code'):
        conditions.append("rp.supplier_code = %(supplier_code)s")
        params['supplier_code'] = search_params['supplier_code']
    
    if search_params.get('date_from'):
        conditions.append("rp.supplier_invoice_date >= %(date_from)s")
        params['date_from'] = search_params['date_from']
    
    if search_params.get('date_to'):
        conditions.append("rp.supplier_invoice_date <= %(date_to)s")
        params['date_to'] = search_params['date_to']
    
    if conditions:
        query += " AND " + " AND ".join(conditions)
    
    query += " ORDER BY rp.supplier_invoice_date DESC, rp.supplier_invoice_number"
    
    return load_data(query, params)

def validate_supplier_invoice(supplier_code: str, invoice_number: str) -> bool:
    """
    Validate if an invoice number is unique for a supplier.
    Returns True if valid, False if duplicate exists.
    """
    query = """
        SELECT COUNT(*) as count
        FROM received_products
        WHERE supplier_code = %s 
        AND supplier_invoice_number = %s
    """
    result = load_data(query, [supplier_code, invoice_number])
    return result.iloc[0]['count'] == 0    

def get_invoice_summary(invoice_number: str) -> dict:
    """
    Get summary information for a specific invoice.
    Returns total items, total quantity, and status information.
    """
    query = """
        SELECT 
            COUNT(DISTINCT product_code) as total_items,
            SUM(quantity) as total_quantity,
            STRING_AGG(DISTINCT quality_status, ', ') as status_summary,
            MIN(received_date) as received_date,
            supplier_invoice_date
        FROM received_products
        WHERE supplier_invoice_number = %s
        GROUP BY supplier_invoice_date
    """
    result = load_data(query, [invoice_number])
    if result.empty:
        raise ValueError(f"No records found for invoice number {invoice_number}")
    return result.to_dict('records')[0]

def get_products_by_invoice(invoice_number: str) -> pd.DataFrame:
    """Retrieve products by supplier invoice number."""
    query = """
        SELECT rp.*, p.product_name, s.supplier_name
        FROM received_products rp
        JOIN products p ON rp.product_code = p.product_code
        JOIN suppliers s ON rp.supplier_code = s.supplier_code
        WHERE rp.supplier_invoice_number = %s
        ORDER BY rp.received_date DESC
    """
    return load_data(query, [invoice_number])

def get_required_checks(department):
    """Get required quality checks for a department."""
    return load_data("""
        SELECT check_id, check_name, required
        FROM quality_check_types
        WHERE department = %s
        ORDER BY check_id
    """, [department])
