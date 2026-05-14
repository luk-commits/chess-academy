import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Card, CardActionArea, Chip, Grid, IconButton, Paper, Typography } from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ChevronRight from '@mui/icons-material/ChevronRight';
import FlagOutlined from '@mui/icons-material/FlagOutlined';
import SchoolIcon from '@mui/icons-material/School';
import { playerTasksService } from '../../services/playerTasksService';
import type { PlayerTask } from '../../types/position';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';

const getStageLabel = (count: number): string => {
  if (count === 1) return '1 etap';
  if (count < 5) return `${count} etapy`;
  return `${count} etapów`;
};

const CoachSection = memo(function CoachSection({ coachName, tasks }: {
  coachName: string;
  tasks: PlayerTask[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleTaskClick = useCallback((taskId: number) => {
    navigate(`/home/player/tasks/${taskId}`);
  }, [navigate]);

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SchoolIcon color="primary" />
        <Typography variant="h5" sx={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setCollapsed(c => !c)}>{coachName}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {tasks.length} zada{tasks.length === 1 ? 'nie' : 'ń'}
        </Typography>
        <IconButton size="small" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? <ExpandMore /> : <ExpandLess />}
        </IconButton>
      </Box>
      {!collapsed && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {tasks.map((task) => (
              <Grid key={task.id} size={{ xs: 12, sm: 6, md: 4 }}>
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
                    onClick={() => handleTaskClick(task.id)}
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
                      label={getStageLabel(task.stages.length)}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 24, fontSize: '0.75rem' }}
                    />
                    <ChevronRight color="action" sx={{ fontSize: 20 }} />
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Paper>
  );
});

export function PlayerTasksView() {
  const [tasks, setTasks] = useState<PlayerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await playerTasksService.fetchTasks();
        if (!cancelled) {
          setTasks(data.tasks);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Nie udalo sie pobrac zadan.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const groupedByCoach = useMemo(() => {
    const groups: Record<string, PlayerTask[]> = {};
    for (const task of tasks) {
      const coach = task.coachName || 'Nieznany trener';
      if (!groups[coach]) groups[coach] = [];
      groups[coach].push(task);
    }
    return groups;
  }, [tasks]);

  const hasAny = tasks.length > 0;

  return (
    <PageLayout>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {loading ? (
        <LoadingState />
      ) : !hasAny ? (
        <EmptyState message="Nie masz jeszcze żadnych zadań. Skontaktuj się z trenerem, aby otrzymać zadania." />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(Object.entries(groupedByCoach) as [string, PlayerTask[]][]).map(([coachName, coachTasks]) => (
            <CoachSection
              key={coachName}
              coachName={coachName}
              tasks={coachTasks}
            />
          ))}
        </Box>
      )}
    </PageLayout>
  );
}
