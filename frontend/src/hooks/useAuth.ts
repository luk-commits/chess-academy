import { useCallback, useState } from 'react';
import { authService } from '../services/authService';
import { ApiError } from '../services/api';
import type { AuthUser, LoginPayload } from '../types/auth';

interface UseAuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<UseAuthState>({
    user: null,
    loading: false,
    error: null,
  });

  const login = useCallback(async (payload: LoginPayload): Promise<AuthUser | null> => {
    setState({ user: null, loading: true, error: null });
    try {
      const { user } = await authService.login(payload);
      setState({ user, loading: false, error: null });
      return user;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unexpected error';
      setState({ user: null, loading: false, error: message });
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setState({ user: null, loading: false, error: null });
  }, []);

  return { ...state, login, logout };
}
