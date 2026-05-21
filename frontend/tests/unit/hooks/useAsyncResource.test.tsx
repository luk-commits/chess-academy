import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAsyncResource } from '../../../src/hooks/useAsyncResource';

describe('useAsyncResource', () => {
  it('starts with loading=true and null data', () => {
    const fetcher = vi.fn().mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAsyncResource(fetcher, []));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('resolves with data and clears loading', async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 42 });
    const { result } = renderHook(() => useAsyncResource(fetcher, []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ value: 42 });
    expect(result.current.error).toBeNull();
  });

  it('captures Error message on rejection', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAsyncResource(fetcher, []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
    expect(result.current.data).toBeNull();
  });

  it('uses defaultErrorMessage when rejection is not an Error', async () => {
    const fetcher = vi.fn().mockRejectedValue('plain string');
    const { result } = renderHook(() =>
      useAsyncResource(fetcher, [], { defaultErrorMessage: 'custom fallback' }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('custom fallback');
  });

  it('refetches when deps change', async () => {
    const fetcher = vi.fn().mockImplementation((dep: number) => Promise.resolve(dep * 10));
    const { result, rerender } = renderHook(
      ({ dep }: { dep: number }) => useAsyncResource(() => fetcher(dep), [dep]),
      { initialProps: { dep: 1 } },
    );
    await waitFor(() => expect(result.current.data).toBe(10));
    rerender({ dep: 2 });
    await waitFor(() => expect(result.current.data).toBe(20));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('reload() triggers a re-fetch', async () => {
    let counter = 0;
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(++counter));
    const { result } = renderHook(() => useAsyncResource(fetcher, []));
    await waitFor(() => expect(result.current.data).toBe(1));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.data).toBe(2));
  });

  it('ignores resolved data after unmount', async () => {
    let resolve: (v: number) => void = () => {};
    const fetcher = vi.fn().mockReturnValue(new Promise<number>((r) => { resolve = r; }));
    const { result, unmount } = renderHook(() => useAsyncResource(fetcher, []));
    unmount();
    resolve(99);
    await Promise.resolve();
    // No state update should happen post-unmount; result snapshot stays as it was at unmount.
    expect(result.current.data).toBeNull();
  });
});
