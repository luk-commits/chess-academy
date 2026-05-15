import SchoolIcon from '@mui/icons-material/School';
import { ComingSoonPlaceholder } from '../../components/feedback/ComingSoonPlaceholder';

export function PlayerLessonsView() {
  return (
    <ComingSoonPlaceholder
      icon={<SchoolIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />}
      title="Lekcje"
      description="Twoje lekcje szachowe – przeglądaj materiały i zadania."
    />
  );
}
