import { AnimatePresence } from 'framer-motion';
import AnnouncementCard from '../../AnnouncementCard.jsx';

export default function ClubNewsTab({ announcements = [], loading = false, canEdit, onNewAnnouncement }) {
  return (
    <div style={{ padding: '14px 14px calc(90px + env(safe-area-inset-bottom, 0px))' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>
          Actualités
        </h2>
        {canEdit && (
          <button
            onClick={onNewAnnouncement}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 10, border: 'none',
              backgroundColor: '#3b82f6', color: '#fff',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Annonce
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 90, borderRadius: 14, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📢</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>
            Aucune actualité pour l'instant
          </div>
          {canEdit ? (
            <div style={{ fontSize: 12, color: 'var(--sl-t3)', marginBottom: 16, lineHeight: 1.5 }}>
              Envoyez votre première annonce à vos abonnés.
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--sl-t3)' }}>
              Revenez bientôt pour les dernières nouvelles du club.
            </div>
          )}
          {canEdit && (
            <button
              onClick={onNewAnnouncement}
              style={{
                padding: '10px 20px', borderRadius: 12, border: 'none',
                backgroundColor: '#3b82f6', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              📢 Envoyer une annonce
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence>
            {announcements.map(ann => (
              <AnnouncementCard key={ann.id} ann={ann} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
