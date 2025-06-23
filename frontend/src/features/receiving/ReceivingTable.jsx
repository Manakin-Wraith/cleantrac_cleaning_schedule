import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { fetchReceivingRecords } from '../../services/receivingService';

/**
 * Basic paginated table to list Receiving Records.
 *
 * Props:
 *  - pageSize (number): rows per page (default 20)
 */
function ReceivingTable({ pageSize = 20 }) {
  const [records, setRecords] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalPages = Math.ceil(count / pageSize);

  const fetchPage = async (pageNumber) => {
    setLoading(true);
    try {
      const params = {
        page: pageNumber,
        page_size: pageSize,
        ordering: '-received_date',
      };
      const response = await fetchReceivingRecords(params);
      const dataList = Array.isArray(response) ? response : response.results || [];
      const totalCount = Array.isArray(response) ? response.length : response.count || dataList.length;
      setRecords(dataList);
      setCount(totalCount);
      setPage(pageNumber);
    } catch (err) {
      console.error('Failed to fetch receiving records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrev = () => {
    if (page > 1) fetchPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) fetchPage(page + 1);
  };

  return (
    <div className="receiving-table-container">
      <h2>Receiving Records</h2>
      {loading && <p>Loading…</p>}
      {!loading && (
        <>
          <table className="receiving-table">
            <thead>
              <tr>
                <th>Product Code</th>
                <th>Product Name</th>
                <th>Batch</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Supplier</th>
                <th>Department</th>
                <th>Received Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.inventory_id}>
                  <td>{r.product_code}</td>
                  <td>{r.product_name || '-'}</td>
                  <td>{r.batch_number}</td>
                  <td>{r.quantity_remaining}</td>
                  <td>{r.unit}</td>
                  <td>{r.supplier_code}</td>
                  <td>{r.department_name}</td>
                  <td>{new Date(r.received_date).toLocaleDateString()}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination-controls">
            <button type="button" onClick={handlePrev} disabled={page === 1}>Prev</button>
            <span>
              Page {page} of {totalPages || 1}
            </span>
            <button type="button" onClick={handleNext} disabled={page === totalPages || totalPages === 0}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}

ReceivingTable.propTypes = {
  pageSize: PropTypes.number,
};

export default ReceivingTable;
