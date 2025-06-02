import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import PageLayout from '../components/PageLayout';
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
      console.log('Supplier data type check:', {
        supplier_code: typeof supplierData.supplier_code,
        supplier_name: typeof supplierData.supplier_name,
        department_id: typeof supplierData.department_id,
        value: supplierData.department_id
      });
      
      // Ensure department_id is a number
      if (typeof supplierData.department_id === 'string' && supplierData.department_id.trim() !== '') {
        supplierData.department_id = parseInt(supplierData.department_id, 10);
      }
      
      let response;
      if (currentSupplier) {
        // Update existing supplier
        console.log(`Updating supplier ${currentSupplier.id} with data:`, supplierData);
        response = await api.put(`/suppliers/${currentSupplier.id}/`, supplierData);
        console.log('Update response:', response.data);
      } else {
        // Create new supplier
        console.log('Creating new supplier with data:', supplierData);
        response = await api.post('/suppliers/', supplierData);
        console.log('Create response:', response.data);
      }
      fetchSuppliers();
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

  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await api.delete(`/suppliers/${supplierId}/`);
        fetchSuppliers();
      } catch (err) {
        console.error('Error deleting supplier:', err);
        setError('Failed to delete supplier. Please try again later.');
      }
    }
  };

  return (
    <PageLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Supplier Management
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
          onDelete={handleDeleteSupplier}
        />

        <SupplierFormModal 
          open={openModal} 
          onClose={handleCloseModal} 
          onSave={handleSaveSupplier} 
          supplier={currentSupplier}
        />
      </Box>
    </PageLayout>
  );
};

export default SupplierManagementPage;
