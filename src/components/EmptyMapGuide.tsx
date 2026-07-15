import { motion } from 'framer-motion';

interface EmptyMapGuideProps { canAddEvent: boolean; onAddEvent: () => void; onResetFilters: () => void; }

export default function EmptyMapGuide({ canAddEvent, onAddEvent, onResetFilters }: EmptyMapGuideProps) {
  function handleShare() {
    const url = window.location.origin;
    if (navigator.share) { navigator.share({ title: 'SportLink', text: 'Rejoins SportLink pour suivre les événements sportifs près de chez toi !', url }).catch(() => {}); }
    else { navigator.clipboard?.writeText(url); }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ pointerEvents: 'auto', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', borderRadius: 'var(--sl-radius-4xl)', padding: '24px 20px', maxWidth: 300, width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗺️</div>
        {canAddEvent ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>Aucun match dans cette zone</div>
            <div style={{ fontSize: 12, color: 'var(--sl-t3)', marginBottom: 20, lineHeight: 1.5 }}>Créez votre premier événement pour le faire apparaître sur la carte — visible par tous les sportifs de la région.</div>
            <button onClick={onAddEvent} style={{ width: '100%', padding: '11px 0', borderRadius: 'var(--sl-radius-xl)', border: 'none', backgroundColor: 'var(--sl-green)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>+ Créer un événement</button>
            <button onClick={onResetFilters} style={{ width: '100%', padding: '10px 0', borderRadius: 'var(--sl-radius-xl)', border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}>Voir tous les événements</button>
            <button onClick={handleShare} style={{ width: '100%', padding: '10px 0', borderRadius: 'var(--sl-radius-xl)', border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t3)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📤 Envoyer le lien à mon club</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>Aucun événement dans cette zone</div>
            <div style={{ fontSize: 12, color: 'var(--sl-t3)', marginBottom: 20, lineHeight: 1.5 }}>Pas encore de club SportLink ici. Élargissez la recherche, ou envoyez le lien à votre club pour qu'il rejoigne la plateforme.</div>
            <button onClick={onResetFilters} style={{ width: '100%', padding: '11px 0', borderRadius: 'var(--sl-radius-xl)', border: 'none', backgroundColor: '#0F1E3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>Voir tous les événements</button>
            <button onClick={handleShare} style={{ width: '100%', padding: '10px 0', borderRadius: 'var(--sl-radius-xl)', border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📤 Envoyer le lien à mon club</button>
          </>
        )}
      </motion.div>
    </div>
  );
}
