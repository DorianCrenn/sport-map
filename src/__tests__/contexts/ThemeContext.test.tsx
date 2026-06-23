import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext.jsx';

// ── Mock localStorage ─────────────────────────────────────────────────────────

const localStore: Record<string, string> = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem:    (k: string) => localStore[k] ?? null,
    setItem:    (k: string, v: string) => { localStore[k] = v; },
    removeItem: (k: string) => { delete localStore[k]; },
    clear:      () => { Object.keys(localStore).forEach(k => delete localStore[k]); },
  },
  writable: true,
});

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  writable: true,
});

// ── Helper ────────────────────────────────────────────────────────────────────

function TestConsumer() {
  const { theme, setTheme, toggleTheme } = useTheme();
  return (
    <>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme('light')}>set-light</button>
      <button onClick={() => setTheme('dark')}>set-dark</button>
      <button onClick={toggleTheme}>toggle</button>
    </>
  );
}

function renderWithTheme(savedTheme?: 'light' | 'dark') {
  localStore['sl-theme'] = savedTheme ?? '';
  if (!savedTheme) delete localStore['sl-theme'];
  return render(
    <ThemeProvider>
      <TestConsumer />
    </ThemeProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ThemeContext', () => {
  beforeEach(() => {
    Object.keys(localStore).forEach(k => delete localStore[k]);
    document.documentElement.removeAttribute('data-theme');
  });

  it('useTheme hors ThemeProvider lance une erreur', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useTheme must be used inside ThemeProvider');
    spy.mockRestore();
  });

  it('thème dark par défaut (matchMedia = dark)', () => {
    renderWithTheme();
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('thème light si localStorage contient "light"', () => {
    localStore['sl-theme'] = 'light';
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('setTheme("light") met à jour le thème et localStorage', () => {
    renderWithTheme();
    act(() => { screen.getByText('set-light').click(); });
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(localStore['sl-theme']).toBe('light');
  });

  it('setTheme("dark") met à jour le thème et localStorage', () => {
    localStore['sl-theme'] = 'light';
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    act(() => { screen.getByText('set-dark').click(); });
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(localStore['sl-theme']).toBe('dark');
  });

  it('toggleTheme bascule de dark à light', () => {
    renderWithTheme('dark');
    act(() => { screen.getByText('toggle').click(); });
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('toggleTheme bascule de light à dark', () => {
    renderWithTheme('light');
    act(() => { screen.getByText('toggle').click(); });
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('setTheme("light") applique data-theme="light" sur documentElement', () => {
    renderWithTheme();
    act(() => { screen.getByText('set-light').click(); });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('setTheme("dark") supprime data-theme sur documentElement', () => {
    renderWithTheme('light');
    act(() => { screen.getByText('set-dark').click(); });
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });
});
