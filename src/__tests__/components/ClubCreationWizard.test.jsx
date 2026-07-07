/**
 * Tests ClubCreationWizard — parcours de création club (wizard 3 étapes)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useSports.js', () => ({
  useSports: () => ({
    allSports: {
      Football: { id: 'Football', label: 'Football', color: '#22C55E' },
      Handball: { id: 'Handball', label: 'Handball', color: '#3B82F6' },
    },
  }),
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ currentUser: { id: 'user-1' } }),
}));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'logo.png' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/logo.png' } }),
      })),
    },
  },
}));

vi.mock('../../components/CityAutocomplete.jsx', () => ({
  default: ({ onSelect, placeholder }) => (
    <input
      data-testid="city-autocomplete"
      placeholder={placeholder}
      onChange={() => {}}
      onFocus={() => onSelect?.({
        nom: 'Brest',
        lat: 48.39, lng: -4.49,
        codesPostaux: ['29200'],
        codeRegion: 'BRE',
        codeDepartement: '29',
      })}
    />
  ),
}));

// Mock framer-motion pour éviter les animations dans les tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../constants/zIndex.js', () => ({ Z: { formModal: 9999 } }));
// SportIcon retourne un data-testid unique pour que les boutons de sport soient identifiables
vi.mock('../../components/SportIcon.jsx', () => ({
  default: ({ sport }) => <span data-testid={`sport-icon-${sport}`}>{sport}</span>,
}));

import ClubCreationWizard from '../../components/club/ClubCreationWizard.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderWizard(onSave = vi.fn(), onClose = vi.fn()) {
  return render(<ClubCreationWizard onSave={onSave} onClose={onClose} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ClubCreationWizard — étape 1 (Identité)', () => {
  it('affiche le titre et la progression étape 1/3', () => {
    renderWizard();
    expect(screen.getByText(/Créez votre club/i)).toBeDefined();
    expect(screen.getByText(/ÉTAPE 1\/3/i)).toBeDefined();
  });

  it('bloque la progression si le nom est vide', () => {
    renderWizard();
    const nextBtn = screen.getByRole('button', { name: /Suivant/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Nom requis/i)).toBeDefined();
    // Toujours à l'étape 1
    expect(screen.getByText(/ÉTAPE 1\/3/i)).toBeDefined();
  });

  it('bloque si aucun sport sélectionné', () => {
    renderWizard();
    fireEvent.change(screen.getByPlaceholderText(/FC Brest/i), { target: { value: 'FC Plouvorn' } });
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));
    expect(screen.getByText(/Choisissez un sport/i)).toBeDefined();
  });

  it('passe a etape 2 si les 3 champs obligatoires sont remplis', async () => {
    renderWizard();
    // Remplir nom
    fireEvent.change(screen.getByPlaceholderText(/FC Brest/i), { target: { value: 'FC Plouvorn' } });
    // Sélectionner sport Football
    fireEvent.click(screen.getAllByText('Football')[0]);
    // Sélectionner ville via le mock (focus déclenche onSelect)
    const cityInput = screen.getByTestId('city-autocomplete');
    fireEvent.focus(cityInput);

    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));
    await waitFor(() => expect(screen.getByText(/ÉTAPE 2\/3/i)).toBeDefined());
  });
});

describe('ClubCreationWizard — navigation', () => {
  it('bouton Precedent ramene a etape precedente', async () => {
    renderWizard();
    // Aller à étape 2
    fireEvent.change(screen.getByPlaceholderText(/FC Brest/i), { target: { value: 'FC Test' } });
    fireEvent.click(screen.getAllByText('Football')[0]);
    const cityInput = screen.getByTestId('city-autocomplete');
    fireEvent.focus(cityInput);
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));
    await waitFor(() => screen.getByText(/ÉTAPE 2\/3/i));

    // Retour à l'étape 1
    fireEvent.click(screen.getByRole('button', { name: /Précédent/i }));
    await waitFor(() => expect(screen.getByText(/ÉTAPE 1\/3/i)).toBeDefined());
  });

  it('bouton Passer saute les étapes optionnelles', async () => {
    renderWizard();
    fireEvent.change(screen.getByPlaceholderText(/FC Brest/i), { target: { value: 'FC Test' } });
    fireEvent.click(screen.getAllByText('Football')[0]);
    fireEvent.focus(screen.getByTestId('city-autocomplete'));
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));
    await waitFor(() => screen.getByText(/ÉTAPE 2\/3/i));

    fireEvent.click(screen.getByRole('button', { name: /Passer/i }));
    await waitFor(() => expect(screen.getByText(/ÉTAPE 3\/3/i)).toBeDefined());
  });

  it('ferme la modal sur le bouton Annuler (étape 1)', () => {
    const onClose = vi.fn();
    renderWizard(vi.fn(), onClose);
    fireEvent.click(screen.getByRole('button', { name: /Annuler/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('ClubCreationWizard — récapitulatif (étape 3)', () => {
  async function goToStep3() {
    const onSave = vi.fn().mockResolvedValue({});
    renderWizard(onSave);

    // Étape 1
    fireEvent.change(screen.getByPlaceholderText(/FC Brest/i), { target: { value: 'FC Plouvorn' } });
    fireEvent.click(screen.getAllByText('Football')[0]);
    fireEvent.focus(screen.getByTestId('city-autocomplete'));
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));

    // Étape 2 : Passer (optionnel)
    await waitFor(() => screen.getByRole('button', { name: /Passer/i }));
    fireEvent.click(screen.getByRole('button', { name: /Passer/i }));

    await waitFor(() => screen.getByText(/C'est prêt/i));
    return onSave;
  }

  it('affiche le bouton Creer le club a etape 3', async () => {
    await goToStep3();
    expect(screen.getByRole('button', { name: /Créer le club/i })).toBeDefined();
  });

  it('appelle onSave avec les données complètes du formulaire', async () => {
    const onSave = await goToStep3();
    fireEvent.click(screen.getByRole('button', { name: /Créer le club/i }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledOnce();
      const callArg = onSave.mock.calls[0][0];
      expect(callArg.name).toBe('FC Plouvorn');
      expect(callArg.sport).toBe('Football');
      expect(callArg.city).toBe('Brest');
    });
  });
});
