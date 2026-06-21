import { useMemo, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useMyRole } from './useMyRole.js';

type PermissionMatrix = Record<string, boolean>;

let _matrixCache: PermissionMatrix | null = null;
let _matrixPromise: Promise<PermissionMatrix> | null = null;

function loadMatrix(): Promise<PermissionMatrix> {
  if (_matrixCache) return Promise.resolve(_matrixCache);
  if (_matrixPromise) return _matrixPromise;
  _matrixPromise = Promise.resolve(
    supabase
      .from('permission_matrix')
      .select('role, resource, action, allowed')
      .then(
        ({ data }: { data: { role: string; resource: string; action: string; allowed: boolean }[] | null }) => {
          const map: PermissionMatrix = {};
          for (const row of data ?? []) {
            map[`${row.role}:${row.resource}:${row.action}`] = row.allowed;
          }
          _matrixCache = map;
          _matrixPromise = null;
          return map;
        },
        () => {
          _matrixPromise = null;
          return {} as PermissionMatrix;
        }
      )
  );
  return _matrixPromise;
}

export function invalidatePermissionCache(): void { _matrixCache = null; }

interface UseCanDoResult {
  can: (resource: string, action: string) => boolean;
  role: string;
  isSimulating: boolean;
}

export function useCanDo(): UseCanDoResult {
  const { role, isSimulating, detectedRole } = useMyRole();
  const [matrix, setMatrix] = useState<PermissionMatrix>(_matrixCache ?? {});
  const loaded = useRef(!!_matrixCache);

  useEffect(() => {
    if (loaded.current) return;
    loadMatrix().then(m => { setMatrix(m); loaded.current = true; });
  }, []);

  const can = useMemo(() => (resource: string, action: string): boolean => {
    if (detectedRole === 'admin' && !isSimulating) return true;
    if (!loaded.current || Object.keys(matrix).length === 0) return true;
    return matrix[`${role}:${resource}:${action}`] ?? false;
  }, [role, isSimulating, detectedRole, matrix]);

  return { can, role, isSimulating };
}
