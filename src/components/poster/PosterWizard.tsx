import { Fragment } from 'react';
import { COLOR_PRESETS } from './posterConstants.js';
import { BG_PRESETS } from './posterBgLibrary.jsx';

/**
 * Mode Simple de PosterStudio — 3 étapes : Style → Infos → Exporter.
 * Extrait de PosterStudio.jsx en 3 sous-composants positionnés dans le layout.
 *
 * Utilisation dans PosterStudio :
 *   <WizardStepBar ps={ps} />         — entre l'en-tête et le canvas
 *   <WizardContent ps={ps} />         — sous le canvas (à la place des panels expert)
 *   <WizardFooter ps={ps} />          — tout en bas (à la place de la bottom nav expert)
 */

export function WizardStepBar({ ps }) {
  const { wizardStep, setWizardStep, accentColor } = ps;
  return (
    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '8px 20px', borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', gap: 0 }}>
      {['Style', 'Infos', 'Exporter'].map((label, i) => (
        <Fragment key={label}>
          <button
            type="button"
            onClick={() => i + 1 < wizardStep && setWizardStep(i + 1)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: i + 1 < wizardStep ? 'pointer' : 'default' }}
            aria-label={`Étape ${i + 1} : ${label}${i + 1 < wizardStep ? ' (cliquer pour revenir)' : ''}`}
          >
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              backgroundColor: i + 1 < wizardStep ? 'var(--sl-green)' : i + 1 === wizardStep ? accentColor : 'var(--sl-surface)',
              border: `2px solid ${i + 1 <= wizardStep ? (i + 1 < wizardStep ? 'var(--sl-green)' : accentColor) : 'var(--sl-border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: i + 1 <= wizardStep ? '#fff' : 'var(--sl-t3)',
              transition: 'all 0.2s',
            }}>
              {i + 1 < wizardStep
                ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                : i + 1}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: i + 1 === wizardStep ? accentColor : i + 1 < wizardStep ? 'var(--sl-green)' : 'var(--sl-t3)' }}>
              {label}
            </span>
          </button>
          {i < 2 && (
            <div style={{ flex: 1, height: 2, margin: '0 8px 16px', backgroundColor: i + 1 < wizardStep ? 'var(--sl-green)' : 'var(--sl-border)', transition: 'background-color 0.3s' }} />
          )}
        </Fragment>
      ))}
    </div>
  );
}

export function WizardContent({ ps }) {
  const { wizardStep, set, format, accentColor, templateId, displayTemplates, sportColors, homeName, awayName, championship, isTournamentEvent, bgPreset, bgSrc, dispatch } = ps;

  function readAndSetBg(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => dispatch({ type: 'PATCH', payload: { bgSrc: ev.target.result, bgPreset: '', bgErr: false, bgMode: 'upload' } });
    r.readAsDataURL(file);
  }

  const hasBg = !!(bgPreset || bgSrc);
  return (
    <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '38dvh', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
      <div style={{ padding: '16px 16px 8px' }}>

        {/* ── Étape 1 : Style ── */}
        {wizardStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', margin: '0 0 8px' }}>Format</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ id: 'post', label: 'Post 4:5' }, { id: 'story', label: 'Story 9:16' }].map(f => (
                  <button key={f.id} onClick={() => set('format', f.id)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: `2px solid ${format === f.id ? accentColor : 'var(--sl-border)'}`, backgroundColor: format === f.id ? `${accentColor}14` : 'var(--sl-surface)', color: format === f.id ? accentColor : 'var(--sl-t2)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', margin: '0 0 8px' }}>Style de l'affiche</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {displayTemplates.slice(0, 8).map(tpl => (
                  <button key={tpl.id} onClick={() => set('templateId', tpl.id)} style={{ padding: '8px 4px', borderRadius: 10, border: `2px solid ${templateId === tpl.id ? accentColor : 'var(--sl-border)'}`, backgroundColor: templateId === tpl.id ? `${accentColor}14` : 'var(--sl-surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{tpl.icon ?? '🎨'}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: templateId === tpl.id ? accentColor : 'var(--sl-t2)', textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word' }}>{tpl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', margin: '0 0 8px' }}>Couleur principale</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {[...sportColors.slice(0, 2), ...COLOR_PRESETS.slice(0, 4).map(c => c.color)].map((col, i) => (
                  <button key={i} onClick={() => set('accentColor', col)} aria-label={`Couleur ${col}`} style={{ width: 30, height: 30, borderRadius: '50%', border: `3px solid ${accentColor === col ? '#fff' : 'transparent'}`, backgroundColor: col, cursor: 'pointer', boxShadow: accentColor === col ? `0 0 0 2px ${col}` : `0 2px 6px ${col}60`, flexShrink: 0 }} />
                ))}
                <label title="Couleur personnalisée" style={{ width: 30, height: 30, borderRadius: '50%', background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                  <input type="color" value={accentColor} onChange={e => set('accentColor', e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                </label>
              </div>
            </div>

            {/* ── Section Image de fond ── */}
            {dispatch && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', margin: 0 }}>Image de fond</p>
                  {hasBg && (
                    <button
                      onClick={() => dispatch({ type: 'PATCH', payload: { bgPreset: '', bgSrc: '', bgErr: false } })}
                      style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                {/* Grille de presets CSS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginBottom: 8 }}>
                  {/* Option "Aucun" */}
                  <button
                    onClick={() => dispatch({ type: 'PATCH', payload: { bgPreset: '', bgSrc: '', bgErr: false } })}
                    aria-label="Pas de fond"
                    style={{
                      height: 42, borderRadius: 10,
                      border: `2px solid ${!hasBg ? accentColor : 'var(--sl-border)'}`,
                      backgroundColor: !hasBg ? `${accentColor}14` : 'var(--sl-surface)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: !hasBg ? accentColor : 'var(--sl-t3)', fontSize: 9, fontWeight: 800,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}
                  >
                    Aucun
                  </button>

                  {/* Presets cinématiques */}
                  {BG_PRESETS.slice(0, 11).map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => dispatch({ type: 'PATCH', payload: { bgPreset: preset.id, bgSrc: '', bgErr: false, bgMode: 'color' } })}
                      aria-label={preset.label}
                      title={preset.label}
                      style={{
                        height: 42, borderRadius: 10,
                        background: preset.preview,
                        cursor: 'pointer', border: 'none',
                        boxShadow: bgPreset === preset.id
                          ? `0 0 0 2px var(--sl-card), 0 0 0 4px ${accentColor}`
                          : 'inset 0 0 0 1.5px rgba(255,255,255,0.08)',
                        transition: 'box-shadow 0.15s',
                        position: 'relative',
                      }}
                    >
                      {bgPreset === preset.id && (
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Upload depuis la galerie */}
                <label
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                    border: `1.5px dashed ${bgSrc && !bgPreset ? accentColor : 'var(--sl-border-s)'}`,
                    backgroundColor: bgSrc && !bgPreset ? `${accentColor}10` : 'var(--sl-surface)',
                    color: bgSrc && !bgPreset ? accentColor : 'var(--sl-t2)',
                    fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => readAndSetBg(e.target.files?.[0])}
                  />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  {bgSrc && !bgPreset ? 'Photo chargée ✓' : 'Depuis ma galerie'}
                </label>
              </div>
            )}
          </div>
        )}

        {/* ── Étape 2 : Infos ── */}
        {wizardStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: '0 0 4px', lineHeight: 1.5 }}>
              Vérifiez ou modifiez les informations de l'affiche.
            </p>
            {!isTournamentEvent ? (
              <>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', margin: '0 0 6px' }}>Équipe domicile</p>
                  <input type="text" value={homeName} onChange={e => set('homeName', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', margin: '0 0 6px' }}>Équipe visiteur</p>
                  <input type="text" value={awayName} onChange={e => set('awayName', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </>
            ) : (
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', margin: '0 0 6px' }}>Nom du tournoi</p>
                <input type="text" value={homeName} onChange={e => set('homeName', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
              </div>
            )}
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', margin: '0 0 6px' }}>Compétition</p>
              <input type="text" value={championship} onChange={e => set('championship', e.target.value)} placeholder="Ex : Championnat Départemental…" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </div>
        )}

        {/* ── Étape 3 : Export ── */}
        {wizardStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0 4px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(34,217,106,0.12)', border: '1px solid rgba(34,217,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--sl-t1)', textAlign: 'center', margin: 0 }}>Votre affiche est prête !</p>
            <p style={{ fontSize: 12, color: 'var(--sl-t3)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
              Téléchargez-la ou partagez-la directement<br />sur WhatsApp ou Instagram.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function WizardFooter({ ps }) {
  const { wizardStep, setWizardStep, onClose, accentColor, handleDownload, downloading } = ps;
  return (
    <div style={{
      flexShrink: 0, display: 'flex', gap: 10, padding: '12px 16px',
      paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
      borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)',
    }}>
      {wizardStep > 1 ? (
        <button
          onClick={() => setWizardStep(s => s - 1)}
          style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: '1px solid var(--sl-border)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Précédent
        </button>
      ) : (
        <button
          onClick={onClose}
          style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: '1px solid var(--sl-border)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Annuler
        </button>
      )}

      {wizardStep < 3 ? (
        <button
          onClick={() => setWizardStep(s => s + 1)}
          style={{ flex: 2, padding: '12px 0', borderRadius: 14, border: 'none', backgroundColor: accentColor, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          Suivant
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      ) : (
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{ flex: 2, padding: '12px 0', borderRadius: 14, border: 'none', backgroundColor: downloading ? 'var(--sl-surface)' : accentColor, color: downloading ? 'var(--sl-t3)' : '#fff', fontSize: 13, fontWeight: 700, cursor: downloading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {downloading ? 'Téléchargement…' : 'Télécharger en PNG'}
        </button>
      )}
    </div>
  );
}
