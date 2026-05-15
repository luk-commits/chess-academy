import GroupIcon from '@mui/icons-material/Group';
import { ComingSoonPlaceholder } from '../../components/feedback/ComingSoonPlaceholder';

export function CoachesView() {
  return (
    <ComingSoonPlaceholder
      icon={<GroupIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />}
      title="Trenerzy"
      description="Lista dostępnych trenerów szachowych."
    />
  );
}
