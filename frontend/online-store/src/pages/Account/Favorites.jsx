import React, { useEffect, useState } from 'react';
import './Favorites.css';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import useCartStore from '../../store/cartStore';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const addToCart = useCartStore(state => state.addToCart);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('favorites')) || [];
    setFavorites(saved);
  }, []);

  const handleRemove = serialNo => {
    const updated = favorites.filter(item => item.serialNo !== serialNo);
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
    toast.success('Removed from favorites', { position: 'top-right' });
  };

  const handleAddToCart = product => {
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`, { position: 'top-right' });
  };

  if (!favorites.length) {
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
      <div className="favorites-grid">
        {favorites.map(product => {
          const imageUrl = new URL(`../../assets/${product.image}`, import.meta.url).href;

          return (
            <div className="favorite-card" key={product.serialNo}>
              <Link to={`/products/${product.name}-${product.serialNo}`} className="favorite-link">
                <img src={imageUrl} alt={product.name} />
                <h3>{product.name}</h3>
                <p>
                  {product.currency}
                  {product.price.toFixed(2)}
                </p>
              </Link>

              <div className="favorite-btn-group">
                <button className="cart-btn" onClick={() => handleAddToCart(product)}>
                  <FontAwesomeIcon icon={faCartPlus} /> Add to Cart
                </button>
                <button className="remove-btn" onClick={() => handleRemove(product.serialNo)}>
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
