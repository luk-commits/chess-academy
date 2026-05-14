import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import { AuthContext } from '../../../src/context/AuthContext';
import type { AuthContextValue } from '../../../src/context/AuthContext';

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
  });

  it('returns context value when inside AuthProvider', () => {
    const value: AuthContextValue = {
      user: { id: 1, email: 'test@chess.local', fullName: 'Test', role: 'PLAYER' },
      loading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user?.fullName).toBe('Test');
    expect(result.current.loading).toBe(false);
  });
});
