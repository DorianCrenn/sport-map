import { motion } from 'framer-motion';
import { Z } from '../constants/zIndex.js';

interface ConsentBannerProps { onAccept: () => void; onRefuse: () => void; }

export default function ConsentBanner({ onAccept, onRefuse }: ConsentBannerProps) {
  return (
    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 36 }} role="dialog" aria-label="Consentement à la collecte de statistiques d'utilisation"
      style={{ position: 'fixed', bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))', left: 0, right: 0, zIndex: (Z as Record<string, number>).helpFab + 1, margin: '0 8px 8px', borderRadius: 18, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', padding: '14px 16px', fontFamily: 'Inter, sans-serif' }}>
      <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Améliorer SportLink ensemble</p>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
        Nous collectons des statistiques anonymisées sur les fonctionnalités utilisées afin d'améliorer l'application. Aucune donnée n'est partagée avec des tiers.{' '}
        <a href="#legal/privacy" onClick={e => { e.preventDefault(); window.location.hash = '#legal/privacy'; }} style={{ color: '#818cf8', textDecoration: 'underline' }}>En savoir plus</a>
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onRefuse} style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Refuser</button>
        <button onClick={onAccept} style={{ flex: 2, padding: '10px', borderRadius: 12, border: 'none', backgroundColor: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Accepter et continuer</button>
      </div>
    </motion.div>
  );
}
