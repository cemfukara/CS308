import { useEffect, useState } from 'react';
import styles from '../Admin.module.css'; // Shared admin styles
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatPrice } from '@/utils/formatPrice';

export default function SMRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      console.log('Fetching refunds...');
      // The api.get returns the data directly, not an object with a .data property
      const data = await api.get('/refunds/pending'); 
      console.log('Refunds response:', data);
      
      // Use 'data' directly instead of 'data.data' or 'res.data'
      setRefunds(data || []); 
    } catch (err) {
      console.error('Fetch refunds error:', err);
      toast.error('Failed to load refund requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this refund? Stock will be restored.')) return;
    try {
      await api.patch(`/refunds/${id}/approve`);
      toast.success('Refund approved successfully.');
      fetchRefunds(); // Refresh list
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to approve refund.');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this refund request?')) return;
    try {
      await api.patch(`/refunds/${id}/reject`);
      toast.success('Refund rejected.');
      fetchRefunds(); // Refresh list
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to reject refund.');
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <Link to="/admin" className={styles.crumbLink}>
          Admin
        </Link>
        <span className={styles.crumbSeparator}>/</span>
        <span className={styles.crumbCurrent}>Refund Requests</span>
      </div>

      <h1 className={styles.title}>Pending Refund Requests</h1>

      {loading ? (
        <p>Loading requests...</p>
      ) : refunds.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No pending refund requests found.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr className={styles.tr}>
                <th className={styles.th}>Refund ID</th>
                <th className={styles.th}>Customer</th>
                <th className={styles.th}>Product</th>
                <th className={styles.th}>Qty</th>
                <th className={styles.th}>Refund Amount</th>
                <th className={styles.th}>Reason</th>
                <th className={styles.th}>Date Requested</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {refunds.map((r) => (
                <tr key={r.refund_id} className={styles.tr}>
                  <td className={styles.td}>#{r.refund_id}</td>
                  <td className={styles.td}>
                    <div>{r.customer_email}</div>
                    <small style={{color: '#6b7280'}}>User ID: {r.user_id}</small>
                  </td>
                  <td className={styles.td}>{r.product_name}</td>
                  <td className={styles.td}>{r.quantity}</td>
                  <td className={styles.td} style={{fontWeight: 'bold', color: '#dc2626'}}>
                    {formatPrice(r.refund_amount, 'TRY')} 
                  </td>
                  <td className={styles.td} style={{maxWidth: '200px', whiteSpace: 'normal'}}>
                    {r.reason}
                  </td>
                  <td className={styles.td}>
                    {new Date(r.requested_at).toLocaleDateString()}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.editBtn} 
                        style={{background: '#dcfce7', color: '#166534', border: '1px solid #86efac'}}
                        onClick={() => handleApprove(r.refund_id)}
                      >
                        Approve
                      </button>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleReject(r.refund_id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}