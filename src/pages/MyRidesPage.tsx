import { useState, useEffect } from 'react';
import { useAndroidBack } from '../hooks/useAndroidBack.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyRides } from '../hooks/useRides.js';
import { useRideNotifications } from '../hooks/useRideNotifications.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import RideCard from '../components/rides/RideCard.jsx';
import { timeAgo } from '../lib/dateUtils.js';
import EmptyState from '../components/ui/EmptyState.jsx';

const TABS = [
  { key: 'driving',   label: 'Mes trajets',   icon: '🚗' },
  { key: 'passenger', label: 'Mes demandes',  icon: '🙋' },
  { key: 'notifs',    label: 'Notifications', icon: '🔔' },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: '⏳ En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  accepted:  { label: '✅ Acceptée',   color: '#22d96a', bg: 'rgba(34,217,106,0.12)' },
  refused:   { label: '❌ Refusée',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  cancelled: { label: '↩ Annulée',    color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

interface MyRidesPageProps {
  onBack: () => void;
}

export default function MyRidesPage({ onBack }: MyRidesPageProps) {
  const { currentUser } = useAuth() as any;
  const { myDriving, myPassenger, loading, refetch } = useMyRides() as any;
  const { notifications, unreadCount, markAllRead, markRead } = useRideNotifications() as any;
  const [activeTab, setActiveTab] = useState('driving');
  const [processingIds, setProcessingIds] = useState(new Set<string>());

  useAndroidBack(true, onBack);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onBack]);

  function markProcessing(id: string) {
    setProcessingIds(prev => new Set([...prev, id]));
  }
  function unmarkProcessing(id: string) {
    setProcessingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  async function handleAccept(requestId: string, rideId: string, passengerId: string) {
    if (processingIds.has(requestId)) return;
    markProcessing(requestId);
    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      if (error) return;
      const ride = myDriving.find((r: any) => r.id === rideId);
      if (ride && ride.takenSeats + 1 >= ride.availableSeats) {
        await supabase.from('rides').update({ status: 'full' }).eq('id', rideId);
      }
      await supabase.from('ride_notifications').insert({
        user_id: passengerId, type: 'request_accepted', ride_id: rideId, request_id: requestId,
        data: { driverName: currentUser?.name, rideLocation: ride?.departureLocation },
      });
      refetch();
    } finally {
      unmarkProcessing(requestId);
    }
  }

  async function handleRefuse(requestId: string, rideId: string, passengerId: string) {
    if (processingIds.has(requestId)) return;
    markProcessing(requestId);
    try {
      await supabase.from('ride_requests').update({ status: 'refused' }).eq('id', requestId);
      const ride = myDriving.find((r: any) => r.id === rideId);
      await supabase.from('ride_notifications').insert({
        user_id: passengerId, type: 'request_refused', ride_id: rideId, request_id: requestId,
        data: { driverName: currentUser?.name, rideLocation: ride?.departureLocation },
      });
      refetch();
    } finally {
      unmarkProcessing(requestId);
    }
  }

  async function handleCancelRide(rideId: string) {
    const ride = myDriving.find((r: any) => r.id === rideId);
    await supabase.from('rides').update({ status: 'cancelled' }).eq('id', rideId);
    const accepted = ride?.requests.filter((r: any) => r.status === 'accepted') ?? [];
    if (accepted.length > 0) {
      await supabase.from('ride_notifications').insert(
        accepted.map((r: any) => ({
          user_id: r.passengerId, type: 'ride_cancelled', ride_id: rideId,
          data: { driverName: currentUser?.name, rideLocation: ride?.departureLocation },
        }))
      );
    }
    refetch();
  }

  async function handleCancelRequest(requestId: string) {
    await supabase.from('ride_requests').update({ status: 'cancelled' }).eq('id', requestId);
    refetch();
  }

  const activeDriving   = myDriving.filter((r: any) => r.status !== 'cancelled' && r.status !== 'completed');
  const pastDriving     = myDriving.filter((r: any) => r.status === 'cancelled' || r.status === 'completed');
  const activePassenger = myPassenger.filter((r: any) => r.status !== 'cancelled');
  const pastPassenger   = myPassenger.filter((r: any) => r.status === 'cancelled');

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Mes covoiturages"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)' }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0, backgroundColor: 'var(--sl-card)', borderBottom: '1px solid var(--sl-border)', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            aria-label="Retour"
            style={{ width: 44, height: 44, borderRadius: 11, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)', flexShrink: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>
              🚗 Mes covoiturages
            </h1>
            <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: '2px 0 0' }}>
              Trajets proposés et demandes envoyées
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const badge = tab.key === 'notifs' ? unreadCount : 0;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); if (tab.key === 'notifs' && unreadCount > 0) markAllRead(); }}
                style={{
                  flex: 1, padding: '9px 4px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${isActive ? 'var(--sl-green)' : 'var(--sl-border)'}`,
                  backgroundColor: isActive ? 'rgba(34,217,106,0.1)' : 'var(--sl-surface)',
                  color: isActive ? 'var(--sl-green)' : 'var(--sl-t2)',
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  position: 'relative', transition: 'all 0.15s',
                }}
              >
                {tab.icon} {tab.label}
                {badge > 0 && (
                  <span style={{
                    position: 'absolute', top: -5, right: -4,
                    minWidth: 16, height: 16, borderRadius: 999, padding: '0 4px',
                    backgroundColor: '#ef4444', color: '#fff',
                    fontSize: 9, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sl-t3)', fontSize: 13 }}>Chargement…</div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ── Mes trajets (driver) ── */}
            {activeTab === 'driving' && (
              <motion.div key="driving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {activeDriving.length === 0 && pastDriving.length === 0 ? (
                  <EmptyState emoji="🚗" title="Aucun trajet proposé" subtitle="Proposez un covoiturage depuis la fiche d'un événement." actionLabel="Voir les événements" onAction={onBack} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {activeDriving.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', padding: '0 2px' }}>
                          Actifs — {activeDriving.length}
                        </div>
                        {activeDriving.map((ride: any) => (
                          <RideCard
                            {...({onJoin: () => {}} as any)}
                            key={ride.id} ride={ride} currentUser={currentUser}
                            onAccept={(reqId: string, passId: string, passName: string) => handleAccept(reqId, ride.id, passId)}
                            onRefuse={(reqId: string, passId: string) => handleRefuse(reqId, ride.id, passId)}
                            onCancel={() => handleCancelRide(ride.id)}
                            onCancelRequest={(reqId: string) => handleCancelRequest(reqId)}
                          />
                        ))}
                      </>
                    )}
                    {pastDriving.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', padding: '0 2px', marginTop: 8 }}>
                          Historique — {pastDriving.length}
                        </div>
                        {pastDriving.map((ride: any) => (
                          <RideCard {...({} as any)} key={ride.id} ride={ride} currentUser={currentUser} compact />
                        ))}
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Mes demandes (passenger) ── */}
            {activeTab === 'passenger' && (
              <motion.div key="passenger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {myPassenger.length === 0 ? (
                  <EmptyState emoji="🙋" title="Aucune demande envoyée" subtitle="Trouvez un covoiturage depuis la fiche d'un événement." actionLabel="Voir les événements" onAction={onBack} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activePassenger.map((req: any) => {
                      const meta = STATUS_META[req.status];
                      return (
                        <div key={req.id} style={{
                          borderRadius: 16, padding: '14px',
                          backgroundColor: 'var(--sl-card)',
                          border: `1px solid ${req.status === 'accepted' ? 'rgba(34,217,106,0.25)' : 'var(--sl-border)'}`,
                        }}>
                          {/* Status badge */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                              backgroundColor: meta?.bg, color: meta?.color,
                            }}>
                              {meta?.label ?? req.status}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{timeAgo(req.createdAt)}</span>
                          </div>

                          {/* Ride info */}
                          {req.ride && (
                            <div style={{ marginBottom: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>
                                  {req.ride.departureLocation}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--sl-t2)', flexShrink: 0 }}>
                                  {(req.ride.driverName ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>
                                  Conducteur · <strong style={{ color: 'var(--sl-t2)' }}>{req.ride.driverName}</strong>
                                </span>
                                <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>·</span>
                                <span style={{ fontSize: 11, color: req.ride.availableSeatsLeft > 0 ? 'var(--sl-green)' : '#ef4444', fontWeight: 600 }}>
                                  {req.ride.availableSeatsLeft} place{req.ride.availableSeatsLeft !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          )}

                          {req.message && (
                            <p style={{ fontSize: 11, color: 'var(--sl-t2)', margin: '0 0 10px', lineHeight: 1.5, borderLeft: '2px solid var(--sl-border)', paddingLeft: 10, fontStyle: 'italic' }}>
                              "{req.message}"
                            </p>
                          )}

                          {(req.status === 'pending' || req.status === 'accepted') && (
                            <button
                              onClick={() => handleCancelRequest(req.id)}
                              style={{ width: '100%', padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, color: 'var(--sl-t3)', background: 'none', border: '1px solid var(--sl-border)', cursor: 'pointer', marginTop: 2 }}
                            >
                              Se désister
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {pastPassenger.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', padding: '4px 2px', marginTop: 4 }}>
                          Annulées — {pastPassenger.length}
                        </div>
                        {pastPassenger.map((req: any) => (
                          <div key={req.id} style={{ borderRadius: 14, padding: '12px', backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', opacity: 0.6 }}>
                            {req.ride && <div style={{ fontSize: 12, color: 'var(--sl-t2)' }}>📍 {req.ride.departureLocation} — {req.ride.driverName}</div>}
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginTop: 4, display: 'block' }}>Annulée</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Notifications ── */}
            {activeTab === 'notifs' && (
              <motion.div key="notifs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {notifications.length === 0 ? (
                  <EmptyState emoji="🔔" title="Aucune notification" subtitle="Vos notifications de covoiturage apparaîtront ici." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {notifications.map((notif: any) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.read && markRead(notif.id)}
                        style={{
                          borderRadius: 14, padding: '12px 14px',
                          backgroundColor: notif.read ? 'var(--sl-surface)' : 'var(--sl-card)',
                          border: `1px solid ${notif.read ? 'var(--sl-border)' : 'rgba(34,217,106,0.2)'}`,
                          cursor: notif.read ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{notif.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: notif.read ? 500 : 700, color: 'var(--sl-t1)', lineHeight: 1.4 }}>
                            {notif.label}
                          </div>
                          {notif.data.rideLocation && (
                            <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>
                              📍 {notif.data.rideLocation}
                            </div>
                          )}
                          {(notif.data.driverName || notif.data.passengerName) && (
                            <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>
                              {notif.data.driverName ? `Conducteur : ${notif.data.driverName}` : `Passager : ${notif.data.passengerName}`}
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 4 }}>{timeAgo(notif.createdAt)}</div>
                        </div>
                        {!notif.read && (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--sl-green)', flexShrink: 0, marginTop: 4 }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
