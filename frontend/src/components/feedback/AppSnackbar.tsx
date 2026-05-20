import { Alert, Snackbar } from '@mui/material';

export type AppSnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

interface AppSnackbarProps {
  open: boolean;
  message: string;
  onClose: () => void;
  severity?: AppSnackbarSeverity;
  autoHideDuration?: number;
}

/**
 * Wspólna otoczka snackbara dla zwykłych komunikatów i alertów.
 */
export function AppSnackbar({
  open,
  message,
  onClose,
  severity,
  autoHideDuration,
}: AppSnackbarProps) {
  const duration = autoHideDuration ?? (severity ? 4000 : 1500);

  if (severity) {
    return (
      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={severity} variant="filled" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    );
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      message={message}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    />
  );
}
