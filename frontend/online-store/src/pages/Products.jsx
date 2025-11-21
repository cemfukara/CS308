import ProductDisplay from '../components/ProductDisplay/ProductDisplay';
import './Products.css';
import { useEffect, useState } from 'react';
import { getAllProducts } from '../lib/productsApi';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAllProducts()
      .then(data => {
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : [];

        setProducts(items);
      })
      .catch(err => setError(err.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Loading products...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="products-page">
      {products.map(product => {
        const imagePath = product.image
          ? new URL(`../assets/${product.image}`, import.meta.url).href
          : new URL(`../assets/placeholder.jpg`, import.meta.url).href;
        return (
          <ProductDisplay
            key={product.product_id || product.serial_number || product.name}
            image={imagePath}
            name={product.name}
            currency={product.currency || '$'}
            price={product.price}
            serialNo={product.serial_number}
            productId={product.product_id}
            model={product.model}
          />
        );
      })}
    </div>
  );
}

export default Products;
