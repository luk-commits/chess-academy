import { apiRequest } from './api';
export const authService = {
    login(payload) {
        return apiRequest('/api/login', {
            method: 'POST',
            body: payload,
        });
    },
    register(payload) {
        return apiRequest('/api/register', {
            method: 'POST',
            body: payload,
        });
    },
    logout() {
        return apiRequest('/api/logout', { method: 'POST' });
    },
    me() {
        return apiRequest('/api/me');
    },
};
