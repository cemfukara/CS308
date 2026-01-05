import { create } from 'zustand';
import useCartStore from './cartStore';

const useAuthStore = create(set => ({
  user: null,
  loading: true,

  setUser: user => {
    set({ user, loading: false });
    // Sync cart when user changes
    useCartStore.getState().syncCart(user);
  },

  fetchProfile: async () => {
    try {
      const res = await fetch('/api/users/profile', {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Not logged in');

      const data = await res.json();
      set({ user: data, loading: false });
      // Sync cart after fetching profile
      useCartStore.getState().syncCart(data);
    } catch (err) {
      set({ user: null, loading: false });
      // Clear cart when not logged in
      useCartStore.getState().syncCart(null);
    }
  },

  logout: () => {
    document.cookie = 'token=; Max-Age=0; path=/;';
    set({ user: null });
    // Clear cart on logout
    useCartStore.getState().syncCart(null);
  },
}));

export default useAuthStore;