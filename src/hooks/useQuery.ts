import { useState, useEffect, Dispatch, SetStateAction } from 'react';

interface UseQueryOptions<T> {
  initialData?: T | null;
  enabled?: boolean;
}

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  setData: Dispatch<SetStateAction<T | null>>;
}

export function useQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = [],
  { initialData = null, enabled = true }: UseQueryOptions<T> = {},
): UseQueryResult<T> {
  const [data, setData]       = useState<T | null>(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.resolve()
      .then(() => queryFn())
      .then(result => { if (!cancelled) { setData(result); setLoading(false); } })
      .catch(err => {
        if (cancelled) return;
        setError((err as Error)?.message ?? String(err));
        setLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setData };
}
