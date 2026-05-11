import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError, apiRequest } from '../../src/services/api';

describe('ApiError', () => {
  it('creates an error with status and message', () => {
    const err = new ApiError('Not Found', 404);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Not Found');
    expect(err.status).toBe(404);
  });
});

describe('apiRequest', () => {
  const mockFetch = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('makes a GET request and returns parsed JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ user: { id: 1 } })),
    });

    const result = await apiRequest('/api/me');
    expect(result).toEqual({ user: { id: 1 } });
    expect(mockFetch).toHaveBeenCalledWith('/api/me', expect.objectContaining({
      method: 'GET',
      credentials: 'include',
    }));
  });

  it('makes a POST request with a JSON body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ ok: true })),
    });

    const body = { email: 'a@b.com', password: 'secret' };
    const result = await apiRequest('/api/login', { method: 'POST', body });
    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledWith('/api/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(body),
    }));
  });

  it('throws ApiError when response is not ok', async () => {
    const errorResponse = {
      ok: false,
      status: 422,
      text: () => Promise.resolve(JSON.stringify({ error: 'Email already taken' })),
    };
    mockFetch.mockResolvedValue(errorResponse);

    await expect(apiRequest('/api/register', { method: 'POST' })).rejects.toMatchObject({
      status: 422,
      message: 'Email already taken',
    });
  });

  it('throws ApiError with generic message when no error field in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve(JSON.stringify({})),
    });

    await expect(apiRequest('/api/test')).rejects.toMatchObject({
      status: 500,
      message: 'Request failed with status 500',
    });
  });

  it('throws on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

    await expect(apiRequest('/api/test')).rejects.toThrow(TypeError);
  });
});
