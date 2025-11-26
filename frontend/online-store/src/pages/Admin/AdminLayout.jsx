import { NavLink, Outlet, Link } from 'react-router-dom';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  return (
    <div className={styles.adminShell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMain}>TechZone</span>
          <span className={styles.brandSub}>Admin</span>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/admin/products"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Products
          </NavLink>

          <NavLink
            to="/admin/categories"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Categories
          </NavLink>

          <NavLink
            to="/admin/inventory"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Inventory & Stock
          </NavLink>

          <NavLink
            to="/admin/deliveries"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Deliveries
          </NavLink>

          <NavLink
            to="/admin/comments"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Comment Approval
          </NavLink>
        </nav>

        <div className={styles.backToStoreWrapper}>
          <Link to="/" className={styles.backToStore}>
            Back to Store
          </Link>
        </div>

        <div className={styles.footer}>
          <span className={styles.footerLabel}>Logged in as</span>
          <span className={styles.footerRole}>Product Manager</span>
        </div>
      </aside>

      <main className={styles.mainArea}>
        {' '}
        <Outlet />
      </main>
    </div>
  );
}
