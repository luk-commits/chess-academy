const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
/**
 * Custom error class that preserves the HTTP status code.
 * This lets the UI distinguish between server validation errors (e.g. 422)
 * and network failures (caught as plain Error), enabling appropriate UX per status.
 */
export class ApiError extends Error {
    status;
    constructor(message, status) {
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
export async function apiRequest(path, options = {}) {
    const requestInit = {
        method: options.method ?? 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    };
    if (options.body !== undefined) {
        requestInit.body = JSON.stringify(options.body);
    }
    const response = await fetch(`${API_URL}${path}`, requestInit);
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
        const message = data && typeof data === 'object' && 'error' in data
            ? String(data.error)
            : `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status);
    }
    return data;
}
