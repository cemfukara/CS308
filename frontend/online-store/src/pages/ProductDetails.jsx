import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus, faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { useState, useEffect, useRef } from 'react';
import './ProductDetails.css';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';
import { getProductsById } from '../lib/productsApi';
import { formatPrice } from '@/utils/formatPrice';
import {
  fetchProductReviews,
  fetchProductRatingStats,
  createReview,
  updateReview,
} from '../lib/reviewApi';
import useAuthStore from '../store/authStore';
import { fetchWishlist, addToWishlist, removeFromWishlist } from '@/lib/wishlistApi';

function ProductDetails() {
  const { id: idParam = '' } = useParams();
  const addToCart = useCartStore(state => state.addToCart);
  const cart = useCartStore(state => state.cart);
  const user = useAuthStore(state => state.user);
  const isAuthenticated = !!user;
  const autoSlideRef = useRef(null);

  const [fitMode, setFitMode] = useState('cover');
  const [loaded, setLoaded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [myReview, setMyReview] = useState(null);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
          currency: data.currency,
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

  // Set liked state based on backend wishlist
  useEffect(() => {
    const loadLiked = async () => {
      if (!product?.product_id || !user) {
        setLiked(false);
        return;
      }

      try {
        const wishlist = await fetchWishlist();
        setLiked(wishlist.some(item => item.product_id === product.product_id));
      } catch (err) {
        console.error('Failed to load wishlist for product details', err);
        // don't toast here, just fail silently
      }
    };

    loadLiked();
  }, [product?.product_id, user?.user_id]);

  useEffect(() => {
    if (!product?.product_id) return;

    let cancelled = false;

    async function loadReviews() {
      try {
        setReviewsLoading(true);
        setReviewsError('');

        const [reviewList, stats] = await Promise.all([
          fetchProductReviews(product.product_id),
          fetchProductRatingStats(product.product_id),
        ]);
        console.log('REVIEWS LOADED:', reviewList);

        if (cancelled) return;

        setReviews(reviewList || []);
        setAverageRating(stats.average_rating || 0);
        setReviewCount(stats.review_count || 0);

        // find my review
        if (user) {
          const mine = (reviewList || []).find(r => r.user_id === user.user_id);
          setMyReview(mine || null);
          setRating(mine?.rating || 0);
          setComment(mine?.comment_text || '');
        } else {
          setMyReview(null);
          setRating(0);
          setComment('');
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load reviews:', err);
        setReviewsError(err.message || 'Failed to load reviews');
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    }

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [product?.product_id, user?.user_id]);

  // Create images for slider (safe even if product is not yet loaded)
  const placeholder = new URL(`../assets/placeholder.jpg`, import.meta.url).href;
  const product_images = product?.product_images || [];

  // If no images from backend, use placeholder as a single "image"
  const images = product_images.length > 0 ? product_images : [{ image_url: placeholder }];

  // Clamp currentImageIndex in case product changes
  const safeIndex =
    currentImageIndex >= 0 && currentImageIndex < images.length ? currentImageIndex : 0;

  const imagePath = images[safeIndex]?.image_url || placeholder;
  // 🔁 Auto-slide effect: move to next image every 4.5s
  useEffect(() => {
    if (images.length <= 1) return;

    resetAutoSlide();

    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [images.length]);

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

  const resetAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }

    autoSlideRef.current = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 4500);
  };

  const inStock = (product?.quantity_in_stock ?? 0) > 0; // Check if product is out of stock

  // ✅ Check favorites to set liked state
  const handleAddToFavorites = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!product?.product_id) return;

    try {
      if (liked) {
        await removeFromWishlist(product.product_id);
        setLiked(false);
        toast.error('Removed from favorites 💔', { position: 'top-right' });
      } else {
        await addToWishlist(product.product_id);
        setLiked(true);
        toast.success('Added to favorites ❤️', { position: 'top-right' });
      }
    } catch (err) {
      console.error('Failed to update wishlist', err);
      toast.error(err.message || 'Failed to update favorites', {
        position: 'top-right',
      });
    }
  };

  const handleRating = value => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setRating(value);
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5.');
      return;
    }

    try {
      setSubmittingReview(true);

      let saved;
      if (myReview) {
        // update existing review
        saved = await updateReview(myReview.review_id, {
          rating,
          comment_text: comment,
        });
        toast.success('Review updated ✅');
      } else {
        // create new review
        saved = await createReview(product.product_id, {
          rating,
          comment_text: comment,
        });
        toast.success('Review submitted ✅');
      }

      // update myReview + list
      setMyReview(saved);
      setReviews(prev => {
        const idx = prev.findIndex(r => r.review_id === saved.review_id);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [saved, ...prev];
      });

      // refresh stats from backend
      const stats = await fetchProductRatingStats(product.product_id);
      setAverageRating(stats.average_rating || 0);
      setReviewCount(stats.review_count || 0);
    } catch (err) {
      console.error('Failed to submit review:', err);
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || (product.quantity_in_stock ?? 0) <= 0) return;

    const prevQty = cart.find(item => item.product_id === product.product_id)?.quantity ?? 0;
    const stockLimit = product.quantity_in_stock ?? 0;

    // Check if we can add one more
    if (prevQty >= stockLimit) {
      toast.error(`Cannot add more. Only ${stockLimit} in stock.`, {
        position: 'top-right',
      });
      return;
    }

    const success = await addToCart(product, 1);

    if (!success) {
      toast.error(`Cannot add more. Only ${stockLimit} in stock.`, {
        position: 'top-right',
      });
      return;
    }

    const qtyInCart = prevQty + 1;
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
            width: '340px',
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
              {qtyInCart === 1 ? '1 item in cart' : `${qtyInCart} items in cart`}
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
              fontFamily: "'Exo 2', sans-serif",
              color: '#00e676',
            }}
          >
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
      ),
      {
        duration: 2500,
        position: 'top-right',
      }
    );
  };

  function renderAverageStars(avg) {
    const max = 5;
    const fullStars = Math.floor(avg);
    const hasHalf = avg % 1 >= 0.25 && avg % 1 <= 0.75;
    const stars = [];

    for (let i = 0; i < max; i++) {
      if (i < fullStars) {
        stars.push(<span key={i}>★</span>);
      } else if (i === fullStars && hasHalf) {
        stars.push(<span key={i}>⯪</span>);
      } else {
        stars.push(<span key={i}>☆</span>);
      }
    }

    return stars;
  }

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % images.length);
    resetAutoSlide();
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
    resetAutoSlide();
  };

  return (
    <div className="product-description">
      <div className="product-img-container">
        <div className="product-main-img-wrapper">
          {images.length > 1 && (
            <button type="button" className="img-nav img-nav-left" onClick={prevImage}>
              ‹
            </button>
          )}

          <img
            src={imagePath}
            className="product-img"
            loading="lazy"
            alt={product.name}
            onLoad={handleImageLoad}
            style={{ objectFit: fitMode, opacity: loaded ? 1 : 0 }}
          />

          {images.length > 1 && (
            <button type="button" className="img-nav img-nav-right" onClick={nextImage}>
              ›
            </button>
          )}
        </div>

        {images.length > 1 && (
          <div className="product-thumbs">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`thumb-btn ${idx === safeIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentImageIndex(idx);
                  resetAutoSlide();
                }}
              >
                <img src={img.image_url || placeholder} alt={`${product.name} ${idx + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-card">
        <h3>
          {product.model}/{product.serial_number}
        </h3>
        <div className="name-rating">
          <h2>{product.name}</h2>

          <div className="avg-stars" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {reviewCount > 0 ? (
              <>
                {renderAverageStars(averageRating)}
                <span style={{ fontSize: '14px', color: '#555' }}>({reviewCount})</span>
              </>
            ) : (
              <span style={{ color: '#777' }}>No reviews yet</span>
            )}
          </div>
        </div>

        <div className={`price-block ${product.discount_ratio !== '0.00' ? 'has-discount' : ''}`}>
          {product.discount_ratio !== '0.00' && (
            <span className="discount-badge-float">-{product.discount_ratio}%</span>
          )}

          <div className="price-main">
            <h1 className="price-now">{formatPrice(product.price, product.currency)}</h1>

            {product.discount_ratio !== '0.00' && (
              <div className="price-meta">
                <span className="price-was">
                  {formatPrice(product.list_price, product.currency)}
                </span>

                <span className="price-save">
                  You save {formatPrice(product.list_price - product.price, product.currency)}
                </span>
              </div>
            )}
          </div>
        </div>

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
        <div className="review-form">
          <div className="rating-stars" style={{ marginRight: 'auto' }}>
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
        <textarea
          placeholder="Share your thoughts..."
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        <div>
          <button
            className="product-comment-btn"
            disabled={submittingReview}
            onClick={handleSubmitReview}
          >
            {submittingReview ? 'Submitting…' : myReview ? 'Update Review' : 'Comment'}
          </button>
        </div>
        <div className="reviews-section">
          {reviewsLoading && <p>Loading reviews…</p>}
          {reviewsError && <p className="reviews-error">{reviewsError}</p>}

          {!reviewsLoading && !reviewsError && reviews.length > 0 && (
            <>
              <h4>Customer Reviews</h4>
              <ul className="reviews-list">
                {reviews.map(rev => (
                  <li key={rev.review_id} className="review-item">
                    {rev.rating ? (
                      <div className="review-rating">
                        {'★'.repeat(rev.rating)}
                        <span className="review-rating-text">{rev.rating}/5</span>
                      </div>
                    ) : (
                      <div className="review-rating review-empty">No rating</div>
                    )}

                    <p className="review-comment">{rev.comment_text ?? 'No comment provided.'}</p>

                    {rev.created_at && (
                      <span className="review-date">
                        {new Date(rev.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                    {user && rev.user_id === user.user_id && rev.rating && (
                      <span className="review-badge">Your review</span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {!reviewsLoading && !reviewsError && reviews.length === 0 && (
            <p className="no-reviews-text">No reviews yet. Be the first to review this product!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
