import { apiRequest } from './api';
import type { LoginPayload, LoginResponse } from '../types/auth';
import type { RegisterPayload } from '../types/auth';

export const authService = {
  login(payload: LoginPayload): Promise<LoginResponse> {
    return apiRequest<LoginResponse, LoginPayload>('/api/login', {
      method: 'POST',
      body: payload,
    });
  },

  register(payload: RegisterPayload): Promise<{ ok: boolean }> {
    return apiRequest<{ ok: boolean }, RegisterPayload>('/api/register', {
      method: 'POST',
      body: payload,
    });
  },

  logout(): Promise<{ ok: boolean }> {
    return apiRequest<{ ok: boolean }>('/api/logout', { method: 'POST' });
  },

  me(): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/api/me');
  },

  refresh(): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/api/refresh', { method: 'POST' });
  },
};

