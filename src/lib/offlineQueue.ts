/**
 * offlineQueue — IndexedDB outbox pour les écritures hors-ligne.
 *
 * Quand l'app est offline, les mutations (create/update/delete) sont mises
 * en file dans IndexedDB. À la reconnexion, `processQueue()` les rejoue
 * dans l'ordre d'insertion.
 */

const DB_NAME    = 'sl-offline-queue';
const DB_VERSION = 1;
const STORE      = 'ops';

export interface QueuedOp {
  id?:       number;      // auto-incrémenté par IDB
  table:     string;      // ex: 'events', 'clubs'
  method:    'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';
  payload:   Record<string, unknown>;
  filter?:   Record<string, unknown>; // pour UPDATE/DELETE : { id: '...' }
  createdAt: number;      // Date.now()
  retries:   number;
}

// ── DB ────────────────────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror   = () => reject(req.error);
  });
}

// ── Écriture ──────────────────────────────────────────────────────────────────

export async function enqueue(op: Omit<QueuedOp, 'id' | 'createdAt' | 'retries'>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).add({ ...op, createdAt: Date.now(), retries: 0 });
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ── Lecture ───────────────────────────────────────────────────────────────────

export async function getAllOps(): Promise<QueuedOp[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueuedOp[]);
    req.onerror   = () => reject(req.error);
  });
}

async function deleteOp(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function updateRetries(id: number, retries: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const rec = getReq.result;
      if (!rec) { resolve(); return; }
      const putReq = store.put({ ...rec, retries });
      putReq.onsuccess = () => resolve();
      putReq.onerror   = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// ── Exécution d'une op via Supabase REST ──────────────────────────────────────

async function executeOp(op: QueuedOp, supabaseUrl: string, anonKey: string, token: string): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type':  'application/json',
    'apikey':        anonKey,
    'Authorization': `Bearer ${token}`,
    'Prefer':        op.method === 'UPSERT' ? 'resolution=merge-duplicates' : 'return=minimal',
  };

  let url    = `${supabaseUrl}/rest/v1/${op.table}`;
  let method = 'POST';
  let body: string | undefined = JSON.stringify(op.payload);

  switch (op.method) {
    case 'INSERT':
      method = 'POST';
      break;
    case 'UPSERT':
      method = 'POST';
      headers['Prefer'] = 'resolution=merge-duplicates,return=minimal';
      break;
    case 'UPDATE': {
      method = 'PATCH';
      const filters = Object.entries(op.filter ?? {})
        .map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`)
        .join('&');
      if (filters) url += `?${filters}`;
      break;
    }
    case 'DELETE': {
      method = 'DELETE';
      body   = undefined;
      const filters = Object.entries(op.filter ?? {})
        .map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`)
        .join('&');
      if (filters) url += `?${filters}`;
      break;
    }
  }

  const res = await fetch(url, { method, headers, body });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[offlineQueue] ${op.method} ${op.table} → HTTP ${res.status}: ${text}`);
  }
}

// ── Processeur principal ──────────────────────────────────────────────────────

export type SyncResult = { processed: number; failed: number };

export async function processQueue(
  supabaseUrl: string,
  anonKey: string,
  token: string,
  onProgress?: (result: SyncResult) => void,
): Promise<SyncResult> {
  const ops = await getAllOps();
  if (ops.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed    = 0;

  for (const op of ops) {
    try {
      await executeOp(op, supabaseUrl, anonKey, token);
      await deleteOp(op.id!);
      processed++;
      onProgress?.({ processed, failed });
    } catch (err: unknown) {
      const MAX_RETRIES = 3;
      if (op.retries >= MAX_RETRIES) {
        console.error('[offlineQueue] Abandon après', MAX_RETRIES, 'tentatives:', op, err);
        await deleteOp(op.id!);
      } else {
        await updateRetries(op.id!, op.retries + 1);
      }
      failed++;
      onProgress?.({ processed, failed });
    }
  }

  return { processed, failed };
}

// ── Taille de la file ─────────────────────────────────────────────────────────

export async function queueSize(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function clearQueue(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}
