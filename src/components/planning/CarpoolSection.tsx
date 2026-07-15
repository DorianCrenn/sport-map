import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRides } from '../../hooks/useRides.js';
import { isEventPast } from '../../lib/eventTime.js';
import { useMyClubMemberships } from '../../hooks/useMyClubMemberships.js';
import CreateRideModal from '../rides/CreateRideModal.jsx';

interface CarpoolEvent {
  id:        string | number;
  date?:     string | null;
  title?:    string | null;
  location?: string | null;
}

interface CarpoolSectionProps {
  eventId:      string | number;
  myStatus?:    string | null;
  isStaff?:     boolean;
  onOpenRides?: () => void;
  event?:       CarpoolEvent;
}

export default function CarpoolSection({ eventId, myStatus, isStaff, onOpenRides, event }: CarpoolSectionProps) {
  // Covoiturage réservé à la communauté du club de l'événement (joueur/famille/
  // staff), et masqué dès que l'événement est terminé ou passé. Aligné sur la
  // carte (RideSection). `isStaff`/`myStatus` restent acceptés mais ne
  // conditionnent plus la visibilité.
  const memberClubIds = useMyClubMemberships();
  const past   = isEventPast(event as any);
  const clubId = (event as any)?.clubId ?? (event as any)?.club_id;
  const isMember = clubId != null && memberClubIds.has(String(clubId));
  const active = (isMember || isStaff) && !past;
  const { rides, loading, createRide } = useRides(active ? String(eventId) : null) as any;
  const [showCreate, setShowCreate] = useState(false);

  if (!active) return null;

  const activeRides  = (rides as any[]).filter((r: any) => r.status !== 'cancelled');
  const totalSeats   = activeRides.reduce((s: number, r: any) => s + r.availableSeatsLeft, 0);
  const hasRides     = activeRides.length > 0;

  const modalEvent = {
    id:    event?.id ?? eventId,
    date:  event?.date  ?? new Date().toISOString(),
    title: event?.title ?? '',
    venue: event?.location ?? '',
    city:  '',
  };

  async function handleSave(data: any) {
    await createRide(data);
    setShowCreate(false);
  }

  return (
    <>
      <motion.div
        data-demo="carpool-card"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-3 pt-3 border-t border-[var(--sl-border)]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">🚗</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--sl-t2)]">Covoiturage</p>
              {loading ? (
                <p className="text-[10px] text-[var(--sl-t3)]">Chargement…</p>
              ) : hasRides ? (
                <p className="text-[10px] text-[var(--sl-t3)]">
                  {activeRides.length} trajet{activeRides.length > 1 ? 's' : ''} · {totalSeats} place{totalSeats > 1 ? 's' : ''} libre{totalSeats > 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-[10px] text-[var(--sl-t3)]">Aucun trajet pour l'instant</p>
              )}
            </div>
          </div>

          <div className="flex gap-1.5 shrink-0">
            {hasRides && (
              <button
                onClick={onOpenRides}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--sl-surface)] text-[var(--sl-t2)] hover:bg-[var(--sl-hover)] transition-colors"
              >
                Rejoindre / Gérer
              </button>
            )}
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--sl-surface)] text-[var(--sl-t2)] hover:bg-[var(--sl-hover)] transition-colors"
            >
              {hasRides ? '+ Proposer' : 'Proposer un trajet'}
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showCreate && (
          <CreateRideModal
            event={modalEvent as any}
            onSave={handleSave}
            onClose={() => setShowCreate(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
