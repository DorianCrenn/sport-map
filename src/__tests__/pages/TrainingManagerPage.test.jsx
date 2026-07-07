import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Retours stables (refs constantes → pas de boucle de rendu) ────────────────

const CLUB = { id: 'c-1', name: 'FC SportLink', sport: 'Football' };
const MANAGED = { managedClubs: [CLUB], loading: false };
const AUTH_MANAGER = { currentUser: { id: 'u-1', role: 'club_admin', clubId: 'c-1' } };
const PLAYER_PROFILE = { profile: null, loading: false };
const TRAININGS_TUPLE = [{}, vi.fn()];
const SESSIONS = { sessions: [], loading: false, createSession: vi.fn(), updateSession: vi.fn(), deleteSession: vi.fn(), generateFromRecurring: vi.fn() };
const ATTENDANCE = { attendance: [], counts: { present: 0, absent: 0, unsure: 0 }, myStatus: null, messages: [], respond: vi.fn(), sendMessage: vi.fn() };

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>,
    span:   ({ children, ...p }) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
vi.mock('../../hooks/useAndroidBack.js', () => ({ useAndroidBack: () => {} }));
vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth: () => AUTH_MANAGER }));
vi.mock('../../hooks/useManagedClubs.js', () => ({ useManagedClubs: () => MANAGED }));
vi.mock('../../hooks/useMyPlayerProfile.js', () => ({ useMyPlayerProfile: () => PLAYER_PROFILE }));
vi.mock('../../hooks/useClubTrainings.js', () => ({ useClubTrainings: () => TRAININGS_TUPLE }));
vi.mock('../../hooks/useTrainingSessions.js', () => ({ useTrainingSessions: () => SESSIONS }));
vi.mock('../../hooks/useTrainingAttendance.js', () => ({ useTrainingAttendance: () => ATTENDANCE }));
vi.mock('../../components/club/blocks/TrainingBlock.jsx', () => ({ default: () => null }));

import TrainingManagerPage from '../../pages/TrainingManagerPage.jsx';

beforeEach(() => { vi.clearAllMocks(); });

describe('TrainingManagerPage', () => {
  it('se monte sans crash en mode manager', () => {
    expect(() => render(<TrainingManagerPage onBack={vi.fn()} />)).not.toThrow();
  });

  it('affiche le bouton Retour', () => {
    render(<TrainingManagerPage onBack={vi.fn()} />);
    expect(screen.getByLabelText('Retour')).toBeInTheDocument();
  });

  it('déclenche onBack au clic sur Retour', () => {
    const onBack = vi.fn();
    render(<TrainingManagerPage onBack={onBack} />);
    fireEvent.click(screen.getByLabelText('Retour'));
    expect(onBack).toHaveBeenCalled();
  });

  it('affiche un état vide quand aucune séance', () => {
    render(<TrainingManagerPage onBack={vi.fn()} />);
    expect(screen.getByText(/aucune séance à venir|aucun entraînement planifié|aucun planning défini/i)).toBeInTheDocument();
  });
});
