import { useLocation, useNavigate } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { HOME_NAV_ITEM, NAV_BY_ROLE } from '../constants/navigation';

const SHOW_NAV_PATHS = [
  '/home/player/tasks',
  '/home/player/lessons',
  '/home/player/coaches',
  '/home/coach/lessons',
  '/home/coach/players',
  '/home/coach/positions',
  '/home/coach/tasks',
];

/**
 * Mobilna nawigacja dolna widoczna tylko na wybranych podścieżkach home.
 */
export function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const showNav = SHOW_NAV_PATHS.some((path) => {
    if (path === '/home/player/tasks') {
      return location.pathname === '/home/player/tasks' || location.pathname === '/home/player/tasks/archive';
    }
    return location.pathname.startsWith(path);
  });

  const isPlayer = user.role === 'PLAYER';
  const navItems = isPlayer ? NAV_BY_ROLE[user.role] : [HOME_NAV_ITEM, ...NAV_BY_ROLE[user.role]];
  const currentValue = navItems.findIndex((item) => location.pathname.startsWith(item.path));

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: { xs: showNav ? 'block' : 'none', sm: 'none' },
      }}
      elevation={8}
    >
      <BottomNavigation
        value={currentValue === -1 ? undefined : currentValue}
        onChange={(_, newValue) => navigate(navItems[newValue].path)}
        sx={{
          bgcolor: 'primary.dark',
          '& .MuiBottomNavigationAction-root': {
            color: 'rgba(255,255,255,0.5)',
            '&.Mui-selected': {
              color: 'white',
            },
          },
        }}
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
