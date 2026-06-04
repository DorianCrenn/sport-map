import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  { id: 'dashboard',    icon: '📊', label: 'Tableau de bord',     desc: 'Stats, vues, conversions' },
  { id: 'edit-page',    icon: '✏️', label: 'Modifier la page',    desc: 'Blocs, design, typographie' },
  { id: 'event',        icon: '📅', label: 'Créer un événement',  desc: 'Match, tournoi, entraînement' },
  { id: 'announce',     icon: '📢', label: 'Envoyer une annonce', desc: 'Tous les abonnés ou une équipe' },
  { id: 'divider' },
  { id: 'edit-info',    icon: '📋', label: 'Infos du club',       desc: 'Nom, sport, ville, équipes' },
  { id: 'add-team',     icon: '👕', label: 'Créer une équipe',    desc: 'Ajouter une catégorie ou une équipe' },
  { id: 'managers',     icon: '⚙️', label: 'Administrateurs',    desc: 'Gérer les accès au club' },
  { id: 'roster',       icon: '👥', label: 'Membres',             desc: 'Effectif et rôles' },
  { id: 'sponsors',     icon: '🤝', label: 'Partenaires',         desc: 'Logos et liens sponsors' },
];

export default function ClubAdminDrawer({ open, onClose, onAction, isEditing }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0, zIndex: 60,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              zIndex: 61,
              backgroundColor: 'var(--sl-card)',
              borderRadius: '20px 20px 0 0',
              overflow: 'hidden',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              maxHeight: '82dvh',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
              <div style={{ width: 36, height: 3.5, borderRadius: 999, backgroundColor: 'var(--sl-border-s)' }} />
            </div>

            {/* Header */}
            <div style={{
              padding: '8px 18px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid var(--sl-border)', flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em' }}>
                  Administration
                </div>
                <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>
                  Outils de gestion du club
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: 'none',
                  backgroundColor: 'var(--sl-surface)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--sl-t2)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Actions list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {ITEMS.map((item, i) => {
                if (item.id === 'divider') return <div key={i} style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0' }} />;

                const isActive = item.id === 'edit-page' && isEditing;

                return (
                  <button
                    key={item.id}
                    onClick={() => { onAction(item.id); onClose(); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 18px', border: 'none', cursor: 'pointer',
                      backgroundColor: isActive ? 'rgba(34,217,106,0.07)' : 'transparent',
                      textAlign: 'left', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'var(--sl-hover)')}
                    onMouseLeave={e => e.currentTarget.style.background = isActive ? 'rgba(34,217,106,0.07)' : 'transparent'}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                      backgroundColor: isActive ? 'rgba(34,217,106,0.12)' : 'var(--sl-surface)',
                      border: `1px solid ${isActive ? 'rgba(34,217,106,0.3)' : 'var(--sl-border)'}`,
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: isActive ? 'var(--sl-green)' : 'var(--sl-t1)',
                      }}>
                        {item.label}
                        {isActive && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: 'var(--sl-green)' }}>✓ ACTIF</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>{item.desc}</div>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
