import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }: any) => <div {...p}>{children}</div>,
    button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import { ToastProvider, useToast } from '../../contexts/ToastContext.jsx';

function TestConsumer({ msg = 'Message test', type = 'success' as any, onReport }: any) {
  const { toast } = useToast();
  return (
    <button onClick={() => toast({ message: msg, type, duration: 60000, onReport })}>
      show-toast
    </button>
  );
}

function setup(props?: any) {
  return render(
    <ToastProvider>
      <TestConsumer {...props} />
    </ToastProvider>
  );
}

describe('ToastContext', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('affiche un toast après appel à toast()', () => {
    setup({ msg: 'Succès enregistré', type: 'success' });
    act(() => { screen.getByText('show-toast').click(); });
    expect(screen.getAllByText('Succès enregistré').length).toBeGreaterThan(0);
  });

  it('affiche un toast d\'erreur', () => {
    setup({ msg: 'Une erreur est survenue', type: 'error' });
    act(() => { screen.getByText('show-toast').click(); });
    expect(screen.getAllByText('Une erreur est survenue').length).toBeGreaterThan(0);
  });

  it('affiche un toast d\'info', () => {
    setup({ msg: 'Info importante', type: 'info' });
    act(() => { screen.getByText('show-toast').click(); });
    expect(screen.getAllByText('Info importante').length).toBeGreaterThan(0);
  });

  it('le toast disparaît après la durée spécifiée', () => {
    setup({ msg: 'Temporaire', type: 'success', duration: 500 });
    act(() => { screen.getByText('show-toast').click(); });
    expect(screen.getAllByText('Temporaire').length).toBeGreaterThan(0);

    act(() => { vi.runAllTimers(); });
    // Après écoulement des timers, le toast doit avoir disparu du DOM
    expect(screen.queryByText('Temporaire')).not.toBeInTheDocument();
  });

  it('useToast hors ToastProvider utilise le contexte par défaut (no-op)', () => {
    function BareConsumer() {
      const { toast } = useToast();
      return <button onClick={() => toast({ message: 'test' })}>go</button>;
    }
    render(<BareConsumer />);
    expect(() => act(() => { screen.getByText('go').click(); })).not.toThrow();
  });

  it('affiche le bouton Signaler si onReport est fourni', () => {
    const onReport = vi.fn();
    setup({ msg: 'Bug détecté', type: 'error', onReport });
    act(() => { screen.getByText('show-toast').click(); });
    expect(screen.getByText(/signaler/i)).toBeInTheDocument();
  });
});
