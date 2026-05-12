import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  const navItems = user.role === 'PLAYER'
    ? ['Lekcje', 'Trenerzy']
    : ['Lekcje', 'Zawodnicy', 'Pozycje'];

  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.dark' }}>
      <Toolbar>
        <EmojiEventsIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ mr: 4, fontWeight: 700 }}>
          ChessAcademy
        </Typography>

        {navItems.map((item) => (
          <Button key={item} color="inherit" sx={{ textTransform: 'none' }}>
            {item}
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
