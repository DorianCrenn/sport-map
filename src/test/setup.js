/* global vi */
import '@testing-library/jest-dom';

// Suppress console.error/warn noise in tests unless explicitly checking them
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// jsdom localStorage polyfill (some vitest environments don't expose it)
if (typeof localStorage === 'undefined' || typeof localStorage.clear !== 'function') {
  const store = {};
  const ls = {
    getItem:    (k)    => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k)    => { delete store[k]; },
    clear:      ()     => { Object.keys(store).forEach(k => delete store[k]); },
    get length()       { return Object.keys(store).length; },
    key:        (i)    => Object.keys(store)[i] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', { value: ls, writable: true });
}
