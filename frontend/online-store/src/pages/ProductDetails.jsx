import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus, faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { useState, useEffect } from 'react';
import './ProductDetails.css';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';
import { getProductsById } from '../lib/productsApi';

function ProductDetails() {
  const { id: idParam = '' } = useParams();
  const addToCart = useCartStore(state => state.addToCart);
  const [fitMode, setFitMode] = useState('cover');
  const [loaded, setLoaded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const navigate = useNavigate();
  const serialNo = idParam.split('-').pop(); //last part of URL

  const handleImageLoad = e => {
    e.target.naturalWidth > e.target.naturalHeight ? setFitMode('contain') : setFitMode('cover');
    setLoaded(true);
  };

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const data = await getProductsById(serialNo);

        if (!isMounted) return;

        const normalized = {
          ...data,
          serialNo: data.serialNo ?? data.serial_number ?? data.product_id ?? serialNo,
          currency: data.currency ?? '$',
          quantity: data.quantity ?? 1,
          quantity_in_stock: data.quantity_in_stock ?? 0,
        };

        setProduct(normalized);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load product');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [serialNo]);

  useEffect(() => {
    if (!product) return;
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    setLiked(favorites.some(f => f.serialNo === product.serialNo));
    const savedRating = JSON.parse(localStorage.getItem(`rating-${product.serialNo}`)) || 0;
    setRating(savedRating);
  }, [product]);

  if (loading) {
    return (
      <div className="product-description">
        <h3>Loading product…</h3>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-description">
        <h3>{error || 'Product not found'}</h3>
      </div>
    );
  }
  const inStock = (product.quantity_in_stock ?? 0) > 0; //Check if product is out of stock

  //Create image path
  const imagePath = product.image
    ? new URL(`../assets/${product.image}`, import.meta.url).href
    : new URL(`../assets/placeholder.jpg`, import.meta.url).href;

  // ✅ Check favorites to set liked state
  const handleAddToFavorites = () => {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const exists = favorites.some(f => f.serialNo === product.serialNo);

    if (exists) {
      favorites = favorites.filter(f => f.serialNo !== product.serialNo);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      setLiked(false);
      toast.error('Removed from favorites 💔', { position: 'top-right' });
    } else {
      favorites.push(product);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      setLiked(true);
      toast.success('Added to favorites ❤️', { position: 'top-right' });
    }
  };

  const handleRating = value => {
    setRating(value);
    localStorage.setItem(`rating-${product.serialNo}`, JSON.stringify(value));
  };

  const handleAddToCart = () => {
    if (!product || (product.quantity_in_stock ?? 0) <= 0) return;
    addToCart(product, 1);
    toast.custom(
      t => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: '#969696',

            color: '#fff',
            borderRadius: '10px',
            padding: '14px 18px',
            boxShadow: '0 0 12px #241111bf',
            animation: t.visible ? 'fadeIn 0.3s ease' : 'fadeOut 0.3s ease forwards',
            width: '320px',
          }}
        >
          <img
            src={imagePath}
            alt={product.name}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '1px solid #241111bf',
            }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontFamily: 'Exo 2' }}>{product.name}</p>
            <p
              style={{
                margin: '4px 0 8px 0',
                color: '#b2ff59',
                fontSize: '14px',
                fontFamily: 'Exo 2',
              }}
            >
              Added to cart
            </p>
            <button
              style={{
                backgroundColor: '#2337eedb',
                border: 'none',
                fontFamily: 'Exo 2',
                color: '#fff',
                borderRadius: '6px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: '0.25s',
              }}
              onClick={() => {
                toast.dismiss(t.id);
                navigate('/cart');
              }}
            >
              View Cart
            </button>
          </div>
          <p
            style={{
              flex: 0.5,
              fontSize: 32,
              fontWeight: 'bold',
              fontFamily: 'Exo 2',
              color: '#00e676',
            }}
          >
            {product.currency}
            {Number(product.price || 0).toFixed(2)}
          </p>
        </div>
      ),
      {
        duration: 2500,
        position: 'top-right',
      }
    );
  };
  return (
    <div className="product-description">
      <div className="product-img-container">
        <img
          src={imagePath}
          className="product-img"
          loading="lazy"
          alt={product.name}
          onLoad={handleImageLoad}
          style={{ objectFit: fitMode, opacity: loaded ? 1 : 0 }}
        />
      </div>

      <div className="product-card">
        <h3>
          {product.model}/{product.serial_number}
        </h3>
        <div className="name-rating">
          <h2>{product.name}</h2>

          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                onClick={() => handleRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <h1>
          {product.currency}
          {Number(product.price || 0).toFixed(2)}
        </h1>
        <p className={inStock ? 'stock-ok' : 'stock-bad'}>
          {inStock ? `In stock: ${product.quantity_in_stock}` : 'Currently out of stock'}
        </p>

        <div>
          <button
            id="add-cart-btn"
            onClick={inStock ? handleAddToCart : undefined}
            className={!inStock ? 'out-of-stock' : ''}
            disabled={!inStock}
          >
            <FontAwesomeIcon icon={faCartPlus} /> {inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>

          <button
            className="fav-btn"
            aria-pressed={liked}
            title={liked ? 'Remove from favorites' : 'Add to favorites'}
            onClick={handleAddToFavorites}
          >
            <FontAwesomeIcon icon={liked ? faHeartSolid : faHeart} />
          </button>
        </div>

        <p>
          {product.description ||
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates corrupti laudantium culpa tempora repellendus? Vel sint aut deserunt maiores dolorem reiciendis doloremque, facilis, rem pariatur distinctio cumque error quam reprehenderit.'}
        </p>

        <textarea placeholder="Share your thoughts..." />
        <div>
          <button className="product-comment-btn">Comment</button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
