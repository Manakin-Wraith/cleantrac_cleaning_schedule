import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
import api from '../../services/api';

/**
 * ProductAutocomplete – Reusable autocomplete for selecting a Product by code / name.
 *
 * Props:
 *  - value: currently selected product object (or null)
 *  - onChange: (productObject) => void
 *  - label: input label
 *  - helperText: text under field
 *  - error: boolean
 */
export default function ProductAutocomplete({ value, onChange, label = 'Product', helperText, error }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounced search
  const searchProducts = useMemo(() => {
    let timeoutId;
    return (query) => {
      clearTimeout(timeoutId);
      if (!query) {
        setOptions([]);
        return;
      }
      timeoutId = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await api.get('/api/products/', { params: { search: query, page_size: 20 } });
          setOptions(res.data.results ?? res.data);
        } catch (err) {
          console.error('Product search failed', err);
        } finally {
          setLoading(false);
        }
      }, 300);
    };
  }, []);

  return (
    <Autocomplete
      value={value}
      options={options}
      getOptionLabel={(opt) => (opt ? `${opt.product_code} – ${opt.name}` : '')}
      isOptionEqualToValue={(opt, val) => opt.product_code === val?.product_code}
      loading={loading}
      onInputChange={(_, newInput) => searchProducts(newInput)}
      onChange={(_, newVal) => onChange(newVal)}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          helperText={helperText}
          error={error}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
}

ProductAutocomplete.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.bool,
};
