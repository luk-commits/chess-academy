import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginView } from '../../../src/views/LoginView';
import { renderWithAuth } from '../test-utils';
import userEvent from '@testing-library/user-event';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('submit button is disabled when fields are empty', () => {
    renderWithAuth(<LoginView />);
    expect(screen.getByRole('button', { name: /zaloguj się/i })).toBeDisabled();
  });

  it('submit button is enabled when both fields are filled', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginView />);
    await user.type(screen.getByLabelText(/email/i), 'test@chess.local');
    await user.type(screen.getByLabelText(/hasło/i), 'password123');
    expect(screen.getByRole('button', { name: /zaloguj się/i })).toBeEnabled();
  });

  it('submit button shows loading text when loading', () => {
    renderWithAuth(<LoginView />, { loading: true });
    expect(screen.getByRole('button', { name: /logowanie/i })).toBeDisabled();
  });

  it('displays error alert when error is present', () => {
    renderWithAuth(<LoginView />, { error: 'Invalid credentials' });
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i);
  });

  it('calls login when form is submitted', async () => {
    const loginMock = vi.fn().mockResolvedValue({ id: 1, email: '', fullName: '', role: 'PLAYER' });
    const user = userEvent.setup();
    renderWithAuth(<LoginView />, { login: loginMock });
    await user.type(screen.getByLabelText(/email/i), 'test@chess.local');
    await user.type(screen.getByLabelText(/hasło/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /zaloguj się/i }));
    expect(loginMock).toHaveBeenCalledWith({ email: 'test@chess.local', password: 'secret123' });
  });

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginView />);
    const passwordInput = screen.getByLabelText(/hasło/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: /toggle password visibility/i }));
    expect(passwordInput).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: /toggle password visibility/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('trims email before calling login', async () => {
    const loginMock = vi.fn().mockResolvedValue({ id: 1, email: 'a@b.c', fullName: 'Test', role: 'PLAYER' });
    const user = userEvent.setup();
    renderWithAuth(<LoginView />, { login: loginMock });
    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, '\u00A0a@b.c');
    await user.type(screen.getByLabelText(/hasło/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /zaloguj się/i }));
    expect(loginMock).toHaveBeenCalledWith({ email: 'a@b.c', password: 'secret123' });
  });

  it('redirects to /home when user is set in context', () => {
    renderWithAuth(<LoginView />, {
      user: { id: 1, email: 'test@chess.local', fullName: 'Test', role: 'PLAYER' },
    });
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('disables email and password fields during loading', () => {
    renderWithAuth(<LoginView />, { loading: true });
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/hasło/i)).toBeDisabled();
  });

  it('hides error alert when loading is true even if error exists', () => {
    renderWithAuth(<LoginView />, { error: 'Invalid credentials', loading: true });
    expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
  });

  it('submits form via Enter key in password field', async () => {
    const loginMock = vi.fn().mockResolvedValue({ id: 1, email: 'test@chess.local', fullName: 'Test', role: 'PLAYER' });
    const user = userEvent.setup();
    renderWithAuth(<LoginView />, { login: loginMock });
    await user.type(screen.getByLabelText(/email/i), 'test@chess.local');
    await user.type(screen.getByLabelText(/hasło/i), 'secret123');
    await user.keyboard('{Enter}');
    expect(loginMock).toHaveBeenCalledWith({ email: 'test@chess.local', password: 'secret123' });
  });
});
