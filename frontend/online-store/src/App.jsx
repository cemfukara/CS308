import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

import RequirePM from './components/RequirePM';
import RequireAuth from './components/RequireAuth';
import useAuthStore from './store/authStore';

// Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import AboutUs from './pages/AboutUs';
import TermsPolicy from './pages/TermsPolicy';
import Contact from './pages/Contact';
import Checkout from './pages/Checkout/Checkout';
import Payment from './pages/Checkout/Payment';
import Confirmation from './pages/Checkout/Confirmation';

// Account (nested)
import AccountLayout from './pages/Account/AccountLayout';
import ProfileInfo from './pages/Account/ProfileInfo';
import ChangePassword from './pages/Account/ChangePassword';
import Addresses from './pages/Account/Addresses';
import Favorites from './pages/Account/Favorites';
import Orders from './pages/Account/Orders';
import Support from './pages/Account/Support';
import Logout from './pages/Account/Logout';
import OrderDetails from './pages/Account/OrderDetails';

//Admin
import AdminLayout from './pages/Admin/AdminLayout.jsx';
import AdminProducts from './pages/Admin/AdminProducts.jsx';
import AdminProductEdit from './pages/Admin/AdminProductEdit.jsx';
import AdminProductNew from './pages/Admin/AdminProductNew.jsx';
import AdminStock from './pages/Admin/AdminStock.jsx';
import AdminCategories from './pages/Admin/AdminCategories.jsx';
import AdminDeliveries from './pages/Admin/AdminDeliveries.jsx';

export function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const fetchProfile = useAuthStore(state => state.fetchProfile);

  // Fetch logged-in user on app start
  useEffect(() => {
    fetchProfile();
  }, []);
  return (
    <>
      {/* Global toast container */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* Hide Navbar/Footer on /admin routes */}
      {!isAdminRoute && <Navbar />}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/terms-policy" element={<TermsPolicy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/payment" element={<Payment />} />
        <Route path="/checkout/confirmation" element={<Confirmation />} />

        {/* Account routes (nested under /account) */}
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfileInfo />} />
          <Route path="password" element={<ChangePassword />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetails />} />
          <Route path="support" element={<Support />} />
          <Route path="logout" element={<Logout />} />
        </Route>

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <RequirePM>
              <AdminLayout />
            </RequirePM>
          }
        >
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductNew />} />
          <Route path="products/edit/:id" element={<AdminProductEdit />} />
          <Route path="inventory" element={<AdminStock />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="deliveries" element={<AdminDeliveries />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isAdminRoute && <Footer />}
    </>
  );
}

// Top-level component that provides the Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
