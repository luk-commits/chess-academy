import { keyframes } from '@mui/material';

export const ZEN_ACCENT = '#2196f3';
export const ZEN_MUTED = 'rgba(148, 163, 184, 0.35)';
export const ZEN_REWARD = '#16a34a';
export const ZEN_PENALTY = '#fb7185';
export const ZEN_SELECTED_SQUARE = 'rgba(33, 150, 243, 0.35)';

export const floatUp = keyframes`
  0%   { opacity: 0; transform: translate(-50%, 0) scale(0.85); }
  20%  { opacity: 1; transform: translate(-50%, -10px) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -55px) scale(1); }
`;

export const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
`;
