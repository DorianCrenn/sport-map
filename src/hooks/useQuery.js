import { useState, useEffect } from 'react';

/**
 * Minimal async data-fetching hook — replaces the repeated boilerplate
 * across 23+ hooks: { loading, cancelled, setState, error }.
 *
 * @param {() => Promise<any>} queryFn  — async function that returns the data
 * @param {any[]} deps                  — re-run when these change (like useEffect deps)
 * @param {{ initialData?, enabled? }}  — options
 *
 * Usage:
 *   const { data: ranking = [], loading, error } = useQuery(
 *     () => supabase.from('profiles').select('*').then(r => r.data),
 *     [limit]
 *   );
 */
export function useQuery(queryFn, deps = [], { initialData = null, enabled = true } = {}) {
  const [data, setData]     = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.resolve()
      .then(() => queryFn())
      .then(result => { if (!cancelled) { setData(result); setLoading(false); } })
      .catch(err  => {
        if (cancelled) return;
        setError(err?.message ?? String(err));
        setLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setData };
}
