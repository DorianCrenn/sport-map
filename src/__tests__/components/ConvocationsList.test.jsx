import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import ConvocationsList from '../../components/convocations/ConvocationsList.jsx';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeConv(overrides = {}) {
  return {
    id: 'c-1',
    status: 'pending',
    responded_by: null,
    note: null,
    event: {
      id: 'evt-1', homeTeam: 'FC Brest', awayTeam: 'Quimper FC',
      date: '2026-07-10T18:00:00Z', city: 'Brest',
    },
    player: { id: 'p-1', name: 'Jean Dupont' },
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ConvocationsList — liste vide', () => {
  it('retourne null si aucune convocation à afficher', () => {
    const { container } = render(
      <ConvocationsList convocations={[]} onRespond={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('retourne null si toutes les convocations sont répondues et showAll=false', () => {
    const { container } = render(
      <ConvocationsList
        convocations={[makeConv({ status: 'accepted' })]}
        onRespond={vi.fn()}
        showAll={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('ConvocationsList — convocation pending', () => {
  it('affiche le titre "Convocations"', () => {
    render(<ConvocationsList convocations={[makeConv()]} onRespond={vi.fn()} />);
    expect(screen.getByText(/convocations/i)).toBeInTheDocument();
  });

  it('affiche le badge "en attente"', () => {
    render(<ConvocationsList convocations={[makeConv()]} onRespond={vi.fn()} />);
    expect(screen.getByText(/1 en attente/i)).toBeInTheDocument();
  });

  it('affiche les boutons Accepter / Décliner / Indisponible', () => {
    render(<ConvocationsList convocations={[makeConv()]} onRespond={vi.fn()} />);
    expect(screen.getByRole('button', { name: /accepter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /décliner/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /indisponible/i })).toBeInTheDocument();
  });

  it('ouvre le sélecteur transport au clic Accepter (puis appelle onRespond après choix)', () => {
    // Cliquer "Accepter" affiche le sélecteur transport — onRespond est appelé APRÈS
    // confirmation du mode de transport (voir TransportSelector).
    const onRespond = vi.fn();
    render(<ConvocationsList convocations={[makeConv({ id: 'c-42' })]} onRespond={onRespond} />);
    fireEvent.click(screen.getByRole('button', { name: /accepter/i }));
    // Le sélecteur transport doit apparaître
    expect(screen.getByText(/Je conduis/i)).toBeInTheDocument();
    // onRespond n'est PAS encore appelé à ce stade
    expect(onRespond).not.toHaveBeenCalled();
  });

  it('appelle onRespond avec "declined" au clic Décliner', () => {
    const onRespond = vi.fn();
    render(<ConvocationsList convocations={[makeConv({ id: 'c-99' })]} onRespond={onRespond} />);
    fireEvent.click(screen.getByRole('button', { name: /décliner/i }));
    expect(onRespond).toHaveBeenCalledWith('c-99', 'declined');
  });

  it('affiche le nom de l\'événement (homeTeam vs awayTeam)', () => {
    render(<ConvocationsList convocations={[makeConv()]} onRespond={vi.fn()} />);
    expect(screen.getByText(/FC Brest vs Quimper FC/)).toBeInTheDocument();
  });

  it('affiche le nom du joueur convoqué', () => {
    render(<ConvocationsList convocations={[makeConv()]} onRespond={vi.fn()} />);
    expect(screen.getByText(/Jean Dupont/i)).toBeInTheDocument();
  });
});

describe('ConvocationsList — statuts', () => {
  it('affiche le badge "Accepté" pour une convocation acceptée', () => {
    render(
      <ConvocationsList
        convocations={[makeConv({ status: 'accepted' })]}
        onRespond={vi.fn()}
        showAll
      />
    );
    expect(screen.getByText('Accepté')).toBeInTheDocument();
  });

  it('n\'affiche pas les boutons de réponse pour une convocation acceptée', () => {
    render(
      <ConvocationsList
        convocations={[makeConv({ status: 'accepted' })]}
        onRespond={vi.fn()}
        showAll
      />
    );
    expect(screen.queryByRole('button', { name: /accepter/i })).not.toBeInTheDocument();
  });

  it('affiche badge "Décliné" pour status declined', () => {
    render(
      <ConvocationsList
        convocations={[makeConv({ status: 'declined' })]}
        onRespond={vi.fn()}
        showAll
      />
    );
    expect(screen.getByText('Décliné')).toBeInTheDocument();
  });
});

describe('ConvocationsList — showAll=true', () => {
  it('affiche les convocations répondues avec showAll=true', () => {
    const convs = [
      makeConv({ id: 'c-1', status: 'accepted' }),
      makeConv({ id: 'c-2', status: 'declined', player: { id: 'p-2', name: 'Marie Martin' } }),
    ];
    render(<ConvocationsList convocations={convs} onRespond={vi.fn()} showAll />);
    expect(screen.getByText('Accepté')).toBeInTheDocument();
    expect(screen.getByText('Décliné')).toBeInTheDocument();
  });

  it('affiche le badge "X répondus" si showAll=false et des réponses existent', () => {
    render(
      <ConvocationsList
        convocations={[
          makeConv({ id: 'c-1', status: 'pending' }),
          makeConv({ id: 'c-2', status: 'accepted' }),
        ]}
        onRespond={vi.fn()}
        showAll={false}
      />
    );
    expect(screen.getByText(/1 répondu/i)).toBeInTheDocument();
  });
});

describe('ConvocationsList — event sans homeTeam/awayTeam', () => {
  it('affiche le title si pas de homeTeam/awayTeam', () => {
    const conv = makeConv({
      event: { id: 'e-1', title: 'Tournoi de Brest', date: '2026-07-10T10:00:00Z' },
    });
    render(<ConvocationsList convocations={[conv]} onRespond={vi.fn()} />);
    expect(screen.getByText('Tournoi de Brest')).toBeInTheDocument();
  });
});
