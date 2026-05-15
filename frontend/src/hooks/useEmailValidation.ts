import { useMemo } from 'react';
import { EMAIL_REGEX } from '../constants/branding';

interface EmailValidationResult {
  isInvalid: boolean;
  errorMessage: string;
}

export function useEmailValidation(email: string): EmailValidationResult {
  return useMemo(() => {
    const trimmed = email.trim();
    const isInvalid = trimmed.length > 0 && !EMAIL_REGEX.test(trimmed);
    return {
      isInvalid,
      errorMessage: isInvalid ? 'Nieprawidłowy adres email' : '',
    };
  }, [email]);
}
