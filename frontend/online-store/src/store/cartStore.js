import { create } from 'zustand';

const useCartStore = create(set => ({
  cart: [],
  addToCart: product =>
    set(state => {
      const existingItem = state.cart.find(item => item.id === product.id);
      if (existingItem) {
        return {
          cart: state.cart.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      } else {
        return {
          cart: [...state.cart, { ...product, quantity: 1 }],
        };
      }
    }),
  updateQuantity: (id, quantity) =>
    set(state => ({
      cart: state.cart.map(item =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity || 1) } : item
      ),
    })),

  removeFromCart: id =>
    set(state => ({
      cart: state.cart.filter(item => item.id !== id),
    })),
  clearCart: () => set({ cart: [] }),
}));

export default useCartStore;
