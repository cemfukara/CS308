import { create } from 'zustand';

const useAuthStore = create(set => ({
  user: null,
  loading: true,

  setUser: user => set({ user, loading: false }), // ✅ NEW

  fetchProfile: async () => {
    try {
      const res = await fetch('/api/users/profile', {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Not logged in');

      const data = await res.json();
      set({ user: data, loading: false });
    } catch (err) {
      set({ user: null, loading: false });
    }
  },

  logout: () => {
    document.cookie = 'token=; Max-Age=0; path=/;';
    set({ user: null });
  },
}));

export default useAuthStore;
