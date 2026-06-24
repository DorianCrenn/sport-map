import { motion } from 'framer-motion';

interface SkeletonCardProps {
  lines?: number;
  avatar?: boolean;
  sportColor?: string;
}

export default function SkeletonCard({ lines = 2, avatar = true, sportColor = 'var(--sl-green)' }: SkeletonCardProps) {
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', marginBottom: 8 }}>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${sportColor}40 0%, ${sportColor}20 60%, transparent 100%)` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
        {avatar && (
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'var(--sl-surface)', flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: lines }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
              style={{ height: i === 0 ? 14 : 10, borderRadius: 6, backgroundColor: 'var(--sl-surface)', width: i === 0 ? '70%' : '45%' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
