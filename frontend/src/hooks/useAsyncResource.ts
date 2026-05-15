import { useCallback, useEffect, useState } from 'react';

interface UseAsyncResourceOptions {
  defaultErrorMessage?: string;
}

interface UseAsyncResourceResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAsyncResource<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown>,
  options: UseAsyncResourceOptions = {},
): UseAsyncResourceResult<T> {
  const { defaultErrorMessage = 'Wystąpił błąd.' } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : defaultErrorMessage);
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, loading, error, reload };
}
