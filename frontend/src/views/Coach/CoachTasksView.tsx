import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Grid,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronRight from '@mui/icons-material/ChevronRight';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useCoachTasks } from '../../hooks/useCoachTasks';
import { tasksService } from '../../services/tasksService';
import { stageLabel } from '../../utils/pluralize';
import type { EnrichedCoachTask, TaskStatus } from '../../types/coachTasks';

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  draft: 'Szkic',
  published: 'Opublikowane',
  archived: 'Zarchiwizowane',
};

function TaskCard({ task, groupId, onTogglePublish, busyTaskId }: {
  task: EnrichedCoachTask;
  groupId?: number;
  onTogglePublish: (taskId: number, current: TaskStatus) => void;
  busyTaskId: number | null;
}) {
  const navigate = useNavigate();

  const classes = task.assignees.filter((a) => a.type === 'class');
  const individuals = task.assignees.filter((a) => a.type === 'individual');

  const completedCount = groupId !== undefined ? task.completedStageCounts[String(groupId)] : undefined;
  const stageCount = task.stages.length;
  const stageLabelText = completedCount !== undefined
    ? `${completedCount}/${stageCount} etapów`
    : stageLabel(stageCount);
  const stageChipColor = completedCount === undefined ? 'primary'
    : completedCount === stageCount ? 'success'
    : completedCount > 0 ? 'warning' : 'default';

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
        border: '1px solid',
        borderColor: 'grey.200',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        position: 'relative',
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
        onClick={() => navigate(`/home/coach/tasks/${task.id}`)}
        sx={{ p: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1, borderRadius: 2 }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Chip
              label={TASK_STATUS_LABEL[task.status]}
              color={task.status === 'published' ? 'success' : task.status === 'archived' ? 'warning' : 'default'}
              size="small"
              variant="filled"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
            <Tooltip title={task.title} arrow>
              <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.3, flex: 1 }} noWrap>
                {task.title}
              </Typography>
            </Tooltip>
          </Box>

          {task.description && (
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block', mb: 0.5 }}>
              {task.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {classes.map((a) => (
              <Chip key={a.groupId} icon={<GroupIcon />} label={a.label} size="small" variant="outlined" color="primary" sx={{ height: 22, fontSize: '0.7rem' }} />
            ))}
            {individuals.map((a) => (
              <Chip key={a.groupId} icon={<PersonIcon />} label={a.label} size="small" variant="outlined" color="secondary" sx={{ height: 22, fontSize: '0.7rem' }} />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Chip
            label={stageLabelText}
            size="small"
            color={stageChipColor}
            variant="outlined"
            sx={{ height: 24, fontSize: '0.75rem' }}
          />
          <Button
            component="span"
            size="small"
            startIcon={task.status === 'published' ? <UnpublishedIcon /> : <PublishIcon />}
            variant={busyTaskId === task.id ? 'outlined' : 'outlined'}
            onClick={(e) => { e.stopPropagation(); onTogglePublish(task.id, task.status); }}
            sx={{ textTransform: 'none', fontSize: '0.7rem', py: 0, minHeight: 24, whiteSpace: 'nowrap', opacity: busyTaskId === task.id ? 0.4 : 1, pointerEvents: busyTaskId === task.id ? 'none' : 'auto' }}
          >
            {task.status === 'published' ? 'Cofnij' : 'Publikuj'}
          </Button>
        </Box>

        <ChevronRight color="action" sx={{ fontSize: 20, mt: 0.5, flexShrink: 0 }} />
      </CardActionArea>
    </Card>
  );
}

export function CoachTasksView() {
  const { tasks, loading, error, reload } = useCoachTasks();
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const togglePublish = useCallback(async (taskId: number, current: TaskStatus) => {
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
  }, [reload]);

  const { classGroups, individualGroups } = useMemo(() => {
    const classMap = new Map<string, { label: string; groupId: number; tasks: EnrichedCoachTask[] }>();
    const individualMap = new Map<string, { label: string; groupId: number; tasks: EnrichedCoachTask[] }>();

    for (const task of tasks) {
      for (const a of task.assignees) {
        if (a.type === 'class') {
          if (!classMap.has(a.label)) {
            classMap.set(a.label, { label: a.label, groupId: a.groupId, tasks: [] });
          }
          classMap.get(a.label)!.tasks.push(task);
        } else {
          if (!individualMap.has(a.label)) {
            individualMap.set(a.label, { label: a.label, groupId: a.groupId, tasks: [] });
          }
          individualMap.get(a.label)!.tasks.push(task);
        }
      }
    }

    return {
      classGroups: Array.from(classMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
      individualGroups: Array.from(individualMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
    };
  }, [tasks]);

  if (loading) return <PageLayout maxWidth="md"><LoadingState /></PageLayout>;
  if (error) return <PageLayout maxWidth="md"><Alert severity="error">{error}</Alert></PageLayout>;
  if (tasks.length === 0) {
    return (
      <PageLayout maxWidth="md">
        <EmptyState message="Nie masz jeszcze żadnych zadań. Utwórz je w zakładce Pozycje." />
      </PageLayout>
    );
  }

  const renderGroup = (label: string, icon: ReactNode, groups: Array<{ groupId: number; label: string; tasks: EnrichedCoachTask[] }>) => (
    groups.length > 0 && (
      <Paper elevation={2} sx={{ p: 2, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {icon}
          <Typography variant="h6">{label}</Typography>
        </Box>
        {groups.map((g) => (
          <Box key={g.groupId} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {g.label}
            </Typography>
            <Grid container spacing={2}>
              {g.tasks.map((task) => (
                <Grid key={task.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <TaskCard task={task} groupId={g.groupId} onTogglePublish={togglePublish} busyTaskId={busyTaskId} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Paper>
    )
  );

  return (
    <PageLayout maxWidth="lg">
      <Typography variant="h5" sx={{ mb: 2 }}>Moje zadania</Typography>
      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

      {renderGroup('Klasy', <GroupIcon color="primary" />, classGroups)}
      {renderGroup('Zawodnicy', <PersonIcon color="primary" />, individualGroups)}

      {tasks.length > 0 && classGroups.length === 0 && individualGroups.length === 0 && (
        <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
          <Grid container spacing={2}>
            {tasks.map((task) => (
              <Grid key={task.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <TaskCard task={task} onTogglePublish={togglePublish} busyTaskId={busyTaskId} />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </PageLayout>
  );
}
