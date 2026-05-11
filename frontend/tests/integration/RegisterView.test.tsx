import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../src/theme';
import { RegisterView } from '../../src/views/RegisterView';
import { AuthContext } from '../../src/context/AuthContext';
import type { AuthContextValue } from '../../src/context/AuthContext';
import userEvent from '@testing-library/user-event';

vi.mock('../../src/services/authService', () => ({
  authService: {
    register: vi.fn(),
  },
}));

function renderRegisterView(contextValue: Partial<AuthContextValue> = {}) {
  const defaultContext: AuthContextValue = {
    user: null,
    loading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/register']}>
        <AuthContext.Provider value={{ ...defaultContext, ...contextValue }}>
          <RegisterView />
        </AuthContext.Provider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('RegisterView', () => {
  it('renders the brand header', () => {
    renderRegisterView();
    expect(screen.getByRole('heading', { name: /chessacademy/i })).toBeInTheDocument();
  });

  it('renders all four form fields', () => {
    renderRegisterView();
    expect(screen.getByLabelText(/imię i nazwisko/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^hasło/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/potwierdź hasło/i)).toBeInTheDocument();
  });

  it('submit button is disabled when fields are empty', () => {
    renderRegisterView();
    expect(screen.getByRole('button', { name: /zarejestruj się/i })).toBeDisabled();
  });

  it('renders role toggle buttons with Gracz selected by default', () => {
    renderRegisterView();
    expect(screen.getByRole('button', { name: 'Gracz' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trener' })).toBeInTheDocument();
  });

  it('renders login navigation link', () => {
    renderRegisterView();
    expect(screen.getByRole('button', { name: /masz już konto/i })).toBeInTheDocument();
  });

  it('submit button becomes enabled when all fields are valid', async () => {
    const user = userEvent.setup();
    renderRegisterView();

    await user.type(screen.getByLabelText(/imię i nazwisko/i), 'Jan Kowalski');
    await user.type(screen.getByLabelText(/^email/i), 'jan@chess.local');
    await user.type(screen.getByLabelText(/^hasło/i), 'Password123!');
    await user.type(screen.getByLabelText(/potwierdź hasło/i), 'Password123!');

    expect(screen.getByRole('button', { name: /zarejestruj się/i })).toBeEnabled();
  });

  it('shows error for too short password', async () => {
    const user = userEvent.setup();
    renderRegisterView();

    const passwordField = screen.getByLabelText(/^hasło/i);
    await user.type(passwordField, 'Ab1!');

    expect(screen.getByText(/hasło musi mieć co najmniej 8 znaków/i)).toBeInTheDocument();
  });

  it('shows error for mismatched passwords', async () => {
    const user = userEvent.setup();
    renderRegisterView();

    await user.type(screen.getByLabelText(/^hasło/i), 'Password123!');
    await user.type(screen.getByLabelText(/potwierdź hasło/i), 'Different!');

    expect(screen.getByText(/hasła nie są identyczne/i)).toBeInTheDocument();
  });

  it('shows error for invalid email', async () => {
    const user = userEvent.setup();
    renderRegisterView();

    await user.type(screen.getByLabelText(/^email/i), 'invalid-email');

    expect(screen.getByText(/nieprawidłowy adres email/i)).toBeInTheDocument();
  });
});
