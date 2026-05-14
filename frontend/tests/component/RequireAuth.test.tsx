import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RequireAuth } from '../../src/components/RequireAuth';
import { AuthContext } from '../../src/context/AuthContext';
import type { AuthContextValue } from '../../src/context/AuthContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: vi.fn(() => null),
  };
});

describe('RequireAuth', () => {
  const baseCtx: AuthContextValue = {
    user: null,
    loading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  };

  function renderWithAuth(ctx: AuthContextValue) {
    return render(
      <MemoryRouter>
        <AuthContext.Provider value={ctx}>
          <RequireAuth>
            <div>Protected Content</div>
          </RequireAuth>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
  }

  it('returns null while loading', () => {
    const { container } = renderWithAuth({ ...baseCtx, user: null, loading: true });
    expect(container.innerHTML).toBe('');
  });

  it('does not render children when user is null', () => {
    renderWithAuth({ ...baseCtx, user: null, loading: false });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    renderWithAuth({
      ...baseCtx,
      user: { id: 1, email: 'test@chess.local', fullName: 'Test', role: 'PLAYER' },
      loading: false,
    });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
