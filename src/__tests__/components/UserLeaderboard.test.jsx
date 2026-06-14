/**
 * Tests UserLeaderboard — classement XP des utilisateurs
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockUseUserLeaderboard } = vi.hoisted(() => ({
  mockUseUserLeaderboard: vi.fn(),
}));

vi.mock('../../hooks/useUserLeaderboard.js', () => ({
  useUserLeaderboard: mockUseUserLeaderboard,
}));
vi.mock('../../hooks/useBadges.js', () => ({
  LEVELS: [],
  getLevel: vi.fn(() => ({ level: 1, name: 'Débutant', progress: 0.3, nextLevel: 2 })),
}));
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => <div {...p}>{children}</div>,
  },
}));
vi.mock('../Skeleton.jsx', () => ({
  Skeleton: ({ width, height }) => <div data-testid="skeleton" style={{ width, height }} />,
}));
vi.mock('../../components/Skeleton.jsx', () => ({
  Skeleton: ({ width, height }) => <div data-testid="skeleton" style={{ width, height }} />,
}));

import UserLeaderboard from '../../components/UserLeaderboard.jsx';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UserLeaderboard — loading', () => {
  it('affiche des skeletons pendant le chargement', () => {
    mockUseUserLeaderboard.mockReturnValue({ ranking: [], loading: true });
    render(<UserLeaderboard />);
    expect(screen.getByLabelText(/chargement du classement/i)).toBeInTheDocument();
  });
});

describe('UserLeaderboard — classement vide', () => {
  it('affiche un message si le classement est vide', () => {
    mockUseUserLeaderboard.mockReturnValue({ ranking: [], loading: false });
    render(<UserLeaderboard />);
    expect(screen.getByText(/aucun membre/i)).toBeInTheDocument();
  });
});

describe('UserLeaderboard — avec données', () => {
  beforeEach(() => {
    mockUseUserLeaderboard.mockReturnValue({
      loading: false,
      ranking: [
        { id: 'u-1', name: 'Alice Dupont', xp: 1200, avatar_url: null },
        { id: 'u-2', name: 'Bob Martin',  xp: 900,  avatar_url: null },
        { id: 'u-3', name: 'Carol Silva', xp: 750,  avatar_url: null },
      ],
    });
  });

  it('affiche le titre "Classement XP"', () => {
    render(<UserLeaderboard />);
    expect(screen.getByText(/classement xp/i)).toBeInTheDocument();
  });

  it('affiche les noms des utilisateurs', () => {
    render(<UserLeaderboard />);
    expect(screen.getByText('Alice Dupont')).toBeInTheDocument();
    expect(screen.getByText('Bob Martin')).toBeInTheDocument();
    expect(screen.getByText('Carol Silva')).toBeInTheDocument();
  });

  it('affiche les points XP', () => {
    render(<UserLeaderboard />);
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('900')).toBeInTheDocument();
  });

  it('affiche les médailles pour le top 3', () => {
    render(<UserLeaderboard />);
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('affiche les initiales pour les utilisateurs sans avatar', () => {
    render(<UserLeaderboard />);
    expect(screen.getByText('AD')).toBeInTheDocument(); // Alice Dupont
    expect(screen.getByText('BM')).toBeInTheDocument(); // Bob Martin
  });

  it('affiche le niveau de chaque utilisateur', () => {
    render(<UserLeaderboard />);
    const levels = screen.getAllByText(/niv\. \d/i);
    expect(levels.length).toBe(3);
  });
});
