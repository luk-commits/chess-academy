import { Box, Card, CardActionArea, Chip, Typography } from '@mui/material';
import FlagOutlined from '@mui/icons-material/FlagOutlined';
import ChevronRight from '@mui/icons-material/ChevronRight';
import type { PlayerTask } from '../../types/position';
import { stageLabel } from '../../utils/pluralize';

interface Props {
  task: PlayerTask;
  onOpen: (taskId: number) => void;
}

export function PlayerTaskCard({ task, onOpen }: Props) {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
        border: '1px solid',
        borderColor: 'grey.200',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
          borderColor: 'primary.light',
        },
        '&:focus-within': {
          borderColor: 'primary.main',
          boxShadow: '0 0 0 3px rgba(26, 35, 126, 0.15)',
        },
      }}
    >
      <CardActionArea
        onClick={() => onOpen(task.id)}
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderRadius: 2,
          minHeight: 64,
        }}
      >
        <FlagOutlined color="secondary" sx={{ fontSize: 22 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
            {task.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            Kliknij, aby rozpocząć
          </Typography>
        </Box>
        <Chip
          label={stageLabel(task.stages.length)}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ height: 24, fontSize: '0.75rem' }}
        />
        <ChevronRight color="action" sx={{ fontSize: 20 }} />
      </CardActionArea>
    </Card>
  );
}
