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

  /**
   * On mount, attempt to restore the session by calling GET /api/me.
   * If the HttpOnly cookie still contains a valid JWT, the server returns the user.
   * The `cancelled` flag prevents state updates after the component unmounts
   * (avoids React warning about setState on unmounted component).
   */
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

  /**
   * Login: call the API, set user state optimistically on success,
   * or extract the server error message and expose it via `error` state.
   * The actual JWT is stored as an HttpOnly cookie by the server — the frontend
   * never reads the token directly.
   */
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
    try {
      await authService.logout();
    } catch {
      // Even if the API call fails (e.g. expired token), clear local state
      // so the user gets redirected to login.
    }
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
