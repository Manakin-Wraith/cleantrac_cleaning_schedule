import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Container, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import SuppliersList from '../components/suppliers/SuppliersList';
import SupplierFormModal from '../components/suppliers/SupplierFormModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SupplierManagementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { currentUser } = useAuth();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/suppliers/');
      setSuppliers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to load suppliers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddSupplier = () => {
    setCurrentSupplier(null);
    setOpenModal(true);
  };

  const handleEditSupplier = (supplier) => {
    setCurrentSupplier(supplier);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentSupplier(null);
  };

  const handleSaveSupplier = async (supplierData) => {
    try {
      console.log('Sending supplier data:', supplierData);
      
      // Ensure department_ids are numbers
      if (supplierData.department_ids && Array.isArray(supplierData.department_ids)) {
        supplierData.department_ids = supplierData.department_ids.map(id => 
          typeof id === 'string' ? parseInt(id, 10) : id
        );
      }
      
      let response;
      if (currentSupplier) {
        // Update existing supplier
        console.log(`Updating supplier ${currentSupplier.id} with data:`, supplierData);
        response = await api.put(`/suppliers/${currentSupplier.id}/`, supplierData);
        console.log('Update response:', response.data);
        
        // Update the supplier in the local state
        setSuppliers(suppliers.map(s => s.id === currentSupplier.id ? response.data : s));
      } else {
        // Create new supplier
        console.log('Creating new supplier with data:', supplierData);
        response = await api.post('/suppliers/', supplierData);
        console.log('Create response:', response.data);
        
        // Add the new supplier to the local state
        setSuppliers([...suppliers, response.data]);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving supplier:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error headers:', err.response?.headers);
      
      // Log the request that was sent
      console.error('Request config:', err.config);
      
      // Throw the error to be caught by the form modal
      throw err;
    }
  };

  const handleRequestDelete = (supplierId) => {
    setDeleteTarget(supplierId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/suppliers/${deleteTarget}/`);
      setDeleteTarget(null);
      fetchSuppliers();
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setError('Failed to delete supplier. Please try again later.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {currentUser?.profile?.department_name ? `${currentUser.profile.department_name} - ` : ''}Supplier Management
        </Typography>
        {(currentUser?.is_superuser || currentUser?.profile?.role === 'manager') && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAddSupplier}
          >
            Add New Supplier
          </Button>
        )}
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}

      <SuppliersList 
        suppliers={suppliers} 
        loading={loading} 
        onEdit={handleEditSupplier} 
        onDelete={handleRequestDelete}
      />

      <SupplierFormModal 
        open={openModal} 
        onClose={handleCloseModal} 
        onSave={handleSaveSupplier} 
        supplier={currentSupplier}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this supplier?
        </DialogContent>
        <DialogActions sx={{ pr: 3, pb: 2 }}>
          <Button onClick={handleCancelDelete} disabled={deleteLoading}>Cancel</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained" 
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SupplierManagementPage;
