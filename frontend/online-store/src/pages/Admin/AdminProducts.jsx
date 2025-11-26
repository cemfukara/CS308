import { Link } from 'react-router-dom';
import styles from './AdminProducts.module.css';
import { getAllProducts, deleteProduct, getCategories } from '../../lib/productsApi';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown from '../../components/Dropdown.jsx';

const PAGE_SIZE = 10;

const CATEGORY_COLORS = [
  { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' }, // blue
  { bg: '#ecfdf5', color: '#065f46', border: '#bbf7d0' }, // green
  { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' }, // orange
  { bg: '#f5f3ff', color: '#5b21b6', border: '#e9d5ff' }, // purple
  { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' }, // gray
];

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pendingSearch, setPendingSearch] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const navigate = useNavigate();

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);

    getAllProducts({
      search,
      sortBy,
      sortOrder,
      page,
      limit: PAGE_SIZE,
    })
      .then(data => {
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : [];

        setProducts(items);

        const total = typeof data?.totalCount === 'number' ? data.totalCount : items.length;
        setTotalCount(total);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Failed to load products');
      })
      .finally(() => setLoading(false));
  }, [search, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        const body = res?.data ?? res;
        const list = body?.categories ?? body;
        setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };

    fetchCategories();
  }, []);

  const handleSearchSubmit = e => {
    e.preventDefault();
    setPage(1);
    setSearch(pendingSearch.trim());
  };

  const goPrev = () => setPage(p => Math.max(1, p - 1));
  const goNext = () => setPage(p => Math.min(totalPages, p + 1));

  const toggleSort = column => {
    setPage(1);

    let newSortBy = sortBy;
    let newSortOrder = sortOrder;

    if (sortBy === column) {
      // same column => flip ASC / DESC
      newSortOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      // different column → switch column, reset to ASC
      newSortBy = column;
      newSortOrder = 'ASC';
    }

    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const getRandomCategoryStyle = id => {
    if (id == null) return CATEGORY_COLORS[4]; // fallback

    // same ID always maps to the same color
    const index = id % CATEGORY_COLORS.length;

    return CATEGORY_COLORS[index];
  };

  const renderSortIcon = column => {
    if (sortBy !== column) return '↕';
    return sortOrder === 'ASC' ? '▲' : '▼';
  };

  const openDeleteModal = product => {
    setDeleteTarget(product);
    setDeleteError('');
    setDeleteOpen(true);
  };

  const closeDeleteModal = useCallback(() => {
    if (deleteLoading) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
    setDeleteError('');
  }, [deleteLoading]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      setDeleteError('');

      await deleteProduct(deleteTarget.product_id);

      setProducts(prev => prev.filter(p => p.product_id !== deleteTarget.product_id));
      setTotalCount(prev => Math.max(0, prev - 1));

      closeDeleteModal();
    } catch (err) {
      console.error(err);
      setDeleteError(err?.message || 'Failed to delete product. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (!deleteOpen) return;
    const onKey = e => {
      if (e.key === 'Escape') closeDeleteModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteOpen, closeDeleteModal]);

  const getCategoryLabel = id => {
    if (!id) return 'No category';

    const cat = categories.find(c => c.category_id === id || c.category_id === Number(id));
    if (!cat) return `Category #${id}`;

    return cat.name || `Category #${id}`;
  };

  return (
    <div className={styles.wrapper}>
      <nav className={styles.breadcrumbs}>
        <Link to="/admin" className={styles.crumbLink}>
          Admin
        </Link>
        <span className={styles.crumbSeparator}>/</span>
        <span className={styles.crumbCurrent}>Product Management</span>
      </nav>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Product Management</h1>
        {loading && <span className={styles.loadingPill}>Updating…</span>}
        <div className={styles.titleActions}>
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => navigate('/admin/products/new')}
          >
            + Add Product
          </button>
        </div>
      </div>

      <form className={styles.controlsRow} onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search by name or description..."
          value={pendingSearch}
          onChange={e => setPendingSearch(e.target.value)}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton}>
          Search
        </button>

        <Dropdown
          label="Sort field"
          value={sortBy}
          onChange={val => {
            setSortBy(val);
            setPage(1);
          }}
          options={[
            { value: 'product_id', label: 'ID' },
            { value: 'name', label: 'Name' },
            { value: 'price', label: 'Price' },
            { value: 'list_price', label: 'List price' },
            { value: 'discount_ratio', label: 'Discount' },
            { value: 'quantity_in_stock', label: 'Stock' },
          ]}
        />

        <Dropdown
          label="Order"
          value={sortOrder}
          onChange={val => {
            setSortOrder(val);
            setPage(1);
          }}
          options={[
            { value: 'ASC', label: 'Ascending' },
            { value: 'DESC', label: 'Descending' },
          ]}
        />
      </form>

      {error && <p className="error">{error}</p>}

      <>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr className={styles.tr}>
                <th className={styles.thSortable} onClick={() => toggleSort('product_id')}>
                  <span>ID</span>
                  <span className={styles.sortIcon}>{renderSortIcon('product_id')}</span>
                </th>
                <th className={styles.th}>Category</th>
                <th className={styles.thSortable} onClick={() => toggleSort('name')}>
                  <span>Name</span>
                  <span className={styles.sortIcon}>{renderSortIcon('name')}</span>
                </th>
                <th className={styles.th}>Model</th>
                <th className={styles.th}>Serial</th>
                <th className={styles.thSortable} onClick={() => toggleSort('price')}>
                  <span>Price</span>
                  <span className={styles.sortIcon}>{renderSortIcon('price')}</span>
                </th>
                <th className={styles.thSortable} onClick={() => toggleSort('list_price')}>
                  <span>List</span>
                  <span className={styles.sortIcon}>{renderSortIcon('list_price')}</span>
                </th>
                <th
                  className={`${styles.thSortable} ${styles.thDiscount}`}
                  onClick={() => toggleSort('discount_ratio')}
                >
                  <span>Discount %</span>
                  <span className={styles.sortIcon}>{renderSortIcon('discount_ratio')}</span>
                </th>

                <th className={styles.thSortable} onClick={() => toggleSort('quantity_in_stock')}>
                  <span>Stock</span>
                  <span className={styles.sortIcon}>{renderSortIcon('quantity_in_stock')}</span>
                </th>
                <th className={styles.th}>Warranty</th>
                <th className={styles.th}>Distributor</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody className={styles.tbody}>
              {products.map(p => (
                <tr
                  key={p.product_id}
                  className={`${styles.tr} ${
                    p.quantity_in_stock === 0
                      ? styles.outOfStock
                      : p.quantity_in_stock < 10
                        ? styles.lowStock
                        : ''
                  }`}
                >
                  <td className={styles.td}>{p.product_id}</td>

                  <td className={styles.td}>
                    {(() => {
                      const style = getRandomCategoryStyle(p.category_id);
                      return (
                        <span
                          className={styles.categoryBadge}
                          style={{
                            background: style.bg,
                            color: style.color,
                            borderColor: style.border,
                          }}
                        >
                          {getCategoryLabel(p.category_id)}
                        </span>
                      );
                    })()}
                  </td>

                  <td className={styles.td}>{p.name}</td>
                  <td className={styles.td}>{p.model}</td>
                  <td className={styles.td}>{p.serial_number}</td>
                  <td className={styles.td}>{p.price}</td>
                  <td className={styles.td}>{p.list_price}</td>
                  <td className={styles.td}>
                    {p.discount_ratio != null ? `${Number(p.discount_ratio).toFixed(0)}%` : '0%'}
                  </td>
                  <td className={styles.td}>{p.quantity_in_stock}</td>
                  <td className={styles.td}>{p.warranty_status}</td>
                  <td className={styles.td}>{p.distributor_info}</td>
                  <td className={styles.td}>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.editBtn}
                        type="button"
                        onClick={() => navigate(`/admin/products/edit/${p.product_id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteBtn}
                        type="button"
                        onClick={() => openDeleteModal(p)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <button className={styles.pageBtn} onClick={goPrev} disabled={page <= 1}>
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {page} / {totalPages}
          </span>
          <button className={styles.pageBtn} onClick={goNext} disabled={page >= totalPages}>
            Next
          </button>
        </div>
      </>
      {deleteOpen && deleteTarget && (
        <div className={styles.modalOverlay} onClick={closeDeleteModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitleDanger}>DELETE PRODUCT</h2>

            <p className={styles.modalText}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong> (ID{' '}
              {deleteTarget.product_id})?
            </p>

            <div className={styles.modalWarning}>
              <span className={styles.warningIcon}>⚠️</span>
              <span>This action cannot be undone.</span>
            </div>

            {deleteError && <p className={styles.modalError}>{deleteError}</p>}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={closeDeleteModal}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
