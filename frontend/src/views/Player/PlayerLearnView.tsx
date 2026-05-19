import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Typography } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { GlassHeader } from '../../components/zen/GlassHeader';
import { StageProgressBar } from '../../components/zen/StageProgressBar';
import { SrStageBoard } from '../../components/srlearn/SrStageBoard';
import { useDueStages } from '../../hooks/useDueStages';
import { playerStagesService } from '../../services/playerStagesService';
import { ZEN_PENALTY, ZEN_REWARD } from '../../components/zen/theme';

type Feedback = { kind: 'pass' | 'fail' } | null;

export function PlayerLearnView() {
  const navigate = useNavigate();
  const { stages, loading, error, reload } = useDueStages();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    setCurrentIndex(0);
    setFeedback(null);
  }, [stages]);

  const totalDue = stages.length;
  const currentStage = stages[currentIndex] ?? null;

  const handleComplete = useCallback((passed: boolean) => {
    if (!currentStage) return;
    setFeedback({ kind: passed ? 'pass' : 'fail' });
    void playerStagesService.submitAttempt(currentStage.id, passed).catch(() => undefined);
    window.setTimeout(() => {
      setCurrentIndex((idx) => idx + 1);
      window.setTimeout(() => {
        setFeedback(null);
      }, 400);
    }, 1500);
  }, [currentStage]);

  if (loading) return <PageLayout maxWidth="md"><LoadingState /></PageLayout>;

  if (error) {
    return (
      <PageLayout maxWidth="md">
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/home')}>Wróć</Button>
      </PageLayout>
    );
  }

  if (totalDue === 0) {
    return (
      <PageLayout maxWidth="md">
        <EmptyState message="Brak powtórek na dziś. Wróć później." />
        <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/home')}>Wróć</Button>
          <Button variant="outlined" onClick={reload}>Odśwież</Button>
        </Box>
      </PageLayout>
    );
  }

  if (currentIndex >= totalDue) {
    return (
      <PageLayout maxWidth="md">
        <EmptyState message={`Skończone! ${totalDue} ${totalDue === 1 ? 'powtórka' : 'powtórek'} za tobą.`} />
        <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/home')}>Wróć</Button>
          <Button variant="outlined" onClick={reload}>Sprawdź ponownie</Button>
        </Box>
      </PageLayout>
    );
  }

  if (!currentStage) return null;

  return (
    <PageLayout maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/home')}>
          Przerwij
        </Button>
      </Box>

      <StageProgressBar total={totalDue} currentIndex={currentIndex} />

      <GlassHeader
        title={currentStage.task.title}
        description={`Trener: ${currentStage.task.coachName}`}
        stageTitle={`Powtórka ${currentIndex + 1} z ${totalDue} · ${currentStage.title}`}
      />

      <Box
        sx={{
          position: 'relative',
          maxWidth: 560,
          mx: 'auto',
          aspectRatio: '1 / 1',
          width: '100%',
        }}
      >
        <SrStageBoard
          key={currentStage.id}
          stage={currentStage}
          onComplete={handleComplete}
        />

        {feedback && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.55)',
              borderRadius: 3,
              color: 'common.white',
              zIndex: 2,
              gap: 1,
            }}
          >
            {feedback.kind === 'pass' ? (
              <CheckCircle sx={{ fontSize: 80, color: ZEN_REWARD }} />
            ) : (
              <Cancel sx={{ fontSize: 80, color: ZEN_PENALTY }} />
            )}
            <Typography variant="h6">
              {feedback.kind === 'pass' ? 'Świetnie!' : 'Następnym razem.'}
            </Typography>
          </Box>
        )}
      </Box>
    </PageLayout>
  );
}
