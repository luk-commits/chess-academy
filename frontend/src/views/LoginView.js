import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Alert, Box, Button, Container, Divider, IconButton, InputAdornment, Paper, TextField, Typography, } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../hooks/useAuth';
import { BrandHeader } from '../components/BrandHeader';
import { useNavigate } from 'react-router-dom';
/**
 * Login form with client-side validation strategy:
 * - The submit button is disabled while fields are empty or a request is in flight
 *   (prevents double submission and empty payloads at the network level).
 * - Server-side validation errors are displayed via the shared `error` state
 *   from AuthContext, which shows them in an Alert above the form.
 * - Password visibility toggle is implemented client-side only (no effect on the value).
 */
export function LoginView() {
    const { login, loading, error, user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        if (user) {
            navigate('/home');
        }
    }, [user, navigate]);
    const handleSubmit = async (event) => {
        event.preventDefault();
        await login({ email: email.trim(), password });
    };
    return (_jsx(Box, { sx: {
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, #1a237e 0%, #534bae 50%, #c2a878 100%)',
            px: 2,
        }, children: _jsx(Container, { maxWidth: "xs", disableGutters: true, children: _jsxs(Paper, { elevation: 12, sx: {
                    p: { xs: 3, sm: 4.5 },
                    borderRadius: 4,
                    backdropFilter: 'blur(8MS)',
                    background: 'rgba(255, 255, 255, 0.97)',
                }, children: [_jsx(BrandHeader, {}), user && (_jsxs(Alert, { severity: "success", sx: { mb: 2 }, children: ["Zalogowano jako ", user.fullName, " (", user.role, ")"] })), error && !loading && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error })), _jsxs(Box, { component: "form", onSubmit: handleSubmit, noValidate: true, children: [_jsx(TextField, { label: "Email", type: "email", autoComplete: "email", required: true, autoFocus: true, value: email, onChange: (e) => setEmail(e.target.value), disabled: loading, sx: { mb: 2 }, slotProps: {
                                    input: {
                                        startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(EmailIcon, { color: "action", fontSize: "small" }) })),
                                    },
                                } }), _jsx(TextField, { label: "Has\u0142o", type: showPassword ? 'text' : 'password', autoComplete: "current-password", required: true, value: password, onChange: (e) => setPassword(e.target.value), disabled: loading, sx: { mb: 3 }, slotProps: {
                                    input: {
                                        startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(LockOutlinedIcon, { color: "action", fontSize: "small" }) })),
                                        endAdornment: (_jsx(InputAdornment, { position: "end", children: _jsx(IconButton, { onClick: () => setShowPassword((v) => !v), edge: "end", size: "small", "aria-label": "toggle password visibility", children: showPassword ? _jsx(VisibilityOffIcon, {}) : _jsx(VisibilityIcon, {}) }) })),
                                    },
                                } }), _jsx(Button, { type: "submit", variant: "contained", size: "large", fullWidth: true, disabled: loading || email === '' || password === '', sx: { py: 1.4, fontSize: '1rem' }, children: loading ? 'Logowanie...' : 'Zaloguj się' })] }), _jsx(Divider, { sx: { my: 3 } }), _jsx(Box, { sx: { textAlign: 'center' }, children: _jsx(Button, { onClick: () => navigate('/register'), variant: "text", size: "small", sx: { textTransform: 'none' }, children: "Nie masz konta? Zarejestruj si\u0119" }) }), _jsx(Typography, { variant: "caption", color: "text.secondary", align: "center", component: "p", sx: { mt: 2 }, children: "Konta demo: coach@chess.local / player@chess.local \u2014 has\u0142o: password123" })] }) }) }));
}
