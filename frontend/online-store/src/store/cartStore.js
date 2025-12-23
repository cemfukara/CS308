import { create } from 'zustand';
import * as cartApi from '../lib/cartApi';

// ✅ Helper functions for localStorage (guest users)
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

// ✅ Zustand store with hybrid localStorage + backend support
const useCartStore = create((set, get) => ({
  cart: loadCart(),
  isAuthenticated: false,
  loading: false,

  // Set authentication status
  setAuthenticated: (isAuth) => {
    set({ isAuthenticated: isAuth });
  },

  // Sync cart when user logs in/out
  syncCart: async (user) => {
    if (user) {
      // User logged in - merge guest cart with backend cart
      try {
        set({ loading: true });

        // 1. Save guest cart items from localStorage before clearing
        const guestCart = loadCart();

        // 2. Load backend cart
        const { items } = await cartApi.getCart();

        // 3. Merge guest cart items into backend cart
        if (guestCart.length > 0) {
          console.log('Merging guest cart items:', guestCart);

          // Add each guest item to backend cart
          for (const guestItem of guestCart) {
            try {
              await cartApi.addToCart(guestItem.product_id, guestItem.quantity);
            } catch (error) {
              console.error(`Failed to merge item ${guestItem.name}:`, error);
              // Continue merging other items even if one fails
            }
          }

          // Reload cart from backend after merging
          const { items: updatedItems } = await cartApi.getCart();

          // Transform backend items to match frontend format
          const transformedCart = updatedItems.map(item => ({
            product_id: item.product_id,
            name: item.name,
            model: item.model,
            price: item.price,
            currency: item.currency || 'TL', // Add currency field
            quantity: item.quantity,
            quantity_in_stock: item.quantity_in_stock,
            image_url: item.image_url,
            alt_text: item.alt_text,
          }));

          // Clear localStorage and use merged backend cart
          localStorage.removeItem('cart');
          set({ cart: transformedCart, isAuthenticated: true, loading: false });
        } else {
          // No guest cart to merge, just use backend cart
          // Transform backend items to match frontend format
          const transformedCart = items.map(item => ({
            product_id: item.product_id,
            name: item.name,
            model: item.model,
            price: item.price,
            currency: item.currency || 'TL',
            quantity: item.quantity,
            quantity_in_stock: item.quantity_in_stock,
            image_url: item.image_url,
            alt_text: item.alt_text,
          }));

          // Clear localStorage and use backend cart
          localStorage.removeItem('cart');
          set({ cart: transformedCart, isAuthenticated: true, loading: false });
        }
      } catch (error) {
        console.error('Failed to sync cart:', error);
        set({ loading: false });
      }
    } else {
      // User logged out - clear cart and use localStorage
      localStorage.removeItem('cart');
      set({ cart: [], isAuthenticated: false, loading: false });
    }
  },

  // Add to cart (supports both authenticated and guest)
  addToCart: async (item, qty = 1) => {
    const { isAuthenticated } = get();

    if (isAuthenticated) {
      // Authenticated: Use backend API
      try {
        await cartApi.addToCart(item.product_id, qty);

        // Refresh cart from backend
        const { items } = await cartApi.getCart();
        const transformedCart = items.map(i => ({
          product_id: i.product_id,
          name: i.name,
          model: i.model,
          price: i.price,
          currency: i.currency || 'TL',
          quantity: i.quantity,
          quantity_in_stock: i.quantity_in_stock,
          image_url: i.image_url,
          alt_text: i.alt_text,
        }));

        set({ cart: transformedCart });
        return true;
      } catch (error) {
        console.error('Failed to add to cart:', error);
        return false;
      }
    } else {
      // Guest: Use localStorage
      const cart = [...get().cart];
      const existing = cart.find(p => p.product_id === item.product_id);

      const currentQty = existing ? existing.quantity : 0;
      const newQty = currentQty + qty;

      // Check stock limit
      const stockLimit = item.quantity_in_stock ?? 0;
      if (newQty > stockLimit) {
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
    }
  },

  // Update quantity (supports both authenticated and guest)
  updateQuantity: async (id, quantity) => {
    const { isAuthenticated, cart } = get();

    if (isAuthenticated) {
      // Authenticated: Use backend API to update quantity directly
      try {
        await cartApi.updateCartItemQuantity(id, quantity);

        // Refresh cart from backend
        const { items } = await cartApi.getCart();
        const transformedCart = items.map(i => ({
          product_id: i.product_id,
          name: i.name,
          model: i.model,
          price: i.price,
          currency: i.currency || 'TL',
          quantity: i.quantity,
          quantity_in_stock: i.quantity_in_stock,
          image_url: i.image_url,
          alt_text: i.alt_text,
        }));

        set({ cart: transformedCart });
      } catch (error) {
        console.error('Failed to update quantity:', error);
        throw error; // Re-throw to let caller handle
      }
    } else {
      // Guest: Use localStorage
      const updatedCart = cart.map(p => {
        if (p.product_id === id) {
          const stockLimit = p.quantity_in_stock ?? 999999;
          return { ...p, quantity: Math.max(1, Math.min(quantity, stockLimit)) };
        }
        return p;
      });

      saveCart(updatedCart);
      set({ cart: updatedCart });
    }
  },

  // Remove from cart (supports both authenticated and guest)
  removeFromCart: async (id) => {
    const { isAuthenticated } = get();

    if (isAuthenticated) {
      // Authenticated: Use backend API
      try {
        await cartApi.removeFromCart(id);

        // Refresh cart from backend
        const { items } = await cartApi.getCart();
        const transformedCart = items.map(i => ({
          product_id: i.product_id,
          name: i.name,
          model: i.model,
          price: i.price,
          currency: i.currency || 'TL',
          quantity: i.quantity,
          quantity_in_stock: i.quantity_in_stock,
          image_url: i.image_url,
          alt_text: i.alt_text,
        }));

        set({ cart: transformedCart });
      } catch (error) {
        console.error('Failed to remove from cart:', error);
      }
    } else {
      // Guest: Use localStorage
      const cart = get().cart.filter(p => p.product_id !== id);
      saveCart(cart);
      set({ cart });
    }
  },

  // Clear cart (supports both authenticated and guest)
  clearCart: async () => {
    const { isAuthenticated } = get();

    if (isAuthenticated) {
      // Authenticated: Use backend API
      try {
        await cartApi.clearCart();
        set({ cart: [] });
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    } else {
      // Guest: Use localStorage
      localStorage.removeItem('cart');
      set({ cart: [] });
    }
  },
}));

export default useCartStore;

