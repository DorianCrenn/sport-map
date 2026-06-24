import { motion, AnimatePresence } from 'framer-motion';
import { useStreak } from '../../hooks/useStreak.js';

interface StreakWidgetProps {
  compact?: boolean;
}

export default function StreakWidget({ compact = false }: StreakWidgetProps) {
  const { count, isNewToday } = useStreak();
  if (count < 2) return null;

  if (compact) {
    return (
      <div
        title={`${count} jours de suite !`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          padding: '2px 8px',
          borderRadius: 999,
          background: 'rgba(255,107,43,0.14)',
          border: '1px solid rgba(255,107,43,0.28)',
        }}
      >
        <span className="sl-streak-fire" style={{ fontSize: 12, lineHeight: 1 }}>🔥</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--sl-streak-color)', fontFamily: 'var(--sl-font-brand)' }}>
          {count}j
        </span>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28, delay: 0.3 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(255,107,43,0.12) 0%, rgba(255,77,77,0.06) 100%)',
          border: '1px solid rgba(255,107,43,0.22)',
          margin: '0 16px 12px',
        }}
      >
        <span className="sl-streak-fire" style={{ fontSize: 28, lineHeight: 1 }}>🔥</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--sl-streak-color)', fontFamily: 'var(--sl-font-brand)', lineHeight: 1.2 }}>
            {count} jours de suite !
          </div>
          <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>
            {isNewToday ? 'Connexion du jour validée ✓' : 'Continue comme ça 💪'}
          </div>
        </div>
        {/* Mini progress toward next milestone */}
        {(() => {
          const milestones = [3, 7, 14, 30, 60, 100];
          const next = milestones.find(m => m > count) ?? 100;
          const prev = milestones[milestones.indexOf(next) - 1] ?? 0;
          const pct  = Math.round(((count - prev) / (next - prev)) * 100);
          return (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 4 }}>→ {next}j</div>
              <div style={{ width: 44, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <div style={{
                  height: '100%', borderRadius: 999, width: `${pct}%`,
                  background: 'var(--sl-gradient-fire)',
                  transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
                }} />
              </div>
            </div>
          );
        })()}
      </motion.div>
    </AnimatePresence>
  );
}
