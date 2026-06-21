import { useState } from 'react';
import { motion } from 'framer-motion';

const EQUIP_LABELS: Record<string, string> = {
  bike:    '🚲 Vélo',
  bags:    '🎒 Gros sacs',
  bulky:   '🏄 Matériel encombrant',
  pets:    '🐶 Animaux',
  no_gear: '❌ Sans matériel',
};

const DETOUR_LABELS: Record<string, string | null> = {
  none:     null,
  small:    '↩ Petit détour OK',
  flexible: '↩ Récupération flexible',
};

const STATUS_COLORS: Record<string, { text: string; bg: string; label: string }> = {
  pending:   { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: '⏳ En attente' },
  accepted:  { text: '#22d96a', bg: 'rgba(34,217,106,0.12)', label: '✅ Confirmée'  },
  refused:   { text: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: '❌ Refusée'    },
  cancelled: { text: '#64748b', bg: 'rgba(100,116,139,0.1)', label: '↩ Annulée'    },
};

interface RideRequest {
  id: string | number;
  passengerId: string | number;
  passengerName?: string | null;
  message?: string | null;
  status: string;
}

interface Ride {
  id: string | number;
  driverId: string | number;
  driverName?: string | null;
  departureLocation: string;
  availableSeatsLeft: number;
  status: string;
  requests?: RideRequest[];
  acceptedEquipment: string[];
  detourFlexibility: string;
  notes?: string | null;
}

interface RideCardProps {
  ride: Ride;
  currentUser: { id: string | number } | null | undefined;
  onJoin: () => void;
  onAccept: (reqId: string | number, passId: string | number, passName: string | null | undefined) => void;
  onRefuse: (reqId: string | number, passId: string | number) => void;
  onCancel: () => void;
  onCancelRequest: (reqId: string | number) => void;
  compact?: boolean;
}

export default function RideCard({ ride, currentUser, onJoin, onAccept, onRefuse, onCancel, onCancelRequest, compact = false }: RideCardProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const isDriver    = currentUser?.id === ride.driverId;
  const myRequest   = ride.requests?.find(r => r.passengerId === currentUser?.id);
  const isFull      = ride.status === 'full' || ride.availableSeatsLeft === 0;
  const isCancelled = ride.status === 'cancelled';
  const pending     = ride.requests?.filter(r => r.status === 'pending')  ?? [];
  const accepted    = ride.requests?.filter(r => r.status === 'accepted') ?? [];

  function avatar(name: string | null | undefined): string {
    return (name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  return (
    <div data-demo="carpool-card" style={{ borderRadius: 16, border: `1px solid ${isDriver ? 'rgba(34,217,106,0.3)' : 'var(--sl-border)'}`, backgroundColor: isDriver ? 'rgba(34,217,106,0.04)' : 'var(--sl-surface)', padding: 14, opacity: isCancelled ? 0.6 : 1 }}>
      {/* Driver row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, backgroundColor: isDriver ? 'rgba(34,217,106,0.18)' : 'var(--sl-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: isDriver ? 'var(--sl-green)' : 'var(--sl-t2)' }}>
          {avatar(ride.driverName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{ride.driverName || 'Conducteur'}</span>
            {isDriver && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, backgroundColor: 'rgba(34,217,106,0.15)', color: 'var(--sl-green)' }}>VOUS</span>}
            {isCancelled && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, backgroundColor: 'rgba(100,116,139,0.15)', color: '#64748b' }}>ANNULÉ</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {ride.departureLocation}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, flexShrink: 0, backgroundColor: isFull ? 'rgba(239,68,68,0.1)' : isCancelled ? 'var(--sl-surface)' : 'rgba(34,217,106,0.1)', color: isFull ? '#ef4444' : isCancelled ? 'var(--sl-t3)' : 'var(--sl-green)' }}>
          <span style={{ fontSize: 17, fontWeight: 800, lineHeight: 1 }}>{ride.availableSeatsLeft}</span>
          <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ride.availableSeatsLeft !== 1 ? 'places' : 'place'}</span>
        </div>
      </div>

      {/* Tags */}
      {!compact && (ride.acceptedEquipment.length > 0 || DETOUR_LABELS[ride.detourFlexibility]) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {ride.acceptedEquipment.map(e => <span key={e} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', color: 'var(--sl-t2)' }}>{EQUIP_LABELS[e] ?? e}</span>)}
          {DETOUR_LABELS[ride.detourFlexibility] && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6' }}>{DETOUR_LABELS[ride.detourFlexibility]}</span>}
        </div>
      )}

      {!compact && ride.notes && <p style={{ fontSize: 12, color: 'var(--sl-t2)', margin: '0 0 10px', lineHeight: 1.5, borderLeft: '2px solid var(--sl-border)', paddingLeft: 10 }}>{ride.notes}</p>}

      {/* Driver: pending requests */}
      {isDriver && pending.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 6 }}>{pending.length} demande{pending.length > 1 ? 's' : ''} en attente</div>
          {pending.map(req => (
            <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, backgroundColor: 'var(--sl-card)', marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--sl-t2)', flexShrink: 0 }}>{avatar(req.passengerName)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)' }}>{req.passengerName}</div>
                {req.message && <div style={{ fontSize: 11, color: 'var(--sl-t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.message}</div>}
              </div>
              <button onClick={() => onAccept(req.id, req.passengerId, req.passengerName)} style={{ width: 36, height: 36, borderRadius: 9, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-green)', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }} aria-label="Accepter">✓</button>
              <button onClick={() => onRefuse(req.id, req.passengerId)} style={{ width: 36, height: 36, borderRadius: 9, border: 'none', cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: 14, fontWeight: 700, flexShrink: 0 }} aria-label="Refuser">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Driver: confirmed passengers */}
      {isDriver && accepted.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 6 }}>{accepted.length} passager{accepted.length > 1 ? 's' : ''} confirmé{accepted.length > 1 ? 's' : ''}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {accepted.map(req => <span key={req.id} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, backgroundColor: 'rgba(34,217,106,0.1)', color: 'var(--sl-green)', fontWeight: 600 }}>✓ {req.passengerName}</span>)}
          </div>
        </div>
      )}

      {/* Passenger CTA */}
      {!isDriver && currentUser && !isCancelled && (
        <div style={{ marginTop: 4 }}>
          {!myRequest && !isFull && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={onJoin} style={{ width: '100%', padding: '11px 0', borderRadius: 12, cursor: 'pointer', border: 'none', backgroundColor: 'var(--sl-green)', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 2px 10px rgba(34,217,106,0.3)' }}>
              Rejoindre ce trajet
            </motion.button>
          )}
          {!myRequest && isFull && <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#ef4444', padding: '8px 0' }}>Trajet complet</div>}
          {myRequest && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLORS[myRequest.status]?.text }}>{STATUS_COLORS[myRequest.status]?.label ?? myRequest.status}</span>
              {(myRequest.status === 'pending' || myRequest.status === 'accepted') && (
                <button onClick={() => onCancelRequest(myRequest.id)} style={{ fontSize: 11, color: 'var(--sl-t3)', background: 'none', border: '1px solid var(--sl-border)', padding: '4px 10px', borderRadius: 8, cursor: 'pointer' }}>Se désister</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Driver: cancel */}
      {isDriver && !isCancelled && (
        <div style={{ marginTop: 8 }}>
          {!confirmCancel ? (
            <button onClick={() => setConfirmCancel(true)} style={{ width: '100%', padding: '9px 0', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t3)' }}>Annuler mon trajet</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmCancel(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t2)' }}>Garder</button>
              <button onClick={() => { onCancel(); setConfirmCancel(false); }} style={{ flex: 1, padding: '9px 0', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 700, border: 'none', backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Confirmer</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
