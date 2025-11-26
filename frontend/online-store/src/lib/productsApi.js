import { api } from './api';

// GET all products with optional filters (search, category, sort, pagination)
export const getAllProducts = (options = {}) => {
  const params = new URLSearchParams();

  const { search, category, sortBy, sortOrder, page, limit } = options;

  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (sortBy) params.set('sortBy', sortBy);
  if (sortOrder) params.set('sortOrder', sortOrder);
  if (page != null) params.set('page', page);
  if (limit != null) params.set('limit', limit);

  const query = params.toString();
  const url = query ? `/products?${query}` : '/products';

  return api.get(url);
};

export const getProductsByCategory = categoryId => getAllProducts({ category: categoryId });

export const getProductsById = productId => api.get(`/products/${productId}`);

export const deleteProduct = productId => api.del(`/products/${productId}`);

export const createProduct = payload => {
  return api.post('/products', payload);
};

export const updateProduct = (productId, payload) => {
  return api.put(`/products/${productId}`, payload);
};

export const getCategories = () => {
  return api.get('/categories');
};
