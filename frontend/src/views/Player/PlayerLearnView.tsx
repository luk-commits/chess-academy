import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button } from '@mui/material';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { BackButton } from '../../components/feedback/BackButton';
import { FeedbackOverlay } from '../../components/feedback/FeedbackOverlay';
import { GlassHeader } from '../../components/zen/GlassHeader';
import { StageProgressBar } from '../../components/zen/StageProgressBar';
import { SrStageBoard } from '../../components/srlearn/SrStageBoard';
import { useDueStages } from '../../hooks/useDueStages';
import { playerStagesService } from '../../services/playerStagesService';

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
        <BackButton onClick={() => navigate('/home')} />
      </PageLayout>
    );
  }

  if (totalDue === 0) {
    return (
      <PageLayout maxWidth="md">
        <EmptyState message="Brak powtórek na dziś. Wróć później." />
        <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
          <BackButton onClick={() => navigate('/home')} />
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
          <BackButton onClick={() => navigate('/home')} />
          <Button variant="outlined" onClick={reload}>Sprawdź ponownie</Button>
        </Box>
      </PageLayout>
    );
  }

  if (!currentStage) return null;

  return (
    <PageLayout maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <BackButton label="Przerwij" onClick={() => navigate('/home')} />
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

        {feedback && <FeedbackOverlay kind={feedback.kind} />}
      </Box>
    </PageLayout>
  );
}
