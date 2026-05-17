import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { PgnPreview } from '../../components/chess/PgnPreview';
import { tasksService } from '../../services/tasksService';
import type { CoachStageDetail, StageStatus } from '../../types/coachTasks';

const STATUS_OPTIONS: { value: StageStatus; label: string }[] = [
  { value: 'draft', label: 'Szkic' },
  { value: 'in_progress', label: 'W edycji' },
  { value: 'published', label: 'Opublikowany' },
];

export function CoachStageEditView() {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();

  const [stage, setStage] = useState<CoachStageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [solutionPgn, setSolutionPgn] = useState('');
  const [status, setStatus] = useState<StageStatus>('draft');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const id = Number(stageId);
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    tasksService.fetchCoachStage(id)
      .then((res) => {
        if (cancelled) return;
        setStage(res.stage);
        setTitle(res.stage.title);
        setSolutionPgn(res.stage.solutionPgn ?? '');
        setStatus(res.stage.status);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : 'Nie udało się pobrać etapu.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stageId]);

  const handleSave = useCallback(async () => {
    if (!stage) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await tasksService.updateCoachStage(stage.id, {
        title,
        solutionPgn,
        status,
      });
      setStage(res.stage);
      setSolutionPgn(res.stage.solutionPgn ?? '');
      setSavedAt(Date.now());
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Nie udało się zapisać.');
    } finally {
      setSaving(false);
    }
  }, [stage, title, solutionPgn, status]);

  if (loading) return <PageLayout maxWidth="md"><LoadingState /></PageLayout>;

  if (loadError || !stage) {
    return (
      <PageLayout maxWidth="md">
        <Alert severity="error" sx={{ mb: 2 }}>{loadError ?? 'Etap nie znaleziony.'}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/home/coach/tasks')}>
          Wróć do listy
        </Button>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/home/coach/tasks')}>
          Wróć do listy
        </Button>
      </Box>

      <Typography variant="h5" sx={{ mb: 1 }}>Edycja etapu</Typography>
      {stage.taskTitle && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Zadanie: {stage.taskTitle}
        </Typography>
      )}

      {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
      {savedAt && !saveError && <Alert severity="success" sx={{ mb: 2 }}>Zapisano.</Alert>}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Tytuł etapu"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
            alignItems: 'start',
          }}
        >
          <TextField
            label="Rozwiązanie (PGN)"
            value={solutionPgn}
            onChange={(e) => setSolutionPgn(e.target.value)}
            placeholder={'1. e4 e5 2. Nf3 Nc6 3. Bb5'}
            multiline
            minRows={10}
            fullWidth
            helperText="Główna linia rozwiązania w notacji PGN. Możesz też przeciągać figury na szachownicy obok - ruchy dopisują się od bieżącej pozycji."
          />

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Podgląd
            </Typography>
            {stage.positionFen ? (
              <PgnPreview
                baseFen={stage.positionFen}
                solutionPgn={solutionPgn}
                onChange={setSolutionPgn}
              />
            ) : (
              <Alert severity="info">Etap nie ma przypisanej pozycji - podgląd niedostępny.</Alert>
            )}
          </Box>
        </Box>

        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as StageStatus)}
          sx={{ maxWidth: 240 }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Zapisywanie...' : 'Zapisz'}
          </Button>
        </Box>
      </Box>
    </PageLayout>
  );
}
