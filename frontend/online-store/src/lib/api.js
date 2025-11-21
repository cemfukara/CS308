export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function handle(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: path => fetch(`${API_BASE}${path}`, { credentials: 'include' }).then(handle),

  post: (path, body) =>
    fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    }).then(handle),

  put: (path, body) =>
    fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    }).then(handle),

  del: path =>
    fetch(`${API_BASE}${path}`, { method: 'DELETE', credentials: 'include' }).then(handle),
};
