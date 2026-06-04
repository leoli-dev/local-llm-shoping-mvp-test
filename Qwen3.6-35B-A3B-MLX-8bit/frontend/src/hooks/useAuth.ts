import { useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      try {
        JSON.parse(tokens);
        // Token exists, user is authenticated
      } catch {
        localStorage.removeItem('tokens');
      }
    }
    setLoading(false);
  }, []);

  const setUserFromLogin = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  return { user, loading, isAuthenticated: !!user, setUserFromLogin, clearUser };
}
