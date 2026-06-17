import { useMemo, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useMyRole } from './useMyRole.js';

// Cache module-level : chargé une seule fois par session
let _matrixCache = null;
let _matrixPromise = null;

function loadMatrix() {
  if (_matrixCache) return Promise.resolve(_matrixCache);
  if (_matrixPromise) return _matrixPromise;
  _matrixPromise = supabase
    .from('permission_matrix')
    .select('role, resource, action, allowed')
    .then(({ data }) => {
      const map = {};
      for (const row of data ?? []) {
        map[`${row.role}:${row.resource}:${row.action}`] = row.allowed;
      }
      _matrixCache = map;
      _matrixPromise = null;
      return map;
    })
    .catch(() => {
      _matrixPromise = null;
      return {};
    });
  return _matrixPromise;
}

/** Invalider le cache (ex: après une modification admin) */
export function invalidatePermissionCache() { _matrixCache = null; }

/**
 * useCanDo — vérifie une permission dans la matrice DB.
 *
 * Retourne `can(resource, action)` → boolean.
 *
 * Règles :
 * - Les admins réels (non-simulés) → toujours true
 * - Sinon → lookup dans permission_matrix pour le rôle métier courant
 * - Fallback permissif si la matrice n'est pas encore chargée
 *   (évite de bloquer l'UI pendant le fetch initial)
 *
 * @example
 * const { can } = useCanDo();
 * if (!can('announcements', 'create')) return null;
 */
export function useCanDo() {
  const { role, isSimulating, detectedRole } = useMyRole();
  const [matrix, setMatrix] = useState(_matrixCache ?? {});
  const loaded = useRef(!!_matrixCache);

  useEffect(() => {
    if (loaded.current) return;
    loadMatrix().then(m => { setMatrix(m); loaded.current = true; });
  }, []);

  const can = useMemo(() => (resource, action) => {
    // Admins réels non-simulés → toujours autorisé
    if (detectedRole === 'admin' && !isSimulating) return true;

    // Si la matrice n'est pas encore chargée → permissif par défaut
    if (!loaded.current || Object.keys(matrix).length === 0) return true;

    return matrix[`${role}:${resource}:${action}`] ?? false;
  }, [role, isSimulating, detectedRole, matrix]);

  return { can, role, isSimulating };
}
