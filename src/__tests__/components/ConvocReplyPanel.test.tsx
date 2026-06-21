import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => React.createElement('div', p, children),
  },
  AnimatePresence: ({ children }: any) => children,
}));
import ConvocReplyPanel from '../../components/ConvocReplyPanel.jsx';

const mockToken = {
  id: 'tok-1',
  player_name: 'Jean Dupont',
  reply_status: null,
  expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  events: { title: 'Match amical', date: '2026-07-01', time: '18:00', venue: 'Stade Brest' },
  clubs: { name: 'FC Brest' },
};

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockToken }),
        }),
      }),
      update: () => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

describe('ConvocReplyPanel', () => {
  const onClose = vi.fn();

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
    // Attendre le chargement, puis chercher les boutons par rôle
    await waitFor(() => screen.getByText(/Jean Dupont/i));
    const btns = screen.getAllByRole('button');
    const labels = btns.map(b => b.textContent ?? '');
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
