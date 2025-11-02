import { useParams } from 'react-router-dom';
import products from '../data/products.json';
import { useState } from 'react';
import './ProductDetails.css';
import useCartStore from '../store/cartStore';
function ProductDetails() {
  const { id: idParam = '' } = useParams();
  const addToCart = useCartStore(state => state.addToCart);
  const [fitMode, setFitMode] = useState('cover');
  const [loaded, setLoaded] = useState(false);

  const handleImageLoad = e => {
    e.target.naturalWidth > e.target.naturalHeight ? setFitMode('contain') : setFitMode('cover');
    setLoaded(true);
  };

  const serialNo = idParam.split('-').pop();
  const src = products.find(p => String(p.serialNo) === String(serialNo));
  src.id = serialNo;
  if (!src) {
    return (
      <div className="product-description">
        <h3>Product not found</h3>
      </div>
    );
  }
  const product = {
    ...src,
    quantity: src.quantity ?? 1,
  };
  const { name, currency, price, image } = product;
  const imageUrl = new URL(`../assets/${image}`, import.meta.url).href;
  return (
    <div className="product-description">
      <div className="product-img-container">
        <img
          src={imageUrl}
          className="product-img"
          loading="lazy"
          alt={`${name}`}
          onLoad={handleImageLoad}
          style={{
            objectFit: fitMode,
            opacity: loaded ? 1 : 0,
          }}
        ></img>
      </div>
      <div className="product-card">
        <p>{serialNo}</p>
        <h3>{name}</h3>
        <p>
          {currency}
          {price.toFixed(2)}
        </p>
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(product);
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductDetails;
