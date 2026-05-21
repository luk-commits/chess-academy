import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePasswordValidation } from '../../../src/hooks/usePasswordValidation';

describe('usePasswordValidation', () => {
  it('returns valid with no message for empty password', () => {
    const { result } = renderHook(() => usePasswordValidation(''));
    expect(result.current.isInvalid).toBe(false);
    expect(result.current.message).toBe('');
  });

  it('flags too-short password', () => {
    const { result } = renderHook(() => usePasswordValidation('Ab1'));
    expect(result.current.isInvalid).toBe(true);
    expect(result.current.message).toContain('co najmniej 8 znaków');
  });

  it('flags missing uppercase letter', () => {
    const { result } = renderHook(() => usePasswordValidation('abcdefgh'));
    expect(result.current.isInvalid).toBe(true);
    expect(result.current.message).toContain('dużą literę');
  });

  it('flags missing lowercase letter', () => {
    const { result } = renderHook(() => usePasswordValidation('ABCDEFGH'));
    expect(result.current.isInvalid).toBe(true);
    expect(result.current.message).toContain('małą literę');
  });

  it('accepts mixed-case password >= 8 chars', () => {
    const { result } = renderHook(() => usePasswordValidation('Abcdefgh'));
    expect(result.current.isInvalid).toBe(false);
    expect(result.current.message).toBe('');
  });

  it('accepts password with digits and symbols', () => {
    const { result } = renderHook(() => usePasswordValidation('P@ssw0rd!'));
    expect(result.current.isInvalid).toBe(false);
  });

  it('checks length before uppercase/lowercase', () => {
    const { result } = renderHook(() => usePasswordValidation('Ab1'));
    expect(result.current.message).toContain('co najmniej 8 znaków');
  });
});
