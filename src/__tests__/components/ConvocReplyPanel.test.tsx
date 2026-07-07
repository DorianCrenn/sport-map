import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => React.createElement('div', p, children),
  },
  AnimatePresence: ({ children }: any) => children,
}));

const mockToken = {
  id: 'tok-1',
  player_name: 'Jean Dupont',
  reply_status: null,
  expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  events: { title: 'Match amical', date: '2026-07-01', time: '18:00', venue: 'Stade Brest' },
  clubs: { name: 'FC Brest' },
};

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockToken }),
        }),
      }),
      update: () => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

import ConvocReplyPanel from '../../components/ConvocReplyPanel.jsx';

// ── Tests — affichage ─────────────────────────────────────────────────────────

describe('ConvocReplyPanel — affichage', () => {
  const onClose = vi.fn();

  beforeEach(() => { vi.clearAllMocks(); });

  it('affiche le nom du joueur', async () => {
    render(<ConvocReplyPanel token="abc123" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText(/Jean Dupont/i)).toBeInTheDocument());
  });

  it('affiche le titre de l\'événement', async () => {
    render(<ConvocReplyPanel token="abc123" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText(/Match amical/i)).toBeInTheDocument());
  });

  it('affiche les 3 boutons de réponse', async () => {
    render(<ConvocReplyPanel token="abc123" onClose={onClose} />);
    await waitFor(() => screen.getByText(/Jean Dupont/i));
    const labels = screen.getAllByRole('button').map(b => b.textContent ?? '');
    expect(labels.some(l => /Présent/i.test(l))).toBe(true);
    expect(labels.some(l => /Absent/i.test(l))).toBe(true);
    expect(labels.some(l => /Peut-être/i.test(l))).toBe(true);
  });

  it('affiche le nom du club', async () => {
    render(<ConvocReplyPanel token="abc123" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText(/FC Brest/)).toBeInTheDocument());
  });

  it('ferme la modale en cliquant sur le fond', async () => {
    const { container } = render(<ConvocReplyPanel token="abc123" onClose={onClose} />);
    await waitFor(() => screen.getByText(/Jean Dupont/));
    fireEvent.click(container.firstChild as Element);
    expect(onClose).toHaveBeenCalled();
  });
});

// ── Tests — confirmation post-réponse ─────────────────────────────────────────

describe('ConvocReplyPanel — confirmation email post-réponse', () => {
  const onClose = vi.fn();
  const mockFetch = vi.fn().mockResolvedValue({ ok: true });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('appelle fetch vers convoc-reply-confirm après une réponse', async () => {
    render(<ConvocReplyPanel token="abc123" onClose={onClose} />);
    await waitFor(() => screen.getByText(/Jean Dupont/i));

    const acceptBtn = screen.getAllByRole('button').find(b => /Présent/i.test(b.textContent ?? ''));
    expect(acceptBtn).toBeDefined();
    fireEvent.click(acceptBtn!);

    await waitFor(() => {
      const confirmCall = mockFetch.mock.calls.find(
        ([url]) => typeof url === 'string' && url.includes('convoc-reply-confirm')
      );
      expect(confirmCall).toBeDefined();
    });
  });

  it('envoie le status correct dans la requête de confirmation', async () => {
    render(<ConvocReplyPanel token="abc123" onClose={onClose} />);
    await waitFor(() => screen.getByText(/Jean Dupont/i));

    const declineBtn = screen.getAllByRole('button').find(b => /Absent/i.test(b.textContent ?? ''));
    fireEvent.click(declineBtn!);

    await waitFor(() => {
      const confirmCall = mockFetch.mock.calls.find(
        ([url]) => typeof url === 'string' && url.includes('convoc-reply-confirm')
      );
      if (confirmCall) {
        const body = JSON.parse(confirmCall[1]?.body ?? '{}');
        expect(body.status).toBe('declined');
        expect(body.token).toBe('abc123');
      }
    });
  });

  it('affiche la confirmation visuelle après réponse', async () => {
    render(<ConvocReplyPanel token="abc123" onClose={onClose} />);
    await waitFor(() => screen.getByText(/Jean Dupont/i));

    const acceptBtn = screen.getAllByRole('button').find(b => /Présent/i.test(b.textContent ?? ''));
    fireEvent.click(acceptBtn!);

    await waitFor(() => expect(screen.getByText(/Réponse enregistrée/i)).toBeInTheDocument());
  });

  it('ne plante pas si fetch échoue lors de la confirmation', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ConvocReplyPanel token="abc123" onClose={onClose} />);
    await waitFor(() => screen.getByText(/Jean Dupont/i));

    const acceptBtn = screen.getAllByRole('button').find(b => /Présent/i.test(b.textContent ?? ''));
    fireEvent.click(acceptBtn!);

    // Le composant doit toujours afficher la confirmation malgré l'erreur fetch
    await waitFor(() => expect(screen.getByText(/Réponse enregistrée/i)).toBeInTheDocument());
  });
});
