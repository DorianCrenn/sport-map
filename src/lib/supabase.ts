import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { demoClient } from '../demo/demoClient.js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let _realClient: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  _realClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      flowType:           'pkce',
      detectSessionInUrl: true,
      persistSession:     true,
      autoRefreshToken:   true,
    },
  });
}

let _isDemoMode = false;

export function setDemoMode(val: boolean): void { _isDemoMode = !!val; }
export function isDemoMode(): boolean            { return _isDemoMode; }

// Proxy routes all calls to demoClient or realClient at call-time.
// All 73+ hooks import this single `supabase` export.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_: SupabaseClient, prop: string | symbol) {
    const target = (_isDemoMode ? demoClient : _realClient) as SupabaseClient | null;
    if (!target) {
      throw new Error(
        '[SportLink] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans .env'
      );
    }
    const val = (target as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? (val as Function).bind(target) : val;
  },
  set(_: SupabaseClient, prop: string | symbol, val: unknown) {
    if (_isDemoMode) (demoClient as unknown as Record<string | symbol, unknown>)[prop] = val;
    else if (_realClient) (_realClient as unknown as Record<string | symbol, unknown>)[prop] = val;
    return true;
  },
});
