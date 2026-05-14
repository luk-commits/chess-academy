import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCardTagsExpanded } from '../../../src/hooks/useCardTagsExpanded';

describe('useCardTagsExpanded', () => {
  it('defaults to empty object', () => {
    const { result } = renderHook(() => useCardTagsExpanded());
    expect(result.current.expanded).toEqual({});
  });

  it('toggle(5) sets expanded[5] = true', () => {
    const { result } = renderHook(() => useCardTagsExpanded());
    act(() => result.current.toggle(5));
    expect(result.current.expanded).toEqual({ 5: true });
  });

  it('second toggle(5) sets it back to false', () => {
    const { result } = renderHook(() => useCardTagsExpanded());
    act(() => result.current.toggle(5));
    act(() => result.current.toggle(5));
    expect(result.current.expanded).toEqual({ 5: false });
  });

  it('toggle(5) and toggle(7) are independent', () => {
    const { result } = renderHook(() => useCardTagsExpanded());
    act(() => result.current.toggle(5));
    act(() => result.current.toggle(7));
    expect(result.current.expanded).toEqual({ 5: true, 7: true });
  });

  it('toggle reference is stable between renders', () => {
    const { result, rerender } = renderHook(() => useCardTagsExpanded());
    const first = result.current.toggle;
    rerender();
    expect(result.current.toggle).toBe(first);
  });
});
