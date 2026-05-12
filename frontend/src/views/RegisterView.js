import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Alert, Box, Button, Container, Divider, IconButton, InputAdornment, Paper, TextField, } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { useAuth } from '../hooks/useAuth';
import { BrandHeader } from '../components/BrandHeader';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
/**
 * Registration form with two-layer validation:
 * 1. Client-side: password confirmation matching + required field check.
 *    The submit button is disabled until all fields are valid.
 * 2. Server-side: the API validates email uniqueness, role values, etc.
 *    Server errors are displayed in an inline Alert.
 */
export function RegisterView() {
    const { loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('PLAYER');
    const [showPassword, setShowPassword] = useState(false);
    const [registerError, setRegisterError] = useState('');
    const navigate = useNavigate();
    const passwordsMatch = password === confirmPassword && confirmPassword !== '';
    const isPasswordMismatch = confirmPassword !== '' && password !== confirmPassword;
    const isPasswordTooShort = password.length > 0 && password.length < 8;
    const hasNoUppercase = password.length > 0 && !/[A-Z]/.test(password);
    const hasNoLowercase = password.length > 0 && !/[a-z]/.test(password);
    const isPasswordInvalid = isPasswordTooShort || hasNoUppercase || hasNoLowercase;
    const isEmailInvalid = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const emailErrorMessage = isEmailInvalid ? 'Nieprawidłowy adres email' : '';
    const passwordValidationMessage = password.length === 0
        ? ''
        : isPasswordTooShort
            ? 'Hasło musi mieć co najmniej 8 znaków'
            : hasNoUppercase
                ? 'Hasło musi zawierać co najmniej 1 dużą literę'
                : hasNoLowercase
                    ? 'Hasło musi zawierać co najmniej 1 małą literę'
                    : '';
    const isFormValid = email.trim() !== '' && password !== '' && fullName.trim() !== '' && passwordsMatch && !isPasswordInvalid && !isEmailInvalid;
    const handleSubmit = async (event) => {
        event.preventDefault();
        setRegisterError('');
        const payload = {
            email: email.trim(),
            password,
            fullName,
            role,
        };
        try {
            await authService.register(payload);
            navigate('/login');
        }
        catch (err) {
            setRegisterError(err.message ?? 'Registration failed');
        }
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
                    backdropFilter: 'blur(8px)',
                    background: 'rgba(255, 255, 255, 0.97)',
                }, children: [_jsx(BrandHeader, {}), registerError && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: registerError })), _jsxs(Box, { component: "form", onSubmit: handleSubmit, noValidate: true, children: [_jsx(TextField, { label: "Imi\u0119 i Nazwisko", fullWidth: true, required: true, value: fullName, onChange: (e) => setFullName(e.target.value), disabled: loading, sx: { mb: 2 }, slotProps: {
                                    input: {
                                        startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(PersonOutlinedIcon, { color: "action", fontSize: "small" }) })),
                                    },
                                } }), _jsx(TextField, { label: "Email", type: "email", fullWidth: true, required: true, value: email, onChange: (e) => setEmail(e.target.value), disabled: loading, error: isEmailInvalid, helperText: emailErrorMessage, sx: { mb: 2 }, slotProps: {
                                    input: {
                                        startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(EmailIcon, { color: "action", fontSize: "small" }) })),
                                    },
                                } }), _jsx(TextField, { label: "Has\u0142o", type: showPassword ? 'text' : 'password', fullWidth: true, required: true, value: password, onChange: (e) => setPassword(e.target.value), disabled: loading, error: Boolean(passwordValidationMessage), helperText: passwordValidationMessage, sx: { mb: 2 }, slotProps: {
                                    input: {
                                        startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(LockOutlinedIcon, { color: "action", fontSize: "small" }) })),
                                        endAdornment: (_jsx(InputAdornment, { position: "end", children: _jsx(IconButton, { onClick: () => setShowPassword((v) => !v), edge: "end", size: "small", children: showPassword ? _jsx(VisibilityOffIcon, {}) : _jsx(VisibilityIcon, {}) }) })),
                                    },
                                } }), _jsx(TextField, { label: "Potwierd\u017A has\u0142o", type: showPassword ? 'text' : 'password', fullWidth: true, required: true, value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), disabled: loading, error: isPasswordMismatch, helperText: isPasswordMismatch ? 'Hasła nie są identyczne' : '', sx: { mb: 2 }, slotProps: {
                                    input: {
                                        startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(LockOutlinedIcon, { color: "action", fontSize: "small" }) })),
                                        endAdornment: (_jsx(InputAdornment, { position: "end", children: _jsx(IconButton, { onClick: () => setShowPassword((v) => !v), edge: "end", size: "small", children: showPassword ? _jsx(VisibilityOffIcon, {}) : _jsx(VisibilityIcon, {}) }) })),
                                    },
                                } }), _jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Button, { onClick: () => setRole('PLAYER'), variant: role === 'PLAYER' ? 'contained' : 'outlined', size: "small", sx: { mr: 1 }, children: "Gracz" }), _jsx(Button, { onClick: () => setRole('COACH'), variant: role === 'COACH' ? 'contained' : 'outlined', size: "small", children: "Trener" })] }), _jsx(Button, { type: "submit", variant: "contained", size: "large", fullWidth: true, disabled: loading || !isFormValid, sx: { py: 1.4, fontSize: '1rem' }, children: loading ? 'Rejestracja...' : 'Zarejestruj się' })] }), _jsx(Divider, { sx: { my: 3 } }), _jsx(Box, { sx: { textAlign: 'center' }, children: _jsx(Button, { onClick: () => navigate('/login'), variant: "text", size: "small", sx: { textTransform: 'none' }, children: "Masz ju\u017C konto? Zaloguj si\u0119" }) })] }) }) }));
}
