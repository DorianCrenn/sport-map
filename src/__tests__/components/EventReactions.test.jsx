/**
 * Tests EventReactions — réactions emoji sur les événements
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockUseEventReactions } = vi.hoisted(() => ({
  mockUseEventReactions: vi.fn(),
}));

vi.mock('../../hooks/useEventReactions.js', () => ({
  useEventReactions: mockUseEventReactions,
  REACTION_EMOJIS: ['👍', '🔥', '💪', '🎉'],
}));

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, onClick, title, ...p }) => <button onClick={onClick} title={title} {...p}>{children}</button>,
    span:   ({ children, ...p }) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import EventReactions from '../../components/EventReactions.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupReactions(overrides = {}) {
  mockUseEventReactions.mockReturnValue({
    counts: {}, mine: new Set(), toggle: vi.fn(),
    loading: false, isLoggedIn: true,
    ...overrides,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EventReactions — loading', () => {
  it('retourne null si loading est true', () => {
    mockUseEventReactions.mockReturnValue({
      counts: {}, mine: new Set(), toggle: vi.fn(), loading: true, isLoggedIn: false,
    });
    const { container } = render(<EventReactions eventId="evt-1" />);
    expect(container.firstChild).toBeNull();
  });
});

describe('EventReactions — rendu', () => {
  it('affiche les boutons pour chaque emoji', () => {
    setupReactions();
    render(<EventReactions eventId="evt-1" />);
    // 4 emojis × 1 bouton chacun
    expect(screen.getByTitle(/réagir 👍/i)).toBeInTheDocument();
    expect(screen.getByTitle(/réagir 🔥/i)).toBeInTheDocument();
    expect(screen.getByTitle(/réagir 💪/i)).toBeInTheDocument();
    expect(screen.getByTitle(/réagir 🎉/i)).toBeInTheDocument();
  });

  it('affiche le count si > 0', () => {
    setupReactions({ counts: { '👍': 5, '🔥': 0 } });
    render(<EventReactions eventId="evt-1" />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('n\'affiche pas le count si = 0', () => {
    setupReactions({ counts: { '👍': 0 } });
    render(<EventReactions eventId="evt-1" />);
    // Les spans vides ne contiennent pas de texte
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});

describe('EventReactions — interactions (utilisateur connecté)', () => {
  it('appelle toggle au clic sur un emoji', () => {
    const toggle = vi.fn();
    setupReactions({ toggle });
    render(<EventReactions eventId="evt-1" />);
    fireEvent.click(screen.getByTitle(/réagir 👍/i));
    expect(toggle).toHaveBeenCalledWith('👍');
  });

  it('affiche le titre "Retirer" pour les réactions déjà ajoutées', () => {
    setupReactions({ mine: new Set(['👍']) });
    render(<EventReactions eventId="evt-1" />);
    expect(screen.getByTitle(/retirer 👍/i)).toBeInTheDocument();
  });
});

describe('EventReactions — utilisateur non connecté', () => {
  it('n\'appelle pas toggle si non connecté', () => {
    const toggle = vi.fn();
    mockUseEventReactions.mockReturnValue({
      counts: {}, mine: new Set(), toggle,
      loading: false, isLoggedIn: false,
    });
    render(<EventReactions eventId="evt-1" />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(toggle).not.toHaveBeenCalled();
  });

  it('affiche le titre "Connectez-vous" si non connecté', () => {
    mockUseEventReactions.mockReturnValue({
      counts: {}, mine: new Set(), toggle: vi.fn(),
      loading: false, isLoggedIn: false,
    });
    render(<EventReactions eventId="evt-1" />);
    const btns = screen.getAllByRole('button');
    expect(btns[0].title).toMatch(/connectez-vous/i);
  });
});
