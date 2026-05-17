import { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, IconButton, Paper, Typography } from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import SchoolIcon from '@mui/icons-material/School';
import type { PlayerTask } from '../../types/position';
import { tasksLabel } from '../../utils/pluralize';
import { PlayerTaskCard } from './PlayerTaskCard';

interface Props {
  coachName: string;
  tasks: PlayerTask[];
}

export const CoachTasksSection = memo(function CoachTasksSection({ coachName, tasks }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const toggle = useCallback(() => setCollapsed(c => !c), []);
  const openTask = useCallback((taskId: number) => {
    navigate(`/home/player/tasks/${taskId}`);
  }, [navigate]);

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SchoolIcon color="primary" />
        <Typography
          variant="h5"
          sx={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={toggle}
        >
          {coachName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', cursor: 'pointer', userSelect: 'none' }} onClick={toggle}>
          {tasksLabel(tasks.length)}
        </Typography>
        <IconButton size="small" onClick={toggle} aria-label={tasksLabel(tasks.length)}>
          {collapsed ? <ExpandMore /> : <ExpandLess />}
        </IconButton>
      </Box>
      {!collapsed && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {tasks.map((task) => (
              <Grid key={task.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <PlayerTaskCard task={task} onOpen={openTask} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Paper>
  );
});
