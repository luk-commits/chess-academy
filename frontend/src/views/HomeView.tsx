import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TopBar } from '../components/TopBar';
import { PlayerHomeView } from './Player/PlayerHomeView';
import { CoachHomeView } from './Coach/CoachHomeView';

export function HomeView() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  if (location.pathname === '/home') {
    return (
      <>
        <TopBar />
        {user.role === 'PLAYER' ? <PlayerHomeView /> : <CoachHomeView />}
      </>
    );
  }

  return (
    <>
      <TopBar />
      <Outlet />
    </>
  );
}
