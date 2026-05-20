import { useState, useEffect } from 'react';

// Mapping slug → code INSEE département
const DEPT_CODES = {
  'finistere':      '29',
  'morbihan':       '56',
  'cotes-armor':    '22',
  'ille-et-vilaine':'35',
};

// STAB-006 : cache module-level avec TTL 1h pour éviter la croissance infinie
const CACHE_TTL = 3_600_000;
const cache = new Map(); // code → { names: string[], ts: number }

function cacheGet(code) {
  const entry = cache.get(code);
  if (!entry || Date.now() - entry.ts > CACHE_TTL) return null;
  return entry.names;
}
function cacheSet(code, names) {
  cache.set(code, { names, ts: Date.now() });
}

export function useCommunes(departmentIds = []) {
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

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
              `https://geo.api.gouv.fr/departements/${code}/communes?fields=nom&limit=10000`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status} for dept ${code}`);
            const data = await res.json();
            const names = data.map(c => c.nom).sort((a, b) => a.localeCompare(b, 'fr'));
            cacheSet(code, names);
            return names;
          })
        );
        if (!cancelled) {
          const merged = [...new Set(perDept.flat())].sort((a, b) => a.localeCompare(b, 'fr'));
          setCommunes(merged);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
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
