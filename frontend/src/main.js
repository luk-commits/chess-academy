import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { theme } from './theme';
import { AuthProvider } from './context/AuthContext';
const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container missing');
}
createRoot(container).render(_jsx(StrictMode, { children: _jsxs(ThemeProvider, { theme: theme, children: [_jsx(CssBaseline, {}), _jsx(BrowserRouter, { children: _jsx(AuthProvider, { children: _jsx(App, {}) }) })] }) }));
