import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, onClick, disabled, ...p }) => <button onClick={onClick} disabled={disabled} {...p}>{children}</button>,
    span:   ({ children, ...p }) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../hooks/useMatchAttendance.js', () => ({
  useMatchAttendance: () => ({
    attendance: [
      { user_id: 'u-1', status: 'present', profiles: { name: 'Alice', avatar_url: null } },
    ],
    counts:   { present: 1, absent: 0, unsure: 0 },
    myStatus: null,
    respond:  vi.fn(),
  }),
}));

vi.mock('../../hooks/useTrainingAttendance.js', () => ({
  useTrainingAttendance: () => ({
    attendance: [], counts: { present: 0, absent: 0, unsure: 0 },
    myStatus: null, respond: vi.fn(), sendMessage: vi.fn(), messages: [],
  }),
}));

vi.mock('../../hooks/useRides.js', () => ({
  useRides: () => ({ rides: [], loading: false }),
}));

vi.mock('../../contexts/ToastContext.jsx', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../../lib/supabase.js', () => {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const eq       = vi.fn(() => ({ maybeSingle }));
  const select   = vi.fn(() => ({ eq }));
  const update   = vi.fn().mockResolvedValue({ error: null });
  const insert   = vi.fn().mockResolvedValue({ error: null });
  const from     = vi.fn(() => ({ select, update, insert }));
  return { supabase: { from } };
});

vi.mock('../../components/home/LiveScorePupitre.jsx', () => ({
  default: () => <div>LiveScorePupitre</div>,
}));

import MatchPlanningCard from '../../components/planning/MatchPlanningCard.jsx';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const DEMO_CLUB = { id: 'club-1', name: 'FC SportLink Démo', primary_color: '#1d4ed8', logo_url: null };

// Date far in the future ensures cardState = 'pre_match' regardless of when tests run
function makeItem(overrides = {}) {
  return {
    id:           'ev-1',
    type:         'match',
    date:         '2030-01-15',
    time:         '19:45',
    title:        'FC SportLink Démo vs Lorient FC',
    location:     'Stade Francis-Le Blé',
    adversaire:   'Lorient FC',
    event_type:   'championship',
    category:     'Seniors',
    team_name:    'Équipe 1',
    home_or_away: 'home',
    level:        'Régional 2',
    score:        null,
    myStatus:     null,
    presentCount: 12,
    absentCount:  2,
    unsureCount:  1,
    convocs:      null,
    isStaffClub:  false,
    isPlayerClub: true,
    isSupporter:  false,
    onRespond:    vi.fn(),
    club_id:      'club-1',
    ...overrides,
  };
}

// ── Tests — rendu de base ──────────────────────────────────────────────────────

describe('MatchPlanningCard — rendu', () => {
  it('affiche le badge type "Championnat"', () => {
    render(<MatchPlanningCard item={makeItem()} club={DEMO_CLUB} userId="u-1" />);
    expect(screen.getByText('Championnat')).toBeInTheDocument();
  });

  it('affiche l\'adversaire', () => {
    render(<MatchPlanningCard item={makeItem()} club={DEMO_CLUB} userId="u-1" />);
    expect(screen.getByText(/Lorient FC/)).toBeInTheDocument();
  });

  it('affiche le lieu', () => {
    render(<MatchPlanningCard item={makeItem()} club={DEMO_CLUB} userId="u-1" />);
    expect(screen.getByText(/Stade Francis-Le Blé/)).toBeInTheDocument();
  });

  it('affiche le niveau', () => {
    render(<MatchPlanningCard item={makeItem()} club={DEMO_CLUB} userId="u-1" />);
    expect(screen.getByText('Régional 2')).toBeInTheDocument();
  });

  it('affiche le score si défini', () => {
    render(<MatchPlanningCard item={makeItem({ score: { home: 2, away: 1 } })} club={DEMO_CLUB} userId="u-1" />);
    expect(screen.getByText('2 – 1')).toBeInTheDocument();
  });

  it('badge COUPE pour event_type=cup', () => {
    render(<MatchPlanningCard item={makeItem({ event_type: 'cup' })} club={DEMO_CLUB} userId="u-1" />);
    expect(screen.getByText('Coupe')).toBeInTheDocument();
  });

  it('badge AMICAL pour event_type=friendly', () => {
    render(<MatchPlanningCard item={makeItem({ event_type: 'friendly' })} club={DEMO_CLUB} userId="u-1" />);
    expect(screen.getByText('Amical')).toBeInTheDocument();
  });
});

// ── Tests — joueur ────────────────────────────────────────────────────────────

describe('MatchPlanningCard — joueur', () => {
  it('affiche les boutons de présence', () => {
    render(<MatchPlanningCard item={makeItem({ isPlayerClub: true })} club={DEMO_CLUB} userId="u-1" />);
    // Scope to "Ma présence" section to avoid ambiguity with the presence summary labels
    const section = screen.getByText('Ma présence').parentElement;
    expect(within(section).getByText('Présent')).toBeInTheDocument();
    expect(within(section).getByText('Absent')).toBeInTheDocument();
    expect(within(section).getByText('Incertain')).toBeInTheDocument();
  });

  it('clic Présent appelle onRespond', () => {
    const onRespond = vi.fn();
    render(<MatchPlanningCard item={makeItem({ isPlayerClub: true, onRespond })} club={DEMO_CLUB} userId="u-1" />);
    const section = screen.getByText('Ma présence').parentElement;
    fireEvent.click(within(section).getByText('Présent'));
    expect(onRespond).toHaveBeenCalledWith('match', 'ev-1', 'present');
  });
});

// ── Tests — staff ─────────────────────────────────────────────────────────────

describe('MatchPlanningCard — staff', () => {
  // Staff items have no player link — isPlayerClub: false
  const staffItem = () => makeItem({ isPlayerClub: false });

  it('affiche le badge "Coach"', () => {
    render(<MatchPlanningCard item={staffItem()} club={DEMO_CLUB} userId="u-1" isStaff isCoach />);
    expect(screen.getByText('Coach')).toBeInTheDocument();
  });

  it('affiche le bouton "Convoquer l\'équipe" si pas de score', () => {
    render(<MatchPlanningCard item={staffItem()} club={DEMO_CLUB} userId="u-1" isStaff isCoach />);
    expect(screen.getByText(/Convoquer l'équipe/i)).toBeInTheDocument();
  });

  it('affiche le bouton "Créer l\'affiche" si pas de score', () => {
    render(<MatchPlanningCard item={staffItem()} club={DEMO_CLUB} userId="u-1" isStaff isCoach isCommunicant />);
    expect(screen.getByText(/Créer l'affiche/i)).toBeInTheDocument();
  });

  it('masque Convoquer si score défini (post-match)', () => {
    render(<MatchPlanningCard item={makeItem({ isPlayerClub: false, score: { home: 2, away: 1 } })} club={DEMO_CLUB} userId="u-1" isStaff isCoach />);
    expect(screen.queryByText(/Convoquer l'équipe/i)).not.toBeInTheDocument();
  });

  it('affiche "Générer l\'affiche résultat" après le match', () => {
    render(<MatchPlanningCard item={makeItem({ isPlayerClub: false, score: { home: 2, away: 1 } })} club={DEMO_CLUB} userId="u-1" isStaff isCoach />);
    expect(screen.getByText(/Générer l'affiche résultat/i)).toBeInTheDocument();
  });

  it('clic Convoquer appelle onConvocate', () => {
    const onConvocate = vi.fn();
    const item = staffItem();
    render(<MatchPlanningCard item={item} club={DEMO_CLUB} userId="u-1" isStaff isCoach onConvocate={onConvocate} />);
    fireEvent.click(screen.getByText(/Convoquer l'équipe/i));
    expect(onConvocate).toHaveBeenCalledWith(item);
  });

  it('clic Créer affiche appelle onOpenPoster', () => {
    const onOpenPoster = vi.fn();
    render(<MatchPlanningCard item={staffItem()} club={DEMO_CLUB} userId="u-1" isStaff isCoach isCommunicant onOpenPoster={onOpenPoster} />);
    fireEvent.click(screen.getByText(/Créer l'affiche/i));
    expect(onOpenPoster).toHaveBeenCalled();
  });

  it('n\'affiche pas les boutons de présence pour staff pur', () => {
    render(<MatchPlanningCard item={staffItem()} club={DEMO_CLUB} userId="u-1" isStaff isCoach />);
    // "Ma présence" section only renders when item.isPlayerClub = true
    expect(screen.queryByText('Ma présence')).not.toBeInTheDocument();
  });
});

// ── Tests — supporter ─────────────────────────────────────────────────────────

describe('MatchPlanningCard — supporter', () => {
  it('n\'affiche pas les boutons de présence', () => {
    render(<MatchPlanningCard item={makeItem({ isSupporter: true, isPlayerClub: false })} club={DEMO_CLUB} userId="u-1" />);
    expect(screen.queryByText('Ma présence')).not.toBeInTheDocument();
  });

  it('affiche "Voir le groupe" si convocs acceptées existent', () => {
    const item = makeItem({ isSupporter: true, isPlayerClub: false, convocs: { accepted: 18, pending: 2, total: 20 } });
    render(<MatchPlanningCard item={item} club={DEMO_CLUB} userId="u-1" />);
    expect(screen.getByText(/18 joueur/i)).toBeInTheDocument();
  });

  it('n\'affiche pas "Voir le groupe" si convocs.accepted=0', () => {
    const item = makeItem({ isSupporter: true, isPlayerClub: false, convocs: { accepted: 0, pending: 0, total: 0 } });
    render(<MatchPlanningCard item={item} club={DEMO_CLUB} userId="u-1" />);
    expect(screen.queryByText(/joueur convoqué/i)).not.toBeInTheDocument();
  });
});
