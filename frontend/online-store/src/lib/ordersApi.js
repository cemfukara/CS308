import { api } from './api';

export const getOrders = () => api.get('/orders');
export const getOrderById = id => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status });
export const createOrder = payload => api.post('/orders', payload);
export const validatePayment = payload => api.post('/payment/validate', payload);
