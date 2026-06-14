/**
 * Tests NextTrainingCard — carte de prochain entraînement
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockUseNextTraining, mockUseMyPlayerProfile } = vi.hoisted(() => ({
  mockUseNextTraining:    vi.fn(),
  mockUseMyPlayerProfile: vi.fn(),
}));

vi.mock('../../hooks/useNextTraining.js', () => ({ useNextTraining: mockUseNextTraining }));
vi.mock('../../hooks/useMyPlayerProfile.js', () => ({ useMyPlayerProfile: mockUseMyPlayerProfile }));
vi.mock('../club/SendTrainingMessageModal.jsx', () => ({
  default: ({ onClose }) => (
    <div data-testid="send-training-modal">
      <button onClick={onClose}>Fermer</button>
    </div>
  ),
}));
vi.mock('../../components/club/SendTrainingMessageModal.jsx', () => ({
  default: ({ onClose }) => (
    <div data-testid="send-training-modal">
      <button onClick={onClose}>Fermer</button>
    </div>
  ),
}));

import NextTrainingCard from '../../components/NextTrainingCard.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);

function makeSession(overrides = {}) {
  return {
    id: 's-1', date: TODAY, time: '18:00', location: 'Gymnase', status: 'active',
    ...overrides,
  };
}

function setup({ session = makeSession(), loading = false, isManager = false } = {}) {
  const user = {
    id: 'u-1',
    role: isManager ? 'club_admin' : 'user',
    clubId: 'club-1',
  };
  mockUseMyPlayerProfile.mockReturnValue({ profile: null, loading: false });
  mockUseNextTraining.mockReturnValue({
    session, counts: { present: 3, absent: 1, unsure: 2 },
    myStatus: null, loading, respond: vi.fn(), sendMessage: vi.fn(),
  });
  return user;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NextTrainingCard — sans données', () => {
  it('retourne null si pas de session', () => {
    const user = setup({ session: null });
    const { container } = render(<NextTrainingCard currentUser={user} />);
    expect(container.firstChild).toBeNull();
  });

  it('retourne null si loading', () => {
    const user = setup({ loading: true });
    const { container } = render(<NextTrainingCard currentUser={user} />);
    expect(container.firstChild).toBeNull();
  });

  it('retourne null si pas de clubId', () => {
    mockUseMyPlayerProfile.mockReturnValue({ profile: null, loading: false });
    mockUseNextTraining.mockReturnValue({ session: null, loading: false });
    const { container } = render(<NextTrainingCard currentUser={{ id: 'u-1', role: 'user', clubId: null }} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('NextTrainingCard — vue joueur', () => {
  it('affiche le titre "Prochain entraînement"', () => {
    const user = setup();
    render(<NextTrainingCard currentUser={user} />);
    expect(screen.getByText(/prochain entraînement/i)).toBeInTheDocument();
  });

  it('affiche l\'heure et le lieu', () => {
    const user = setup();
    render(<NextTrainingCard currentUser={user} />);
    expect(screen.getByText('18:00')).toBeInTheDocument();
    expect(screen.getByText('Gymnase')).toBeInTheDocument();
  });

  it('affiche les boutons de réponse (Présent, Absent, Peut-être)', () => {
    const user = setup();
    render(<NextTrainingCard currentUser={user} />);
    expect(screen.getByRole('button', { name: /présent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /absent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /peut-être/i })).toBeInTheDocument();
  });

  it('appelle respond avec le statut au clic', () => {
    const respond = vi.fn();
    mockUseNextTraining.mockReturnValue({
      session: makeSession(), counts: {}, myStatus: null,
      loading: false, respond, sendMessage: vi.fn(),
    });
    const user = { id: 'u-1', role: 'user', clubId: 'club-1' };
    render(<NextTrainingCard currentUser={user} />);
    fireEvent.click(screen.getByRole('button', { name: /présent/i }));
    expect(respond).toHaveBeenCalledWith('present');
  });

  it('affiche le bouton "Planning" si onOpenTrainings fourni', () => {
    const user = setup();
    render(<NextTrainingCard currentUser={user} onOpenTrainings={vi.fn()} />);
    expect(screen.getByRole('button', { name: /planning/i })).toBeInTheDocument();
  });
});

describe('NextTrainingCard — vue manager', () => {
  it('affiche les compteurs présences/absences', () => {
    const user = setup({ isManager: true });
    render(<NextTrainingCard currentUser={user} />);
    expect(screen.getByText('3')).toBeInTheDocument(); // présents
    expect(screen.getByText('1')).toBeInTheDocument(); // absents
    expect(screen.getByText('2')).toBeInTheDocument(); // peut-être
  });

  it('affiche le bouton "Envoyer un message"', () => {
    const user = setup({ isManager: true });
    render(<NextTrainingCard currentUser={user} />);
    expect(screen.getByRole('button', { name: /envoyer un message/i })).toBeInTheDocument();
  });

  it('ouvre le modal d\'envoi de message au clic', () => {
    const user = setup({ isManager: true });
    render(<NextTrainingCard currentUser={user} />);
    fireEvent.click(screen.getByRole('button', { name: /envoyer un message/i }));
    expect(screen.getByTestId('send-training-modal')).toBeInTheDocument();
  });

  it('ferme le modal au clic Fermer', () => {
    const user = setup({ isManager: true });
    render(<NextTrainingCard currentUser={user} />);
    fireEvent.click(screen.getByRole('button', { name: /envoyer un message/i }));
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }));
    expect(screen.queryByTestId('send-training-modal')).not.toBeInTheDocument();
  });
});
