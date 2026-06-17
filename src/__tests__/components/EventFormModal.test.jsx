/**
 * Tests for EventFormModal — validation, submit, modes, recurrence, keyboard
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: React.forwardRef(({ children, style, className, onClick, role, 'aria-modal': ariaModal, 'aria-labelledby': ariaLabelledBy }, ref) =>
        <div ref={ref} style={style} className={className} onClick={onClick} role={role} aria-modal={ariaModal} aria-labelledby={ariaLabelledBy}>{children}</div>
      ),
    },
  };
});

vi.mock('../../constants/zIndex.js', () => ({ Z: { formModal: 100 } }));

vi.mock('../../data/cities.js', () => ({
  EVENT_TYPES: [
    { value: 'championship', label: 'Championnat', icon: '🏆', color: '#3b82f6' },
    { value: 'cup',          label: 'Coupe',        icon: '🥈', color: '#f97316' },
    { value: 'friendly',     label: 'Amical',        icon: '⚽', color: '#22C55E' },
  ],
}));

vi.mock('../../data/clubs.js', () => ({ STATIC_CLUBS: [] }));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(() => ({ currentUser: { id: 'u1', name: 'Test' }, isClubAdmin: false })),
}));

vi.mock('../../hooks/useSports.js', () => ({
  useSports: vi.fn(() => ({
    allSports: {
      Football:   { label: 'Football',   isArchived: false },
      Handball:   { label: 'Handball',   isArchived: false },
      Basketball: { label: 'Basketball', isArchived: false },
    },
  })),
}));

vi.mock('../../hooks/useClubs.js', () => ({
  useClubs: vi.fn(() => ({ userClubs: [] })),
}));

vi.mock('../../hooks/useFocusTrap.js', () => ({
  useFocusTrap: vi.fn(),
}));

vi.mock('../../components/CityAutocomplete.jsx', () => ({
  default: ({ value, onChange, onSelect, placeholder, inputStyle }) => (
    <input
      data-testid="city-autocomplete"
      placeholder={placeholder}
      value={value}
      onChange={e => { onChange(e.target.value); onSelect({ nom: e.target.value, lat: 48.39, lng: -4.48 }); }}
      style={inputStyle}
    />
  ),
}));

vi.mock('../../components/VenueAutocomplete.jsx', () => ({
  default: ({ value, onChange, placeholder, style }) => (
    <input
      data-testid="venue-autocomplete"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={style}
    />
  ),
}));

vi.mock('../../components/SportIcon.jsx', () => ({
  default: () => null,
}));

import EventFormModal from '../../components/EventFormModal.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultProps = {
  event:       { _isNew: true },
  onSave:      vi.fn(),
  onClose:     vi.fn(),
  onBulkSave:  vi.fn(),
};

function renderModal(props = {}) {
  return render(<EventFormModal {...defaultProps} {...props} />);
}

// React 19 + jsdom : met à jour un input contrôlé et force le flush du state.
// Le tab() déclenche le blur sur l'input, ce qui commit la valeur dans React 19.
async function setInputValue(el, value) {
  el.focus();
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeSetter.call(el, value);
  fireEvent.change(el, { target: { value } });
  // Tab away pour déclencher le blur et forcer le commit React 19
  await userEvent.tab();
}

// Navigate through the 3-step form: step1 → step2 (optionally fill teams) → step3
async function goToStep3({ homeTeam = '', awayTeam = '' } = {}) {
  // Step 1 → 2
  const next1 = screen.getByRole('button', { name: /suivant/i });
  await userEvent.click(next1);
  // Fill team names in step 2 (Football full mode) — text inputs work with fireEvent.change
  if (homeTeam) fireEvent.change(screen.getByPlaceholderText(/fc brest/i), { target: { value: homeTeam } });
  if (awayTeam) fireEvent.change(screen.getByPlaceholderText(/fc quimper/i), { target: { value: awayTeam } });
  // Step 2 → 3
  const next2 = screen.getByRole('button', { name: /suivant/i });
  await userEvent.click(next2);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Heading variants ──────────────────────────────────────────────────────────

describe('EventFormModal — heading selon le mode', () => {
  it('affiche "Nouvel événement" pour un nouvel événement', () => {
    renderModal({ event: { _isNew: true } });
    expect(screen.getByText('Nouvel événement')).toBeInTheDocument();
  });

  it('affiche "Dupliquer l\'événement" en mode duplication', () => {
    renderModal({ event: { _isNew: true, _isDuplicate: true, title: 'Match', sport: 'Football' } });
    expect(screen.getByText("Dupliquer l'événement")).toBeInTheDocument();
  });

  it('affiche "Modifier l\'événement" en mode édition', () => {
    renderModal({ event: {
      id: 'evt-1', title: 'Match', sport: 'Football',
      date: '2026-06-01T15:00:00', city: 'Brest', lat: 48.39, lng: -4.48,
    }});
    expect(screen.getByText("Modifier l'événement")).toBeInTheDocument();
  });
});

// ── Fermeture ──────────────────────────────────────────────────────────────────

describe('EventFormModal — fermeture', () => {
  it('appelle onClose quand on appuie sur Escape', () => {
    renderModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('appelle onClose quand on clique sur le bouton Fermer', async () => {
    renderModal();
    const closeBtn = screen.getByRole('button', { name: /fermer/i });
    await userEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('appelle onClose quand on clique sur "Annuler"', async () => {
    renderModal();
    const cancelBtn = screen.getByRole('button', { name: /annuler/i });
    await userEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});

// ── Validation ─────────────────────────────────────────────────────────────────

describe('EventFormModal — validation Zod', () => {
  it('affiche une erreur et ne soumet pas si la date est vide', async () => {
    const onSave = vi.fn();
    renderModal({ onSave });

    // Navigate to step 3 (date field) without filling the date
    await goToStep3();
    const submitBtn = screen.getByRole('button', { name: /créer l'événement/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/date/i)).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('appelle onSave avec les données correctes pour un formulaire valide', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderModal({ onSave });

    // Navigate: step1 → step2 (fill teams) → step3 (fill date)
    await goToStep3({ homeTeam: 'FC Brest', awayTeam: 'FC Quimper' });
    const dateInputEl = document.querySelector('input[type="date"]');
    await setInputValue(dateInputEl, '2030-06-15');

    const submitBtn = screen.getByRole('button', { name: /créer l'événement/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    const arg = onSave.mock.calls[0][0];
    expect(arg).toMatchObject({
      sport: 'Football',
      date: expect.stringContaining('2030-06-15T15:00:00'),
    });
  });

  it('n\'appelle pas onSave deux fois si le formulaire est soumis deux fois rapidement', async () => {
    const onSave = vi.fn(() => new Promise(r => setTimeout(r, 500)));
    renderModal({ onSave });

    await goToStep3({ homeTeam: 'FC Brest', awayTeam: 'FC Quimper' });
    const dateInputEl = document.querySelector('input[type="date"]');
    await setInputValue(dateInputEl, '2030-06-15');

    const submitBtn = screen.getByRole('button', { name: /créer l'événement/i });
    await userEvent.click(submitBtn);
    await userEvent.click(submitBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

// ── Récurrence ─────────────────────────────────────────────────────────────────

describe('EventFormModal — récurrence', () => {
  it('appelle onBulkSave avec plusieurs occurrences quand récurrence activée', async () => {
    const onBulkSave = vi.fn().mockResolvedValue(undefined);
    renderModal({ onBulkSave });

    // Navigate to step 3 with teams filled
    await goToStep3({ homeTeam: 'FC Brest', awayTeam: 'FC Quimper' });

    // Fill date (step 3)
    const dateInputEl = document.querySelector('input[type="date"]');
    await setInputValue(dateInputEl, '2026-09-01');

    // Enable recurrence (step 3 button)
    const recurrenceBtn = screen.getByRole('button', { name: /récurrence/i });
    await userEvent.click(recurrenceBtn);

    // Set end date
    const allDateInputs = document.querySelectorAll('input[type="date"]');
    const untilInput = allDateInputs[allDateInputs.length - 1];
    await setInputValue(untilInput, '2026-09-22');

    const submitBtn = screen.getByRole('button', { name: /créer l'événement/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(onBulkSave).toHaveBeenCalledTimes(1);
    });

    const events = onBulkSave.mock.calls[0][0];
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThanOrEqual(4);
    const seriesIds = new Set(events.map(e => e.seriesId));
    expect(seriesIds.size).toBe(1);
  });

  it('compte le bon nombre d\'occurrences dans l\'aperçu', async () => {
    renderModal();

    await goToStep3();

    const dateInputEl = document.querySelector('input[type="date"]');
    await setInputValue(dateInputEl, '2026-09-01');

    const recurrenceBtn = screen.getByRole('button', { name: /récurrence/i });
    await userEvent.click(recurrenceBtn);

    const allDateInputs = document.querySelectorAll('input[type="date"]');
    const untilInput = allDateInputs[allDateInputs.length - 1];
    await setInputValue(untilInput, '2026-09-22');

    await waitFor(() => {
      expect(screen.getByText(/4 occurrence/i)).toBeInTheDocument();
    });
  });
});

// ── Erreur réseau ──────────────────────────────────────────────────────────────

describe('EventFormModal — erreur lors de la sauvegarde', () => {
  it('affiche le message d\'erreur si onSave lance une exception', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Connexion refusée'));
    renderModal({ onSave });

    await goToStep3({ homeTeam: 'FC Brest', awayTeam: 'FC Quimper' });

    const dateInputEl = document.querySelector('input[type="date"]');
    await setInputValue(dateInputEl, '2030-06-15');

    const submitBtn = screen.getByRole('button', { name: /créer l'événement/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/connexion refusée/i)).toBeInTheDocument();
    });
  });
});

// ── Protection titre vide ──────────────────────────────────────────────────────

describe('EventFormModal — titre vide bloqué', () => {
  it('bloque la soumission si aucune équipe n\'est renseignée pour un sport collectif', async () => {
    const onSave = vi.fn();
    renderModal({ onSave });

    // Navigate to step 3 WITHOUT filling homeTeam/awayTeam → title will be empty
    await goToStep3();
    const dateInputEl = document.querySelector('input[type="date"]');
    await setInputValue(dateInputEl, '2030-06-15');

    const submitBtn = screen.getByRole('button', { name: /créer l'événement/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/nom de l'événement est requis/i)).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});

// ── Données envoyées à onSave ──────────────────────────────────────────────────

describe('EventFormModal — structure des données envoyées', () => {
  it('envoie tous les champs critiques : sport, date, city, lat, lng, eventType, homeOrAway', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderModal({ onSave });

    // step1 → step2 (fill teams) → step3 (fill date)
    await goToStep3({ homeTeam: 'FC Brest', awayTeam: 'FC Quimper' });

    const dateInputEl = document.querySelector('input[type="date"]');
    await setInputValue(dateInputEl, '2030-06-15');

    const submitBtn = screen.getByRole('button', { name: /créer l'événement/i });
    await userEvent.click(submitBtn);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    const arg = onSave.mock.calls[0][0];
    expect(arg).toMatchObject({
      sport:      'Football',
      date:       expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      eventType:  'championship',
      homeOrAway: 'home',
    });
    expect(arg.lat).toBeDefined();
    expect(arg.lng).toBeDefined();
    expect(arg.title).toBeTruthy();
  });
});
