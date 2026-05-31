import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(() => ({ currentUser: { id: 'u1', favoriteSports: [] } })),
}));

vi.mock('../../contexts/FavoritesContext.jsx', () => ({
  useFavoritesContext: vi.fn(() => ({ isFavorite: () => false, toggleFavorite: vi.fn() })),
}));

vi.mock('../../hooks/useManagedClubs.js', () => ({
  useManagedClubs: vi.fn(() => ({ managedClubs: [], loading: false })),
}));

vi.mock('../../hooks/useMatchesForDate.js', () => ({
  useMatchesForDate: vi.fn(() => ({ matches: [], loading: false })),
}));

vi.mock('../../hooks/useEliteSponsors.js', () => ({
  useEliteSponsors: vi.fn(() => ({ sponsors: [], loading: false })),
}));

vi.mock('../../components/score/ScoreEntryContainer.jsx', () => ({
  default: () => <div data-testid="score-entry">ScoreEntry</div>,
}));

import { useAuth } from '../../contexts/AuthContext.jsx';
import { useManagedClubs } from '../../hooks/useManagedClubs.js';
import MatchesTab from '../../components/feed/MatchesTab.jsx';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({ currentUser: { id: 'u1', favoriteSports: [] } });
  vi.mocked(useManagedClubs).mockReturnValue({ managedClubs: [], loading: false });
});

// ── Navigation principale ─────────────────────────────────────────────────────

describe('MatchesTab — sous-onglets', () => {
  it('affiche les 3 onglets de base (Tous, Favoris, Compétitions)', () => {
    render(<MatchesTab followedClubIds={[]} />);

    expect(screen.getByText('Tous')).toBeDefined();
    expect(screen.getByText('Favoris')).toBeDefined();
    expect(screen.getByText('Compétitions')).toBeDefined();
  });

  it('N\'affiche PAS l\'onglet Mon Club si pas de clubs gérés', () => {
    vi.mocked(useManagedClubs).mockReturnValue({ managedClubs: [], loading: false });
    render(<MatchesTab followedClubIds={[]} />);

    expect(screen.queryByText('Mon Club')).toBeNull();
  });

  it('affiche l\'onglet Mon Club si l\'utilisateur gère au moins un club', () => {
    vi.mocked(useManagedClubs).mockReturnValue({
      managedClubs: [{ id: 'c1', name: 'FC Brest' }],
      loading: false,
    });
    render(<MatchesTab followedClubIds={['c1']} />);

    expect(screen.getByText('Mon Club')).toBeDefined();
  });
});

// ── Navigation par date ───────────────────────────────────────────────────────

describe('MatchesTab — navigation par date', () => {
  it('affiche "Aujourd\'hui" par défaut', () => {
    render(<MatchesTab followedClubIds={[]} />);
    expect(screen.getByText("Aujourd'hui")).toBeDefined();
  });

  it('les boutons de navigation sont présents', () => {
    render(<MatchesTab followedClubIds={[]} />);
    const prevBtn = screen.getByLabelText('Jour précédent');
    const nextBtn = screen.getByLabelText('Jour suivant');
    expect(prevBtn).toBeDefined();
    expect(nextBtn).toBeDefined();
  });

  it('clic sur "Jour suivant" change la date affichée', () => {
    render(<MatchesTab followedClubIds={[]} />);
    const nextBtn = screen.getByLabelText('Jour suivant');
    fireEvent.click(nextBtn);
    expect(screen.queryByText("Aujourd'hui")).toBeNull();
    expect(screen.getByText('Demain')).toBeDefined();
  });
});

// ── Filtres de statut ─────────────────────────────────────────────────────────

describe('MatchesTab — filtres statut', () => {
  it('affiche les filtres Live, Terminé, À venir', () => {
    render(<MatchesTab followedClubIds={[]} />);
    expect(screen.getByText('Live')).toBeDefined();
    expect(screen.getByText('Terminé')).toBeDefined();
    expect(screen.getByText('À venir')).toBeDefined();
  });

  it('les filtres statut sont masqués sur l\'onglet Compétitions', () => {
    render(<MatchesTab followedClubIds={[]} />);
    const compTab = screen.getByText('Compétitions');
    fireEvent.click(compTab);

    expect(screen.queryByText('Live')).toBeNull();
    expect(screen.queryByText('Terminé')).toBeNull();
    expect(screen.queryByText('À venir')).toBeNull();
  });
});
