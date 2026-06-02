/* global vi, expect */
import '@testing-library/jest-dom';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// Configurer axe avec les règles WCAG 2.2 AA
configureAxe({
  rules: {
    'color-contrast': { enabled: true },
    'button-name':    { enabled: true },
    'image-alt':      { enabled: true },
    'label':          { enabled: true },
    'aria-required-attr': { enabled: true },
    'role-img-alt':   { enabled: true },
  },
});

// Suppress console.error/warn noise in tests unless explicitly checking them
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// jsdom scrollTo polyfill — jsdom ne supporte pas scrollTo sur les éléments DOM
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollTo = window.HTMLElement.prototype.scrollTo || function () {};
  window.scrollTo = window.scrollTo || function () {};
}

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
