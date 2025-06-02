# Suppliers CRUD Implementation Checklist

## Backend Implementation
- [x] Create Supplier model in core/models.py
  - [x] Add supplier_code field (unique per department)
  - [x] Add supplier_name field
  - [x] Add contact_info field
  - [x] Add address field
  - [x] Add country_of_origin field (default "South Africa")
  - [x] Add department ForeignKey
  - [x] Add created_at and updated_at timestamps
  - [x] Add unique_together constraint for supplier_code and department

- [x] Create SupplierSerializer in core/serializers.py
  - [x] Include all Supplier model fields
  - [x] Add department_id as write-only field
  - [x] Add department_name as read-only field

- [x] Create SupplierViewSet in core/views.py
  - [x] Use IsManagerForWriteOrAuthenticatedReadOnly permission
  - [x] Filter queryset by department for non-superusers
  - [x] Auto-assign department from user's profile if not provided

- [x] Register API endpoints in core/urls.py
  - [x] Register SupplierViewSet with router

## Frontend Implementation
- [x] Create SuppliersList component
  - [x] Display suppliers in a table
  - [x] Add search functionality
  - [x] Add pagination
  - [x] Show edit/delete buttons for managers

- [x] Create SupplierFormModal component
  - [x] Form for adding/editing suppliers
  - [x] Validation for required fields
  - [x] Auto-populate department from user's profile
  - [x] Default country_of_origin to "South Africa"

- [x] Create SupplierManagementPage component
  - [x] Integrate SuppliersList and SupplierFormModal
  - [x] Implement CRUD operations with API calls
  - [x] Add error handling

- [x] Update Sidebar component
  - [x] Add Suppliers link to Management section
  - [x] Use LocalShippingIcon for the menu item

- [x] Update App.jsx
  - [x] Add route for SupplierManagementPage

## Testing
- [ ] Test backend API endpoints
  - [ ] Test GET /suppliers/ (list)
  - [ ] Test POST /suppliers/ (create)
  - [ ] Test GET /suppliers/{id}/ (retrieve)
  - [ ] Test PUT /suppliers/{id}/ (update)
  - [ ] Test DELETE /suppliers/{id}/ (delete)

- [ ] Test frontend components
  - [ ] Test SuppliersList rendering and filtering
  - [ ] Test SupplierFormModal validation
  - [ ] Test adding a new supplier
  - [ ] Test editing an existing supplier
  - [ ] Test deleting a supplier

## Deployment
- [ ] Run migrations
- [ ] Test in development environment
- [ ] Deploy to production

## Documentation
- [ ] Add API documentation for supplier endpoints
- [ ] Update user manual with supplier management instructions
