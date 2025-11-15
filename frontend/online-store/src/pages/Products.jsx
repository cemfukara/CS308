import ProductDisplay from '../components/ProductDisplay/ProductDisplay';
import products from '../data/products.json';
import './Products.css';

function Products() {
  return (
    <div className="products-page">
      {products.map(product => {
        const imagePath = new URL(`../assets/${product.image}`, import.meta.url).href;
        return (
          <ProductDisplay
            image={imagePath}
            name={product.name}
            currency={product.currency}
            price={product.price}
            serialNo={product.serialNo}
            key={product.serialNo}
          />
        );
      })}
    </div>
  );
}

export default Products;
