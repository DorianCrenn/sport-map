import { motion } from 'framer-motion';

interface DraftBannerProps { onRestore: () => void; onDiscard: () => void; }

export default function DraftBanner({ onRestore, onDiscard }: DraftBannerProps) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 16px', backgroundColor: 'rgba(99,102,241,0.1)', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Brouillon retrouvé
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onRestore} style={{ fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 7, backgroundColor: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' }}>Restaurer</button>
          <button onClick={onDiscard} style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 7, backgroundColor: 'transparent', color: 'rgba(129,140,248,0.8)', border: 'none', cursor: 'pointer' }}>Ignorer</button>
        </div>
      </div>
    </motion.div>
  );
}
