import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useCoachTasks } from '../../hooks/useCoachTasks';
import { tasksService } from '../../services/tasksService';
import type { CoachStageSummary, StageStatus, TaskStatus } from '../../types/coachTasks';

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  draft: 'Szkic',
  published: 'Opublikowane',
  archived: 'Zarchiwizowane',
};

const STAGE_STATUS_LABEL: Record<StageStatus, string> = {
  draft: 'Szkic',
  in_progress: 'W edycji',
  published: 'Opublikowany',
};

const TASK_STATUS_COLOR: Record<TaskStatus, 'default' | 'success' | 'warning'> = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
};

const STAGE_STATUS_COLOR: Record<StageStatus, 'default' | 'info' | 'success'> = {
  draft: 'default',
  in_progress: 'info',
  published: 'success',
};

export function CoachTasksView() {
  const navigate = useNavigate();
  const { tasks, loading, error, reload } = useCoachTasks();
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) return <PageLayout maxWidth="md"><LoadingState /></PageLayout>;
  if (error) return <PageLayout maxWidth="md"><Alert severity="error">{error}</Alert></PageLayout>;
  if (tasks.length === 0) {
    return (
      <PageLayout maxWidth="md">
        <EmptyState message="Nie masz jeszcze żadnych zadań. Utwórz je w zakładce Pozycje." />
      </PageLayout>
    );
  }

  const togglePublish = async (taskId: number, current: TaskStatus) => {
    setBusyTaskId(taskId);
    setActionError(null);
    const next: TaskStatus = current === 'published' ? 'draft' : 'published';
    try {
      await tasksService.updateCoachTask(taskId, { status: next });
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Nie udało się zmienić statusu.');
    } finally {
      setBusyTaskId(null);
    }
  };

  const renderStageRow = (stage: CoachStageSummary) => (
    <Box key={stage.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
      <Typography variant="body2" sx={{ flex: 1 }}>
        {stage.title}
      </Typography>
      <Chip
        label={stage.hasSolutionPgn ? 'PGN ✓' : 'brak PGN'}
        color={stage.hasSolutionPgn ? 'success' : 'default'}
        size="small"
        variant={stage.hasSolutionPgn ? 'filled' : 'outlined'}
      />
      <Chip
        label={STAGE_STATUS_LABEL[stage.status]}
        color={STAGE_STATUS_COLOR[stage.status]}
        size="small"
      />
      <IconButton
        size="small"
        onClick={() => navigate(`/home/coach/stages/${stage.id}`)}
        aria-label={`Edytuj etap ${stage.title}`}
      >
        <EditIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  return (
    <PageLayout maxWidth="md">
      <Typography variant="h5" sx={{ mb: 2 }}>Moje zadania</Typography>
      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tasks.map((task) => (
          <Card key={task.id} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ flex: 1 }}>{task.title}</Typography>
                <Chip label={TASK_STATUS_LABEL[task.status]} color={TASK_STATUS_COLOR[task.status]} size="small" />
                <Button
                  size="small"
                  startIcon={task.status === 'published' ? <UnpublishedIcon /> : <PublishIcon />}
                  variant="outlined"
                  disabled={busyTaskId === task.id}
                  onClick={() => togglePublish(task.id, task.status)}
                >
                  {task.status === 'published' ? 'Cofnij' : 'Publikuj'}
                </Button>
              </Box>

              {task.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {task.description}
                </Typography>
              )}

              <Divider sx={{ my: 1 }} />

              {task.stages.length === 0 ? (
                <Typography variant="caption" color="text.secondary">Brak etapów.</Typography>
              ) : (
                <Box>
                  {task.stages.map(renderStageRow)}
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </PageLayout>
  );
}
