import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../lib/categoriesApi';
import { api } from '../../lib/api.js';
import styles from './AdminProducts.module.css';
import Dropdown from '../../components/Dropdown.jsx';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [reassignModal, setReassignModal] = useState({
    open: false,
    categoryId: null,
    productCount: 0,
  });
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    categoryId: null,
    categoryName: '',
  });
  const [reassignTarget, setReassignTarget] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getCategories();
      const list = res?.data ?? res;
      setCategories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async e => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setSaving(true);
      await createCategory({ name: newName.trim() });
      setNewName('');
      await load();
    } catch (err) {
      console.error(err);
      setError('Failed to add category.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = cat => {
    setEditingId(cat.category_id);
    setEditingName(cat.name || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const submitEdit = async id => {
    if (!editingName.trim()) return;
    try {
      setSaving(true);
      await updateCategory(id, { name: editingName.trim() });
      cancelEdit();
      await load();
    } catch (err) {
      console.error(err);
      setError('Failed to update category.');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = cat => {
    setConfirmModal({
      open: true,
      categoryId: cat.category_id,
      categoryName: cat.name || '',
    });
  };

  const closeDeleteConfirm = () => {
    setConfirmModal({
      open: false,
      categoryId: null,
      categoryName: '',
    });
  };

  const handleDelete = async id => {
    try {
      setSaving(true);
      await deleteCategory(id);
      await load();
    } catch (err) {
      // api.js throws: new Error(responseText)
      let data = null;
      try {
        data = JSON.parse(err.message);
      } catch (e) {
        console.error('Delete error:', e);
        // not JSON, ignore
      }

      if (data && data.productCount) {
        // pick first other category as default
        const others = categories.filter(c => c.category_id !== id);
        const firstTarget = others.length ? others[0].category_id : '';

        setReassignTarget(firstTarget);

        setReassignModal({
          open: true,
          categoryId: id,
          productCount: data.productCount,
        });
        return;
      }

      console.error(err);
      setError(data?.error || 'Failed to delete category.');
    } finally {
      setSaving(false);
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
        <span className={styles.crumbCurrent}>Categories</span>
      </div>

      {/* Title */}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Category Management</h1>
        {loading && <span className={styles.loadingPill}>Loading…</span>}
      </div>

      {/* Error */}
      {error && (
        <div className={styles.modalError} style={{ marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {/* Add new category */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          className={styles.input}
          placeholder="New category name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button type="submit" className={styles.confirmDeleteBtn} disabled={saving}>
          {saving ? 'Saving…' : 'Add'}
        </button>
      </form>
      {confirmModal.open && (
        <div className={styles.deleteModalOverlay}>
          <div className={styles.deleteModal}>
            <h3 className={styles.deleteModalTitle}>Delete Category</h3>
            <p className={styles.deleteModalText}>
              Are you sure you want to delete{' '}
              <strong>{confirmModal.categoryName || `Category #${confirmModal.categoryId}`}</strong>
              ?
              <br />
              If this category has products, you&apos;ll be asked to reassign them first.
            </p>

            <div className={styles.deleteModalButtons}>
              <button
                type="button"
                className={styles.deleteModalCancel}
                onClick={closeDeleteConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteModalConfirm}
                disabled={saving}
                onClick={() => {
                  const id = confirmModal.categoryId;
                  closeDeleteConfirm();
                  handleDelete(id);
                }}
              >
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reassignModal.open && (
        <div className={styles.reModalOverlay}>
          <div className={styles.reModal}>
            <h3 className={styles.reModalTitle}>Category In Use</h3>

            <p className={styles.reModalText}>
              This category is assigned to <strong>{reassignModal.productCount}</strong> products.
              Choose a category to move those products into, then delete this one.
            </p>

            <Dropdown
              options={categories
                .filter(c => c.category_id !== reassignModal.categoryId)
                .map(c => ({
                  value: c.category_id,
                  label: c.name,
                }))}
              value={reassignTarget}
              placeholder="Select category"
              onChange={value => setReassignTarget(value)}
              className={styles.reModalDropdown}
            />

            <div className={styles.reModalButtons}>
              <button
                className={styles.reModalCancel}
                onClick={() => {
                  setReassignModal({
                    open: false,
                    categoryId: null,
                    productCount: 0,
                  });
                  setReassignTarget('');
                }}
              >
                Cancel
              </button>

              <button
                className={styles.reModalConfirm}
                disabled={!reassignTarget || saving}
                onClick={async () => {
                  try {
                    setSaving(true);
                    await api.put(`/categories/${reassignModal.categoryId}/reassign`, {
                      targetCategoryId: reassignTarget,
                    });
                    setReassignModal({
                      open: false,
                      categoryId: null,
                      productCount: 0,
                    });
                    setReassignTarget('');
                    await load();
                  } catch (err) {
                    console.error('Reassign error:', err);
                    setError('Failed to reassign category.');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Reassign & Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>ID</th>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {!loading && categories.length === 0 && (
              <tr className={styles.tr}>
                <td className={styles.td} colSpan={3}>
                  <div className={styles.emptyState}>No categories yet.</div>
                </td>
              </tr>
            )}

            {categories.map(cat => (
              <tr key={cat.category_id} className={styles.tr}>
                <td className={styles.td}>{cat.category_id}</td>
                <td className={styles.td}>
                  {editingId === cat.category_id ? (
                    <input
                      className={styles.input}
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    cat.name || '—'
                  )}
                </td>
                <td className={styles.td}>
                  {editingId === cat.category_id ? (
                    <>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => submitEdit(cat.category_id)}
                        disabled={saving}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={cancelEdit}
                        disabled={saving}
                        style={{ marginLeft: 6 }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        style={{ marginRight: 6 }}
                        className={styles.editBtn}
                        onClick={() => startEdit(cat)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => openDeleteConfirm(cat)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminCategories;
