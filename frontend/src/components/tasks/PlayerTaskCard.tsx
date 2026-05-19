import { Box, Card, CardActionArea, Chip, Tooltip, Typography } from '@mui/material';
import Flag from '@mui/icons-material/Flag';
import ChevronRight from '@mui/icons-material/ChevronRight';
import type { PlayerTask } from '../../types/position';
import { stageLabel } from '../../utils/pluralize';

interface Props {
  task: PlayerTask;
  onOpen: (taskId: number) => void;
}

const FLAG_COLOR: Record<string, 'success' | 'info' | 'warning' | 'primary' | 'disabled'> = {
  new: 'success',
  in_progress: 'info',
  interrupted: 'warning',
  completed: 'primary',
  archived: 'disabled',
};

const STATUS_TOOLTIP: Record<string, string> = {
  new: 'Nowe – kliknij, aby rozpocząć',
  in_progress: 'Rozpoczęte – możesz kontynuować',
  interrupted: 'Przerwane – możesz wrócić do zadania',
  completed: 'Ukończone – zadanie zaliczone',
  archived: 'W archiwum – zadanie zarchiwizowane',
};

function statusDescription(task: PlayerTask): string {
  const tp = task.taskProgress;
  if (!tp || tp.status === 'new') return 'Kliknij, aby rozpocząć';
  if (tp.status === 'completed') return 'Ukończone';
  if (tp.status === 'archived') return 'W archiwum';
  return 'Wróć do etapu ' + ((task.stages.findIndex(s => s.id === tp.currentStageId) ?? 0) + 1);
}

export function PlayerTaskCard({ task, onOpen }: Props) {
  const tp = task.taskProgress;
  const status = tp?.status ?? 'new';
  const stagesCount = task.stages.length;

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
        <Tooltip title={STATUS_TOOLTIP[status]} arrow>
          <Flag color={FLAG_COLOR[status]} sx={{ fontSize: 22 }} />
        </Tooltip>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Tooltip title={task.title} arrow>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
              {task.title}
            </Typography>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            {statusDescription(task)}
          </Typography>
        </Box>
        <Chip
          label={stageLabel(stagesCount)}
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
