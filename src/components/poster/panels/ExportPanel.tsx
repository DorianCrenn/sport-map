/**
 * ExportPanel — Popover d'export/partage (PNG, WhatsApp, IG, Facebook, lien).
 * Reçoit toute la logique d'export via l'objet `ps` (poster state).
 */
import { motion } from 'framer-motion';
import { MiniToggle } from '../PosterAtoms.jsx';
import { isDemoMode } from '../../../lib/supabase.js';

function dispatchPosterGenerated() {
  if (isDemoMode()) {
    window.dispatchEvent(new CustomEvent('sl-demo-action', { detail: { type: 'poster-generated' } }));
  }
}

export default function ExportPanel({ ps }) {
  const {
    accentColor, hasPremium,
    watermarkVisible, setWatermarkVisible,
    downloading, exportingAll, sharing, sharingIG, linkCopied,
    handleDownload, handleDownloadAll,
    handleShareWhatsApp, handleShareIG, handleShareFacebook, handleCopyLink,
    setExportOpen,
    canPublish, publishing, published, posterType, handlePublish,
  } = ps;

  const POSTER_TYPE_LABEL: Record<string, string> = {
    announce:    'Publier l\'affiche match',
    convocation: 'Publier la convocation',
    result:      'Publier l\'affiche résultat',
  };
  const POSTER_TYPE_SUB: Record<string, string> = {
    announce:    'Visible par les membres du club',
    convocation: 'Avec la liste des joueurs convoqués',
    result:      'Avec le score final du match',
  };
  const publishLabel = POSTER_TYPE_LABEL[posterType ?? 'announce'] ?? POSTER_TYPE_LABEL.announce;
  const publishSub   = POSTER_TYPE_SUB[posterType ?? 'announce']   ?? POSTER_TYPE_SUB.announce;

  return (
    <motion.div
      key="exportpopover"
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      style={{
        position: 'absolute', bottom: 'calc(62px + env(safe-area-inset-bottom, 0px))', right: 12, left: 12, zIndex: 30,
        backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
        borderRadius: 20, boxShadow: '0 12px 40px rgba(0,0,0,0.3)', padding: 8,
      }}
    >
      {/* Watermark toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 4px' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: hasPremium ? 'var(--sl-t1)' : 'var(--sl-t3)' }}>Masquer le watermark</div>
          {!hasPremium && <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Plan Club Pro requis</div>}
        </div>
        {hasPremium ? (
          <MiniToggle value={!watermarkVisible} onChange={() => setWatermarkVisible(v => !v)} accent={accentColor} />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        )}
      </div>
      <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0' }} />

      {/* Publier au club — visible aux supporters/joueurs/famille en lecture seule */}
      {canPublish && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handlePublish(); dispatchPosterGenerated(); }} disabled={publishing}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 13, border: 'none', cursor: 'pointer', backgroundColor: published ? 'rgba(34,217,106,0.14)' : accentColor }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: published ? 'rgba(34,217,106,0.22)' : 'rgba(0,0,0,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {published ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22D96A" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 11a9 9 0 0 1 9-9 9 9 0 0 1 9 9"/><path d="M12 14v7"/><path d="M9 17l3-3 3 3"/><circle cx="12" cy="6" r="1.4" fill="#fff" stroke="none"/>
              </svg>
            )}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: published ? 'var(--sl-green)' : '#fff' }}>
              {publishing ? 'Publication…' : published ? 'Affiche publiée !' : publishLabel}
            </div>
            <div style={{ fontSize: 10, color: published ? 'var(--sl-t3)' : 'rgba(255,255,255,0.75)' }}>{publishSub}</div>
          </div>
        </motion.button>
      )}

      <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0' }} />

      {/* PNG download */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleDownload(); setExportOpen(false); dispatchPosterGenerated(); }} disabled={downloading}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 13, border: 'none', cursor: 'pointer', backgroundColor: `${accentColor}10` }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{downloading ? 'Téléchargement…' : 'Télécharger en PNG'}</div>
          <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>HD 3× — prêt pour Instagram</div>
        </div>
      </motion.button>

      {/* Tout télécharger */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleDownloadAll(); setExportOpen(false); dispatchPosterGenerated(); }} disabled={exportingAll}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 13, border: 'none', cursor: 'pointer', backgroundColor: `${accentColor}10` }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', backgroundColor: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 7, fontWeight: 900, color: '#fff', lineHeight: 1 }}>2</span>
          </div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{exportingAll ? 'Téléchargement…' : 'Tout télécharger'}</div>
          <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Story 9:16 + Post 4:5 · HD 3×</div>
        </div>
      </motion.button>

      <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0' }} />

      {/* WhatsApp */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleShareWhatsApp(); setExportOpen(false); }} disabled={sharing}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 13, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(37,211,102,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.855L.057 23.882l6.233-1.635A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894c-1.897 0-3.66-.51-5.182-1.398l-.371-.22-3.851 1.01 1.029-3.763-.242-.387A9.855 9.855 0 012.106 12c0-5.457 4.437-9.894 9.894-9.894 5.457 0 9.894 4.437 9.894 9.894 0 5.457-4.437 9.894-9.894 9.894z"/>
          </svg>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{sharing ? 'Partage…' : 'Partager sur WhatsApp'}</div>
          <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Image + texte de l'événement</div>
        </div>
      </motion.button>

      {/* Instagram */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleShareIG(); setExportOpen(false); }} disabled={sharingIG}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 13, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(225,48,108,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2.3" strokeLinecap="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{sharingIG ? 'Partage…' : 'Partager sur Instagram'}</div>
          <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Via le partage natif ou téléchargement</div>
        </div>
      </motion.button>

      {/* Facebook */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleShareFacebook(); setExportOpen(false); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 13, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(24,119,242,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Partager sur Facebook</div>
          <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Partage du lien de l'événement</div>
        </div>
      </motion.button>

      <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0' }} />

      {/* Copier le lien */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={handleCopyLink}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 13, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: linkCopied ? 'rgba(34,217,106,0.14)' : 'rgba(148,163,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
          {linkCopied ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22D96A" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          )}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: linkCopied ? 'var(--sl-green)' : 'var(--sl-t1)', transition: 'color 0.2s' }}>{linkCopied ? 'Lien copié !' : 'Copier le lien'}</div>
          <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Lien vers l'événement SportLink</div>
        </div>
      </motion.button>
    </motion.div>
  );
}
