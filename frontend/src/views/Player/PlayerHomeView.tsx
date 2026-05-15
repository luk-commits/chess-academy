import { WelcomeCard } from '../../components/home/WelcomeCard';
import { useAuth } from '../../hooks/useAuth';

export function PlayerHomeView() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <WelcomeCard
      greeting="Witaj zawodniku!"
      description="Panel zawodnika – wkrótce dostępne lekcje i lista trenerów."
    />
  );
}
