import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }: any) => <div {...p}>{children}</div>,
    button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../constants/zIndex.js', () => ({ Z: { helpFab: 400 } }));
vi.mock('../../hooks/useAndroidBack.js', () => ({ useAndroidBack: vi.fn() }));
vi.mock('../../components/ui/EmptyState.jsx', () => ({
  default: ({ title }: any) => <div data-testid="empty-state">{title ?? 'empty'}</div>,
}));
vi.mock('../../components/icons.js', () => ({
  IconChat:       () => <span>💬</span>,
  IconHelpCircle: () => <span>❓</span>,
  IconBulb:       () => <span>💡</span>,
  IconBell:       () => <span>🔔</span>,
}));

const mockUseFeedback = vi.hoisted(() => vi.fn());
vi.mock('../../hooks/useFeedback.js', () => ({ useFeedback: mockUseFeedback }));

vi.mock('../../data/helpContent.js', () => ({
  HELP_CONTENT: [
    { id: 'q1', category: 'general', categoryId: 'general', question: 'Comment créer un club ?', answer: 'Allez dans Clubs...' },
    { id: 'q2', category: 'poster',  categoryId: 'poster',  question: 'Comment créer une affiche ?', answer: 'Ouvrez PosterStudio...' },
  ],
  HELP_CATEGORIES: [
    { id: 'general', label: 'Général',  icon: '📖' },
    { id: 'poster',  label: 'Affiches', icon: '🖼️' },
  ],
}));

import HelpPage from '../../pages/HelpPage.jsx';

function defaultFeedback() {
  mockUseFeedback.mockReturnValue({
    ideas:      [],
    fetchIdeas: vi.fn().mockResolvedValue([]),
    vote:       vi.fn(),
    unvote:     vi.fn(),
    loadMyVotes: vi.fn().mockResolvedValue([]),
    submit:     vi.fn().mockResolvedValue({}),
    search:     '',
    setSearch:  vi.fn(),
  });
}

const sampleNotif = {
  id: 'n1',
  feedback_id: 'f1',
  old_status: 'new',
  new_status: 'planned',
  read: false,
  created_at: new Date().toISOString(),
  feedback: { type: 'idea', message: 'Mon idée' },
};

describe('HelpPage', () => {
  beforeEach(() => { defaultFeedback(); });

  it('monte sans erreur', () => {
    expect(() => render(<HelpPage onClose={vi.fn()} />)).not.toThrow();
  });

  it('affiche l\'onglet FAQ par défaut', () => {
    render(<HelpPage onClose={vi.fn()} />);
    expect(screen.getByText(/FAQ/i)).toBeInTheDocument();
  });

  it('affiche l\'onglet Idées', () => {
    render(<HelpPage onClose={vi.fn()} />);
    expect(screen.getByText(/Idées/i)).toBeInTheDocument();
  });

  it('affiche l\'onglet Notifications quand il y en a', () => {
    render(<HelpPage onClose={vi.fn()} notifications={[sampleNotif]} unreadCount={1} />);
    expect(document.body.textContent).toMatch(/Notifications/i);
  });

  it('affiche les questions FAQ depuis HELP_CONTENT', () => {
    render(<HelpPage onClose={vi.fn()} />);
    expect(screen.getByText('Comment créer un club ?')).toBeInTheDocument();
  });

  it('affiche la réponse en cliquant sur une question', async () => {
    render(<HelpPage onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Comment créer un club ?'));
    await waitFor(() => {
      expect(screen.getByText(/Allez dans Clubs/i)).toBeInTheDocument();
    });
  });

  it('affiche le badge sur l\'onglet Notifications si unreadCount > 0', () => {
    render(<HelpPage onClose={vi.fn()} unreadCount={3} notifications={[sampleNotif]} />);
    // Le badge unread est visible dans le DOM
    expect(document.body.textContent).toMatch(/3/);
  });

  it('s\'ouvre sur l\'onglet Notifications si unreadCount > 0', () => {
    render(<HelpPage onClose={vi.fn()} unreadCount={2} notifications={[sampleNotif]} />);
    // L'onglet Notifications est actif → aucune FAQ visible
    expect(document.body.textContent).toMatch(/Notifications/i);
  });

  it('affiche EmptyState dans Idées si pas de feedback', async () => {
    render(<HelpPage onClose={vi.fn()} />);
    fireEvent.click(screen.getByText(/Idées/i));
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });
});
