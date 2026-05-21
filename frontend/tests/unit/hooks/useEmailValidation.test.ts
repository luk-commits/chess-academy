import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEmailValidation } from '../../../src/hooks/useEmailValidation';

describe('useEmailValidation', () => {
  it('returns valid for empty input (no error before typing)', () => {
    const { result } = renderHook(() => useEmailValidation(''));
    expect(result.current.isInvalid).toBe(false);
    expect(result.current.errorMessage).toBe('');
  });

  it('returns valid for whitespace-only input', () => {
    const { result } = renderHook(() => useEmailValidation('   '));
    expect(result.current.isInvalid).toBe(false);
  });

  it('returns valid for a well-formed email', () => {
    const { result } = renderHook(() => useEmailValidation('foo@bar.com'));
    expect(result.current.isInvalid).toBe(false);
    expect(result.current.errorMessage).toBe('');
  });

  it('tolerates surrounding whitespace', () => {
    const { result } = renderHook(() => useEmailValidation('  foo@bar.com  '));
    expect(result.current.isInvalid).toBe(false);
  });

  it('flags missing @', () => {
    const { result } = renderHook(() => useEmailValidation('foobar.com'));
    expect(result.current.isInvalid).toBe(true);
    expect(result.current.errorMessage).toBe('Nieprawidłowy adres email');
  });

  it('flags missing TLD', () => {
    const { result } = renderHook(() => useEmailValidation('foo@bar'));
    expect(result.current.isInvalid).toBe(true);
  });

  it('flags spaces inside email', () => {
    const { result } = renderHook(() => useEmailValidation('foo @bar.com'));
    expect(result.current.isInvalid).toBe(true);
  });

  it('updates when email changes', () => {
    const { result, rerender } = renderHook(({ email }) => useEmailValidation(email), {
      initialProps: { email: 'bad' },
    });
    expect(result.current.isInvalid).toBe(true);
    rerender({ email: 'good@email.com' });
    expect(result.current.isInvalid).toBe(false);
  });
});
