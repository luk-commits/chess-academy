import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Box,
  IconButton,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../hooks/useAuth';

interface NavItem {
  label: string;
  path: string;
}

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  if (!user) return null;

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems: NavItem[] = user.role === 'PLAYER'
    ? [
        { label: 'Lekcje', path: '/home/player/lessons' },
        { label: 'Zadania', path: '/home/player/tasks' },
        { label: 'Trenerzy', path: '/home/player/coaches' },
      ]
    : [
        { label: 'Lekcje', path: '/home/coach/lessons' },
        { label: 'Zawodnicy', path: '/home/coach/players' },
        { label: 'Pozycje', path: '/home/coach/positions' },
      ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.dark' }}>
      <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }}>
        <Box
          component="button"
          onClick={() => navigate('/home')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            mr: { xs: 1, md: 4 },
            minWidth: 0,
          }}
        >
          <EmojiEventsIcon sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
            ChessAcademy
          </Typography>
        </Box>

        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => navigate(item.path)}
              sx={{
                textTransform: 'none',
                mx: 0.5,
                px: 2,
                fontWeight: isActive(item.path) ? 700 : 400,
                borderBottom: isActive(item.path) ? '2px solid white' : '2px solid transparent',
                borderRadius: 0,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.15)',
                  borderBottom: '2px solid rgba(255,255,255,0.7)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          color="inherit"
          onClick={handleMenuOpen}
          aria-label="konto"
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
        >
          <AccountCircleIcon />
        </IconButton>

        <Button
          color="inherit"
          onClick={handleMenuOpen}
          sx={{ textTransform: 'none', display: { xs: 'none', md: 'inline-flex' } }}
        >
          <AccountCircleIcon sx={{ mr: { xs: 0, sm: 0.5 } }} />
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {user.email}
          </Box>
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleLogout}>Wyloguj</MenuItem>
        </Menu>

      </Toolbar>
    </AppBar>
  );
}
