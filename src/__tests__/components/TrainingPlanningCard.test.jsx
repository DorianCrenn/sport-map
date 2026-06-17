import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, onClick, disabled, ...p }) => <button onClick={onClick} disabled={disabled} {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../hooks/useTrainingAttendance.js', () => ({
  useTrainingAttendance: () => ({
    attendance: [
      { user_id: 'u-1', status: 'present', profiles: { name: 'Alice', avatar_url: null } },
      { user_id: 'u-2', status: 'absent',  profiles: { name: 'Bob',   avatar_url: null } },
    ],
    counts:   { present: 1, absent: 1, unsure: 0 },
    myStatus: null,
    respond:  vi.fn(),
    sendMessage: vi.fn(),
    messages: [],
  }),
}));

vi.mock('../../hooks/useRides.js', () => ({
  useRides: () => ({ rides: [], loading: false }),
}));

import TrainingPlanningCard from '../../components/planning/TrainingPlanningCard.jsx';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeItem(overrides = {}) {
  return {
    id:           'ts-1',
    type:         'training',
    date:         '2026-06-17',
    time:         '18h30',
    title:        'Entraînement Équipe 1',
    location:     'Complexe de la Cavale Blanche',
    status:       'active',
    team_id:      'Équipe 1',
    myStatus:     null,
    presentCount: 14,
    absentCount:  3,
    unsureCount:  1,
    isStaffClub:  false,
    isPlayerClub: true,
    onRespond:    vi.fn(),
    ...overrides,
  };
}

// ── Tests — rendu de base ──────────────────────────────────────────────────────

describe('TrainingPlanningCard — rendu', () => {
  it('affiche le badge ENTRAÎNEMENT', () => {
    render(<TrainingPlanningCard item={makeItem()} userId="u-1" />);
    expect(screen.getByText('Entraînement')).toBeInTheDocument();
  });

  it('affiche le titre', () => {
    render(<TrainingPlanningCard item={makeItem()} userId="u-1" />);
    expect(screen.getByText('Entraînement Équipe 1')).toBeInTheDocument();
  });

  it('affiche l\'heure', () => {
    render(<TrainingPlanningCard item={makeItem()} userId="u-1" />);
    expect(screen.getByText('18h30')).toBeInTheDocument();
  });

  it('affiche le lieu', () => {
    render(<TrainingPlanningCard item={makeItem()} userId="u-1" />);
    expect(screen.getByText(/Complexe de la Cavale Blanche/)).toBeInTheDocument();
  });

  it('affiche les compteurs de présence', () => {
    const { container } = render(<TrainingPlanningCard item={makeItem()} userId="u-1" />);
    // CountBadge rend "✓ N" dans un span .text-emerald-400
    const greenBadge = container.querySelector('.text-emerald-400');
    expect(greenBadge).not.toBeNull();
    expect(greenBadge.textContent).toContain('14');
    const redBadge = container.querySelector('.text-red-400');
    expect(redBadge?.textContent).toContain('3');
  });
});

// ── Tests — joueur ────────────────────────────────────────────────────────────

describe('TrainingPlanningCard — joueur (isPlayerClub=true)', () => {
  it('affiche les boutons Présent/Absent/Incertain', () => {
    render(<TrainingPlanningCard item={makeItem({ isPlayerClub: true })} userId="u-1" />);
    expect(screen.getByText('Présent')).toBeInTheDocument();
    expect(screen.getByText('Absent')).toBeInTheDocument();
    expect(screen.getByText('Incertain')).toBeInTheDocument();
  });

  it('clic Présent déclenche onRespond', () => {
    const onRespond = vi.fn();
    render(<TrainingPlanningCard item={makeItem({ isPlayerClub: true, onRespond })} userId="u-1" />);
    fireEvent.click(screen.getByText('Présent'));
    expect(onRespond).toHaveBeenCalledWith('training', 'ts-1', 'present');
  });
});

// ── Tests — visiteur sans équipe ──────────────────────────────────────────────

describe('TrainingPlanningCard — sans équipe (isPlayerClub=false)', () => {
  it('n\'affiche pas les boutons de présence', () => {
    render(<TrainingPlanningCard item={makeItem({ isPlayerClub: false })} userId="u-1" />);
    expect(screen.queryByText('Présent')).not.toBeInTheDocument();
  });
});

// ── Tests — statut reporté ────────────────────────────────────────────────────

describe('TrainingPlanningCard — statut reporté', () => {
  it('affiche le badge "Reporté" si status=rescheduled', () => {
    render(<TrainingPlanningCard item={makeItem({ status: 'rescheduled' })} userId="u-1" />);
    expect(screen.getByText('Reporté')).toBeInTheDocument();
  });
});
