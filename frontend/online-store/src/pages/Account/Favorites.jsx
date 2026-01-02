// src/pages/Favorites.jsx
import React, { useEffect, useState } from 'react';
import './Favorites.css';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import useCartStore from '@/store/cartStore';
import { formatPrice } from '@/utils/formatPrice';
import useAuthStore from '@/store/authStore';
import { fetchWishlist, removeFromWishlist } from '@/lib/wishlistApi';

const Favorites = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const addToCart = useCartStore(state => state.addToCart);
  const user = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const navigate = useNavigate();

  useEffect(() => {
    // if auth still loading, wait
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const wishlistProducts = await fetchWishlist();
        setItems(wishlistProducts);
      } catch (err) {
        console.error('Failed to load wishlist', err);
        toast.error(err.message || 'Failed to load favorites');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, authLoading]);

  const handleRemove = async product_id => {
    try {
      await removeFromWishlist(product_id);
      setItems(prev => prev.filter(item => item.product_id !== product_id));
      toast.success('Removed from favorites', { position: 'top-right' });
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
      toast.error(err.message || 'Failed to remove from favorites');
    }
  };

  const handleAddToCart = async product => {
    await addToCart(product, 1);
    toast.success(`${product.name} added to cart!`, { position: 'top-right' });
  };

  if (authLoading) {
    return (
      <div className="favorites-empty">
        <h2>Loading your favorites…</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="favorites-empty">
        <h2>You need to log in to see your favorites 💔</h2>
        <button className="favorites-link" onClick={() => navigate('/auth')}>
          Go to Login
        </button>
      </div>
    );
  }

  if (!items.length && !loading) {
    return (
      <div className="favorites-empty">
        <h2>No favorite products yet 💔</h2>
        <Link to="/products" className="favorites-link">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <h2 className="favorites-title">My Favorites ❤️</h2>

      {loading && <p>Loading…</p>}

      <div className="favorites-grid">
        {items.map(product => {
          // image from DB product_images
          const productImages = product.product_images || product.images || [];
          const primaryImage =
            productImages.find(img => img.is_primary)?.image_url ||
            productImages[0]?.image_url ||
            new URL('../assets/placeholder.jpg', import.meta.url).href;

          // Link slug: just use serial_number (ProductDetails uses last segment as serial)
          const slug = product.serial_number || product.serialNo || product.product_id;

          return (
            <div className="favorite-card" key={product.product_id}>
              <Link to={`/products/${slug}`} className="favorite-link">
                <img src={primaryImage} alt={product.name} />
                <h3>{product.name}</h3>
                <p>{formatPrice(product.price, product.currency)}</p>
              </Link>

              <div className="favorite-btn-group">
                <button className="cart-btn" onClick={() => handleAddToCart(product)}>
                  <FontAwesomeIcon icon={faCartPlus} /> Add to Cart
                </button>
                <button className="remove-btn" onClick={() => handleRemove(product.product_id)}>
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Favorites;
