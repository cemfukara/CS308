import { create } from 'zustand';

// ✅ Helper functions for localStorage
const loadCart = () => {
  if (typeof window === 'undefined') return [];
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
    const existing = cart.find(p => p.product_id === item.product_id);

    const currentQty = existing ? existing.quantity : 0;
    const newQty = currentQty + qty;

    // Check stock limit
    const stockLimit = item.quantity_in_stock ?? 0;
    if (newQty > stockLimit) {
      // Return false to indicate failure
      return false;
    }

    if (existing) {
      existing.quantity = newQty;
    } else {
      cart.push({ ...item, quantity: qty });
    }

    saveCart(cart);
    set({ cart });
    return true;
  },

  updateQuantity: (id, quantity) => {
    const cart = get().cart.map(p => {
      if (p.product_id === id) {
        const stockLimit = p.quantity_in_stock ?? 999999;
        return { ...p, quantity: Math.max(1, Math.min(quantity, stockLimit)) };
      }
      return p;
    });

    saveCart(cart);
    set({ cart });
  },

  removeFromCart: id => {
    const cart = get().cart.filter(p => p.product_id !== id);
    saveCart(cart);
    set({ cart });
  },

  clearCart: () => {
    localStorage.removeItem('cart');
    set({ cart: [] });
  },
}));

export default useCartStore;
