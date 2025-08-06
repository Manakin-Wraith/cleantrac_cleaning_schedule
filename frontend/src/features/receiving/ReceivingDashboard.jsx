import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Skeleton,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';

import { fetchReceivingRecords } from '../../services/receivingService';
import ReceivingTableGrid from './ReceivingTableGrid';
import { OptimizedTodaysDeliveriesCard, OptimizedExpiringSoonCard } from '../../components/OptimizedDashboardCards';

dayjs.extend(utc);

const AccentPaper = styled(Paper)(({ theme, accent }) => {
  const background = accent || theme.palette.primary.main;
  // Get the contrast text calculated by MUI
  const muiContrast = theme.palette.getContrastText(background);
  // Force white text if MUI chooses a dark text colour (black/rgba black) which
  // can be hard to read on certain accent colours like red.
  const textColor = muiContrast.startsWith('#000') || muiContrast.startsWith('rgba(0, 0, 0')
    ? theme.palette.common.white
    : muiContrast;

  return {
    padding: theme.spacing(2),
    color: textColor,
    backgroundColor: background,
    height: '100%',
  };
});

import { useRef } from 'react';

function KPI({ title, value, loading, accent, onClick }) {
  const prevValueRef = useRef(value);
  // Persist the last non-loading value so we can keep it during a refetch
  if (!loading) {
    prevValueRef.current = value;
  }
  const displayValue = loading ? prevValueRef.current : value;
  return (
    <AccentPaper
      elevation={3}
      accent={accent}
      sx={{
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        // Ensures the card keeps its height whether loading or not
        minHeight: 120,
        transition: 'opacity 0.3s ease-in-out',
      }}
      onClick={onClick}
    >
      {loading ? (
        // Overlay skeleton but keep previous value underneath to preserve size
        <>
          <Skeleton variant="rectangular" sx={{ position:'absolute', inset:0, width:'100%', height:'100%' }} />
          <Box sx={{ visibility:'hidden' }}>
            <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {displayValue}
            </Typography>
          </Box>
        </>
      ) : (
        <>
          
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ mt: 1 }}>
            {value}
          </Typography>
        </>
      )}
    </AccentPaper>
  );
}

KPI.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  loading: PropTypes.bool,
  accent: PropTypes.string,
  onClick: PropTypes.func,
};



export default function ReceivingDashboard({ pollInterval = 30000, accentColor }) {
  const theme = useTheme();
  const accent = accentColor || theme.palette.primary.main;
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [expiringRows, setExpiringRows] = useState([]);


  const load = useCallback(async () => {
    setLoading(true);
    try {
      // fetch all records for the department (backend already filters)
      const params = { page_size: 1000 };
      const resp = await fetchReceivingRecords(params);
      const dataList = Array.isArray(resp) ? resp : resp.results || [];
      setRows(dataList);
      // pre-compute expiring rows list (≤7 days)
      const today = dayjs().utc().startOf('day');
      setExpiringRows(dataList.filter((r)=>{
        const expiry=r.expiry_date?dayjs.utc(r.expiry_date):null;
        return expiry && expiry.isBefore(today.add(7,'day'));
      }));
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(load, pollInterval);
    return () => clearInterval(id);
  }, [load, pollInterval]);

  // KPI calculations
  const today = dayjs().utc().startOf('day');
  const todaysDeliveries = rows.filter((r) => {
    const received = r.received_date ? dayjs.utc(r.received_date) : null;
    return received && received.isAfter(today);
  }).length;

  const expiringSoon = rows.filter((r) => {
    const expiry = r.expiry_date ? dayjs.utc(r.expiry_date) : null;
    return expiry && expiry.isBefore(today.add(7, 'day'));
  }).length;



  return (
    <Box sx={{ width: '100%' }}>
      {/* Optimized KPI Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
            </Box>
          ) : (
            <OptimizedTodaysDeliveriesCard 
              deliveryMetrics={{
                todaysDeliveries: todaysDeliveries,
                totalDeliveries: rows.length
              }}
              onViewDetails={() => {
                // Scroll to table or provide visual feedback
                const tableElement = document.querySelector('[data-testid="receiving-table"]');
                if (tableElement) {
                  tableElement.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
            </Box>
          ) : (
            <OptimizedExpiringSoonCard 
              expiringMetrics={{
                expiringSoon: expiringSoon,
                daysThreshold: 7
              }}
              onViewDetails={() => {
                // Scroll to table and highlight expiring items
                const tableElement = document.querySelector('[data-testid="receiving-table"]');
                if (tableElement) {
                  tableElement.scrollIntoView({ behavior: 'smooth' });
                }
                // Future: Could filter table to show only expiring items
              }}
            />
          )}
        </Grid>
        {/* Empty grid item for balanced layout */}
        <Grid item xs={12} sm={12} md={4}>
          {/* Future: Additional KPI card can go here */}
        </Grid>
      </Grid>

      {/* Receiving Table - Simplified Single View */}
      <Box sx={{ mt: 4 }}>
        <ReceivingTableGrid 
          pollInterval={pollInterval}
        />
      </Box>
    </Box>
  );
}

ReceivingDashboard.propTypes = {
  pollInterval: PropTypes.number,
  accentColor: PropTypes.string,
};
