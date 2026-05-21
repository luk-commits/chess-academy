import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardActionArea, Chip, Typography } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import FlagOutlined from '@mui/icons-material/FlagOutlined';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { AppSnackbar } from '../../components/feedback/AppSnackbar';
import { usePlayerTasks } from '../../hooks/usePlayerTasks';
import { playerTasksService } from '../../services/playerTasksService';

export function PlayerTasksArchiveView() {
  const { tasks, loading, error, reload } = usePlayerTasks();
  const navigate = useNavigate();
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);

  const archivedTasks = useMemo(() => tasks.filter(t => t.taskProgress?.status === 'archived'), [tasks]);

  const handleRestore = async (taskId: number) => {
    try {
      await playerTasksService.restoreTask(taskId);
      reload();
      setSnackbarMsg('Zadanie zostało przywrócone jako nowe.');
    } catch {
      setSnackbarMsg('Nie udało się przywrócić zadania.');
    }
  };

  if (loading) return <PageLayout maxWidth="md"><LoadingState /></PageLayout>;
  if (error) return <PageLayout maxWidth="md"><Alert severity="error">{error}</Alert></PageLayout>;

  return (
    <PageLayout maxWidth="md">
      <Typography variant="h5" sx={{ mb: 2 }}>Archiwum zadań</Typography>

      {archivedTasks.length === 0 ? (
        <EmptyState message="Brak zarchiwizowanych zadań." />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {archivedTasks.map(task => (
            <Card key={task.id} elevation={2} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
              <CardActionArea
                onClick={() => navigate(`/home/player/tasks/${task.id}`)}
                sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 2 }}
              >
                <FlagOutlined color="secondary" sx={{ fontSize: 22 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{task.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{task.coachName}</Typography>
                </Box>
                <Chip label="W archiwum" size="small" variant="outlined" sx={{ height: 24, fontSize: '0.75rem' }} />
                <Button
                  size="small"
                  startIcon={<RestoreIcon />}
                  variant="outlined"
                  onClick={(e) => { e.stopPropagation(); handleRestore(task.id); }}
                  sx={{ mr: 1 }}
                >
                  Przywróć
                </Button>
                <ChevronRight color="action" sx={{ fontSize: 20 }} />
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      <AppSnackbar
        open={!!snackbarMsg}
        autoHideDuration={3000}
        onClose={() => setSnackbarMsg(null)}
        message={snackbarMsg ?? ''}
      />
    </PageLayout>
  );
}
