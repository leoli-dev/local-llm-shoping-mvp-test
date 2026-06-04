const API_BASE = 'http://localhost:3001/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  auth: {
    register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => apiRequest('/auth/me')
  },
  products: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/products?${query}`);
    },
    detail: (id) => apiRequest(`/products/${id}`),
    categories: () => apiRequest('/products/categories')
  },
  cart: {
    get: () => apiRequest('/cart'),
    addItem: (data) => apiRequest('/cart/items', { method: 'POST', body: JSON.stringify(data) }),
    updateItem: (itemId, quantity) => apiRequest(`/cart/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
    removeItem: (itemId) => apiRequest(`/cart/items/${itemId}`, { method: 'DELETE' })
  },
  orders: {
    list: () => apiRequest('/orders'),
    detail: (id) => apiRequest(`/orders/${id}`),
    create: (data) => apiRequest('/orders', { method: 'POST', body: JSON.stringify(data) }),
    cancel: (id) => apiRequest(`/orders/${id}/cancel`, { method: 'PATCH' })
  }
};
