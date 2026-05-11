const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/**
 * Custom error class that preserves the HTTP status code.
 * This lets the UI distinguish between server validation errors (e.g. 422)
 * and network failures (caught as plain Error), enabling appropriate UX per status.
 */
export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Thin wrapper around fetch with:
 * - Automatic JSON serialization/deserialization
 * - `credentials: 'include'` to send HttpOnly cookies cross-origin
 * - Structured error extraction from the server's `{ error: string }` response shape
 */
export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: { method?: string; body?: TBody } = {},
): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as TResponse;
}
