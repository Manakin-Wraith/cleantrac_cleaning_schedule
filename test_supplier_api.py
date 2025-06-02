import requests
import json
import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleantrac_project.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Department, Supplier

# API endpoint
API_URL = 'http://localhost:8001/api'

# Get auth token (replace with your credentials)
def get_auth_token():
    response = requests.post(f'{API_URL}/token-auth/', json={
        'username': 'admin',  # replace with your admin username
        'password': 'admin'   # replace with your admin password
    })
    
    if response.status_code == 200:
        return response.json()['token']
    else:
        print(f"Authentication failed: {response.status_code}")
        print(response.text)
        sys.exit(1)

# Test creating a supplier
def test_create_supplier(token):
    # Get the first department from the database
    department = Department.objects.first()
    if not department:
        print("No departments found in the database")
        sys.exit(1)
    
    print(f"Using department: {department.name} (ID: {department.id})")
    
    # Create test data
    test_supplier = {
        'supplier_code': f'TEST-{department.id}',
        'supplier_name': 'Test Supplier',
        'contact_info': 'test@example.com',
        'address': '123 Test Street',
        'country_of_origin': 'South Africa',
        'department_id': department.id
    }
    
    # Print the request payload
    print("\nSending request with payload:")
    print(json.dumps(test_supplier, indent=2))
    
    # Send the request
    headers = {
        'Authorization': f'Token {token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(f'{API_URL}/suppliers/', 
                            json=test_supplier,
                            headers=headers)
    
    # Print the response
    print(f"\nResponse status code: {response.status_code}")
    
    try:
        print("Response content:")
        print(json.dumps(response.json(), indent=2))
    except:
        print("Raw response content:")
        print(response.text)
    
    return response.status_code == 201

if __name__ == "__main__":
    token = get_auth_token()
    print(f"Authentication successful, token: {token[:10]}...")
    
    success = test_create_supplier(token)
    
    if success:
        print("\nSupplier created successfully!")
    else:
        print("\nFailed to create supplier!")
