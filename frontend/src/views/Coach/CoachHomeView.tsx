import { WelcomeCard } from '../../components/home/WelcomeCard';
import { useAuth } from '../../hooks/useAuth';

export function CoachHomeView() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <WelcomeCard
      greeting="Witaj trenerze!"
      description="Panel trenera – wkrótce dostępne lekcje, lista zawodników i pozycje szachowe."
    />
  );
}
