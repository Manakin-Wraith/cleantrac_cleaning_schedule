# Multi-Department Supplier Integration Checklist

## Backend Tasks
- [x] Update Supplier model to use ManyToManyField for departments
- [x] Update SupplierSerializer to handle multiple departments
- [x] Update SupplierViewSet to filter by multiple departments
- [x] Create import_suppliers management command for JSON import
- [x] Update Django admin configuration for Supplier model
- [x] Run database migrations to apply model changes
- [x] Run JSON import command to populate suppliers with departments
- [x] Fix permission class to handle ManyToManyField departments

## Frontend Tasks
- [x] Update SupplierFormModal to support multi-department selection
- [x] Update SuppliersList to display multiple departments per supplier
- [x] Update SupplierManagementPage to handle multi-department data

## Testing Tasks
- [ ] Test supplier creation with multiple departments
- [ ] Test supplier updates with department changes
- [ ] Test supplier filtering by department
- [x] Test JSON import with multi-department assignments
- [ ] Verify UI correctly displays multiple departments

## Documentation Tasks
- [ ] Update API documentation for multi-department endpoints
- [ ] Document the JSON import format for suppliers
- [ ] Document the UI changes for department selection
