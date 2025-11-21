import { api } from './api';

export const getAllProducts = () => api.get('/products');
export const getProductsByCategory = categoryId => api.get(`/products/category/${categoryId}`);
export const getProductsById = productId => api.get(`/products/${productId}`);
