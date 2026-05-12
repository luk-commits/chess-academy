import { useAuth } from '../hooks/useAuth';
import { TopBar } from '../components/TopBar';
import { PlayerHomeView } from './Player/PlayerHomeView';
import { CoachHomeView } from './Coach/CoachHomeView';

export function HomeView() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <TopBar />
      {user.role === 'PLAYER' ? <PlayerHomeView /> : <CoachHomeView />}
    </>
  );
}
