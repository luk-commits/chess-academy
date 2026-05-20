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
  Divider,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../hooks/useAuth';
import { NAV_BY_ROLE } from '../constants/navigation';

/**
 * Górny pasek nawigacji z linkami zależnymi od roli i menu konta.
 */
export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  if (!user) return null;

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = NAV_BY_ROLE[user.role];
  const isActive = (path: string) => {
    if (path === '/home/player/tasks' && location.pathname.startsWith('/home/player/tasks/archive')) return false;
    if (path === '/home/player/tasks/archive') return location.pathname === '/home/player/tasks/archive';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

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
          sx={{
            textTransform: 'none',
            display: { xs: 'none', md: 'inline-flex' },
            borderBottomLeftRadius: anchorEl ? 0 : undefined,
            borderBottomRightRadius: anchorEl ? 0 : undefined,
            bgcolor: anchorEl ? 'rgba(255,255,255,0.1)' : 'transparent',
            pb: '10px',
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {user.email}
          </Box>
          <AccountCircleIcon sx={{ ml: { xs: 0, sm: 0.5 } }} />
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                width: anchorEl?.offsetWidth ?? 'auto',
                minWidth: 180,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderTop: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PersonIcon fontSize="small" />
            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
              Profil
            </Typography>
          </Box>
          <Divider />
          {user.role === 'PLAYER' && (
            <MenuItem onClick={() => { handleMenuClose(); navigate('/home/player/tasks/archive'); }} sx={{ gap: 1.5, py: 1.5, px: 2 }}>
              <Inventory2Icon fontSize="small" />
              Archiwum
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.5, px: 2 }}>
            <LogoutIcon fontSize="small" />
            Wyloguj
          </MenuItem>
        </Menu>

      </Toolbar>
    </AppBar>
  );
}
