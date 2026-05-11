import { useState, type FormEvent, useEffect } from 'react';
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login({ email: email.trim(), password });
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
            backdropFilter: 'blur(8MS)',
            background: 'rgba(255, 255, 255, 0.97)',
          }}
        >
          <BrandHeader />

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

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              autoFocus
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              sx={{ mb: 3 }}
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
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading || email === '' || password === ''}
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
        </Paper>
      </Container>
    </Box>
  );
}
