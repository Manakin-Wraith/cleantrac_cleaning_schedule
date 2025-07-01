import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { DataGrid } from '@mui/x-data-grid';
import { Box, TextField, Stack } from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import { fetchReceivingRecords } from '../../services/receivingService';

const defaultPageSize = 25;

function ReceivingTableGrid({ pageSize = defaultPageSize, pollInterval = 30000, staticRows = null }) {
  const theme = useTheme();
  const [rows, setRows] = useState(staticRows || []);
  const [rowCount, setRowCount] = useState(staticRows ? staticRows.length : 0);
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
      const mapped = dataList.map((r) => ({ id: r.id || r.tracking_id || r.inventory_id, ...r }));
      setRows(mapped);
      setRowCount(total);
    } catch (err) {
      console.error('Error loading receiving records', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortModel, search]);

  // Fetch only when not using static rows
  useEffect(() => {
    if (!staticRows) {
      load();
    } else {
      // ensure counts stay in sync if staticRows prop changes
      setRows(staticRows);
      setRowCount(staticRows.length);
    }
  }, [load, staticRows]);

  // ----------------------- Polling -----------------------
  // Poll only when not using static rows
  useEffect(() => {
    if (staticRows) return undefined;
    const id = setInterval(load, pollInterval);
    return () => clearInterval(id);
  }, [load, pollInterval, staticRows]);

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
    { field: 'storage_location', headerName: 'Department', flex: 1.2 },
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
    {
      field: 'expiry_date',
      headerName: 'Expiry / Best-before',
      flex: 1.4,

      renderCell: (params) => {
        const raw = params.row?.expiry_date || params.row?.best_before_date || params.row?.sell_by_date;
        if (!raw) return '-';
        const dateObj = dayjs.utc(raw);
        if (!dateObj.isValid()) return raw;
        const days = dateObj.diff(dayjs().utc().startOf('day'), 'day');
        const color = days <= 3 ? theme.palette.error.main : days <= 7 ? theme.palette.warning.dark : undefined;
        const formatted = dateObj.format('DD MMM YYYY');
        return (
          <span title={`${formatted} (${days}d)`} style={{ color, fontWeight: 500 }}>
            {formatted}
          </span>
        );
      },
      sortComparator: (v1, v2, param1, param2) => {
        const d1 = dayjs.utc(param1.row?.expiry_date || param1.row?.best_before_date || param1.row?.sell_by_date);
        const d2 = dayjs.utc(param2.row?.expiry_date || param2.row?.best_before_date || param2.row?.sell_by_date);
        if (!d1.isValid() && !d2.isValid()) return 0;
        if (!d1.isValid()) return 1;
        if (!d2.isValid()) return -1;
        return d1.diff(d2);
      },
    },
    { field: 'status', headerName: 'Status', flex: 1 },
  ];

  return (
    <Box sx={{ height: 600, width: '100%', overflowX: 'auto', pb: 4 }}>
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
        autoHeight={false}
        sx={{
          minWidth: 800,
          fontSize: 13,
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: 'rgba(255,255,255,0.6)',
            fontWeight: 600,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
          },
          '& .MuiDataGrid-columnSeparator': { display: 'none' },
          '& .MuiDataGrid-row': {
            '&:nth-of-type(odd)': {
              bgcolor: 'rgba(255,255,255,0.04)',
            },
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)',
            },
          },
          '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(255,255,255,0.08)' },
          '& .MuiDataGrid-footerContainer': {
            bgcolor: 'rgba(255,255,255,0.75)',
            color: 'text.primary',
            borderTop: 'none',
            borderBottomLeftRadius: 6,
            borderBottomRightRadius: 6,
          },
          '& .MuiTablePagination-root, & .MuiTablePagination-displayedRows, & .MuiTablePagination-selectLabel': {
            color: 'text.primary',
          },
          '& .Mui-disabled svg': { color: 'grey.500' },
        }}
        rows={rows}
        columns={columns}
        pagination
        pageSizeOptions={[10, 25, 50, 100]}
        pageSize={pageSize}
        paginationMode={staticRows ? 'client' : 'server'}
        rowCount={rowCount}
        onPaginationModelChange={(model) => setPage(model.page)}
        sortingMode={staticRows ? 'client' : 'server'}
        sortModel={sortModel}
        onSortModelChange={(m) => setSortModel(m)}
        loading={loading}
        disableColumnMenu

      />
    </Box>
  );
}



ReceivingTableGrid.propTypes = {
  pageSize: PropTypes.number,
  pollInterval: PropTypes.number,
  staticRows: PropTypes.array,
};

export default ReceivingTableGrid;
