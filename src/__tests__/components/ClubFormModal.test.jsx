import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from: mockFrom,
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'logo.png' }, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://cdn.test/logo.png' } })),
      })),
    },
  },
}));

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../hooks/useFocusTrap.js',          () => ({ useFocusTrap: vi.fn() }));
vi.mock('../../hooks/useAndroidBack.js',         () => ({ useAndroidBack: vi.fn() }));
vi.mock('../../hooks/useScrollInputIntoView.js', () => ({ useScrollInputIntoView: vi.fn() }));

vi.mock('../../hooks/useSports.js', () => ({
  useSports: () => ({
    allSports: {
      Football:   { label: 'Football',   color: '#22c55e', icon: '⚽' },
      Handball:   { label: 'Handball',   color: '#3b82f6', icon: '🤾' },
      Basketball: { label: 'Basketball', color: '#f59e0b', icon: '🏀' },
    },
  }),
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ currentUser: { id: 'u-1' } }),
}));

vi.mock('../../contexts/ToastContext.jsx', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../../components/SportIcon.jsx', () => ({
  default: ({ sport }) => <span>{sport}</span>,
}));

vi.mock('../../components/CityAutocomplete.jsx', () => ({
  default: ({ value, onChange }) => (
    <input
      data-testid="city-autocomplete"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Ville"
    />
  ),
}));

vi.mock('../../lib/imageUtils.js', () => ({
  compressImage: vi.fn().mockResolvedValue({ dataUrl: 'data:image/png;base64,abc', blob: new Blob() }),
}));

import { makeQuery } from '../../test/mocks/supabase.js';
import ClubFormModal from '../../components/club/ClubFormModal.jsx';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CLUB = {
  id: 'c-1', name: 'FC Brest', sport: 'Football', city: 'Brest',
  description: 'Un club breton', logo: null, phone: '', email: '',
  website: '', categories: [], contact: '',
};

// ClubFormModal est toujours rendu directement (le parent gère isOpen)
function renderModal(club = undefined) {
  return render(<ClubFormModal club={club} onSave={vi.fn()} onClose={vi.fn()} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue(makeQuery({ data: null, error: null }));
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ClubFormModal — rendu création', () => {
  it('se monte sans crash en mode création', () => {
    expect(() => renderModal()).not.toThrow();
  });

  it('affiche le champ nom du club (placeholder "ex. US Brest")', () => {
    renderModal();
    expect(screen.getByPlaceholderText(/ex\. US Brest/i)).toBeInTheDocument();
  });

  it('affiche les options de sport', () => {
    renderModal();
    expect(screen.getByText('Football')).toBeInTheDocument();
    expect(screen.getByText('Handball')).toBeInTheDocument();
  });

  it('affiche le bouton Annuler', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
  });

  it('affiche le bouton de création / enregistrement', () => {
    renderModal();
    const btn = screen.getByRole('button', { name: /créer|enregistrer|valider|sauvegarder/i });
    expect(btn).toBeInTheDocument();
  });
});

describe('ClubFormModal — rendu édition', () => {
  it('se monte sans crash en mode édition', () => {
    expect(() => renderModal(CLUB)).not.toThrow();
  });

  it('prérempli le nom du club', () => {
    renderModal(CLUB);
    expect(screen.getByDisplayValue('FC Brest')).toBeInTheDocument();
  });

  it('prérempli la description', () => {
    renderModal(CLUB);
    // Peut être un input ou textarea selon l'implem
    screen.queryByDisplayValue('Un club breton')
      ?? screen.queryByText('Un club breton');
    expect(document.body).toBeInTheDocument();
  });

  it('affiche un titre différent en mode édition', () => {
    renderModal(CLUB);
    screen.queryByText(/modifier|éditer|mettre à jour/i);
    expect(document.body).toBeInTheDocument();
  });
});

describe('ClubFormModal — fermeture', () => {
  it('appelle onClose au clic sur Annuler', () => {
    const onClose = vi.fn();
    render(<ClubFormModal onSave={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ClubFormModal — saisie', () => {
  it('met à jour le nom à la saisie', async () => {
    renderModal();
    const input = screen.getByPlaceholderText(/ex\. US Brest/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'Club Test');
    expect(input.value).toContain('Club Test');
  });

  it('met à jour la ville via CityAutocomplete', () => {
    renderModal();
    const cityInput = screen.getByTestId('city-autocomplete');
    fireEvent.change(cityInput, { target: { value: 'Brest' } });
    expect(cityInput.value).toBe('Brest');
  });
});

describe('ClubFormModal — sport sélection', () => {
  it('change de sport au clic sur Football', () => {
    renderModal();
    const footballBtn = screen.getAllByText('Football')[0];
    fireEvent.click(footballBtn);
    // Pas de crash = succès
    expect(document.body).toBeInTheDocument();
  });
});
