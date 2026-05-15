import { useState, type FormEvent, useEffect } from 'react';
import { Alert, Box, Button, Divider, Typography } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/forms/AuthLayout';
import { IconTextField } from '../components/forms/IconTextField';
import { PasswordField } from '../components/forms/PasswordField';
import { useEmailValidation } from '../hooks/useEmailValidation';

/**
 * Login form with two-layer validation:
 * 1. Client-side: email format (shared regex with RegisterView).
 * 2. Server-side: error displayed via shared `error` state from AuthContext.
 */
export function LoginView() {
  const { login, loading, error, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { isInvalid: isEmailInvalid, errorMessage: emailErrorMessage } = useEmailValidation(email);

  useEffect(() => {
    if (user) navigate('/home');
  }, [user, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login({ email: email.trim(), password });
  };

  const topAlert = (
    <>
      {user && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Zalogowano jako {user.fullName} ({user.role})
        </Alert>
      )}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
    </>
  );

  return (
    <AuthLayout topAlert={topAlert}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <IconTextField
          startIcon={<EmailIcon color="action" fontSize="small" />}
          label="Email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={setEmail}
          disabled={loading}
          error={isEmailInvalid}
          helperText={emailErrorMessage}
          sx={{ mb: 2 }}
        />

        <PasswordField
          label="Hasło"
          autoComplete="current-password"
          required
          value={password}
          onChange={setPassword}
          disabled={loading}
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading || email === '' || password === '' || isEmailInvalid}
          sx={{ py: 1.4, fontSize: '1rem' }}
        >
          {loading ? 'Logowanie...' : 'Zaloguj się'}
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ textAlign: 'center' }}>
        <Button
          onClick={() => navigate('/register')}
          variant="text"
          size="small"
          sx={{ textTransform: 'none' }}
        >
          Nie masz konta? Zarejestruj się
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" align="center" component="p" sx={{ mt: 2 }}>
        Konta demo: coach@chess.local / player@chess.local — hasło: password123
      </Typography>
    </AuthLayout>
  );
}
