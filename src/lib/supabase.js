import { createClient } from '@supabase/supabase-js';
import { demoClient }   from '../demo/demoClient.js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Real client — created only when env vars are present.
// Demo mode never accesses this client, so missing env vars in demo are fine.
let _realClient = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  _realClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      flowType:         'pkce',
      detectSessionInUrl: true,
      persistSession:   true,
      autoRefreshToken: true,
    },
  });
}

// ── Demo mode flag ────────────────────────────────────────────────────────────

let _isDemoMode = false;

export function setDemoMode(val) { _isDemoMode = !!val; }
export function isDemoMode()     { return _isDemoMode; }

// ── Proxy : routes all calls to demoClient or realClient ─────────────────────
//
// All 73+ hooks import this single `supabase` export.
// The Proxy intercepts every property access and dispatches to the correct
// client at call-time — no hook modifications needed.

export const supabase = new Proxy({}, {
  get(_, prop) {
    const target = _isDemoMode ? demoClient : _realClient;

    if (!target) {
      throw new Error(
        '[SportLink] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans .env'
      );
    }

    const val = target[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  },

  // Support: `supabase.auth = ...` patterns (none exist, but just in case)
  set(_, prop, val) {
    if (_isDemoMode) demoClient[prop] = val;
    else if (_realClient) _realClient[prop] = val;
    return true;
  },
});
