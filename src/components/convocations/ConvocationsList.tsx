import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'En attente',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  accepted:    { label: 'Accepté',      color: 'var(--sl-success)', bg: 'var(--sl-success-dim)'   },
  declined:    { label: 'Décliné',      color: 'var(--sl-error)',   bg: 'var(--sl-error-dim)'     },
  unavailable: { label: 'Indisponible', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

interface TransportSelectorProps { onSelect: (mode: string, seats: number | null) => void; onBack: () => void; }

function TransportSelector({ onSelect, onBack }: TransportSelectorProps) {
  const [driverSeats, setDriverSeats] = useState(3);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function confirm() {
    if (!selected) return;
    setConfirmed(true);
    setTimeout(() => { onSelect(selected, selected === 'driving' ? driverSeats : null); }, 900);
  }

  if (confirmed) {
    return (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
        <div style={{ paddingTop: 10, borderTop: '1px solid var(--sl-border)', marginTop: 8, textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', margin: '8px 0' }}>✓ Transport enregistré</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div style={{ paddingTop: 10, borderTop: '1px solid var(--sl-border)', marginTop: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 8 }}>✅ Présent — Comment y venez-vous ?</p>
        <button onClick={() => setSelected('driving')} style={{ width: '100%', marginBottom: 6, padding: '10px 12px', borderRadius: 'var(--sl-radius-lg)', cursor: 'pointer', textAlign: 'left', border: `1.5px solid ${selected === 'driving' ? '#22c55e' : 'var(--sl-border)'}`, backgroundColor: selected === 'driving' ? 'rgba(34,197,94,0.07)' : 'transparent', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>🚗</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Je conduis</p>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--sl-t3)' }}>Un trajet sera créé automatiquement</p>
          </div>
          {selected === 'driving' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={e => { e.stopPropagation(); setDriverSeats(n); }} style={{ width: 36, height: 36, borderRadius: 'var(--sl-radius-lg)', cursor: 'pointer', border: `1.5px solid ${driverSeats === n ? '#22c55e' : 'var(--sl-border)'}`, backgroundColor: driverSeats === n ? 'rgba(34,197,94,0.15)' : 'transparent', color: driverSeats === n ? '#22c55e' : 'var(--sl-t2)', fontSize: 13, fontWeight: 800 }}>{n}</button>
              ))}
              <span style={{ fontSize: 10, color: 'var(--sl-t3)', marginLeft: 2 }}>places</span>
            </div>
          )}
        </button>
        <button onClick={() => setSelected('passenger')} style={{ width: '100%', marginBottom: 6, padding: '10px 12px', borderRadius: 'var(--sl-radius-lg)', cursor: 'pointer', textAlign: 'left', border: `1.5px solid ${selected === 'passenger' ? '#6366f1' : 'var(--sl-border)'}`, backgroundColor: selected === 'passenger' ? 'rgba(99,102,241,0.07)' : 'transparent', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>🙋</span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Je cherche une place</p>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--sl-t3)' }}>Le coach verra que vous avez besoin d'un trajet</p>
          </div>
        </button>
        <button onClick={() => setSelected('own_means')} style={{ width: '100%', marginBottom: 10, padding: '10px 12px', borderRadius: 'var(--sl-radius-lg)', cursor: 'pointer', textAlign: 'left', border: `1.5px solid ${selected === 'own_means' ? '#94a3b8' : 'var(--sl-border)'}`, backgroundColor: selected === 'own_means' ? 'rgba(148,163,184,0.07)' : 'transparent', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>🏡</span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Par mes propres moyens</p>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--sl-t3)' }}>Vous venez directement sur place</p>
          </div>
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onBack} style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--sl-radius-md)', cursor: 'pointer', border: '1.5px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t3)', fontSize: 12, fontWeight: 600 }}>Retour</button>
          <button onClick={confirm} disabled={!selected} style={{ flex: 2, padding: '9px 0', borderRadius: 'var(--sl-radius-md)', cursor: 'pointer', border: 'none', backgroundColor: selected ? '#22c55e' : 'var(--sl-card-hi)', color: selected ? '#000' : 'var(--sl-t3)', fontSize: 13, fontWeight: 700, transition: 'all 0.15s' }}>Confirmer</button>
        </div>
      </div>
    </motion.div>
  );
}

interface Convocation {
  id: string | number;
  status: string;
  event?: Record<string, any> | null;
  player?: Record<string, any> | null;
  responded_by?: any;
  transport_mode?: string | null;
  driver_seats?: number | null;
  note?: string | null;
}

interface ConvocationCardProps { conv: Convocation; onRespond: (id: string | number, status: string, note?: any, mode?: string, seats?: number | null) => void; }

function ConvocationCard({ conv, onRespond }: ConvocationCardProps) {
  const [awaitingTransport, setAwaitingTransport] = useState(false);
  const event = conv.event;
  const player = conv.player;
  const statusCfg = STATUS_CFG[conv.status] ?? STATUS_CFG.pending;

  const dateLabel = event?.date
    ? new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(event.date))
    : '—';
  const timeLabel = event?.date?.length > 10
    ? new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const matchLabel = event
    ? (event.team_name && event.adversaire
        ? `${event.team_name} vs ${event.adversaire}`
        : event.adversaire
          ? `vs ${event.adversaire}`
          : event.homeTeam && event.awayTeam
            ? `${event.homeTeam} vs ${event.awayTeam}`
            : event.title ?? 'Match')
    : 'Événement';

  function handleTransportSelect(mode: string, seats: number | null) {
    setAwaitingTransport(false);
    onRespond(conv.id, 'accepted', null, mode, seats);
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ borderRadius: 'var(--sl-radius-2xl)', border: `1.5px solid ${statusCfg.color}40`, backgroundColor: 'var(--sl-card)', overflow: 'hidden' }}>
      <div style={{ height: 3, backgroundColor: statusCfg.color }} />
      <div style={{ padding: '11px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366f1' }}>📋 Convocation{player ? ` — ${player.name}` : ''}</span>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--sl-radius-4xl)', backgroundColor: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--sl-t1)', margin: '0 0 3px' }}>{matchLabel}</p>
        <p style={{ fontSize: 11, color: 'var(--sl-t2)', margin: '0 0 10px', display: 'flex', gap: 4 }}>
          <span>{dateLabel}</span>
          {timeLabel && <><span>·</span><span>{timeLabel}</span></>}
          {event?.city && <><span>·</span><span>{event.city}</span></>}
        </p>
        {conv.status === 'pending' && !awaitingTransport && (
          <div data-demo="convocation-respond" style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => setAwaitingTransport(true)} style={{ flex: 1, padding: '10px 6px', minHeight: 44, borderRadius: 'var(--sl-radius-md)', cursor: 'pointer', border: '1.5px solid var(--sl-border)', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, transition: 'all 0.15s' }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)' }}>Accepter</span>
            </button>
            {[
              { status: 'declined', emoji: '❌', label: 'Décliner' },
              { status: 'unavailable', emoji: '🤔', label: 'Indisponible' },
            ].map(btn => (
              <button key={btn.status} onClick={() => onRespond(conv.id, btn.status)} style={{ flex: 1, padding: '10px 6px', minHeight: 44, borderRadius: 'var(--sl-radius-md)', cursor: 'pointer', border: '1.5px solid var(--sl-border)', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, transition: 'all 0.15s' }}>
                <span style={{ fontSize: 16 }}>{btn.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)' }}>{btn.label}</span>
              </button>
            ))}
          </div>
        )}
        <AnimatePresence>
          {awaitingTransport && <TransportSelector onSelect={handleTransportSelect} onBack={() => setAwaitingTransport(false)} />}
        </AnimatePresence>
        {conv.status !== 'pending' && conv.responded_by && (
          <p style={{ fontSize: 10, color: 'var(--sl-t3)', margin: 0 }}>
            Répondu
            {conv.transport_mode === 'driving' && ` · 🚗 Je conduis (${conv.driver_seats ?? '?'} places)`}
            {conv.transport_mode === 'passenger' && ' · 🙋 Je cherche une place'}
            {conv.transport_mode === 'own_means' && ' · 🏡 Par mes propres moyens'}
            {conv.note ? ` · "${conv.note}"` : ''}
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface ConvocationsListProps { convocations: Convocation[]; onRespond: (id: string | number, status: string, note?: any, mode?: string, seats?: number | null) => void; showAll?: boolean; }

export default function ConvocationsList({ convocations, onRespond, showAll = false }: ConvocationsListProps) {
  const pending = convocations.filter(c => c.status === 'pending');
  const responded = convocations.filter(c => c.status !== 'pending');
  const displayed = showAll ? convocations : pending;

  if (!displayed.length) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sl-t3)' }}>Convocations</span>
          {pending.length > 0 && <span style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.12)', padding: '2px 6px', borderRadius: 'var(--sl-radius-4xl)' }}>{pending.length} en attente</span>}
        </div>
        {!showAll && responded.length > 0 && <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{responded.length} répondu{responded.length > 1 ? 's' : ''}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence mode="popLayout">
          {displayed.map(conv => <ConvocationCard key={conv.id} conv={conv} onRespond={onRespond} />)}
        </AnimatePresence>
      </div>
    </div>
  );
}
