/**
 * demoClient — Fake Supabase client pour le mode démonstration.
 *
 * Intercepte toutes les opérations DB via le Proxy dans supabase.js.
 * Aucune requête réelle n'est émise vers Supabase en mode démo.
 */

import { buildDemoTables, DEMO_AUTH_USER, DEMO_SESSION } from './data/index.js';

// ── Tables mutables (copie fresh à chaque session démo) ──────────────────────

let _tables = null;

export function resetDemoTables() {
  _tables = buildDemoTables();
}

function getTables() {
  if (!_tables) _tables = buildDemoTables();
  return _tables;
}

// ── Query Builder ────────────────────────────────────────────────────────────

class DemoQueryBuilder {
  constructor(table) {
    this._table   = table;
    this._op      = 'select';
    this._payload = null;
    this._filters = [];
    this._singleRow = false;
    this._maybe   = false;
    this._headOnly = false;
    this._orderCol = null;
    this._orderAsc = true;
    this._limitN  = null;
    this._selectDone = false;
    this._upsertOpts = null;
  }

  // ── Select / filters ────────────────────────────────────────────────────────

  select(cols, opts = {}) {
    if (opts?.count === 'exact' && opts?.head) this._headOnly = true;
    return this;
  }

  eq(col, val)   { this._filters.push(r => String(r[col]) === String(val));  return this; }
  neq(col, val)  { this._filters.push(r => String(r[col]) !== String(val));  return this; }
  gt(col, val)   { this._filters.push(r => r[col] > val);  return this; }
  gte(col, val)  { this._filters.push(r => r[col] >= val); return this; }
  lt(col, val)   { this._filters.push(r => r[col] < val);  return this; }
  lte(col, val)  { this._filters.push(r => r[col] <= val); return this; }
  is(col, val)   {
    this._filters.push(r => val === null ? (r[col] == null) : r[col] === val);
    return this;
  }
  in(col, vals)  {
    const strs = vals.map(String);
    this._filters.push(r => strs.includes(String(r[col])));
    return this;
  }
  not()         { return this; }
  like()        { return this; }
  ilike()       { return this; }
  filter()      { return this; }
  contains()    { return this; }
  overlaps()    { return this; }
  textSearch()  { return this; }
  returns()     { return this; }
  throwOnError(){ return this; }

  or(filterStr) {
    const conditions = String(filterStr).split(',').map(part => {
      const m = part.trim().match(/^(.+?)\.(eq|neq|gte|lte|gt|lt|is|like|ilike)\.(.*)$/);
      if (!m) return () => true;
      const [, col, op, val] = m;
      return r => {
        const rv = r[col];
        if (op === 'eq')    return String(rv ?? '') === val;
        if (op === 'neq')   return String(rv ?? '') !== val;
        if (op === 'gte')   return rv != null && rv >= val;
        if (op === 'lte')   return rv != null && rv <= val;
        if (op === 'gt')    return rv != null && rv > val;
        if (op === 'lt')    return rv != null && rv < val;
        if (op === 'is')    return val === 'null' ? (rv == null) : rv === val;
        if (op === 'like' || op === 'ilike') {
          const str = String(rv ?? '');
          const pattern = val.replace(/%/g, '.*').replace(/_/g, '.');
          return new RegExp(`^${pattern}$`, op === 'ilike' ? 'i' : '').test(str);
        }
        return true;
      };
    });
    this._filters.push(r => conditions.some(c => { try { return c(r); } catch { return false; } }));
    return this;
  }
  match(obj) {
    Object.entries(obj).forEach(([k, v]) => this.eq(k, v));
    return this;
  }

  order(col, opts = {}) {
    this._orderCol = col;
    this._orderAsc = opts.ascending !== false;
    return this;
  }

  limit(n)         { this._limitN = n;   return this; }
  range(from, to)  { this._limitN = to - from + 1; return this; }

  maybeSingle() { this._singleRow = true; this._maybe = true; return this._resolveAsync(); }
  single()      { this._singleRow = true; this._maybe = false; return this._resolveAsync(); }

  // ── Mutations ────────────────────────────────────────────────────────────────

  insert(payload) { this._op = 'insert'; this._payload = payload; return this; }
  update(payload) { this._op = 'update'; this._payload = payload; return this; }
  delete()        { this._op = 'delete'; return this; }
  upsert(payload, opts) { this._op = 'upsert'; this._payload = payload; this._upsertOpts = opts; return this; }

  // ── Thenable interface (await / Promise.race) ────────────────────────────────

  then(resolve, reject) {
    try {
      const result = this._doResolve();
      // Wrap in a microtask so we behave like a real async Promise
      Promise.resolve(result).then(resolve, reject);
    } catch (e) {
      if (reject) reject(e);
      else console.error('[DemoClient] unhandled error:', e);
    }
    return this; // for .then().catch() chains
  }

  catch(reject) {
    return Promise.resolve(this._doResolve()).catch(reject);
  }

  finally(cb) {
    return Promise.resolve(this._doResolve()).finally(cb);
  }

  _resolveAsync() {
    return Promise.resolve(this._doResolve());
  }

  // ── Resolution logic ─────────────────────────────────────────────────────────

  _doResolve() {
    const tables = getTables();
    const table  = tables[this._table] ?? [];

    try {
      if (this._op === 'insert') {
        return this._handleInsert(tables);
      }
      if (this._op === 'update') {
        return this._handleUpdate(tables, table);
      }
      if (this._op === 'delete') {
        return this._handleDelete(tables, table);
      }
      if (this._op === 'upsert') {
        return this._handleUpsert(tables);
      }

      // SELECT
      return this._handleSelect(table);

    } catch (err) {
      console.warn('[DemoClient] query error on', this._table, err.message);
      return { data: this._singleRow ? null : [], error: null, count: 0 };
    }
  }

  _applyFilters(rows) {
    return rows.filter(r => this._filters.every(f => {
      try { return f(r); } catch { return false; }
    }));
  }

  _applyOrder(rows) {
    if (!this._orderCol) return rows;
    return [...rows].sort((a, b) => {
      const av = a[this._orderCol], bv = b[this._orderCol];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return this._orderAsc ? cmp : -cmp;
    });
  }

  _handleSelect(table) {
    let rows = this._applyFilters(table);
    rows = this._applyOrder(rows);
    if (this._limitN !== null) rows = rows.slice(0, this._limitN);

    if (this._headOnly) {
      return { data: null, error: null, count: rows.length };
    }
    if (this._singleRow) {
      return { data: rows[0] ?? null, error: null };
    }
    return { data: rows, error: null };
  }

  _handleInsert(tables) {
    const items = Array.isArray(this._payload) ? this._payload : [this._payload];
    const withIds = items.map(item => ({
      id:         item.id        || `demo-new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: item.created_at || new Date().toISOString(),
      ...item,
    }));

    if (!tables[this._table]) tables[this._table] = [];
    withIds.forEach(item => tables[this._table].push(item));

    // Dispatch sandbox notification
    _notifySandboxMutation(this._table, 'INSERT', withIds);

    const data = Array.isArray(this._payload) ? withIds : withIds[0];
    if (this._singleRow) return { data: withIds[0] ?? null, error: null };
    return { data, error: null };
  }

  _handleUpdate(tables, table) {
    const updated = [];
    const filtered = this._applyFilters(table);
    filtered.forEach(row => {
      const idx = tables[this._table].findIndex(r => r === row);
      if (idx >= 0) {
        tables[this._table][idx] = { ...row, ...this._payload };
        updated.push(tables[this._table][idx]);
      }
    });

    _notifySandboxMutation(this._table, 'UPDATE', updated);

    if (this._singleRow) return { data: updated[0] ?? null, error: null };
    return { data: updated, error: null };
  }

  _handleDelete(tables, table) {
    const toDelete = this._applyFilters(table);
    const deleteIds = new Set(toDelete.map(r => r.id));
    tables[this._table] = (tables[this._table] ?? []).filter(r => !deleteIds.has(r.id));

    _notifySandboxMutation(this._table, 'DELETE', toDelete);
    return { data: null, error: null };
  }

  _handleUpsert(tables) {
    const items = Array.isArray(this._payload) ? this._payload : [this._payload];
    // Support compound conflict keys: 'session_id,user_id' → ['session_id', 'user_id']
    const conflictKeys = (this._upsertOpts?.onConflict ?? 'id')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    items.forEach(item => {
      const idx = (tables[this._table] ?? []).findIndex(r =>
        conflictKeys.every(k => String(r[k] ?? '') === String(item[k] ?? ''))
      );
      if (idx >= 0) {
        tables[this._table][idx] = { ...tables[this._table][idx], ...item };
      } else {
        if (!tables[this._table]) tables[this._table] = [];
        tables[this._table].push({
          id: item.id || `demo-new-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...item,
        });
      }
    });

    return { data: items, error: null };
  }
}

// ── Sandbox mutation notification ────────────────────────────────────────────

function _notifySandboxMutation(table, op, rows) {
  window.dispatchEvent(new CustomEvent('sl-demo-mutation', {
    detail: { table, op, rows },
  }));
}

// ── No-op Realtime channel ───────────────────────────────────────────────────

function makeDemoChannel(name) {
  const channel = {
    _name: name,
    on:          () => channel,
    subscribe:   (cb) => { cb?.('SUBSCRIBED'); return channel; },
    unsubscribe: () => {},
    send:        () => Promise.resolve({ status: 'ok' }),
  };
  return channel;
}

// ── Auth mock ────────────────────────────────────────────────────────────────

const demoAuth = {
  getSession: () => Promise.resolve({ data: { session: DEMO_SESSION }, error: null }),
  getUser:    () => Promise.resolve({ data: { user: DEMO_AUTH_USER },  error: null }),

  onAuthStateChange(cb) {
    // Fire INITIAL_SESSION asynchronously (like real Supabase)
    setTimeout(() => cb('INITIAL_SESSION', DEMO_SESSION), 0);
    return {
      data: {
        subscription: { unsubscribe: () => {} },
      },
    };
  },

  signOut: async () => {
    // En mode démo, déconnexion = retour à l'accueil
    setTimeout(() => {
      sessionStorage.removeItem('sl-demo-profile');
      sessionStorage.removeItem('sl-demo-step');
      window.location.href = '/';
    }, 0);
    return { error: null };
  },

  signInWithPassword: async () => ({
    data:  { session: DEMO_SESSION, user: DEMO_AUTH_USER },
    error: null,
  }),

  signUp: async () => ({
    data:  { user: DEMO_AUTH_USER, session: DEMO_SESSION },
    error: null,
  }),

  signInWithOAuth: async () => ({
    data:  { url: null },
    error: null,
  }),

  exchangeCodeForSession: async () => ({
    data:  { session: DEMO_SESSION },
    error: null,
  }),

  resetPasswordForEmail: async () => ({ error: null }),
  updateUser:            async () => ({ data: { user: DEMO_AUTH_USER }, error: null }),
};

// ── Storage mock ─────────────────────────────────────────────────────────────

const demoStorage = {
  from: () => ({
    upload: async (path) => ({ data: { path }, error: null }),
    getPublicUrl: () => ({ data: { publicUrl: 'https://placehold.co/400x400?text=Demo' } }),
    remove: async () => ({ data: null, error: null }),
    list:   async () => ({ data: [], error: null }),
  }),
};

// ── RPC mock ─────────────────────────────────────────────────────────────────

function demoRpc() {
  return Promise.resolve({ data: null, error: null });
}

// ── Client principal ─────────────────────────────────────────────────────────

export const demoClient = {
  from:          (table) => new DemoQueryBuilder(table),
  auth:          demoAuth,
  storage:       demoStorage,
  rpc:           demoRpc,
  channel:       (name)  => makeDemoChannel(name ?? 'demo'),
  removeChannel: ()      => {},
  realtime:      { setAuth: () => {} },
};
