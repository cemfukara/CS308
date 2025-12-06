import ProductDisplay from '@/components/ProductDisplay/ProductDisplay';
import './Products.css';
import { useEffect, useState } from 'react';
import { getAllProducts } from '@/lib/productsApi';
import { formatPrice } from '@/utils/formatPrice';

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
        const primaryImage =
          product.product_images?.find(img => img.is_primary)?.image_url ||
          product.product_images?.[0]?.image_url ||
          new URL(`../assets/placeholder.jpg`, import.meta.url).href;
        return (
          <ProductDisplay
            key={product.product_id || product.serial_number || product.name}
            image={primaryImage}
            name={product.name}
            price={formatPrice(product.price, product.currency)}
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
