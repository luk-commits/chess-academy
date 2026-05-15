import { useState, type FormEvent } from 'react';
import { Alert, Box, Button } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { RegisterPayload } from '../types/auth';
import { AuthLayout } from '../components/forms/AuthLayout';
import { IconTextField } from '../components/forms/IconTextField';
import { PasswordField } from '../components/forms/PasswordField';
import { useEmailValidation } from '../hooks/useEmailValidation';
import { usePasswordValidation } from '../hooks/usePasswordValidation';

/**
 * Registration form with two-layer validation:
 * 1. Client-side: password rules + matching confirmation + email format.
 * 2. Server-side: email uniqueness, role values, etc.
 */
export function RegisterView() {
  const { loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'PLAYER' | 'COACH'>('PLAYER');
  const [registerError, setRegisterError] = useState('');
  const navigate = useNavigate();

  const { isInvalid: isEmailInvalid, errorMessage: emailErrorMessage } = useEmailValidation(email);
  const { isInvalid: isPasswordInvalid, message: passwordValidationMessage } = usePasswordValidation(password);
  const isPasswordMismatch = confirmPassword !== '' && password !== confirmPassword;
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const isFormValid =
    email.trim() !== '' &&
    password !== '' &&
    fullName.trim() !== '' &&
    passwordsMatch &&
    !isPasswordInvalid &&
    !isEmailInvalid;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterError('');
    const payload: RegisterPayload = {
      email: email.trim(),
      password,
      fullName,
      role,
    };
    try {
      await authService.register(payload);
      navigate('/login');
    } catch (err: any) {
      setRegisterError(err.message ?? 'Registration failed');
    }
  };

  const topAlert = registerError ? (
    <Alert severity="error" sx={{ mb: 2 }}>
      {registerError}
    </Alert>
  ) : null;

  return (
    <AuthLayout topAlert={topAlert}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <IconTextField
          startIcon={<PersonOutlinedIcon color="action" fontSize="small" />}
          label="Imię i Nazwisko"
          required
          value={fullName}
          onChange={setFullName}
          disabled={loading}
          sx={{ mb: 2 }}
        />

        <IconTextField
          startIcon={<EmailIcon color="action" fontSize="small" />}
          label="Email"
          type="email"
          required
          value={email}
          onChange={setEmail}
          disabled={loading}
          error={isEmailInvalid}
          helperText={emailErrorMessage}
          sx={{ mb: 2 }}
        />

        <PasswordField
          label="Hasło"
          required
          value={password}
          onChange={setPassword}
          disabled={loading}
          error={Boolean(passwordValidationMessage)}
          helperText={passwordValidationMessage}
          sx={{ mb: 2 }}
        />

        <PasswordField
          label="Potwierdź hasło"
          required
          value={confirmPassword}
          onChange={setConfirmPassword}
          disabled={loading}
          error={isPasswordMismatch}
          helperText={isPasswordMismatch ? 'Hasła nie są identyczne' : ''}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 3 }}>
          <Button
            onClick={() => setRole('PLAYER')}
            variant={role === 'PLAYER' ? 'contained' : 'outlined'}
            size="small"
            sx={{ mr: 1 }}
          >
            Gracz
          </Button>
          <Button
            onClick={() => setRole('COACH')}
            variant={role === 'COACH' ? 'contained' : 'outlined'}
            size="small"
          >
            Trener
          </Button>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading || !isFormValid}
          sx={{ py: 1.4, fontSize: '1rem' }}
        >
          {loading ? 'Rejestracja...' : 'Zarejestruj się'}
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Button
          onClick={() => navigate('/login')}
          variant="text"
          size="small"
          sx={{ textTransform: 'none' }}
        >
          Masz już konto? Zaloguj się
        </Button>
      </Box>
    </AuthLayout>
  );
}
