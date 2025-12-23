import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroSlider from '@/components/HeroSlider';
import { getFeaturedProduct } from '@/lib/productsApi';
import { formatPrice } from '@/utils/formatPrice';
import useCurrencyStore from '@/store/currencyStore';
import './Home.css';

function Home() {
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get currency conversion
  const { selectedCurrency, convertAmount } = useCurrencyStore();

  useEffect(() => {
    let cancelled = false;

    async function loadFeatured() {
      try {
        setLoading(true);
        setError('');

        const data = await getFeaturedProduct();
        if (!cancelled) setFeatured(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('Failed to load featured product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFeatured();
    return () => {
      cancelled = true;
    };
  }, []);

  const image =
    featured?.product_images?.[0]?.image_url ||
    new URL('../assets/placeholder.jpg', import.meta.url).href;

  return (
    <div className="home">
      {/* HERO */}
      <HeroSlider />

      {/* CTA */}
      <div className="home-cta">
        <Link to="/products" className="home-cta-btn">
          Start Shopping
        </Link>
      </div>

      {/* FEATURED */}
      <section className="featured-section">
        <h2 className="featured-title">🔥 Best Deal Right Now</h2>

        {loading && <div className="featured-card loading">Loading featured product…</div>}

        {!loading && error && <div className="featured-card error">{error}</div>}

        {!loading && !error && !featured && (
          <div className="featured-card empty">No discounted products available.</div>
        )}

        {!loading && !error && featured && (
          <div className="featured-card">
            {/* Discount badge */}
            {featured.discount_ratio > 0 && (
              <span className="featured-badge">-{Math.round(featured.discount_ratio)}%</span>
            )}

            <img src={image} alt={featured.name} className="featured-image" />

            <div className="featured-content">
              <h3>{featured.name}</h3>

              <p className="featured-description">{featured.description}</p>

              <div className="featured-price">
                {featured.list_price > featured.price && (
                  <span className="featured-old-price">
                    {formatPrice(
                      convertAmount(featured.list_price, featured.currency, selectedCurrency),
                      selectedCurrency
                    )}
                  </span>
                )}

                <span className="featured-new-price">
                  {formatPrice(
                    convertAmount(featured.price, featured.currency, selectedCurrency),
                    selectedCurrency
                  )}
                </span>

                {featured.discount_amount > 0 && (
                  <span className="featured-save">
                    You save {formatPrice(
                      convertAmount(featured.discount_amount, featured.currency, selectedCurrency),
                      selectedCurrency
                    )}
                  </span>
                )}
              </div>

              <Link to={`/products/${featured.product_id}`} className="featured-btn">
                View Product
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
