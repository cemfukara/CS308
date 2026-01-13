import { api, API_BASE } from './api';

export const getOrders = () => api.get('/orders');
export const getOrderById = id => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status });
export const createOrder = payload => api.post('/orders', payload);
export const validatePayment = payload => api.post('/payment/validate', payload);
export const cancelOrder = (id) => api.post(`/orders/${id}/cancel`);

export const downloadInvoice = async (orderId) => {
    const res = await fetch(`${API_BASE}/invoice/${orderId}/pdf`, {
        credentials: 'include',
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to download PDF');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
};