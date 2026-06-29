import { motion } from 'framer-motion';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ emoji, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', gap: 8 }}>
      {emoji && (
        <motion.span
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.05 }}
          className="sl-float"
          style={{ fontSize: 44, lineHeight: 1, marginBottom: 4, userSelect: 'none', display: 'inline-block' }}
        >
          {emoji}
        </motion.span>
      )}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        style={{ fontSize: 16, fontWeight: 700, color: 'var(--sl-t1)', margin: 0, fontFamily: 'var(--sl-font-brand)' }}
      >
        {title}
      </motion.p>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.3 }}
          style={{ fontSize: 12, color: 'var(--sl-t3)', margin: 0, maxWidth: 220, lineHeight: 1.5 }}
        >
          {subtitle}
        </motion.p>
      )}
      {actionLabel && onAction && (
        <motion.button
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 380, damping: 22 }}
          whileTap={{ scale: 0.93 }}
          whileHover={{ scale: 1.04, boxShadow: '0 6px 20px rgba(34,217,106,0.4)' }}
          onClick={onAction}
          className="sl-btn-shimmer"
          style={{ marginTop: 10, padding: '11px 22px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', backgroundColor: 'var(--sl-green)', boxShadow: 'var(--sl-green-glow)' }}
        >
          {actionLabel}
        </motion.button>
      )}
    </div>
  );
}
