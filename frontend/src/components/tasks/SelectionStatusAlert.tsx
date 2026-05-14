import { Alert } from '@mui/material';

export interface SelectionStatusAlertProps {
  selectedPositionCount: number;
  selectedGroupCount: number;
}

export function SelectionStatusAlert({ selectedPositionCount, selectedGroupCount }: SelectionStatusAlertProps) {
  if (selectedPositionCount > 0 && selectedGroupCount > 0) {
    return (
      <Alert severity="success" sx={{ py: 0.5 }}>
        Gotowe ({selectedPositionCount} pozycji, {selectedGroupCount} grup)
      </Alert>
    );
  }

  if (selectedPositionCount === 0 && selectedGroupCount > 0) {
    return (
      <Alert severity="warning" sx={{ py: 0.5 }}>
        Wybierz pozycję
      </Alert>
    );
  }

  if (selectedPositionCount > 0 && selectedGroupCount === 0) {
    return (
      <Alert severity="warning" sx={{ py: 0.5 }}>
        Wybierz zawodnika/klasę
      </Alert>
    );
  }

  return (
    <Alert severity="info" sx={{ py: 0.5 }}>
      Wybierz pozycje oraz zawodnika/klasę
    </Alert>
  );
}
