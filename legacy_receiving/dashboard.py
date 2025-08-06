"""
SPATRAC - Product Traceability Dashboard
Main application entry point.
"""
import streamlit as st
import pandas as pd
import logging
from data_access.database import load_data, execute_query
import os

# Feature flag to control which parts of the UI are exposed.
# In production (ECS) we will set SPATRAC_FEATURE_SET=minimal so that
# only Deliveries & Receiving are visible. Locally it defaults to "full".
FEATURE_SET = os.getenv("SPATRAC_FEATURE_SET", "full").lower()
MINIMAL_ALLOWED_PAGES = {
    "Overview",
    "Deliveries",
    "Receiving",
    "Receive Product",
    "Receive Products",
}

# Configure the page settings first, before any other imports
st.set_page_config(
    page_title="SPATRAC",
    page_icon="/Users/thecasterymedia/Desktop/PORTFOLIO/SaaS/SPATRAC_FINAL/box_icon.png",
    layout="wide"
)

# Import application settings and components
from config.settings import (
    APP_NAME, APP_TITLE, APP_ICON, APP_LAYOUT, 
    PAGES, NAVIGATION, LEGACY_PAGE_MAPPING
)
from components.overview import render as render_overview
from components.inventory_management import render as render_inventory_management
from components.products import render as render_products
from components.recipes import render as render_recipes
from components.recipe_production import render as render_recipe_production
from components.recipe_sales_report import render as render_recipe_sales_report
from components.suppliers import render as render_suppliers
from components.deliveries import render as render_deliveries
from components.traceability import render as render_traceability
from components.edit_delivery import render as render_edit_delivery
from components.sales_analytics import render as render_sales_analytics
from components.reports import render as render_reports
from components.ingredient_product_traceability import render as render_ingredient_product_traceability
from components.chain_of_custody_report import render as render_chain_of_custody_report

# Legacy imports for backward compatibility
from components.inventoryui import render as render_current_inventory
from components.expired_products_ui import render as render_expired_products
from components.waste_analysis import render as render_waste_analysis
from components.sales_reporting import render as render_sales_analysis

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def check_recipe_data():
    """Check if recipe data exists in the database."""
    query = "SELECT COUNT(*) as count FROM recipes"
    result = load_data(query)
    recipe_count = result['count'].iloc[0] if not result.empty else 0
    
    if recipe_count == 0:
        logger.warning("No recipe data found in the database. Some features like sales impact analysis may not work correctly.")
        return False
    else:
        logger.info(f"Found {recipe_count} recipes in the database.")
        return True

def main():
    """Main function to render the dashboard."""
    # Initialize session state for navigation
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'Overview'
    
    # Set title
    st.title(APP_TITLE)
    
    # Check for recipe data
    has_recipes = check_recipe_data()

    # Determine which pages should be available based on feature flag
    allowed_pages = None if FEATURE_SET == "full" else MINIMAL_ALLOWED_PAGES
    if not has_recipes:
        st.warning("⚠️ No recipe data found in the database. Some features like sales impact analysis may not work correctly. Please run the recipe import script.")
    
    # Set up the sidebar
    with st.sidebar:
        st.title(f"{APP_ICON} {APP_NAME}")
        st.write("Product Traceability System")
        st.write("---")
        
        # Render navigation menu
        for category, details in NAVIGATION.items():
            icon = details.get('icon', 'arrow-right')
            st.write(f"### :{icon}: {category}")
            
            for page in details['pages']:
                # Skip pages that are not allowed in minimal mode
                if allowed_pages is not None and page not in allowed_pages:
                    continue
                if st.button(page, key=f"nav_{page}", use_container_width=True):
                    st.session_state.current_page = page
            
            st.write("")
    
    # Render the selected page
    current_page = st.session_state.current_page
    
    # Handle legacy page names
    if current_page in LEGACY_PAGE_MAPPING:
        current_page = LEGACY_PAGE_MAPPING[current_page]
    
    # Render the appropriate page
    if current_page == 'Overview':
        render_overview()
    elif current_page == 'Inventory Management':
        render_inventory_management()
    elif current_page == 'Products':
        render_products()
    elif current_page == 'Recipes & Ingredients':
        render_recipes()
    elif current_page == 'Recipe Production':
        render_recipe_production()
    elif current_page == 'Recipe Sales Report':
        render_recipe_sales_report()
    elif current_page == 'Suppliers':
        render_suppliers()
    elif current_page == 'Deliveries':
        render_deliveries()
    elif current_page == 'Traceability':
        render_traceability()
    elif current_page == 'Edit Delivery':
        render_edit_delivery()
    elif current_page == 'Sales Analytics':
        render_sales_analytics()
    elif current_page == 'Reports':
        render_reports()
    elif current_page == 'Ingredient-Product Traceability':
        render_ingredient_product_traceability()
    elif current_page == 'Chain of Custody Report':
        render_chain_of_custody_report()
    # Legacy pages
    elif current_page == 'Current Inventory':
        render_current_inventory()
    elif current_page == 'Expired Products':
        render_expired_products()
    elif current_page == 'Waste Analysis':
        render_waste_analysis()
    elif current_page == 'Sales Analysis':
        render_sales_analysis()
    else:
        st.error(f"Page '{current_page}' not found.")

if __name__ == "__main__":
    main()
