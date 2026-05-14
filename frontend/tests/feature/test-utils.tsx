import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../src/theme';
import { AuthContext } from '../../src/context/AuthContext';
import type { AuthContextValue } from '../../src/context/AuthContext';
import { type ReactElement } from 'react';
import { vi } from 'vitest';

export function renderWithAuth(
  ui: ReactElement,
  overrides: Partial<AuthContextValue> = {},
): RenderResult {
  const defaultContext: AuthContextValue = {
    user: null,
    loading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/login']}>
        <AuthContext.Provider value={{ ...defaultContext, ...overrides }}>
          {ui}
        </AuthContext.Provider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
