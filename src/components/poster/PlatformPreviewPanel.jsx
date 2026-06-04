import { motion } from 'framer-motion';
import PosterRenderer from './PosterRenderer.jsx';

export default function PlatformPreviewPanel({
  platformPreview, setPlatformPreview,
  templateId, posterData,
  transforms, bgPreset, effects,
  overlayElements, aiOverlayElements, playerLayers,
  activeBandLogos, hasPremium, club,
}) {
  const platforms = [
    { id: 'ig-story', label: 'Story IG',  color: '#E1306C' },
    { id: 'ig-post',  label: 'Post IG',   color: '#E1306C' },
    { id: 'whatsapp', label: 'WhatsApp',  color: '#25D366' },
  ];

  return (
    <motion.div key="platform-preview"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 42, backgroundColor: 'var(--sl-card)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--sl-border)', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Aperçu plateformes</span>
        <button onClick={() => setPlatformPreview(null)}
          style={{ width: 32, height: 32, borderRadius: 9, border: 'none', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '10px 16px', flexShrink: 0, borderBottom: '1px solid var(--sl-border)' }}>
        {platforms.map(p => (
          <button key={p.id} onClick={() => setPlatformPreview(p.id)}
            style={{ padding: '7px 16px', borderRadius: 10, border: `1.5px solid ${platformPreview === p.id ? p.color : 'var(--sl-border)'}`, backgroundColor: platformPreview === p.id ? `${p.color}16` : 'transparent', fontSize: 12, fontWeight: 700, color: platformPreview === p.id ? p.color : 'var(--sl-t2)', cursor: 'pointer' }}>
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
        {platformPreview === 'ig-story' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: '#E1306C', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Instagram Story · 9:16</span>
            <div style={{ width: 240, height: 427, borderRadius: 20, overflow: 'hidden', position: 'relative', boxShadow: '0 0 0 3px #E1306C66, 0 28px 70px rgba(0,0,0,0.6)', backgroundColor: '#000', flexShrink: 0 }}>
              <PosterRenderer templateId={templateId} data={posterData} format="story" previewWidth={240} transforms={transforms} bgPresetId={bgPreset} effects={effects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} sponsorLogos={activeBandLogos} showWatermark={!hasPremium} />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)', zIndex: 10, display: 'flex', alignItems: 'flex-start', padding: '10px 12px 0', gap: 7 }}>
                <div style={{ flex: 1, height: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)', marginTop: 6 }} />
                <div style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid white', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  {club?.logo ? <img src={club.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 9, fontWeight: 900, color: 'white' }}>{(club?.name || 'C')[0]}</span>}
                </div>
                <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.9)', fontWeight: 700, lineHeight: '26px', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club?.name || 'Votre club'}</span>
              </div>
            </div>
          </div>
        )}

        {platformPreview === 'ig-post' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: '#E1306C', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Instagram Post · 4:5</span>
            <div style={{ width: 290, backgroundColor: 'var(--sl-card)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.35)', border: '1px solid var(--sl-border)', flexShrink: 0 }}>
              <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--sl-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {club?.logo ? <img src={club.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--sl-t1)' }}>{(club?.name || 'C')[0]}</span>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t1)' }}>{club?.name || 'Votre club'}</div>
                  <div style={{ fontSize: 9, color: 'var(--sl-t3)' }}>SportLink</div>
                </div>
                <svg style={{ marginLeft: 'auto' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <PosterRenderer templateId={templateId} data={posterData} format="post" previewWidth={290} transforms={transforms} bgPresetId={bgPreset} effects={effects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} sponsorLogos={activeBandLogos} showWatermark={!hasPremium} />
              </div>
              <div style={{ padding: '8px 12px 10px', display: 'flex', gap: 14, alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                <svg style={{ marginLeft: 'auto' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </div>
            </div>
          </div>
        )}

        {platformPreview === 'whatsapp' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: '#25D366', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>WhatsApp</span>
            <div style={{ width: 290, backgroundColor: '#111b21', borderRadius: 18, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', flexShrink: 0 }}>
              <div style={{ padding: '11px 14px', backgroundColor: '#202c33', display: 'flex', alignItems: 'center', gap: 9 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#2a3942', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {club?.logo ? <img src={club.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 10, fontWeight: 900, color: '#aebac1' }}>{(club?.name || 'C')[0]}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#e9edef', fontWeight: 700 }}>{club?.name || 'Votre club'}</div>
                  <div style={{ fontSize: 9.5, color: '#8696a0' }}>en ligne</div>
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </div>
              <div style={{ padding: '14px 10px 14px', backgroundColor: '#0b141a' }}>
                <div style={{ maxWidth: '88%', marginLeft: 'auto', backgroundColor: '#005c4b', borderRadius: '10px 2px 10px 10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <PosterRenderer templateId={templateId} data={posterData} format="post" previewWidth={232} transforms={transforms} bgPresetId={bgPreset} effects={effects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} sponsorLogos={activeBandLogos} showWatermark={!hasPremium} />
                  </div>
                  <div style={{ padding: '4px 10px 6px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>maintenant</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#53bdeb" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 12 5 16 11 8"/><polyline points="7 12 11 16 17 8"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
