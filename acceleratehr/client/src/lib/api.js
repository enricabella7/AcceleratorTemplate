const API_ORIGIN = import.meta.env.VITE_API_URL || '';
const BASE = API_ORIGIN + '/api';

export function uploadUrl(path) {
  return `${API_ORIGIN}/uploads/${path}`;
}

function getToken() {
  return localStorage.getItem('ahr_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('ahr_token', token);
  else localStorage.removeItem('ahr_token');
}

export function isAuthenticated() {
  return !!getToken();
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    setToken(null);
    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = '/admin/login';
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  put: (path, body) => request(path, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

// SWR fetcher
export const fetcher = (path) => request(path);
