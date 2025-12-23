import ProductDisplay from '@/components/ProductDisplay/ProductDisplay';
import './Products.css';
import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllProducts } from '@/lib/productsApi';
import { formatPrice } from '@/utils/formatPrice';
import Dropdown from '@/components/Dropdown';

// Map category slugs from Navbar → DB category_id
const CATEGORY_SLUG_TO_ID = {
  smartphones: 1,
  laptops: 2,
  audio: 3,
  accessories: 4,
  cases: 4,
  chargers: 4,
  desktops: 2,
  monitors: 2,
  headphones: 3,
  keyboards: 4,
  mice: 4,
};

function getCategoryIdFromSlug(slug) {
  if (!slug) return undefined;
  return CATEGORY_SLUG_TO_ID[slug.toLowerCase()];
}

// Map UI sort value → backend sortBy/sortOrder
function mapSortValue(value) {
  switch (value) {
    case 'price_asc':
      return { sortBy: 'price', sortOrder: 'ASC' };
    case 'price_desc':
      return { sortBy: 'price', sortOrder: 'DESC' };
    case 'popularity_desc':
      return { sortBy: 'order_count', sortOrder: 'DESC' };
    default:
      return { sortBy: 'product_id', sortOrder: 'ASC' };
  }
}

function Products() {
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // just for displaying in UI
  const [searchTerm, setSearchTerm] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [sortValue, setSortValue] = useState('');
  const [limitValue, setLimitValue] = useState(12);
  const [page, setPage] = useState(1);

  // 🔥 SINGLE EFFECT: parse URL + fetch products
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const search = params.get('search') || '';
    const category = params.get('category') || '';
    const sort = params.get('sort') || '';
    const limitParam = parseInt(params.get('limit') || '', 10);
    const pageParam = parseInt(params.get('page') || '', 10);

    const limit = !Number.isNaN(limitParam) && limitParam > 0 ? limitParam : 12;
    const currentPage = !Number.isNaN(pageParam) && pageParam > 0 ? pageParam : 1;

    // update display state
    setSearchTerm(search);
    setCategorySlug(category);
    setSortValue(sort);
    setLimitValue(limit);
    setPage(currentPage);

    const { sortBy, sortOrder } = mapSortValue(sort);
    const categoryId = getCategoryIdFromSlug(category);

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getAllProducts({
          search: search || undefined,
          sortBy,
          sortOrder,
          category: categoryId || undefined,
          limit,
          page: currentPage,
        });

        const data = res.data || res; // api wrapper might already return data

        const items = Array.isArray(data.products)
          ? data.products
          : Array.isArray(data)
            ? data
            : [];

        setProducts(items);
        setTotalCount(typeof data?.totalCount === 'number' ? data.totalCount : items.length);
      } catch (err) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [location.search]);

  const totalPages = useMemo(() => {
    if (!limitValue) return 1;
    return Math.max(1, Math.ceil(totalCount / limitValue));
  }, [totalCount, limitValue]);

  // URL-updating handlers

  const handleLimitChange = newLimit => {
    const params = new URLSearchParams(location.search);
    params.set('limit', newLimit);
    params.set('page', '1');
    navigate(`/products?${params.toString()}`);
  };

  const handleSortChange = newSort => {
    const params = new URLSearchParams(location.search);
    if (newSort) params.set('sort', newSort);
    else params.delete('sort');
    params.set('page', '1');
    navigate(`/products?${params.toString()}`);
  };

  const handlePageChange = newPage => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(location.search);
    params.set('page', String(newPage));
    navigate(`/products?${params.toString()}`);
  };

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const pages = [];
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let p = start; p <= end; p += 1) pages.push(p);
    return pages;
  }, [page, totalPages]);

  if (loading) return <p className="loading">Loading products...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="products-page">
      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="products-summary">
          {searchTerm ? (
            <span>
              Showing results for <strong>"{searchTerm}"</strong>
            </span>
          ) : categorySlug ? (
            <span>
              Category: <strong>{categorySlug}</strong>
            </span>
          ) : (
            <span>All products</span>
          )}
          {totalCount > 0 && (
            <span className="products-count">
              {' '}
              · {totalCount} item{totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="products-controls">
          <Dropdown
            label="Items per page"
            value={String(limitValue)}
            onChange={handleLimitChange}
            options={[
              { label: '4', value: '4' },
              { label: '8', value: '8' },
              { label: '12', value: '12' },
              { label: '24', value: '24' },
              { label: '48', value: '48' },
            ]}
          />

          <Dropdown
            label="Sort by"
            value={sortValue}
            onChange={handleSortChange}
            options={[
              { label: 'Default', value: '' },
              { label: 'Price: Low → High', value: 'price_asc' },
              { label: 'Price: High → Low', value: 'price_desc' },
              { label: 'Popularity', value: 'popularity_desc' },
            ]}
          />
        </div>
      </div>

      {/* Product cards */}
      <div className="products-grid">
        {products.length === 0 && <p className="no-results">No products found.</p>}

        {products.map(product => {
          const primaryImage =
            product.product_images?.find(img => img.is_primary)?.image_url ||
            product.product_images?.[0]?.image_url ||
            new URL('../assets/placeholder.jpg', import.meta.url).href;

          return (
            <ProductDisplay
              key={product.product_id || product.serial_number || product.name}
              image={primaryImage}
              name={product.name}
              currency={product.currency}
              price={product.price}
              serialNo={product.serial_number}
              productId={product.product_id}
              model={product.model}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button type="button" onClick={() => handlePageChange(1)} disabled={page === 1}>
            «
          </button>
          <button type="button" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
            ‹
          </button>

          {pageNumbers.map(p => (
            <button
              key={p}
              type="button"
              className={p === page ? 'active' : ''}
              onClick={() => handlePageChange(p)}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}

export default Products;
