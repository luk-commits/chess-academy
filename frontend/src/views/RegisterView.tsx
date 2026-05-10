import { useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { useAuth } from '../hooks/useAuth';
import { BrandHeader } from '../components/BrandHeader';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { RegisterPayload } from '../types/auth';

export function RegisterView() {
  const { loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'PLAYER' | 'COACH'>('PLAYER');
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const navigate = useNavigate();

  const passwordsMatch = password === confirmPassword && confirmPassword !== '';
  const isPasswordMismatch = confirmPassword !== '' && password !== confirmPassword;
  const isFormValid = email !== '' && password !== '' && fullName !== '' && passwordsMatch;

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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #1a237e 0%, #534bae 50%, #c2a878 100%)',
        px: 2,
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Paper
          elevation={12}
          sx={{
            p: { xs: 3, sm: 4.5 },
            borderRadius: 4,
            backdropFilter: 'blur(8px)',
            background: 'rgba(255, 255, 255, 0.97)',
          }}
        >
          <BrandHeader />

          {registerError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {registerError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Imię i Nazwisko"
              fullWidth
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
              slotProps={{
                input: {
                  startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlinedIcon color="action" fontSize="small" />
                      </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Hasło"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              error={isPasswordMismatch}
              helperText={isPasswordMismatch ? "Hasła nie są identyczne" : ""}
              sx={{ mb: 2 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Potwierdź hasło"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              error={isPasswordMismatch}
              helperText={isPasswordMismatch ? "Hasła nie są identyczne" : ""}
              sx={{ mb: 2 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
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

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Button
              onClick={() => navigate('/login')}
              variant="text"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Masz już konto? Zaloguj się
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
