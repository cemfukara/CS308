// src/tests/cartStore.test.js
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import useCartStore from '../store/cartStore';

// Simple in-memory localStorage mock, shared by all tests in this file
beforeAll(() => {
  const store = {};

  globalThis.localStorage = {
    getItem: key => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: key => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(k => delete store[k]);
    },
  };
});

describe('cartStore', () => {
  beforeEach(() => {
    // reset storage + store state before each test
    localStorage.clear();
    useCartStore.setState({ cart: [] });
  });

  it('starts with empty cart when localStorage is empty', () => {
    const { cart } = useCartStore.getState();
    expect(cart).toEqual([]);

    const stored = localStorage.getItem('cart');
    expect(stored === null || stored === '[]').toBe(true);
  });

  it('addToCart adds an item and persists to localStorage', () => {
    const { addToCart } = useCartStore.getState();

    const product = {
      product_id: 1,
      name: 'Photon X1',
      price: 999.99,
    };

    // adjust quantity arg if your store signature is different
    addToCart(product, 2);

    const state = useCartStore.getState();
    expect(state.cart).toHaveLength(1);
    expect(state.cart[0]).toMatchObject({
      product_id: 1,
      name: 'Photon X1',
      quantity: 2,
    });

    const stored = JSON.parse(localStorage.getItem('cart'));
    expect(stored).toHaveLength(1);
    expect(stored[0].product_id).toBe(1);
  });

  it('removeFromCart removes by product_id and updates storage', () => {
    const initialCart = [
      { product_id: 1, name: 'A', quantity: 1 },
      { product_id: 2, name: 'B', quantity: 1 },
    ];

    useCartStore.setState({ cart: initialCart });
    localStorage.setItem('cart', JSON.stringify(initialCart));

    const { removeFromCart } = useCartStore.getState();
    // if your store uses a different signature, adjust here
    removeFromCart(1);

    const state = useCartStore.getState();
    expect(state.cart.map(p => p.product_id)).toEqual([2]);

    const stored = JSON.parse(localStorage.getItem('cart'));
    expect(stored.map(p => p.product_id)).toEqual([2]);
  });

  it('clearCart clears cart and removes localStorage key', () => {
    const initialCart = [{ product_id: 1, name: 'A', quantity: 1 }];

    useCartStore.setState({ cart: initialCart });
    localStorage.setItem('cart', JSON.stringify(initialCart));

    const { clearCart } = useCartStore.getState();
    clearCart();

    expect(useCartStore.getState().cart).toEqual([]);
    expect(localStorage.getItem('cart')).toBeNull();
  });
});
