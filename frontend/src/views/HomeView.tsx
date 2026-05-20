import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { PlayerHomeView } from './Player/PlayerHomeView';
import { CoachHomeView } from './Coach/CoachHomeView';

/**
 * Widok layoutu po zalogowaniu, otaczający strony właściwe dla roli.
 */
export function HomeView() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <Box sx={{ pb: { xs: 7, sm: 0 }, minHeight: '100vh' }}>
      <TopBar />

      {location.pathname === '/home'
        ? user.role === 'PLAYER' ? <PlayerHomeView /> : <CoachHomeView />
        : <Outlet />
      }

      <BottomNav />
    </Box>
  );
}
