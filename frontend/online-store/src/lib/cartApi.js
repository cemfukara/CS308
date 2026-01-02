// API client for cart operations (authenticated users only)

const API_BASE = '/api/cart';

/**
 * Get user's cart from backend
 * @returns {Promise<{cart: Object, items: Array}>}
 */
export async function getCart() {
  const res = await fetch(API_BASE, {
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch cart');
  }

  return res.json();
}

/**
 * Add item to cart
 * @param {number} productId
 * @param {number} quantity
 * @returns {Promise<Object>}
 */
export async function addToCart(productId, quantity = 1) {
  const res = await fetch(`${API_BASE}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId, quantity }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to add item to cart');
  }

  return data;
}

/**
 * Update cart item quantity
 * @param {number} productId
 * @param {number} quantity
 * @returns {Promise<Object>}
 */
export async function updateCartItemQuantity(productId, quantity) {
  const res = await fetch(`${API_BASE}/items/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ quantity }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to update cart item quantity');
  }

  return data;
}

/**
 * Remove item from cart
 * @param {number} productId
 * @returns {Promise<Object>}
 */
export async function removeFromCart(productId) {
  const res = await fetch(`${API_BASE}/remove/${productId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to remove item from cart');
  }

  return data;
}

/**
 * Clear all items from cart
 * @returns {Promise<Object>}
 */
export async function clearCart() {
  const res = await fetch(`${API_BASE}/clear`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to clear cart');
  }

  return data;
}
