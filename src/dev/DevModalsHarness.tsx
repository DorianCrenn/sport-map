import { useState, type ReactNode } from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import FeedbackModal from '../components/FeedbackModal.jsx';
import FollowModal from '../components/FollowModal.jsx';
import CreateRideModal from '../components/rides/CreateRideModal.jsx';
import JoinRideModal from '../components/rides/JoinRideModal.jsx';
import QuickAddTeamModal from '../components/club/QuickAddTeamModal.jsx';
import ClubFormModal from '../components/club/ClubFormModal.jsx';
import SendAnnouncementModal from '../components/club/SendAnnouncementModal.jsx';
import PushBroadcastModal from '../components/club/PushBroadcastModal.jsx';
import ConvocReplyPanel from '../components/ConvocReplyPanel.jsx';

// ── Harnais DEV pour tester visuellement les modales en isolation (overflow,
// safe-area, viewport court). Accès : #dev-modals (menu) ou #dev-modals=Nom.
// N'est monté qu'en DEV (voir App).

const noop = () => {};
const asyncNoop = async () => {};

const mockClub = {
  id: 'club-1', name: 'FC SportLink Démonstration Test', sport: 'Football',
  city: 'Brest', logo_url: null, userId: 'u-1',
  categories: [
    { id: 'cat_s', name: 'Seniors', teams: [{ id: 'Équipe 1', name: 'Équipe 1', level: 'R2' }, { id: 'Réserve', name: 'Réserve', level: 'D1' }] },
    { id: 'cat_j', name: 'Jeunes', teams: [{ id: 'U17', name: 'U17' }, { id: 'U15', name: 'U15' }, { id: 'U13', name: 'U13' }, { id: 'U11', name: 'U11' }] },
    { id: 'cat_f', name: 'Féminines', teams: [{ id: 'Équipe F', name: 'Équipe F' }, { id: 'U15 F', name: 'U15 F' }] },
  ],
};
const mockEvent = { id: 'evt-1', date: '2026-08-15', time: '15:00', sport: 'Football', title: 'FC Démo vs AS Plougastel', clubId: 'club-1', venue: 'Stade de la Liberté, Brest', adversaire: 'AS Plougastel' };
const mockRide = { id: 'ride-1', departureLocation: 'Place de la Liberté, Brest', driverName: 'Alexandre Martin', availableSeatsLeft: 3 } as any;

const MODALS: Record<string, (close: () => void) => ReactNode> = {
  ConfirmDialog:        (c) => <ConfirmDialog open title="Supprimer cet événement ?" message={'Cette action est irréversible. '.repeat(12)} confirmLabel="Supprimer" onConfirm={c} onCancel={c} />,
  FeedbackModal:        (c) => <FeedbackModal onClose={c} />,
  FollowModal:          (c) => <FollowModal club={mockClub as any} onSave={noop} onClose={c} />,
  CreateRideModal:      (c) => <CreateRideModal event={mockEvent as any} onSave={asyncNoop} onClose={c} />,
  JoinRideModal:        (c) => <JoinRideModal ride={mockRide} onSave={asyncNoop} onClose={c} />,
  QuickAddTeamModal:    (c) => <QuickAddTeamModal club={mockClub as any} onSave={asyncNoop} onClose={c} />,
  ClubFormModal:        (c) => <ClubFormModal club={mockClub as any} onSave={asyncNoop} onClose={c} />,
  SendAnnouncementModal:(c) => <SendAnnouncementModal club={mockClub as any} onSend={asyncNoop} onClose={c} />,
  PushBroadcastModal:   (c) => <PushBroadcastModal clubId="club-1" clubName="FC Démo" onClose={c} />,
  ConvocReplyPanel:     (c) => <ConvocReplyPanel token="dev-token" onClose={c} />,
};

export default function DevModalsHarness({ initial = null }: { initial?: string | null }) {
  const [active, setActive] = useState<string | null>(initial && MODALS[initial] ? initial : null);
  const close = () => setActive(null);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sl-bg)', padding: 16 }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 12 }}>Dev · Modales</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Object.keys(MODALS).map((name) => (
          <button key={name} data-modal={name} onClick={() => setActive(name)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--sl-border)', background: active === name ? 'var(--sl-green)' : 'var(--sl-card)', color: active === name ? '#fff' : 'var(--sl-t2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {name}
          </button>
        ))}
      </div>
      {active && MODALS[active]?.(close)}
    </div>
  );
}
