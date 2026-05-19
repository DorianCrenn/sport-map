import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// ── localStorage mock ────────────────────────────────────────────────────────
let _store = {};
const localStorageMock = {
  getItem:    vi.fn((key) => _store[key] ?? null),
  setItem:    vi.fn((key, value) => { _store[key] = String(value); }),
  removeItem: vi.fn((key) => { delete _store[key]; }),
  clear:      vi.fn(() => { _store = {}; }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// ── Browser API stubs ────────────────────────────────────────────────────────
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
global.window.open = vi.fn();

// ── CSS vars (jsdom ne supporte pas les custom properties) ──────────────────
global.CSS = { supports: vi.fn(() => false) };

// ── Reset entre chaque test ──────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  _store = {};
});
