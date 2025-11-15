import { create } from 'zustand';

// ✅ Helper functions for localStorage
const loadCart = () => {
  try {
    return JSON.parse(localStorage.getItem('cart')) || [];
  } catch {
    return [];
  }
};

const saveCart = cart => {
  localStorage.setItem('cart', JSON.stringify(cart));
};

// ✅ Zustand store with persistence
const useCartStore = create((set, get) => ({
  cart: loadCart(),

  addToCart: (item, qty = 1) => {
    const cart = [...get().cart];
    const existing = cart.find(p => p.id === item.id);

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({ ...item, quantity: qty });
    }

    saveCart(cart);
    set({ cart });
  },

  updateQuantity: (id, quantity) => {
    const cart = get().cart.map(p => (p.id === id ? { ...p, quantity: Math.max(1, quantity) } : p));

    saveCart(cart);
    set({ cart });
  },

  removeFromCart: id => {
    const cart = get().cart.filter(p => p.id !== id);
    saveCart(cart);
    set({ cart });
  },

  clearCart: () => {
    localStorage.removeItem('cart');
    set({ cart: [] });
  },
}));

export default useCartStore;
