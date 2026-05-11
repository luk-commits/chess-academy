import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../src/theme';
import { LoginView } from '../../src/views/LoginView';
import { AuthContext } from '../../src/context/AuthContext';
import type { AuthContextValue } from '../../src/context/AuthContext';
import userEvent from '@testing-library/user-event';

function renderLoginView(contextValue: Partial<AuthContextValue> = {}) {
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
        <AuthContext.Provider value={{ ...defaultContext, ...contextValue }}>
          <LoginView />
        </AuthContext.Provider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('LoginView', () => {
  it('renders the brand header', () => {
    renderLoginView();
    expect(screen.getByRole('heading', { name: /chessacademy/i })).toBeInTheDocument();
  });

  it('renders email and password fields', () => {
    renderLoginView();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
  });

  it('submit button is disabled when fields are empty', () => {
    renderLoginView();
    expect(screen.getByRole('button', { name: /zaloguj się/i })).toBeDisabled();
  });

  it('submit button is enabled when both fields are filled', async () => {
    const user = userEvent.setup();
    renderLoginView();

    await user.type(screen.getByLabelText(/email/i), 'test@chess.local');
    await user.type(screen.getByLabelText(/hasło/i), 'password123');

    expect(screen.getByRole('button', { name: /zaloguj się/i })).toBeEnabled();
  });

  it('submit button shows loading text when loading', () => {
    renderLoginView({ loading: true });
    expect(screen.getByRole('button', { name: /logowanie/i })).toBeDisabled();
  });

  it('displays error alert when error is present', () => {
    renderLoginView({ error: 'Invalid credentials' });
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i);
  });

  it('renders the register navigation link', () => {
    renderLoginView();
    expect(screen.getByRole('button', { name: /nie masz konta/i })).toBeInTheDocument();
  });

  it('renders demo account info', () => {
    renderLoginView();
    expect(screen.getByText(/coach@chess\.local/i)).toBeInTheDocument();
  });

  it('calls login when form is submitted', async () => {
    const loginMock = vi.fn().mockResolvedValue({ id: 1, email: 'test@chess.local', fullName: 'Test', role: 'PLAYER' });
    const user = userEvent.setup();
    renderLoginView({ login: loginMock });

    await user.type(screen.getByLabelText(/email/i), 'test@chess.local');
    await user.type(screen.getByLabelText(/hasło/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /zaloguj się/i }));

    expect(loginMock).toHaveBeenCalledWith({ email: 'test@chess.local', password: 'secret123' });
  });
});
