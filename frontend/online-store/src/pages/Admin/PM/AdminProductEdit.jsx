import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getProductsById, updateProduct } from '@/lib/productsApi.js';
import { getCategories } from '@/lib/categoriesApi.js';
import styles from '../Admin.module.css';
import Dropdown from '@/components/Dropdown.jsx';
function AdminProductEdit() {
  const navigate = useNavigate();
  const { id } = useParams(); // product_id from URL

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

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // fetch existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getProductsById(id);
        const body = res?.data ?? res;
        const p = body?.product ?? body;
        if (!p) {
          setError('Product not found.');
          setLoading(false);
          return;
        }
        setName(p.name ?? '');
        setModel(p.model ?? '');
        setSerialNumber(p.serial_number ?? '');
        setDescription(p.description ?? '');
        setCategoryId(
          p.category_id !== null && p.category_id !== undefined ? String(p.category_id) : ''
        );
        setPrice(p.price != null ? String(p.price) : '');
        setListPrice(p.list_price != null ? String(p.list_price) : '');
        setQuantityInStock(p.quantity_in_stock != null ? String(p.quantity_in_stock) : '');
        setWarrantyStatus(p.warranty_status ?? '');
        setDistributorInfo(p.distributor_info ?? '');
      } catch (err) {
        console.error(err);
        setError('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

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

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;

    setError('');

    if (!name.trim()) return setError('Product name is required.');
    if (!price || Number(price) <= 0) return setError('Price must be a positive number.');
    if (quantityInStock === '' || Number(quantityInStock) < 0)
      return setError('Quantity in stock cannot be negative.');
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    const payload = {
      name: name.trim(),
      model: model.trim() || null,
      serial_number: serialNumber.trim() || null,
      description: description.trim() || null,
      category_id: categoryId ? Number(categoryId) : null,
      price: Number(price),
      list_price: listPrice ? Number(listPrice) : null,
      quantity_in_stock: Number(quantityInStock),
      warranty_status: warrantyStatus.trim() || null,
      distributor_info: distributorInfo.trim() || null,
    };

    try {
      setSubmitting(true);
      await updateProduct(id, payload);
      navigate('/admin/pm/products');
    } catch (err) {
      console.error(err);
      setError('Failed to update product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/pm/products');
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
        <span className={styles.crumbCurrent}>Edit Product</span>
      </nav>

      {/* Title row */}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Edit Product</h1>
        {loading && <span className={styles.loadingPill}>Loading product…</span>}
      </div>

      {/* Error */}
      {error && (
        <div className={styles.modalError} style={{ marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {/* If still loading, don't show empty form */}
      {loading ? null : (
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Name *</label>
              <input
                className={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
              />
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

          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className={styles.confirmDeleteBtn} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AdminProductEdit;
