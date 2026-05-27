import { motion } from 'framer-motion';

export default function EmptyMapGuide({ canAddEvent, onAddEvent, onResetFilters }) {
  function handleShare() {
    const url = window.location.origin;
    if (navigator.share) {
      navigator.share({
        title: 'SportLink',
        text: 'Rejoins SportLink pour suivre les événements sportifs en Finistère !',
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
    }
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, pointerEvents: 'none',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          pointerEvents: 'auto',
          backgroundColor: 'var(--sl-card)',
          border: '1px solid var(--sl-border)',
          borderRadius: 20,
          padding: '24px 20px',
          maxWidth: 300,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗺️</div>

        {canAddEvent ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>
              Aucun match dans cette zone
            </div>
            <div style={{ fontSize: 12, color: 'var(--sl-t3)', marginBottom: 20, lineHeight: 1.5 }}>
              Créez votre premier événement pour le faire apparaître sur la carte.
            </div>
            <button
              onClick={onAddEvent}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 12, border: 'none',
                backgroundColor: 'var(--sl-green)', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 8,
              }}
            >
              + Créer un événement
            </button>
            <button
              onClick={onResetFilters}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 12,
                border: '1px solid var(--sl-border)',
                backgroundColor: 'transparent', color: 'var(--sl-t2)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 8,
              }}
            >
              Voir tous les événements
            </button>
            <button
              onClick={handleShare}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 12,
                border: '1px solid var(--sl-border)',
                backgroundColor: 'transparent', color: 'var(--sl-t3)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Inviter mon club
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>
              Aucun événement dans cette zone
            </div>
            <div style={{ fontSize: 12, color: 'var(--sl-t3)', marginBottom: 20, lineHeight: 1.5 }}>
              Pas encore de club SportLink près de chez vous — explorez la Bretagne ou invitez votre club !
            </div>
            <button
              onClick={onResetFilters}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 12, border: 'none',
                backgroundColor: '#0F1E3A', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 8,
              }}
            >
              Voir tous les événements
            </button>
            <button
              onClick={handleShare}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 12,
                border: '1px solid var(--sl-border)',
                backgroundColor: 'transparent', color: 'var(--sl-t2)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Inviter mon club
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
