import { useState, useEffect } from 'react';

const DEPT_CODES: Record<string, string> = {
  'finistere':       '29',
  'morbihan':        '56',
  'cotes-armor':     '22',
  'ille-et-vilaine': '35',
};

const CACHE_TTL = 3_600_000;
const cache = new Map<string, { names: string[]; ts: number }>();

function cacheGet(code: string): string[] | null {
  const entry = cache.get(code);
  if (!entry || Date.now() - entry.ts > CACHE_TTL) return null;
  return entry.names;
}
function cacheSet(code: string, names: string[]) {
  cache.set(code, { names, ts: Date.now() });
}

interface UseCommunesResult {
  communes: string[];
  loading: boolean;
  error: string | null;
}

export function useCommunes(departmentIds: string[] = []): UseCommunesResult {
  const [communes, setCommunes] = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const key = [...departmentIds].sort().join(',');

  useEffect(() => {
    if (!key) return;

    const codes = departmentIds.map(id => DEPT_CODES[id]).filter(Boolean);
    if (codes.length === 0) return;

    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const perDept = await Promise.all(
          codes.map(async code => {
            const cached = cacheGet(code);
            if (cached) return cached;
            const res = await fetch(
              `https://geo.api.gouv.fr/departements/${code}/communes?fields=nom&limit=10000`,
            );
            if (!res.ok) throw new Error(`HTTP ${res.status} for dept ${code}`);
            const data = (await res.json()) as { nom: string }[];
            const names = data.map(c => c.nom).sort((a, b) => a.localeCompare(b, 'fr'));
            cacheSet(code, names);
            return names;
          }),
        );
        if (!cancelled) {
          const merged = [...new Set(perDept.flat())].sort((a, b) => a.localeCompare(b, 'fr'));
          setCommunes(merged);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { communes, loading, error };
}
