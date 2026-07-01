import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase.js';
import { useFeedRides } from '../../hooks/useFeedRides.js';
import RideSection from '../rides/RideSection.jsx';

const SPORT_EMOJI: Record<string, string> = {
  Football: '⚽', Basketball: '🏀', Rugby: '🏉', Handball: '🤾',
  Tennis: '🎾', Volleyball: '🏐', Hockey: '🏑', Natation: '🏊',
};

function fmtDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
  const diff = Math.floor((d.getTime() - Date.now()) / 86_400_000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

interface SelectedEvent {
  id:       string;
  clubId:   string;
  title:    string;
  sport:    string;
  adversaire: string;
  date:     string;
}

interface FeedRidesProps {
  clubIds:            string[];
  teamFilters?:       string[];
  isCoachOrManager:   boolean;
  isClubAdmin:        boolean;
  isAdmin:            boolean;
  isCommunicant:      boolean;
  isPlayerOrGuardian: boolean;
}

export default function FeedRides({
  clubIds,
  teamFilters = [],
  isCoachOrManager,
  isClubAdmin,
  isAdmin,
  isCommunicant,
  isPlayerOrGuardian,
}: FeedRidesProps) {
  const { items, loading } = useFeedRides(clubIds, teamFilters);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [relancingId,   setRelancingId]   = useState<string | null>(null);
  const [relancedIds,   setRelancedIds]   = useState<Set<string>>(new Set());

  // Peut rejoindre/proposer : joueur, parent, coach
  const canJoin     = isCoachOrManager || isPlayerOrGuardian;
  // Peut relancer l'équipe : staff (admin, communicant) et coach
  const canRelancer = (isClubAdmin || isAdmin || isCommunicant) || isCoachOrManager;
  // Badge "Vue staff" : staff pur sans rôle joueur/coach
  const isStaffOnly = (isClubAdmin || isAdmin || isCommunicant) && !isCoachOrManager && !isPlayerOrGuardian;

  async function handleRelancer(eventId: string, clubId: string, adversaire: string) {
    if (relancingId) return;
    setRelancingId(eventId);
    try {
      await supabase.functions.invoke('notify-team-players', {
        body: {
          clubId,
          eventId,
          target: 'event',
          title: '🚗 Covoiturage disponible',
          body: `Des places de covoiturage sont disponibles pour le match contre ${adversaire} !`,
        },
      });
      setRelancedIds(prev => new Set([...prev, eventId]));
      window.dispatchEvent(new CustomEvent('sl-toast', {
        detail: { message: 'Rappel covoiturage envoyé 🚗', type: 'success' },
      }));
    } catch {
      window.dispatchEvent(new CustomEvent('sl-toast', {
        detail: { message: 'Erreur lors de l\'envoi', type: 'error' },
      }));
    } finally {
      setRelancingId(null);
    }
  }

  if (loading || !items.length) return null;

  return (
    <>
      <div style={{ padding: '10px 16px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }}>🚗</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)' }}>Covoiturages</span>
          {isStaffOnly && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8,
              backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6',
            }}>
              Vue staff
            </span>
          )}
        </div>

        {/* Match cards — vertical list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((match, i) => {
            const emoji       = SPORT_EMOJI[match.sport] ?? '🏆';
            const hasRides    = match.totalRides > 0;
            const hasSeats    = match.availableSeats > 0;
            const isRelanced  = relancedIds.has(match.eventId);
            const isSending   = relancingId === match.eventId;

            return (
              <motion.div
                key={match.eventId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 14,
                  backgroundColor: 'var(--sl-card)',
                  border: `1px solid ${hasSeats ? 'rgba(34,217,106,0.2)' : 'var(--sl-border)'}`,
                }}
              >
                {/* Sport emoji */}
                <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>

                {/* Match info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {match.clubName} <span style={{ color: 'var(--sl-t3)', fontWeight: 400 }}>vs</span> {match.adversaire}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{fmtDate(match.date)}</span>
                    {match.teamName && (
                      <>
                        <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>·</span>
                        <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{match.teamName}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Rides badge */}
                <div style={{ flexShrink: 0, textAlign: 'center', marginRight: 4 }}>
                  {hasRides ? (
                    <div>
                      <div style={{
                        fontSize: 14, fontWeight: 900,
                        color: hasSeats ? '#22d96a' : '#ef4444',
                        fontFamily: "'Barlow Condensed', sans-serif",
                      }}>
                        {hasSeats ? match.availableSeats : '✕'}
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase' }}>
                        {hasSeats ? 'places' : 'complet'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 600 }}>
                      Aucun<br />trajet
                    </div>
                  )}
                </div>

                {/* CTA — selon rôle : Rejoindre (joueur/parent/coach) + Relancer (staff/coach) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>

                  {/* Rejoindre / Proposer — joueur, parent, coach */}
                  {canJoin && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedEvent({
                        id:         match.eventId,
                        clubId:     match.clubId,
                        title:      `${match.clubName} vs ${match.adversaire}`,
                        sport:      match.sport,
                        adversaire: match.adversaire,
                        date:       match.date,
                      })}
                      style={{
                        padding: '7px 12px', borderRadius: 10, border: 'none',
                        cursor: 'pointer', fontSize: 11, fontWeight: 700,
                        backgroundColor: hasSeats ? '#22d96a' : 'rgba(34,217,106,0.12)',
                        color: hasSeats ? '#fff' : '#22d96a',
                        minWidth: 76, textAlign: 'center',
                      }}
                    >
                      {hasRides ? 'Rejoindre' : 'Proposer'}
                    </motion.button>
                  )}

                  {/* Relancer — staff et coach */}
                  {canRelancer && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => !isRelanced && handleRelancer(match.eventId, match.clubId, match.adversaire)}
                      disabled={isSending || isRelanced}
                      style={{
                        padding: canJoin ? '5px 12px' : '7px 12px',
                        borderRadius: 10, border: 'none',
                        cursor: isSending || isRelanced ? 'default' : 'pointer',
                        fontSize: canJoin ? 10 : 11, fontWeight: 700,
                        backgroundColor: isRelanced
                          ? 'rgba(34,217,106,0.12)'
                          : 'rgba(59,130,246,0.12)',
                        color: isRelanced ? '#22d96a' : '#3b82f6',
                        transition: 'all 0.2s',
                        minWidth: 76, textAlign: 'center',
                      }}
                    >
                      {isSending ? '…' : isRelanced ? '✓ Envoyé' : 'Relancer'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom-sheet : RideSection pour le match sélectionné */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedEvent(null); }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1200,
              backgroundColor: 'rgba(0,0,0,0.55)',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 36 }}
              style={{
                backgroundColor: 'var(--sl-card)',
                borderRadius: '20px 20px 0 0',
                maxHeight: '85vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Sheet header */}
              <div style={{
                flexShrink: 0, padding: '14px 16px 12px',
                borderBottom: '1px solid var(--sl-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)' }}>
                    🚗 Covoiturages
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>
                    {selectedEvent.title} · {fmtDate(selectedEvent.date)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  aria-label="Fermer"
                  style={{
                    width: 36, height: 36, borderRadius: 10, border: 'none',
                    cursor: 'pointer', backgroundColor: 'var(--sl-surface)',
                    color: 'var(--sl-t2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* RideSection inside sheet */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 0' }}>
                <RideSection
                  event={{ id: selectedEvent.id, clubId: selectedEvent.clubId }}
                  snapPoint="full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
