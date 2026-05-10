import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';
import { ApiError } from '../services/api';
import type { AuthUser, LoginPayload } from '../types/auth';

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    authService
      .me()
      .then(({ user }) => {
        if (!cancelled) setUser(user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<AuthUser | null> => {
    setLoading(true);
    setError(null);
    try {
      const { user } = await authService.login(payload);
      setUser(user);
      return user;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unexpected error';
      setUser(null);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
