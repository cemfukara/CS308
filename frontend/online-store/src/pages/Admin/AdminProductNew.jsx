import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createProduct } from '../../lib/productsApi';
import { getCategories } from '../../lib/categoriesApi';
import styles from './AdminProducts.module.css';
import Dropdown from '../../components/Dropdown.jsx';

function AdminProductNew() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [quantityInStock, setQuantityInStock] = useState('');
  const [warrantyStatus, setWarrantyStatus] = useState('');
  const [distributorInfo, setDistributorInfo] = useState('');
  const [categories, setCategories] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        const body = res?.data ?? res;
        const list = body?.categories ?? body; // works for [{...}] or {categories:[...]}
        setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 3)
      return setError('Name must be at least 3 characters.');

    if (!price || Number(price) <= 0) return setError('Price must be positive.');
    if (quantityInStock < 0) return setError('Quantity cannot be negative.');
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    const payload = {
      name,
      model,
      serial_number: serialNumber,
      description,
      category_id: categoryId ? Number(categoryId) : null,
      price: Number(price),
      list_price: listPrice ? Number(listPrice) : null,
      quantity_in_stock: Number(quantityInStock),
      warranty_status: warrantyStatus,
      distributor_info: distributorInfo,
    };

    try {
      setSubmitting(true);
      await createProduct(payload);
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbs}>
        <Link to="/admin" className={styles.crumbLink}>
          Admin
        </Link>
        <span className={styles.crumbSeparator}>/</span>
        <Link to="/admin/products" className={styles.crumbLink}>
          Product Management
        </Link>
        <span className={styles.crumbSeparator}>/</span>
        <span className={styles.crumbCurrent}>Add Product</span>
      </nav>

      {/* Title */}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Add New Product</h1>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.modalError} style={{ marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Name *</label>
            <input className={styles.input} value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Model</label>
            <input
              className={styles.input}
              value={model}
              onChange={e => setModel(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Serial Number</label>
            <input
              className={styles.input}
              value={serialNumber}
              onChange={e => setSerialNumber(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <Dropdown
              label="Category"
              value={categoryId} // still a string or number
              onChange={val => setCategoryId(val)}
              options={categories.map(c => ({
                value: c.category_id,
                label: c.name || `Category #${c.category_id}`,
              }))}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Price *</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={e => {
                const v = e.target.value;
                if (v === '') return setPrice('');
                if (Number(v) < 0) return; // prevent negative typing
                setPrice(v);
              }}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>List Price</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              step="0.01"
              value={listPrice}
              onChange={e => {
                const v = e.target.value;
                if (v === '') return setListPrice('');
                if (Number(v) < 0) return; // prevent negative typing
                setListPrice(v);
              }}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Quantity *</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              step="1"
              value={quantityInStock}
              onChange={e => {
                const v = e.target.value;
                if (v === '') return setQuantityInStock('');
                if (Number(v) < 0) return;
                setQuantityInStock(v);
              }}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Warranty</label>
            <input
              className={styles.input}
              value={warrantyStatus}
              onChange={e => setWarrantyStatus(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Distributor</label>
            <input
              className={styles.input}
              value={distributorInfo}
              onChange={e => setDistributorInfo(e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => navigate('/admin/products')}
            disabled={submitting}
          >
            Cancel
          </button>

          <button type="submit" className={styles.confirmDeleteBtn} disabled={submitting}>
            {submitting ? 'Saving…' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminProductNew;
