
import { useEffect, useState, useCallback } from 'react';
import styles from '../Admin.module.css';
import { Link } from 'react-router-dom';
import Dropdown from '@/components/Dropdown.jsx';
import { getAllProducts } from '@/lib/productsApi.js';
import { getCategories } from '@/lib/categoriesApi.js';
import { formatPrice } from '@/utils/formatPrice.js';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = [
  { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  { bg: '#ecfdf5', color: '#065f46', border: '#bbf7d0' },
  { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
  { bg: '#f5f3ff', color: '#5b21b6', border: '#e9d5ff' },
  { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
];

// pick a color for each category
const getCategoryStyle = id => {
  if (!id) return CATEGORY_COLORS[4];
  const idx = id % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[idx];
};

export default function SMDiscounts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // ⭐ NEW
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pendingSearch, setPendingSearch] = useState('');
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState([]);
  const [discountValue, setDiscountValue] = useState('');

  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');

  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceProduct, setPriceProduct] = useState(null); // product object
  const [newListPrice, setNewListPrice] = useState('');

  const openPriceModal = (product) => {
    setPriceProduct(product);
    setNewListPrice(product?.list_price ?? '');
    setPriceModalOpen(true);
  };
  
  const closePriceModal = () => {
    setPriceModalOpen(false);
    setPriceProduct(null);
    setNewListPrice('');
  };
  
  const submitListPrice = async () => {
    const val = Number(newListPrice);
  
    if (!priceProduct) return;
    if (isNaN(val) || val <= 0) {
      toast.error('Enter a valid list price (> 0).');
      return;
    }
  
    try {
      setLoading(true);
  
      await api.put('/sales/set-list-price', {
        productId: priceProduct.product_id,
        listPrice: val,
      });
  
      toast.success('List price updated.');
      await fetchProducts(); // refresh table
      closePriceModal();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update list price.');
    } finally {
      setLoading(false);
    }
  };

  // ============= FETCH PRODUCTS =============
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllProducts({
        search: '',
        sortBy: 'product_id',
        sortOrder: 'ASC',
        page: 1,
        limit: 500,
      });
      setProducts(data.products ?? data);
    } catch (err) {
      console.error(err);
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ============= FETCH CATEGORIES (FIX) =============
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories();
        const body = res?.data ?? res;
        const list = body?.categories ?? body;
        setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };

    loadCategories();
  }, []);

  // ============= CATEGORY NAME HELPER (FIX) =============
  const getCategoryName = id => {
    const c = categories.find(cat => cat.category_id === id);
    return c ? c.name : 'Category';
  };

  // ============= SEARCH =============
  const handleSearchSubmit = e => {
    e.preventDefault();
    setSearch(pendingSearch.trim().toLowerCase());
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search));

  // ============= SORT =============
  const toggleSort = column => {
    let newOrder = sortOrder;
    if (sortBy === column) {
      newOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      newOrder = 'ASC';
    }
    setSortBy(column);
    setSortOrder(newOrder);
  };

  const sorted = [...filtered].sort((a, b) => {
    const A = a[sortBy];
    const B = b[sortBy];
    if (A < B) return sortOrder === 'ASC' ? -1 : 1;
    if (A > B) return sortOrder === 'ASC' ? 1 : -1;
    return 0;
  });

  const renderSortIcon = column => {
    if (sortBy !== column) return '↕';
    return sortOrder === 'ASC' ? '▲' : '▼';
  };

  // ============= SELECT PRODUCTS =============
  const toggleSelect = id => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const selectAll = () => {
    if (selected.length === sorted.length) setSelected([]);
    else setSelected(sorted.map(p => p.product_id));
  };

  // ============= APPLY DISCOUNT (FRONTEND ONLY) =============
  const applyDiscount = async () => {
    const discountNum = Number(discountValue);
  
    if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
      toast.error('Enter a valid percentage (0–100).');
      return;
    }
  
    if (selected.length === 0) {
      toast.error('Select at least one product.');
      return;
    }
  
    try {
      setLoading(true);
  
      // Call backend for each selected product
      for (const productId of selected) {
        await api.patch('/discount', {
          productId,
          discountRate: discountNum,
        });
      }
  
      toast.success('Discount applied successfully.');
  
      // IMPORTANT: reload products from database
      await fetchProducts();
  
      setSelected([]);
      setDiscountValue('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to apply discount.');
    } finally {
      setLoading(false);
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
        <span className={styles.crumbCurrent}>Discount Management</span>
      </div>

      <h1 className={styles.title}>Discount Management</h1>

      {/* Discount input */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="number"
          placeholder="Discount %"
          value={discountValue}
          onChange={e => setDiscountValue(e.target.value)}
          className={styles.searchInput}
          style={{ maxWidth: '120px' }}
        />
        <button onClick={applyDiscount} className={styles.searchButton}>
          Apply Discount
        </button>
      </div>

      {priceModalOpen && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h2 style={{ marginBottom: 10 }}>Set List Price</h2>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 14, opacity: 0.8 }}>
          Product: <b>{priceProduct?.name}</b> (ID: {priceProduct?.product_id})
        </div>
      </div>

      <input
        type="number"
        value={newListPrice}
        onChange={(e) => setNewListPrice(e.target.value)}
        className={styles.searchInput}
        placeholder="New list price"
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button type="button" className={styles.searchButton} onClick={submitListPrice}>
          Apply
        </button>
        <button type="button" className={styles.cancelBtn} onClick={closePriceModal}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

      {/* Search / Sort Controls */}
      <form className={styles.controlsRow} onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search by name..."
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
          onChange={val => setSortBy(val)}
          options={[
            { value: 'product_id', label: 'ID' },
            { value: 'name', label: 'Name' },
            { value: 'price', label: 'Price' },
            { value: 'list_price', label: 'List Price' },
            { value: 'discount_ratio', label: 'Discount' },
            { value: 'quantity_in_stock', label: 'Stock' },
          ]}
        />

        <Dropdown
          label="Order"
          value={sortOrder}
          onChange={val => setSortOrder(val)}
          options={[
            { value: 'ASC', label: 'Ascending' },
            { value: 'DESC', label: 'Descending' },
          ]}
        />
      </form>

      {loading && <p>Loading invoices…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr className={styles.tr}>
              <th className={styles.th}>
                <input
                  type="checkbox"
                  checked={selected.length === sorted.length && sorted.length > 0}
                  onChange={selectAll}
                />
              </th>

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

              <th className={styles.thSortable} onClick={() => toggleSort('discount_ratio')}>
                <span>Discount %</span>
                <span className={styles.sortIcon}>{renderSortIcon('discount_ratio')}</span>
              </th>

              <th className={styles.thSortable} onClick={() => toggleSort('quantity_in_stock')}>
                <span>Stock</span>
                <span className={styles.sortIcon}>{renderSortIcon('quantity_in_stock')}</span>
              </th>

              <th className={styles.th}>Distributor</th>
              <th className={styles.th}>Set Price</th>
            </tr>
          </thead>

          <tbody className={styles.tbody}>
            {sorted.map(p => {
              const catStyle = getCategoryStyle(p.category_id);

              return (
                <tr key={p.product_id} className={styles.tr}>
                  <td className={styles.td}>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.product_id)}
                      onChange={() => toggleSelect(p.product_id)}
                    />
                  </td>

                  <td className={styles.td}>{p.product_id}</td>

                  {/* ⭐ FIXED CATEGORY NAME */}
                  <td className={styles.td}>
                    <span
                      className={styles.categoryBadge}
                      style={{
                        background: catStyle.bg,
                        color: catStyle.color,
                        borderColor: catStyle.border,
                      }}
                    >
                      {getCategoryName(p.category_id)}
                    </span>
                  </td>

                  <td className={styles.td}>{p.name}</td>
                  <td className={styles.td}>{p.model}</td>
                  <td className={styles.td}>{p.serial_number}</td>

                  <td className={styles.td}>{formatPrice(p.price, p.currency)}</td>
                  <td className={styles.td}>{formatPrice(p.list_price, p.currency)}</td>
                  <td className={styles.td}>{p.discount_ratio ? `${p.discount_ratio}%` : '0%'}</td>

                  <td className={styles.td}>{p.quantity_in_stock}</td>
                  <td className={styles.td}>{p.distributor_info}</td>
                  <td className={styles.td}>
  <button
    className={styles.searchButton}
    type="button"
    onClick={() => openPriceModal(p)}
  >
    Edit
  </button>
</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}