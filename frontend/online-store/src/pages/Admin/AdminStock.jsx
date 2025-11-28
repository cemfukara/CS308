// src/pages/admin/AdminStock.jsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllProducts } from '../../lib/productsApi';
import styles from './AdminProducts.module.css';

const LOW_STOCK_THRESHOLD = 10;

function AdminStock() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLowOnly, setShowLowOnly] = useState(false);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getAllProducts({
          sortBy: 'quantity_in_stock',
          sortOrder: 'ASC',
          page: 1,
          limit: 1000, // load many, then filter client-side
        });

        const body = res?.data ?? res;
        const list = body?.products ?? body;
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error(err);
        setError('Failed to load stock information.');
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, []);

  const filteredProducts = showLowOnly
    ? products.filter(p => p.quantity_in_stock === 0 || p.quantity_in_stock < LOW_STOCK_THRESHOLD)
    : products;

  const getStockStatus = qty => {
    if (qty === 0) return 'Out of stock';
    if (qty < LOW_STOCK_THRESHOLD) return 'Low stock';
    return 'In stock';
  };

  return (
    <div className={styles.wrapper}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <Link to="/admin" className={styles.crumbLink}>
          Admin
        </Link>
        <span className={styles.crumbSeparator}>/</span>
        <span className={styles.crumbCurrent}>Inventory</span>
      </div>

      {/* Title row */}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Inventory Overview</h1>
        {loading && <span className={styles.loadingPill}>Loading…</span>}
      </div>

      {/* Filters */}
      <div className={styles.inventoryControls}>
        <label className={styles.stockToggle}>
          <input
            type="checkbox"
            checked={showLowOnly}
            onChange={e => setShowLowOnly(e.target.checked)}
          />
          <span>Show only low / out-of-stock products</span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.modalError} style={{ marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Product</th>
              <th className={styles.th}>Model</th>
              <th className={styles.th}>Quantity</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {!loading && filteredProducts.length === 0 && (
              <tr className={styles.tr}>
                <td className={styles.td} colSpan={4}>
                  <div className={styles.emptyState}>No products found for this filter.</div>
                </td>
              </tr>
            )}

            {filteredProducts.map(p => (
              <tr
                key={p.product_id}
                className={`${styles.tr} ${
                  p.quantity_in_stock === 0
                    ? styles.outOfStock
                    : p.quantity_in_stock < 5
                      ? styles.lowStock
                      : ''
                }`}
                onDoubleClick={() => navigate(`/admin/products/edit/${p.product_id}`)}
                style={{ cursor: 'pointer' }}
                title="Double-click to edit product"
              >
                <td className={styles.td}>{p.name}</td>
                <td className={styles.td}>{p.model || '—'}</td>
                <td className={styles.td}>{p.quantity_in_stock}</td>
                <td className={styles.td}>{getStockStatus(p.quantity_in_stock)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminStock;
