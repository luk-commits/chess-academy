import { useMemo } from 'react';

interface PasswordValidationResult {
  isInvalid: boolean;
  message: string;
}

export function usePasswordValidation(password: string): PasswordValidationResult {
  return useMemo(() => {
    if (password.length === 0) {
      return { isInvalid: false, message: '' };
    }
    if (password.length < 8) {
      return { isInvalid: true, message: 'Hasło musi mieć co najmniej 8 znaków' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isInvalid: true, message: 'Hasło musi zawierać co najmniej 1 dużą literę' };
    }
    if (!/[a-z]/.test(password)) {
      return { isInvalid: true, message: 'Hasło musi zawierać co najmniej 1 małą literę' };
    }
    return { isInvalid: false, message: '' };
  }, [password]);
}
