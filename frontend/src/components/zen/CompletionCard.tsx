import { Button, Paper, Typography } from '@mui/material';
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined';

interface Props {
  score: number;
  hasNext: boolean;
  autoAdvance: boolean;
  onContinue: () => void;
}

export function CompletionCard({ score, hasNext, autoAdvance, onContinue }: Props) {
  return (
    <Paper
      sx={{
        position: 'absolute',
        inset: 0,
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        textAlign: 'center',
        gap: 1.5,
        background: 'linear-gradient(135deg, #ffffff, #f0f9ff)',
      }}
    >
      <EmojiEventsOutlined sx={{ fontSize: 56, color: '#facc15' }} />
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Zadanie ukończone
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Wynik końcowy: <strong>{score}</strong>
      </Typography>
      {autoAdvance && (
        <Typography variant="caption" color="text.secondary">
          {hasNext ? 'Przechodzę do następnego...' : 'Brak kolejnego zadania.'}
        </Typography>
      )}
      <Button variant="contained" onClick={onContinue} sx={{ mt: 1 }}>
        {hasNext ? 'Następne zadanie' : 'Wróć do listy zadań'}
      </Button>
    </Paper>
  );
}
