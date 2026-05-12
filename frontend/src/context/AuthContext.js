import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { ApiError } from '../services/api';
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
            if (!cancelled)
                setUser(user);
        })
            .catch(() => {
            if (!cancelled)
                setUser(null);
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
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
    const login = useCallback(async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const { user } = await authService.login(payload);
            setUser(user);
            return user;
        }
        catch (err) {
            const message = err instanceof ApiError ? err.message : 'Unexpected error';
            setUser(null);
            setError(message);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
        setError(null);
    }, []);
    return (_jsx(AuthContext.Provider, { value: { user, loading, error, login, logout }, children: children }));
}
