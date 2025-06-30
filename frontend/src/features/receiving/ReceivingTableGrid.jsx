import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { DataGrid } from '@mui/x-data-grid';
import { Box, TextField, Stack } from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import { fetchReceivingRecords } from '../../services/receivingService';

const defaultPageSize = 25;

function ReceivingTableGrid({ pageSize = defaultPageSize, pollInterval = 30000 }) {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0); // DataGrid is 0-based
  const [loading, setLoading] = useState(false);
  const [sortModel, setSortModel] = useState([{
    field: 'received_date', sort: 'desc',
  }]);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1, // backend is 1-based
        page_size: pageSize,
        ordering: sortModel.length ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : undefined,
        search: search || undefined,
      };
      const resp = await fetchReceivingRecords(params);
      const dataList = Array.isArray(resp) ? resp : resp.results || [];
      const total = Array.isArray(resp) ? resp.length : resp.count || dataList.length;
      const mapped = dataList.map((r) => ({ id: r.inventory_id, ...r }));
      setRows(mapped);
      setRowCount(total);
    } catch (err) {
      console.error('Error loading receiving records', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortModel, search]);

  useEffect(() => {
    load();
  }, [load]);

  // ----------------------- Polling -----------------------
  useEffect(() => {
    const id = setInterval(() => {
      // always reload current page
      load();
    }, pollInterval);
    return () => clearInterval(id);
  }, [load, pollInterval]);

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const debouncedSearch = useCallback((val) => {
    clearTimeout(window.__rcvDebounce);
    window.__rcvDebounce = setTimeout(() => {
      setPage(0);
      setSearch(val);
    }, 500);
  }, []);

  const columns = [
    { field: 'product_code', headerName: 'Product Code', flex: 1, minWidth: 120 },
    { field: 'product_name', headerName: 'Product Name', flex: 2, minWidth: 160 },
    { field: 'batch_number', headerName: 'Batch', flex: 1 },
    { field: 'quantity_remaining', headerName: 'Qty', type: 'number', width: 90 },
    { field: 'unit', headerName: 'Unit', width: 80 },
    { field: 'supplier_code', headerName: 'Supplier', flex: 1 },
    { field: 'department_name', headerName: 'Department', flex: 1.2 },
    { field: 'received_date', headerName: 'Received Date', flex: 1.4,
       renderCell: (params) => {
         const raw = params.row?.received_date;
         if (!raw) return '-';
         const formatted = dayjs.utc(raw).format('DD MMM YYYY');
         if (formatted === 'Invalid Date') {
           console.warn('Invalid received_date:', raw);
           return '-';
         }
         return formatted;
       } },
    { field: 'status', headerName: 'Status', flex: 1 },
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
        <TextField
          size="small"
          label="Search"
          placeholder="Product code or name"
          onChange={handleSearchChange}
          sx={{ width: 300 }}
        />
      </Stack>
      <DataGrid
        rows={rows}
        columns={columns}
        pagination
        pageSizeOptions={[10, 25, 50, 100]}
        pageSize={pageSize}
        paginationMode="server"
        rowCount={rowCount}
        onPaginationModelChange={(model) => setPage(model.page)}
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={(m) => setSortModel(m)}
        loading={loading}
        disableColumnMenu
        sx={{ '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.100' } }}
      />
    </Box>
  );
}

ReceivingTableGrid.propTypes = {
  pageSize: PropTypes.number,
  /** Polling interval in milliseconds (default 30000) */
  pollInterval: PropTypes.number,
};

export default ReceivingTableGrid;
