/**
 * TemplatePanelTab — Sélecteur de templates, bibliothèque, variantes IA et affiche IA full.
 */
import PosterRenderer from '../PosterRenderer.jsx';
import { SLabel } from '../PosterAtoms.jsx';
import { generateVariants } from '../../../lib/posterVariants.js';
import { POSTER_STYLE_SUGGESTIONS } from '../../../lib/posterVariants.js';

export default function TemplatePanelTab({ ps }) {
  const {
    accentColor, templateId, set, libFilter, setLibFilter,
    displayTemplates, hasPremium, favTplHook, toggleFavTpl, setShowUpgradeModal,
    club, defTplHook, libHook, libName, setLibName, saveToLib, loadFromLibrary,
    clubDNA, poster, format,
    variants, setVariants, variantSeed, setVariantSeed, variantsOpen, setVariantsOpen,
    dispatch, aiPosterHint, setAiPosterHint, aiPosterLoading, handleGenerateAIPoster,
    aiPosterVariants, bgSrc, homeName, awayName, championship, event, isTournamentEvent,
    posterData,
  } = ps;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[['all', 'Tous'], ['favs', '❤️ Favoris']].map(([id, label]) => (
          <button key={id} onClick={() => setLibFilter(id)}
            style={{ padding: '5px 12px', borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${libFilter === id ? accentColor : 'var(--sl-border-s)'}`, backgroundColor: libFilter === id ? `${accentColor}16` : 'var(--sl-surface)', color: libFilter === id ? accentColor : 'var(--sl-t2)' }}>
            {label}
          </button>
        ))}
      </div>

      {displayTemplates.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--sl-t3)', fontSize: 12 }}>
          Aucun template favori — cliquez sur ❤️ pour en ajouter.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {displayTemplates.map(t => {
          const active = templateId === t.id;
          const locked = t.isPremium && !hasPremium;
          const fav = favTplHook.isFav(t.id);
          return (
            <button key={t.id} onClick={() => { if (locked) setShowUpgradeModal(true); else set('templateId', t.id); }}
              style={{ padding: '14px 12px', borderRadius: 14, cursor: locked ? 'default' : 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden', border: `2px solid ${active ? t.color : 'var(--sl-border-s)'}`, backgroundColor: active ? `${t.color}12` : 'var(--sl-surface)', opacity: locked ? 0.65 : 1 }}>
              {locked && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, backdropFilter: 'blur(1px)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.06em' }}>PREMIUM</span>
                </div>
              )}
              <button onClick={e => { e.stopPropagation(); toggleFavTpl(t.id); }}
                style={{ position: 'absolute', top: 7, left: 7, width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: fav ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.2)', color: fav ? '#ef4444' : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, padding: 0 }}>
                {fav ? '❤' : '♡'}
              </button>
              {t.isPremium && !locked && <div style={{ position: 'absolute', top: 7, right: 7, fontSize: 9, color: '#D4AF37' }}>👑</div>}
              <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: active ? t.color : 'var(--sl-t1)', marginBottom: 2 }}>{t.label}</div>
              <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{t.desc}</div>
            </button>
          );
        })}
      </div>

      {club && (
        <button onClick={() => defTplHook.set(templateId)}
          style={{ width: '100%', padding: '10px', borderRadius: 11, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${accentColor}40`, backgroundColor: `${accentColor}0D`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Définir comme template par défaut du club
        </button>
      )}

      {/* Library */}
      <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '2px 0' }} />
      <SLabel>Ma bibliothèque ({libHook.entries.length}/20)</SLabel>
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={libName} onChange={e => setLibName(e.target.value)}
          placeholder={`Affiche ${new Date().toLocaleDateString('fr-FR')}`}
          onKeyDown={e => e.key === 'Enter' && saveToLib()}
          style={{ flex: 1, padding: '8px 11px', borderRadius: 10, fontSize: 12, fontWeight: 500, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none' }}
        />
        <button onClick={saveToLib}
          style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800, backgroundColor: accentColor, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Sauver
        </button>
      </div>
      {libHook.entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {libHook.entries.map(entry => (
            <div key={entry.id} style={{ padding: '10px 12px', borderRadius: 12, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1 }}>{new Date(entry.savedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => loadFromLibrary(entry)} style={{ padding: '5px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, backgroundColor: `${accentColor}16`, color: accentColor, border: `1px solid ${accentColor}40`, cursor: 'pointer' }}>Charger</button>
                <button onClick={() => libHook.duplicate(entry.id)} title="Dupliquer" style={{ padding: '5px 8px', borderRadius: 8, fontSize: 11, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>⧉</button>
                <button onClick={() => libHook.remove(entry.id)} title="Supprimer" style={{ padding: '5px 8px', borderRadius: 8, fontSize: 11, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Variantes IA */}
      {clubDNA.daProfile && (
        <div>
          <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '2px 0 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <SLabel accent={accentColor}>Variantes IA</SLabel>
            {variants.length > 0 && (
              <button
                onClick={() => {
                  const newSeed = variantSeed + 1;
                  setVariantSeed(newSeed);
                  setVariants(generateVariants(clubDNA.daProfile, poster, displayTemplates, 8, newSeed));
                }}
                style={{ fontSize: 10, fontWeight: 700, color: accentColor, border: `1px solid ${accentColor}40`, background: `${accentColor}10`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>
                ↺ Régénérer
              </button>
            )}
          </div>

          {variants.length === 0 && (
            <button
              onClick={() => {
                const vs = generateVariants(clubDNA.daProfile, poster, displayTemplates, 8, variantSeed);
                setVariants(vs);
                setVariantsOpen(true);
              }}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                background: `linear-gradient(135deg, ${clubDNA.daProfile.colors.accent}CC, ${accentColor})`,
                color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              <span style={{ fontSize: 16 }}>✨</span>
              Générer des variantes
              <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>basées sur votre style club</span>
            </button>
          )}

          {variants.length > 0 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {variants.map(v => (
                  <button key={v.variantId} onClick={() => dispatch({ type: 'PATCH', payload: v.state })}
                    style={{
                      padding: 0, border: `2px solid ${templateId === v.templateId && accentColor === v.accentColor ? v.tplColor : 'var(--sl-border-s)'}`,
                      borderRadius: 10, cursor: 'pointer', overflow: 'hidden', background: 'var(--sl-surface)', transition: 'border-color 0.15s',
                    }}>
                    <div style={{ width: '100%', aspectRatio: format === 'story' ? '9/16' : '4/5', overflow: 'hidden', pointerEvents: 'none' }}>
                      <PosterRenderer
                        templateId={v.templateId}
                        data={{ ...posterData, accentColor: v.accentColor }}
                        format={format} previewWidth={72} transforms={{}}
                        bgPresetId={v.state.bgPreset} effects={{ tint: null, tintOp: 0 }}
                        overlayElements={v.state.overlayElements || []} playerLayers={[]}
                      />
                    </div>
                    <div style={{ padding: '4px 5px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 3, background: v.accentColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--sl-t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 9.5, color: 'var(--sl-t3)', textAlign: 'center' }}>
                Cliquer pour appliquer · {variants.length} variantes générées depuis votre style {clubDNA.daProfile.styleLabel}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Affiche IA full */}
      <div>
        <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '2px 0 12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <div style={{ width: 2, height: 13, borderRadius: 2, background: '#6366f1', flexShrink: 0 }} />
          <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#818cf8' }}>Affiche IA</span>
          <div style={{ flex: 1, height: 1, background: 'var(--sl-border)' }} />
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 700 }}>Flux · IA</span>
        </div>

        <div style={{ padding: '8px 11px', borderRadius: 10, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', marginBottom: 10, fontSize: 10.5, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700, color: 'var(--sl-t1)' }}>
            {homeName && awayName ? `${homeName} vs ${awayName}` : event?.title || 'Événement'}
          </span>
          {(championship || event?.sport) && <span style={{ color: 'var(--sl-t3)' }}>{' · '}{championship || event?.sport}</span>}
          {event?.date && <span style={{ color: 'var(--sl-t3)' }}>{' · '}{new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {POSTER_STYLE_SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setAiPosterHint(aiPosterHint === s ? '' : s)}
              style={{
                padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${aiPosterHint === s ? '#818cf8' : 'var(--sl-border-s)'}`,
                background: aiPosterHint === s ? 'rgba(99,102,241,0.12)' : 'var(--sl-surface)',
                color: aiPosterHint === s ? '#818cf8' : 'var(--sl-t2)', transition: 'all 0.12s',
              }}>
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input value={aiPosterHint} onChange={e => setAiPosterHint(e.target.value)}
            placeholder="Ajouter des indications (optionnel)…" disabled={aiPosterLoading}
            onKeyDown={e => { if (e.key === 'Enter' && !aiPosterLoading) handleGenerateAIPoster(); }}
            style={{ flex: 1, padding: '9px 11px', borderRadius: 10, fontSize: 11, fontWeight: 500, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none' }}
          />
          <button disabled={aiPosterLoading} onClick={handleGenerateAIPoster}
            style={{
              padding: '9px 13px', borderRadius: 10, fontSize: 14, fontWeight: 800,
              cursor: aiPosterLoading ? 'wait' : 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: '#fff', border: 'none', opacity: aiPosterLoading ? 0.6 : 1, flexShrink: 0,
            }}>
            {aiPosterLoading ? '⏳' : '✨'}
          </button>
        </div>

        {aiPosterLoading && (
          <div style={{ fontSize: 10, color: '#818cf8', textAlign: 'center', fontWeight: 600 }}>Génération de 4 affiches… 20-60 sec</div>
        )}

        {aiPosterVariants.length > 0 && !aiPosterLoading && (
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7, marginTop: 4 }}>Choisissez un design</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {aiPosterVariants.map((v, i) => {
                const isSelected = bgSrc === v.imageUrl;
                return (
                  <button key={i} onClick={() => dispatch({ type: 'PATCH', payload: { bgSrc: v.imageUrl, bgMode: 'url', bgErr: false, bgPreset: '', templateId: 'ai-full' } })}
                    style={{
                      position: 'relative', borderRadius: 8, overflow: 'hidden', padding: 0,
                      border: `2px solid ${isSelected ? '#6366f1' : 'transparent'}`,
                      cursor: 'pointer', aspectRatio: '9 / 16', background: '#111',
                      boxShadow: isSelected ? '0 0 0 1px #6366f1' : 'none', transition: 'border-color 0.12s',
                    }}>
                    <img src={v.imageUrl} alt={v.style} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 4px 4px',
                      background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))',
                      fontSize: 7.5, color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontWeight: 700, lineHeight: 1.2,
                    }}>{v.style.split(' ').slice(0, 2).join(' ')}</div>
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff' }}>✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
