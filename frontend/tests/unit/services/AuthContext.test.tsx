import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from '../../../src/context/AuthContext';

vi.mock('../../../src/services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
  },
}));

const mockUser = { id: 1, email: 'test@chess.local', fullName: 'Test', role: 'PLAYER' as const };

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logout clears user state even when the API call rejects', async () => {
    const { authService } = await import('../../../src/services/authService');

    vi.mocked(authService.me).mockResolvedValue({ user: mockUser });
    vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'));

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useContext(AuthContext)!, { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('logout clears user state when the API call succeeds', async () => {
    const { authService } = await import('../../../src/services/authService');

    vi.mocked(authService.me).mockResolvedValue({ user: mockUser });
    vi.mocked(authService.logout).mockResolvedValue({ ok: true });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useContext(AuthContext)!, { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
