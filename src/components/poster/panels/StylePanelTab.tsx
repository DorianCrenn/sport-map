/**
 * StylePanelTab — Couleur principale, palettes sport/club, calques, identité visuelle IA.
 */
import { motion } from 'framer-motion';
import { SLabel, ColorSwatch, MiniToggle } from '../PosterAtoms.jsx';
import { COLOR_PRESETS, LAYER_BLOCKS } from '../posterConstants.js';

export default function StylePanelTab({ ps }) {
  const {
    accentColor, set, sportColors, clubColors,
    transforms, setLayerProp, resetLayers, hasLayerChanges,
    clubDNA, dnaFileRef, dispatch, event,
  } = ps;

  const STYLE_ICONS = { premium: '✦', bold: '⚡', cinematic: '🎬', minimalist: '◻', street: '🔥', esport: '⚙', classic: '◈' };
  const { daProfile, analyzing, analyzeError } = clubDNA;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Couleur principale */}
      <div>
        <SLabel accent={accentColor}>Couleur principale</SLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
          {COLOR_PRESETS.map(p => {
            const active = accentColor === p.color;
            return (
              <button key={p.id} onClick={() => set('accentColor', p.color)}
                style={{
                  padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                  border: `1.5px solid ${active ? p.color : 'var(--sl-border-s)'}`,
                  background: active ? `${p.color}18` : 'var(--sl-surface)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.12s',
                }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: p.color, boxShadow: active ? `0 0 10px ${p.color}80` : 'none', transition: 'box-shadow 0.12s' }} />
                <span style={{ fontSize: 8.5, fontWeight: 700, color: active ? p.color : 'var(--sl-t3)', letterSpacing: '0.04em' }}>{p.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
          <input type="color" value={accentColor} onChange={e => set('accentColor', e.target.value)}
            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2, backgroundColor: 'transparent', flexShrink: 0 }}/>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: `linear-gradient(90deg, #000 0%, ${accentColor} 50%, #fff 100%)` }}/>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{accentColor.toUpperCase()}</span>
        </div>
      </div>

      {sportColors.length > 0 && (
        <div>
          <SLabel>Couleurs {event?.sport || 'sport'}</SLabel>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {sportColors.map(c => <ColorSwatch key={c} color={c} active={accentColor === c} onClick={() => set('accentColor', c)} />)}
            <span style={{ fontSize: 10, color: 'var(--sl-t3)', marginLeft: 4 }}>Cliquer pour appliquer</span>
          </div>
        </div>
      )}

      {clubColors.length > 0 && (
        <div>
          <SLabel>Couleurs du club</SLabel>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {clubColors.map(c => <ColorSwatch key={c} color={c} active={accentColor === c} onClick={() => set('accentColor', c)} />)}
            <span style={{ fontSize: 10, color: 'var(--sl-t3)', marginLeft: 4 }}>Identité du club</span>
          </div>
        </div>
      )}

      {/* Calques */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <SLabel accent={accentColor}>Calques</SLabel>
          {hasLayerChanges && (
            <button onClick={resetLayers}
              style={{ fontSize: 9.5, color: 'var(--sl-t3)', border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 5, textDecoration: 'underline' }}>
              Tout réinitialiser
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {LAYER_BLOCKS.map(block => {
            const t = transforms[block.id] || {};
            const visible = t.visible !== false;
            const opacity = t.opacity ?? 1;
            return (
              <div key={block.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10,
                  backgroundColor: 'var(--sl-surface)',
                  border: `1px solid ${visible ? 'var(--sl-border)' : 'rgba(239,68,68,0.2)'}`,
                  opacity: visible ? 1 : 0.5, transition: 'opacity 0.15s, border-color 0.15s',
                }}>
                <span style={{ fontSize: 12, width: 18, textAlign: 'center', flexShrink: 0 }}>{block.icon}</span>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--sl-t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.label}</span>
                <input type="range" min={0.1} max={1} step={0.05} value={opacity}
                  onChange={e => setLayerProp(block.id, 'opacity', parseFloat(e.target.value))}
                  style={{ width: 70, accentColor, cursor: 'pointer', flexShrink: 0, touchAction: 'none' }} />
                <span style={{ fontSize: 9, color: 'var(--sl-t3)', width: 22, textAlign: 'right', flexShrink: 0 }}>{Math.round(opacity * 100)}%</span>
                <MiniToggle value={visible} onChange={v => setLayerProp(block.id, 'visible', v)} accent={accentColor} />
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 8, background: `${accentColor}08`, border: `1px solid ${accentColor}20`, fontSize: 10, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
          Position & rotation → bouton ✏️ sur l'aperçu
        </div>
      </div>

      {/* Identité visuelle IA */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <SLabel accent={daProfile ? '#22D96A' : accentColor}>
            {daProfile ? '✓ Identité visuelle analysée' : 'Identité visuelle IA'}
          </SLabel>
          {daProfile && (
            <button onClick={() => dnaFileRef.current?.click()}
              style={{ fontSize: 9.5, color: 'var(--sl-t3)', border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 5, textDecoration: 'underline' }}>
              Ré-analyser
            </button>
          )}
        </div>

        {!daProfile && !analyzing && (
          <div onClick={() => dnaFileRef.current?.click()}
            style={{ padding: '20px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', border: `2px dashed ${accentColor}50`, background: `${accentColor}07`, transition: 'all 0.15s' }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>🎨</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 3 }}>Importez une affiche existante</div>
            <div style={{ fontSize: 10, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
              Notre IA analyse votre identité visuelle<br />et adapte les templates à votre style de club
            </div>
          </div>
        )}

        {analyzing && (
          <div style={{ padding: '20px 16px', borderRadius: 14, background: 'var(--sl-surface)', border: `1px solid ${accentColor}30`, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🎨</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, marginBottom: 6 }}>Analyse de votre identité visuelle…</div>
            <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginBottom: 10 }}>Extraction des couleurs et classification du style</div>
            <div style={{ height: 3, borderRadius: 2, background: 'var(--sl-border)', overflow: 'hidden' }}>
              <motion.div style={{ height: '100%', background: accentColor, borderRadius: 2 }}
                animate={{ width: ['0%', '60%', '90%'] }} transition={{ duration: 2.2, ease: 'easeInOut' }} />
            </div>
          </div>
        )}

        {daProfile && !analyzing && (
          <div style={{ borderRadius: 14, background: 'var(--sl-surface)', border: `1.5px solid ${daProfile.colors?.accent ?? '#8b5cf6'}40`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', height: 10 }}>
              {(daProfile.palette ?? []).map((hex, i) => <div key={i} style={{ flex: 1, background: hex }} />)}
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${daProfile.colors?.accent ?? '#8b5cf6'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {STYLE_ICONS[daProfile.style] || '🎨'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 2 }}>{daProfile.styleLabel}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(daProfile.mood ?? []).slice(0, 3).map(m => (
                      <span key={m} style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: `${daProfile.colors?.accent ?? '#8b5cf6'}18`, color: daProfile.colors?.accent ?? '#8b5cf6', textTransform: 'capitalize' }}>{m}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#22D96A' }}>{Math.round(daProfile.confidence * 100)}%</div>
                  <div style={{ fontSize: 8.5, color: 'var(--sl-t3)' }}>confiance</div>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 6 }}>Palette extraite</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {(daProfile.palette ?? []).map((hex, i) => (
                    <button key={i} onClick={() => set('accentColor', hex)} title={hex}
                      style={{ flex: 1, height: 28, borderRadius: 7, background: hex, border: accentColor === hex ? '2px solid white' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.12s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                  ))}
                </div>
                <div style={{ fontSize: 9, color: 'var(--sl-t3)', marginTop: 4 }}>Cliquer pour appliquer comme couleur principale</div>
              </div>

              {daProfile.templateAffinities?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 6 }}>Templates recommandés</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(daProfile.templateAffinities ?? []).map(tpl => (
                      <span key={tpl} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${daProfile.colors?.accent ?? '#8b5cf6'}14`, color: daProfile.colors?.accent ?? '#8b5cf6', border: `1px solid ${daProfile.colors?.accent ?? '#8b5cf6'}30`, textTransform: 'capitalize' }}>{tpl}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => { clubDNA.applyToStudio(dispatch); set('accentColor', daProfile.colors.accent); }}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800,
                  background: `linear-gradient(135deg, ${daProfile.colors.accent}, ${daProfile.colors.dominant})`,
                  color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Appliquer à mes affiches
              </button>
            </div>
          </div>
        )}

        {analyzeError && (
          <div style={{ marginTop: 8, padding: '7px 11px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, color: '#ef4444' }}>{analyzeError}</div>
        )}

        {daProfile && (
          <button onClick={() => clubDNA.clearDNA()}
            style={{ marginTop: 8, width: '100%', padding: '7px', borderRadius: 9, fontSize: 10, fontWeight: 600, color: 'var(--sl-t3)', background: 'none', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>
            Supprimer l'analyse
          </button>
        )}

        <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, background: `${accentColor}08`, border: `1px solid ${accentColor}15`, fontSize: 9.5, color: 'var(--sl-t3)' }}>
          🧪 Phase 1 — analyse canvas locale. Phase 4 : Claude Vision API.
        </div>

        <input ref={dnaFileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={async e => {
            const file = e.target.files?.[0];
            if (file) await clubDNA.analyzePoster(file);
            e.target.value = '';
          }} />
      </div>
    </div>
  );
}
