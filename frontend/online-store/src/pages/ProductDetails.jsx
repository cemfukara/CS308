import { useParams, useNavigate } from 'react-router-dom';
import products from '../data/products.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus, faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { useState, useEffect } from 'react';
import './ProductDetails.css';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

function ProductDetails() {
  const { id: idParam = '' } = useParams();
  const addToCart = useCartStore(state => state.addToCart);
  const [fitMode, setFitMode] = useState('cover');
  const [loaded, setLoaded] = useState(false);
  const [liked, setLiked] = useState(false);
  const navigate = useNavigate();

  const handleImageLoad = e => {
    e.target.naturalWidth > e.target.naturalHeight ? setFitMode('contain') : setFitMode('cover');
    setLoaded(true);
  };

  const serialNo = idParam.split('-').pop();
  const src = products.find(p => String(p.serialNo) === String(serialNo));

  if (!src) {
    return (
      <div className="product-description">
        <h3>Product not found</h3>
      </div>
    );
  }

  const product = { ...src, id: serialNo, quantity: src.quantity ?? 1 };
  const imageUrl = new URL(`../assets/${product.image}`, import.meta.url).href;

  // ✅ Check favorites to set liked state
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    setLiked(favorites.some(f => f.serialNo === product.serialNo));
  }, [product.serialNo]);

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

  const handleAddToCart = () => {
    addToCart(product, 1);

    toast.success(`${product.name} has been added to your cart 🛒`, {
      position: 'top-right',
      duration: 2500,
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
        fontFamily: 'Exo 2, sans-serif',
        fontWeight: 500,
      },
    });
  };

  return (
    <div className="product-description">
      <div className="product-img-container">
        <img
          src={imageUrl}
          className="product-img"
          loading="lazy"
          alt={product.name}
          onLoad={handleImageLoad}
          style={{ objectFit: fitMode, opacity: loaded ? 1 : 0 }}
        />
      </div>

      <div className="product-card">
        <h3>{serialNo}</h3>
        <h2>{product.name}</h2>
        <h1>
          {product.currency}
          {product.price.toFixed(2)}
        </h1>

        <div>
          <button onClick={handleAddToCart}>
            <FontAwesomeIcon icon={faCartPlus} /> Add to Cart
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
