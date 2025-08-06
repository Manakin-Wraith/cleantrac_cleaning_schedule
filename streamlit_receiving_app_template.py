
import streamlit as st
import requests
import pandas as pd
from urllib.parse import urlparse

def detect_tenant_from_url():
    """
    Detect tenant from the current URL subdomain.
    Expected format: [tenant].receiving.cleentrac.com
    """
    try:
        # In production, this would use st.experimental_get_query_params()
        # or detect from the actual URL
        current_url = st.experimental_get_query_params().get('tenant', ['test'])[0]
        
        if '.receiving.cleentrac.com' in current_url:
            tenant_slug = current_url.split('.receiving.cleentrac.com')[0]
        else:
            # Fallback for development
            tenant_slug = current_url
            
        return tenant_slug
    except:
        return 'test'  # Default tenant for development

def get_tenant_api_base():
    """
    Get the API base URL for the current tenant.
    """
    tenant_slug = detect_tenant_from_url()
    # In production, this would route to the correct tenant schema
    return f"http://127.0.0.1:8000/api/"

def main():
    st.title("🚚 CleanTrac Receiving Dashboard")
    
    # Detect current tenant
    tenant_slug = detect_tenant_from_url()
    st.sidebar.info(f"Current Tenant: {tenant_slug}")
    
    # Tenant-specific receiving interface
    st.header("📦 Receive New Products")
    
    with st.form("receiving_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            product_code = st.text_input("Product Code")
            batch_number = st.text_input("Batch Number")
            supplier_code = st.text_input("Supplier Code")
        
        with col2:
            quantity = st.number_input("Quantity", min_value=0.0)
            unit = st.text_input("Unit")
            expiry_date = st.date_input("Expiry Date")
        
        submitted = st.form_submit_button("Record Receiving")
        
        if submitted:
            # This would save to the tenant-specific schema
            st.success(f"✅ Recorded receiving for tenant: {tenant_slug}")
            st.json({
                "tenant": tenant_slug,
                "product_code": product_code,
                "batch_number": batch_number,
                "quantity": quantity,
                "unit": unit
            })
    
    # Display tenant-specific receiving records
    st.header("📋 Recent Receiving Records")
    
    try:
        # This would query the tenant-specific API endpoint
        api_base = get_tenant_api_base()
        # records = requests.get(f"{api_base}/receiving-records/").json()
        
        # For demo, show sample data
        sample_data = pd.DataFrame([
            {"Product": f"{tenant_slug}_BREAD_001", "Quantity": "50 loaves", "Date": "2025-08-04"},
            {"Product": f"{tenant_slug}_MEAT_001", "Quantity": "25.5 kg", "Date": "2025-08-04"}
        ])
        
        st.dataframe(sample_data)
        
    except Exception as e:
        st.error(f"Error loading receiving records: {e}")

if __name__ == "__main__":
    main()
