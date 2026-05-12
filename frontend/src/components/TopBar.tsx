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
        { label: 'Trenerzy', path: '/home/coaches' },
      ]
    : [
        { label: 'Lekcje', path: '/home/coach/lessons' },
        { label: 'Zawodnicy', path: '/home/players' },
        { label: 'Pozycje', path: '/home/positions' },
      ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.dark' }}>
      <Toolbar>
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
            mr: 4,
          }}
        >
          <EmojiEventsIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ChessAcademy
          </Typography>
        </Box>

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

        <Box sx={{ flexGrow: 1 }} />

        <Button
          color="inherit"
          onClick={handleMenuOpen}
          sx={{ textTransform: 'none' }}
        >
          <AccountCircleIcon sx={{ mr: 0.5 }} />
          {user.email}
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
