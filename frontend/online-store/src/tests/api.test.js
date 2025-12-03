// api.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, API_BASE } from '../lib/api';

describe('api helper', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('api.get calls fetch with base url and returns parsed json', async () => {
    const mockJson = { hello: 'world' };

    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockJson),
    });

    const result = await api.get('/products');

    expect(globalThis.fetch).toHaveBeenCalledWith(`${API_BASE}/products`, {
      credentials: 'include',
    });

    expect(result).toEqual(mockJson);
  });

  it('api.get throws when response is not ok, using response text', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      text: vi.fn().mockResolvedValue('Bad Request from server'),
    });

    await expect(api.get('/broken')).rejects.toThrow('Bad Request from server');
  });

  it('api.post sends JSON body and parses response', async () => {
    const payload = { email: 'test@example.com' };
    const responseBody = { message: 'ok' };

    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(responseBody),
    });

    const result = await api.post('/users/login', payload);

    expect(globalThis.fetch).toHaveBeenCalledWith(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    expect(result).toEqual(responseBody);
  });
});
