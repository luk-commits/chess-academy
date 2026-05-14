import { Snackbar } from '@mui/material';

interface CopyFeedbackSnackbarProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function CopyFeedbackSnackbar({ open, onClose, message = 'Skopiowano do schowka' }: CopyFeedbackSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={1500}
      onClose={onClose}
      message={message}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    />
  );
}
