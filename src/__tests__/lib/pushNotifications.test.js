import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: { from: mockFrom },
}));

// Importer après le mock
import {
  getSwRegistration,
  getPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '../../lib/pushNotifications.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSubscription(endpoint = 'https://push.example.com/sub') {
  return {
    endpoint,
    toJSON: () => ({ endpoint, keys: { p256dh: 'KEY_P256', auth: 'KEY_AUTH' } }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
}

function makePushManager(sub = null) {
  return {
    getSubscription: vi.fn().mockResolvedValue(sub),
    subscribe:       vi.fn().mockResolvedValue(makeSubscription()),
  };
}

function makeReg(sub = null) {
  return { pushManager: makePushManager(sub) };
}

function dbOk()  { return { error: null }; }
function dbErr() { return { error: { message: 'DB error' } }; }

function upsertChain(result) {
  return { upsert: vi.fn().mockResolvedValue(result) };
}
function deleteChain(result) {
  return { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(result) }) }) };
}

beforeEach(() => {
  vi.clearAllMocks();

  // Service Worker
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { ready: Promise.resolve(makeReg()) },
    configurable: true,
    writable: true,
  });

  // Notification
  Object.defineProperty(window, 'Notification', {
    value: { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') },
    configurable: true,
    writable: true,
  });
});

// ── getSwRegistration ─────────────────────────────────────────────────────────

describe('getSwRegistration', () => {
  it('retourne la registration SW quand serviceWorker est disponible', async () => {
    const reg = await getSwRegistration();
    expect(reg).toBeDefined();
    expect(reg.pushManager).toBeDefined();
  });

  it('retourne null si serviceWorker absent', async () => {
    const orig = navigator.serviceWorker;
    Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true });
    const reg = await getSwRegistration();
    expect(reg).toBeNull();
    Object.defineProperty(navigator, 'serviceWorker', { value: orig, configurable: true });
  });
});

// ── getPushSubscription ───────────────────────────────────────────────────────

describe('getPushSubscription', () => {
  it('retourne null si aucune souscription active', async () => {
    const sub = await getPushSubscription();
    expect(sub).toBeNull();
  });

  it('retourne la souscription si elle existe', async () => {
    const existing = makeSubscription();
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve(makeReg(existing)) },
      configurable: true,
    });
    const sub = await getPushSubscription();
    expect(sub).toBe(existing);
  });

  it('retourne null si SW non disponible', async () => {
    Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true });
    const sub = await getPushSubscription();
    expect(sub).toBeNull();
  });
});

// ── subscribeToPush ───────────────────────────────────────────────────────────

describe('subscribeToPush', () => {
  it('lève une erreur si Notification non supporté', async () => {
    Object.defineProperty(window, 'Notification', { value: undefined, configurable: true });
    await expect(subscribeToPush('user-1')).rejects.toThrow('Notifications not supported');
  });

  it('lève une erreur si la permission est refusée', async () => {
    window.Notification.requestPermission = vi.fn().mockResolvedValue('denied');
    await expect(subscribeToPush('user-1')).rejects.toThrow('Permission denied');
  });

  it('lève une erreur si SW non disponible', async () => {
    Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true });
    await expect(subscribeToPush('user-1')).rejects.toThrow('Service Worker not available');
  });

  it('appelle pushManager.subscribe et sauvegarde en base', async () => {
    mockFrom.mockReturnValue(upsertChain(dbOk()));
    const sub = await subscribeToPush('user-1');
    expect(sub).toBeDefined();
    expect(mockFrom).toHaveBeenCalledWith('push_subscriptions');
  });

  it('lève une erreur si l\'upsert Supabase échoue', async () => {
    mockFrom.mockReturnValue(upsertChain(dbErr()));
    await expect(subscribeToPush('user-1')).rejects.toThrow('DB error');
  });
});

// ── unsubscribeFromPush ───────────────────────────────────────────────────────

describe('unsubscribeFromPush', () => {
  it('ne fait rien si aucune souscription active', async () => {
    await expect(unsubscribeFromPush('user-1')).resolves.toBeUndefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('appelle unsubscribe() et supprime de la base', async () => {
    const existingSub = makeSubscription('https://push.example.com/abc');
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve(makeReg(existingSub)) },
      configurable: true,
    });
    mockFrom.mockReturnValue(deleteChain(dbOk()));

    await unsubscribeFromPush('user-1');

    expect(existingSub.unsubscribe).toHaveBeenCalledOnce();
    expect(mockFrom).toHaveBeenCalledWith('push_subscriptions');
  });
});
