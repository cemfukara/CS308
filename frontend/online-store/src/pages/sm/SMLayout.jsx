import { NavLink, Outlet, Link } from "react-router-dom";
import styles from "../admin/AdminLayout.module.css"; // reusing PM styles

export default function SMLayout() {
  return (
    <div className={styles.adminShell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMain}>TechZone</span>
          <span className={styles.brandSub}>Sales Manager</span>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/sm/discounts" className={styles.link}>Discount Management</NavLink>
          <NavLink to="/sm/invoices" className={styles.link}>Invoice Management</NavLink>
          <NavLink to="/sm/revenue" className={styles.link}>Revenue Dashboard</NavLink>
        </nav>

        <div className={styles.backToStoreWrapper}>
          <Link to="/" className={styles.backToStore}>Back to Store</Link>
        </div>
      </aside>

      <main className={styles.mainArea}>
        <Outlet />
      </main>
    </div>
  );
}
