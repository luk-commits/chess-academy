import { Box } from '@mui/material';
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined';
import { RollingScore } from './RollingScore';
import { ZEN_REWARD, ZEN_PENALTY, floatUp } from './theme';

export interface ScoreDelta {
  id: number;
  value: number;
}

interface Props {
  score: number;
  deltas: ScoreDelta[];
}

export function ScoreBadge({ score, deltas }: Props) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 8,
        right: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.5,
        borderRadius: 999,
        bgcolor: 'rgba(15, 23, 42, 0.85)',
        color: '#f1f5f9',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.25)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 600,
        fontSize: 14,
        zIndex: 4,
        pointerEvents: 'none',
      }}
    >
      <EmojiEventsOutlined sx={{ fontSize: 16, color: '#facc15' }} />
      <Box component="span" sx={{ minWidth: 32, textAlign: 'right' }}>
        <RollingScore value={score} />
      </Box>
      {deltas.map((d) => (
        <Box
          key={d.id}
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: '100%',
            color: d.value > 0 ? ZEN_REWARD : ZEN_PENALTY,
            fontWeight: 700,
            fontSize: 14,
            animation: `${floatUp} 900ms ease-out forwards`,
            pointerEvents: 'none',
          }}
        >
          {d.value > 0 ? `+${d.value}` : d.value}
        </Box>
      ))}
    </Box>
  );
}
