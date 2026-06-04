import type { AuthResponse } from './types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

let tokens: TokenPair | null = JSON.parse(localStorage.getItem('tokens') || 'null');
let isRefreshing = false;

function saveTokens(t: TokenPair | null) {
  tokens = t;
  if (t) {
    localStorage.setItem('tokens', JSON.stringify(t));
  } else {
    localStorage.removeItem('tokens');
  }
}

function getTokens(): TokenPair | null {
  return tokens;
}

async function refreshToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens!.refreshToken })
  });

  if (!res.ok) {
    saveTokens(null);
    window.location.hash = '#/login';
    throw new Error('Session expired');
  }

  const data = await res.json() as { accessToken: string };
  saveTokens({ ...tokens!, accessToken: data.accessToken });
  return data.accessToken;
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };

  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  // Handle 401 with token refresh
  if (res.status === 401 && !isRefreshing) {
    isRefreshing = true;
    try {
      const newToken = await refreshToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    } finally {
      isRefreshing = false;
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error || 'Request failed');
  }

  return res.json() as Promise<T>;
}

// Auth helpers
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error || 'Login failed');
  }

  const data = await res.json() as AuthResponse;
  saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error || 'Registration failed');
  }

  const data = await res.json() as AuthResponse;
  saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export function logout() {
  saveTokens(null);
  window.location.hash = '#/login';
}

export function isAuthenticated(): boolean {
  return !!tokens?.accessToken;
}

export { getTokens };
