import SchoolIcon from '@mui/icons-material/School';
import { ComingSoonPlaceholder } from '../../components/feedback/ComingSoonPlaceholder';

export function LessonsView() {
  return (
    <ComingSoonPlaceholder
      icon={<SchoolIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />}
      title="Lekcje"
      description="Przeglądaj dostępne lekcje szachowe."
    />
  );
}
