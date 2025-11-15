import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

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

// Account (nested)
import AccountLayout from './pages/Account/AccountLayout';
import ProfileInfo from './pages/Account/ProfileInfo';
import ChangePassword from './pages/Account/ChangePassword';
import Addresses from './pages/Account/Addresses';
import Favorites from './pages/Account/Favorites';
import Orders from './pages/Account/Orders';
import Support from './pages/Account/Support';
import Logout from './pages/Account/Logout';

// ✅ New: Order details page
import OrderDetails from './pages/Account/OrderDetails';

function App() {
  return (
    <Router>
      {/* Global toast container */}
      <Toaster position="top-right" reverseOrder={false} />

      <Navbar />

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

        {/* Account routes (nested under /account) */}
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfileInfo />} />
          <Route path="password" element={<ChangePassword />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetails />} /> {/* ✅ Added */}
          <Route path="support" element={<Support />} />
          <Route path="logout" element={<Logout />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;
