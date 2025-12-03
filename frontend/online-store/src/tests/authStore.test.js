// src/tests/authStore.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import useAuthStore from '../store/authStore';

const originalFetch = globalThis.fetch;

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('has null user and loading=true initially', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(true);
  });

  it('setUser updates user and sets loading=false', () => {
    const { setUser } = useAuthStore.getState();
    const fakeUser = { id: 1, fullName: 'Test User' };

    setUser(fakeUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(fakeUser);
    expect(state.loading).toBe(false);
  });

  it('fetchProfile sets user and loading=false on success', async () => {
    const fakeUser = { id: 42, fullName: 'Profile User' };

    const mockJson = vi.fn().mockResolvedValue(fakeUser);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: mockJson,
    });

    globalThis.fetch = mockFetch;

    const { fetchProfile } = useAuthStore.getState();
    await fetchProfile();

    expect(mockFetch).toHaveBeenCalledWith('/api/users/profile', {
      credentials: 'include',
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(fakeUser);
    expect(state.loading).toBe(false);
  });

  it('fetchProfile sets user=null and loading=false on error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn(),
    });

    globalThis.fetch = mockFetch;

    useAuthStore.setState({ user: { id: 1 }, loading: true });

    const { fetchProfile } = useAuthStore.getState();
    await fetchProfile();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('logout clears user state', () => {
    // simulate logged-in
    useAuthStore.setState({ user: { id: 1 }, loading: false });

    const { logout } = useAuthStore.getState();
    logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
  });
});
