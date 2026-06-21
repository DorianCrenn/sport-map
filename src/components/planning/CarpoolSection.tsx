import { motion } from 'framer-motion';
import { useRides } from '../../hooks/useRides.js';

interface CarpoolSectionProps {
  eventId: string | number;
  myStatus?: string | null;
  onOpenRides?: () => void;
}

export default function CarpoolSection({ eventId, myStatus, onOpenRides }: CarpoolSectionProps) {
  const { rides, loading } = useRides(myStatus === 'present' ? String(eventId) : null) as any;

  if (myStatus !== 'present') return null;

  const activeRides = (rides as any[]).filter((r: any) => r.status !== 'cancelled');
  const totalSeats  = activeRides.reduce((s: number, r: any) => s + r.availableSeatsLeft, 0);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 pt-3 border-t border-[var(--sl-border)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🚗</span>
          <div>
            <p className="text-xs font-semibold text-[var(--sl-t2)]">Covoiturage</p>
            {loading ? (
              <p className="text-[10px] text-[var(--sl-t3)]">Chargement…</p>
            ) : activeRides.length > 0 ? (
              <p className="text-[10px] text-[var(--sl-t3)]">
                {activeRides.length} trajet{activeRides.length > 1 ? 's' : ''} · {totalSeats} place{totalSeats > 1 ? 's' : ''} libre{totalSeats > 1 ? 's' : ''}
              </p>
            ) : (
              <p className="text-[10px] text-[var(--sl-t3)]">Aucun trajet pour l'instant</p>
            )}
          </div>
        </div>
        <button
          onClick={onOpenRides}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--sl-surface)] text-[var(--sl-t2)] hover:bg-[var(--sl-hover)] transition-colors"
        >
          {activeRides.length > 0 ? 'Rejoindre / Gérer' : 'Proposer un trajet'}
        </button>
      </div>
    </motion.div>
  );
}
