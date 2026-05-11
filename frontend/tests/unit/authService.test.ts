import { describe, it, expect, vi } from 'vitest';
import { authService } from '../../src/services/authService';

vi.mock('../../src/services/api', () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from '../../src/services/api';
const mockedApiRequest = vi.mocked(apiRequest);

describe('authService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('login calls apiRequest POST /api/login', () => {
    const payload = { email: 'a@b.com', password: 'secret' };
    authService.login(payload);
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/login', {
      method: 'POST',
      body: payload,
    });
  });

  it('register calls apiRequest POST /api/register', () => {
    const payload = { email: 'a@b.com', password: 'secret', fullName: 'Test', role: 'PLAYER' as const };
    authService.register(payload);
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/register', {
      method: 'POST',
      body: payload,
    });
  });

  it('logout calls apiRequest POST /api/logout', () => {
    authService.logout();
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/logout', { method: 'POST' });
  });

  it('me calls apiRequest GET /api/me', () => {
    authService.me();
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/me');
  });
});
