import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../api';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));

  useEffect(() => {
    if (token) {
      api.auth.me()
        .then(({ user: u }) => setUser(u))
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('auth_token', data.token);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const data = await api.auth.register({ username, email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('auth_token', data.token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
