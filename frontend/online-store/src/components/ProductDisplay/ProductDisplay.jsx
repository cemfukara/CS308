import { Link } from 'react-router-dom';
import './ProductDisplay.css';
import { useState } from 'react';
function ProductDisplay({ image, name, currency, price, serialNo, productId, model }) {
  const [fitMode, setFitMode] = useState('cover');
  const [loaded, setLoaded] = useState(false);
  const handleImageLoad = e => {
    e.target.naturalWidth > e.target.naturalHeight ? setFitMode('contain') : setFitMode('cover');
    setLoaded(true);
  };

  return (
    <Link
      to={`/products/${name.toLowerCase().replace(/ /g, '-')}-${serialNo}-${productId}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="product-display">
        <img
          className={`product-image ${loaded ? 'fade-in' : ''}`}
          src={image}
          alt="Product Image"
          onLoad={handleImageLoad}
          style={{
            objectFit: fitMode,
            opacity: loaded ? 1 : 0,
          }}
          loading="lazy"
        />

        <div className="product-details">
          <p className="product-serialno">
            {model}/{serialNo}
          </p>
          <p className="product-name">{name}</p>
          <p className="product-price">
            {currency}
            {price}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default ProductDisplay;
