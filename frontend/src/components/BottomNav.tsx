import { useLocation, useNavigate } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import GridViewIcon from '@mui/icons-material/GridView';
import { useAuth } from '../hooks/useAuth';

export function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const navItems = user.role === 'PLAYER'
    ? [
        { label: 'Home', icon: <HomeIcon />, path: '/home' },
        { label: 'Lekcje', icon: <MenuBookIcon />, path: '/home/player/lessons' },
        { label: 'Trenerzy', icon: <GroupIcon />, path: '/home/player/coaches' },
      ]
    : [
        { label: 'Home', icon: <HomeIcon />, path: '/home' },
        { label: 'Lekcje', icon: <MenuBookIcon />, path: '/home/coach/lessons' },
        { label: 'Zawodnicy', icon: <PeopleIcon />, path: '/home/coach/players' },
        { label: 'Pozycje', icon: <GridViewIcon />, path: '/home/coach/positions' },
      ];

  const currentValue = navItems.findIndex((item) => location.pathname === item.path);

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: { xs: 'block', sm: 'none' },
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
