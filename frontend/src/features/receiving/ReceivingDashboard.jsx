import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  Box,
  Grid,
  Paper,
  Tabs,
  Tab,
  Typography,
  Skeleton,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';

import { fetchReceivingRecords } from '../../services/receivingService';
import ReceivingTableGrid from './ReceivingTableGrid';

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

function a11yProps(index) {
  return {
    id: `rcv-tab-${index}`,
    'aria-controls': `rcv-tabpanel-${index}`,
  };
}

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rcv-tabpanel-${index}`}
      aria-labelledby={`rcv-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

export default function ReceivingDashboard({ pollInterval = 30000, accentColor }) {
  const theme = useTheme();
  const accent = accentColor || theme.palette.primary.main;
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [expiringRows, setExpiringRows] = useState([]);
  const [tab, setTab] = useState(0);

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

  const tabSx = {
    color: theme.palette.common.black,
    '&.Mui-selected': {
      color: theme.palette.common.white,
    },
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* KPI Grid */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <KPI
            title="Today's Deliveries"
            value={todaysDeliveries}
            loading={loading}
            accent={accent}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPI
            title="Expiring Soon (≤7 days)"
            value={expiringSoon}
            loading={loading}
            accent={accent}
            onClick={()=>setTab(1)}
          />
        </Grid>
        {/* Add empty grid items to keep layout pleasant */}
      </Grid>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mt: 3 }}
        textColor="inherit"
        indicatorColor="primary"
      >
        <Tab label={`All Deliveries (${rows.length})`} sx={tabSx} {...a11yProps(0)} />
        <Tab label={`Expiring Soon (${expiringRows.length})`} sx={tabSx} {...a11yProps(1)} />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <ReceivingTableGrid pollInterval={pollInterval} />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <ReceivingTableGrid staticRows={expiringRows} />
      </TabPanel>
    </Box>
  );
}

ReceivingDashboard.propTypes = {
  pollInterval: PropTypes.number,
  accentColor: PropTypes.string,
};
