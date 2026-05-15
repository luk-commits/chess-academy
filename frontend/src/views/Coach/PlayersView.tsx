import PeopleIcon from '@mui/icons-material/People';
import { ComingSoonPlaceholder } from '../../components/feedback/ComingSoonPlaceholder';

export function PlayersView() {
  return (
    <ComingSoonPlaceholder
      icon={<PeopleIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />}
      title="Zawodnicy"
      description="Zarządzaj swoimi zawodnikami."
    />
  );
}
