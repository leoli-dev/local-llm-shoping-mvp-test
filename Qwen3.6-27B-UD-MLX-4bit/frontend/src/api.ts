const API_BASE = 'http://localhost:3001/api';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || `HTTP ${response.status}`);
  }
  return response.json();
}

// Auth
export const api = {
  auth: {
    register: (data: { username: string; email: string; password: string }) =>
      fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),

    login: (data: { email: string; password: string }) =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),

    me: () =>
      fetch(`${API_BASE}/auth/me`, { headers: authHeaders() }).then(handleResponse),
  },

  // Products
  products: {
    list: (params?: { page?: number; search?: string; category?: string }) =>
      fetch(
        `${API_BASE}/products?page=${params?.page || 1}&search=${params?.search || ''}&category=${params?.category || ''}`,
        { headers: {} }
      ).then(handleResponse),

    get: (id: number) =>
      fetch(`${API_BASE}/products/${id}`).then(handleResponse),

    categories: () =>
      fetch(`${API_BASE}/products/categories`).then(handleResponse),
  },

  // Cart
  cart: {
    get: () =>
      fetch(`${API_BASE}/cart`, { headers: authHeaders() }).then(handleResponse),

    addItem: (data: { product_id: number; quantity?: number }) =>
      fetch(`${API_BASE}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
      }).then(handleResponse),

    updateItem: (cartId: number, quantity: number) =>
      fetch(`${API_BASE}/cart/items/${cartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ quantity }),
      }).then(handleResponse),

    removeItem: (cartId: number) =>
      fetch(`${API_BASE}/cart/items/${cartId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).then(handleResponse),
  },

  // Orders
  orders: {
    create: () =>
      fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      }).then(handleResponse),

    list: (page = 1) =>
      fetch(`${API_BASE}/orders?page=${page}`, { headers: authHeaders() }).then(handleResponse),

    get: (id: number) =>
      fetch(`${API_BASE}/orders/${id}`, { headers: authHeaders() }).then(handleResponse),

    cancel: (id: number) =>
      fetch(`${API_BASE}/orders/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      }).then(handleResponse),
  },
};
