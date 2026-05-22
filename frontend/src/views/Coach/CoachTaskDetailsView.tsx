import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Link,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useCoachTasks } from '../../hooks/useCoachTasks';
import type { CoachStageSummary, TaskStatus } from '../../types/coachTasks';

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  draft: 'Szkic',
  published: 'Opublikowane',
  archived: 'Zarchiwizowane',
};

const TASK_STATUS_COLOR: Record<TaskStatus, 'default' | 'success' | 'warning'> = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
};

export function CoachTaskDetailsView() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { tasks, loading, error } = useCoachTasks();

  const task = useMemo(
    () => tasks.find((t) => t.id === Number(taskId)),
    [tasks, taskId],
  );

  const handleBack = useCallback(() => {
    navigate('/home/coach/tasks');
  }, [navigate]);

  if (loading) return <PageLayout maxWidth="md"><LoadingState /></PageLayout>;
  if (error) return <PageLayout maxWidth="md"><Alert severity="error">{error}</Alert></PageLayout>;
  if (!task) {
    return (
      <PageLayout maxWidth="md">
        <EmptyState message="Zadanie nie znalezione." />
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Wróć do listy zadań
        </Button>
      </PageLayout>
    );
  }

  const stageCount = task.stages.length;
  const publishedCount = task.stages.filter((s) => s.status === 'published').length;
  const pgnReadyCount = task.stages.filter((s) => s.hasSolutionPgn).length;

  const renderStageRow = (stage: CoachStageSummary) => (
    <Card key={stage.id} variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ flex: 1, fontWeight: 500 }}>
            {stage.title}
          </Typography>
          <Chip
            label={stage.hasSolutionPgn ? 'PGN ✓' : 'Brak PGN'}
            color={stage.hasSolutionPgn ? 'success' : 'default'}
            size="small"
            variant={stage.hasSolutionPgn ? 'filled' : 'outlined'}
          />
          <Chip
            label={stage.status === 'draft' ? 'Szkic' : stage.status === 'in_progress' ? 'W edycji' : 'Opublikowany'}
            color={stage.status === 'published' ? 'success' : stage.status === 'in_progress' ? 'info' : 'default'}
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
      </CardContent>
    </Card>
  );

  const classes = task.assignees.filter((a) => a.type === 'class');
  const individuals = task.assignees.filter((a) => a.type === 'individual');

  return (
    <PageLayout maxWidth="md">
      <Box sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 1 }}>
          Wróć do listy zadań
        </Button>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            sx={{ cursor: 'pointer' }}
            onClick={handleBack}
          >
            Moje zadania
          </Link>
          <Typography color="text.primary">{task.title}</Typography>
        </Breadcrumbs>
      </Box>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{ flex: 1 }}>{task.title}</Typography>
            <Chip label={TASK_STATUS_LABEL[task.status]} color={TASK_STATUS_COLOR[task.status]} size="small" />
          </Box>

          {task.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {task.description}
            </Typography>
          )}

          {(classes.length > 0 || individuals.length > 0) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
              {classes.map((a) => (
                <Chip key={a.groupId} icon={<GroupIcon />} label={a.label} size="small" variant="outlined" color="primary" />
              ))}
              {individuals.map((a) => (
                <Chip key={a.groupId} icon={<PersonIcon />} label={a.label} size="small" variant="outlined" color="secondary" />
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Etapy: {stageCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Opublikowane: {publishedCount}/{stageCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Z PGN: {pgnReadyCount}/{stageCount}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 2 }}>Pozycje / Etapy</Typography>

      {stageCount === 0 ? (
        <Alert severity="info">To zadanie nie ma jeszcze żadnych etapów.</Alert>
      ) : (
        <Box>
          {task.stages.map(renderStageRow)}
        </Box>
      )}
    </PageLayout>
  );
}