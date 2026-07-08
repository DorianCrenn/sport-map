import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';

const { mockUseAuth, mockIsDemoMode } = vi.hoisted(() => ({ mockUseAuth: vi.fn(), mockIsDemoMode: vi.fn(() => false) }));

vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth: mockUseAuth }));
vi.mock('../../lib/supabase.js', () => ({ isDemoMode: mockIsDemoMode, supabase: {}, setDemoMode: () => {} }));
vi.mock('../../pages/HomePage.jsx', () => ({ default: () => <div data-testid="home-page" /> }));
vi.mock('../../pages/ActualitesPage.jsx', () => ({ default: () => <div data-testid="actualites-page" /> }));

import HomeScreen from '../../pages/HomeScreen.jsx';

const BASE = { followedClubIds: [], onNavigate: vi.fn() };

// HomePage/ActualitesPage sont lazy → Suspense + findBy (résolution async).
function renderHome(props = {}) {
  return render(<Suspense fallback={null}><HomeScreen {...BASE} {...props} /></Suspense>);
}

beforeEach(() => {
  mockUseAuth.mockReset();
  mockIsDemoMode.mockReturnValue(false);
});

describe('HomeScreen', () => {
  it('utilisateur connecté → affiche ActualitesPage', async () => {
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u-1' } });
    renderHome();
    expect(await screen.findByTestId('actualites-page')).toBeInTheDocument();
  });

  it('mode démo (non connecté) → affiche ActualitesPage', async () => {
    mockUseAuth.mockReturnValue({ currentUser: null });
    mockIsDemoMode.mockReturnValue(true);
    renderHome();
    expect(await screen.findByTestId('actualites-page')).toBeInTheDocument();
  });

  it('visiteur non connecté, hors démo → affiche HomePage', async () => {
    mockUseAuth.mockReturnValue({ currentUser: null });
    renderHome();
    expect(await screen.findByTestId('home-page')).toBeInTheDocument();
  });
});
