import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

import RequireAdmin from './components/Auth/RequireAdmin.jsx';
import RequireAuth from './components/Auth/RequireAuth.jsx';
import RequireSupportAgent from './components/Auth/RequireSupportAgent.jsx';
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

// Product Manager (PM) – note the folder is ./pages/Admin/PM/
import AdminLayout from './pages/Admin/AdminLayout.jsx';
import AdminProducts from './pages/Admin/PM/AdminProducts.jsx';
import AdminProductEdit from './pages/Admin/PM/AdminProductEdit.jsx';
import AdminProductNew from './pages/Admin/PM/AdminProductNew.jsx';
import AdminStock from './pages/Admin/PM/AdminStock.jsx';
import AdminCategories from './pages/Admin/PM/AdminCategories.jsx';
import PMDeliveries from './pages/Admin/PM/PMDeliveries.jsx';
import AdminComments from './pages/Admin/PM/AdminComments.jsx';

// Sales Manager (SM) – note the folder is ./pages/Admin/SM/
import SMDiscounts from './pages/Admin/SM/SMDiscounts.jsx';
import SMInvoices from './pages/Admin/SM/SMInvoices.jsx';
import SMRevenue from './pages/Admin/SM/SMRevenue.jsx';

// Support Agent (SA) -– note the folder is ./pages/Admin/SA/
import SupportQueuePage from './pages/Admin/SA/SupportQueuePage.jsx';
import SupportActiveChatsPage from './pages/Admin/SA/SupportActiveChatsPage.jsx';
import SupportAgentChatPage from './pages/Admin/SA/SupportAgentChatPage.jsx';

export function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const fetchProfile = useAuthStore(state => state.fetchProfile);

  // Fetch logged-in user on app start
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

        {/* Product Manager routes */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route path="pm/products" element={<AdminProducts />} />
          <Route path="pm/products/new" element={<AdminProductNew />} />
          <Route path="pm/products/edit/:id" element={<AdminProductEdit />} />
          <Route path="pm/inventory" element={<AdminStock />} />
          <Route path="pm/categories" element={<AdminCategories />} />
          <Route path="pm/comments" element={<AdminComments />} />
          <Route path="pm/deliveries" element={<PMDeliveries />} />
          <Route path="sm/discounts" element={<SMDiscounts />} />
          <Route path="sm/invoices" element={<SMInvoices />} />
          <Route path="sm/revenue" element={<SMRevenue />} />
        </Route>

        <Route
          path="/admin/support"
          element={
            <RequireSupportAgent>
              <AdminLayout />
            </RequireSupportAgent>
          }
        >
          <Route path="queue" element={<SupportQueuePage />} />
          <Route path="active" element={<SupportActiveChatsPage />} />
          <Route path="chat/:chatId" element={<SupportAgentChatPage />} />
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
