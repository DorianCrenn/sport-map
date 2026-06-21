import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { getPlanMeta, requiredPlanFor } from '../../lib/planHelpers.js';

interface PlanGateProps {
  allowed:    boolean;
  feature?:   string;
  mode?:      'overlay' | 'hide' | 'replace';
  fallback?:  ReactNode;
  onUpgrade?: () => void;
  children:   ReactNode;
}

export default function PlanGate({ allowed, feature, mode = 'overlay', fallback = null, onUpgrade, children }: PlanGateProps) {
  if (allowed) return <>{children}</>;
  if (mode === 'hide') return null;
  if (mode === 'replace') return <>{fallback ?? null}</>;

  const meta = getPlanMeta(feature ? requiredPlanFor(feature as any) : 'starter') as { name: string; color: string; badge: string };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ pointerEvents: 'none', opacity: 0.35, userSelect: 'none' }}>{children}</div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 'inherit', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', gap: 8, cursor: onUpgrade ? 'pointer' : 'default' }} onClick={onUpgrade}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.4, padding: '0 12px' }}>Plan {meta.name} requis</span>
        {onUpgrade && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={e => { e.stopPropagation(); onUpgrade(); }} style={{ marginTop: 4, padding: '7px 16px', borderRadius: 10, border: 'none', backgroundColor: meta.color, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            Débloquer {meta.badge}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
