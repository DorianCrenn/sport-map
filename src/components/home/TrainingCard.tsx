import { motion } from 'framer-motion';

interface Training {
  time?: string | null;
  location?: string | null;
}

interface TrainingCardProps {
  training: Training;
  onOpenTrainings: () => void;
}

export default function TrainingCard({ training, onOpenTrainings }: TrainingCardProps) {
  const time     = training?.time     ?? '';
  const location = training?.location ?? '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      className="rounded-2xl border border-[var(--sl-border)] bg-[var(--sl-card)] overflow-hidden"
      data-demo="training-card"
    >
      <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />

      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black tracking-widest uppercase text-violet-400">
              Entraînement
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
              Ce soir
            </span>
          </div>
          <p className="text-[15px] font-bold text-[var(--sl-t1)] leading-snug">
            {time ? `${time}` : 'Séance programmée'}
            {location ? <span className="font-normal text-[var(--sl-t2)]"> · {location}</span> : null}
          </p>
        </div>
        <button
          onClick={onOpenTrainings}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 text-white text-[12px] font-bold active:scale-95 transition-transform"
        >
          <span>📋</span>
          Présences
        </button>
      </div>
    </motion.div>
  );
}
