/**
 * BackgroundPanelTab — Éléments décoratifs, éléments IA, teinte d'ambiance,
 * image de fond (couleur/URL/upload), fonds IA, sponsor.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { SLabel } from '../PosterAtoms.jsx';
import { ELEMENT_LIBRARY } from '../posterElements.jsx';
import { TINT_PALETTE } from '../posterConstants.js';
import { BG_PROMPT_SUGGESTIONS, ELEMENT_PROMPT_SUGGESTIONS } from '../../../lib/posterVariants.js';

export default function BackgroundPanelTab({ ps }) {
  const {
    accentColor, overlayElements, set, dispatch,
    addOverlayElement, removeOverlayElement, updateOverlayElement,
    aiOverlayElements, addAiOverlay, removeAiOverlay, updateAiOverlay,
    savedAiEls, addSavedEl, removeSavedEl,
    setAiElEditorUid,
    aiBgLoading, aiBgResult, customPrompt, setCustomPrompt, generateBg,
    aiElLoading, elementPrompt, setElementPrompt, generateElement,
    aiGenerateBlocked, onUpgradeRequired,
    bgTint, bgTintOp, bgMode, bgSrc, bgUrl, bgErr, bgFileRef,
    applyBgUrl, readFile,
    sponsorSrc, sponsorRef,
    pageSponsors, useBandSponsors, setUseBandSponsors, selectedSponsorIds, setSelectedSponsorIds,
    savedAiBgs, addSavedBg, removeSavedBg,
    clubDNA, event,
  } = ps;

  const dnaForBg = clubDNA.daProfile || { style: 'classic', mood: [], colors: { accent: accentColor } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Éléments décoratifs */}
      <div>
        <SLabel accent={accentColor}>Éléments décoratifs</SLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {ELEMENT_LIBRARY.map(el => (
            <button key={el.id} onClick={() => addOverlayElement(el.id)}
              style={{ padding: '8px 4px 7px', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', height: 28, borderRadius: 6, background: el.preview, flexShrink: 0 }} />
              <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--sl-t1)', lineHeight: 1, textAlign: 'center' }}>{el.label}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--sl-t3)', lineHeight: 1.5 }}>Cliquer pour ajouter sur l'affiche — régler ci-dessous</div>
      </div>

      {/* Active elements list */}
      {(overlayElements || []).length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <SLabel accent={accentColor}>Éléments actifs ({(overlayElements || []).length})</SLabel>
            <button onClick={() => set('overlayElements', [])}
              style={{ fontSize: 9.5, color: 'var(--sl-t3)', border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 5, textDecoration: 'underline' }}>Tout effacer</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(overlayElements || []).map(el => {
              const meta = ELEMENT_LIBRARY.find(e => e.id === el.type);
              return (
                <div key={el.uid} style={{ padding: '10px 12px', borderRadius: 12, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{meta?.icon}</span>
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta?.label}</span>
                    <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--sl-border)', flexShrink: 0 }}>
                      {[['Fond', false], ['Dessus', true]].map(([lbl, val]) => (
                        <button key={String(lbl)} onClick={() => updateOverlayElement(el.uid, { above: val })}
                          style={{ padding: '3px 9px', border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 800, backgroundColor: el.above === val ? accentColor : 'var(--sl-surface)', color: el.above === val ? '#fff' : 'var(--sl-t3)', transition: 'all 0.12s' }}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => removeOverlayElement(el.uid)}
                      style={{ width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.10)', color: '#ef4444', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ position: 'relative', width: 26, height: 26, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--sl-border)', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', inset: 0, background: el.color }} />
                      <input type="color" value={el.color} onChange={e => updateOverlayElement(el.uid, { color: e.target.value })}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                    </div>
                    <input type="range" min={0.05} max={1} step={0.05} value={el.opacity}
                      onChange={e => updateOverlayElement(el.uid, { opacity: parseFloat(e.target.value) })}
                      style={{ flex: 1, accentColor, cursor: 'pointer' }} />
                    <span style={{ fontSize: 10, color: 'var(--sl-t3)', width: 28, textAlign: 'right', fontWeight: 700, flexShrink: 0 }}>{Math.round(el.opacity * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Éléments IA */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, marginTop: 2 }}>
          <div style={{ width: 2, height: 13, borderRadius: 2, background: accentColor, flexShrink: 0 }} />
          <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: accentColor }}>Éléments IA</span>
          <div style={{ flex: 1, height: 1, background: 'var(--sl-border)' }} />
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 700 }}>Screen blend</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {ELEMENT_PROMPT_SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setElementPrompt(s)}
              style={{ padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: `1px solid ${elementPrompt === s ? accentColor : 'var(--sl-border-s)'}`, background: elementPrompt === s ? `${accentColor}18` : 'var(--sl-surface)', color: elementPrompt === s ? accentColor : 'var(--sl-t2)', transition: 'all 0.12s' }}>
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input value={elementPrompt} onChange={e => setElementPrompt(e.target.value)} placeholder="Décris l'effet décoratif…" disabled={aiElLoading}
            onKeyDown={e => { if (e.key !== 'Enter') return; generateElement({ accentColor, onSuccess: res => addAiOverlay({ imageUrl: res.imageUrl, prompt: res.prompt }) }); }}
            style={{ flex: 1, padding: '9px 11px', borderRadius: 10, fontSize: 11, fontWeight: 500, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none' }} />
          <button
            disabled={aiElLoading || !elementPrompt.trim()}
            onClick={() => aiGenerateBlocked ? onUpgradeRequired?.() : generateElement({ accentColor, onSuccess: res => addAiOverlay({ imageUrl: res.imageUrl, prompt: res.prompt }) })}
            title={aiGenerateBlocked ? 'Quota mensuel atteint — passez au plan supérieur' : undefined}
            style={{ padding: '9px 13px', borderRadius: 10, fontSize: 12, fontWeight: 800, flexShrink: 0, cursor: (aiElLoading || !elementPrompt.trim()) ? 'not-allowed' : 'pointer', background: aiGenerateBlocked ? 'rgba(148,163,184,0.2)' : 'linear-gradient(135deg, #a855f7, #6366f1)', color: aiGenerateBlocked ? 'var(--sl-t3)' : '#fff', border: aiGenerateBlocked ? '1.5px dashed rgba(148,163,184,0.5)' : 'none', opacity: (aiElLoading || !elementPrompt.trim()) ? 0.5 : 1 }}>
            {aiElLoading ? '⏳' : aiGenerateBlocked ? '🔒' : '✨'}
          </button>
        </div>
        {aiElLoading && <div style={{ fontSize: 10, color: '#a78bfa', textAlign: 'center', marginBottom: 6, fontWeight: 600 }}>Génération en cours… (30-60s)</div>}

        {(aiOverlayElements || []).length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)' }}>Actifs ({(aiOverlayElements || []).length})</span>
              <button onClick={() => dispatch({ type: 'PATCH', payload: { aiOverlayElements: [] } })}
                style={{ fontSize: 9.5, color: 'var(--sl-t3)', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Tout effacer</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {(aiOverlayElements || []).map(el => {
                const isSaved = savedAiEls.some(s => s.imageUrl === el.imageUrl);
                return (
                  <div key={el.uid} style={{ borderRadius: 10, border: '1px solid var(--sl-border)', overflow: 'hidden', background: 'var(--sl-surface)' }}>
                    <div style={{ position: 'relative', height: 90, background: '#000' }}>
                      <img src={el.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <button onClick={() => updateAiOverlay(el.uid, { above: !el.above })}
                        style={{ position: 'absolute', bottom: 4, left: 4, padding: '2px 7px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 8, fontWeight: 800, background: el.above ? accentColor : 'rgba(0,0,0,0.65)', color: el.above ? '#000' : '#fff' }}>
                        {el.above ? 'Dessus' : 'Fond'}
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--sl-border)' }}>
                      <button onClick={() => setAiElEditorUid(el.uid)} style={{ padding: '9px 0', border: 'none', borderRight: '1px solid var(--sl-border)', cursor: 'pointer', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                      <button onClick={() => addSavedEl({ imageUrl: el.imageUrl, prompt: el.prompt })}
                        style={{ padding: '9px 0', border: 'none', borderRight: '1px solid var(--sl-border)', cursor: 'pointer', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: isSaved ? '#ef4444' : 'var(--sl-t3)' }}>♥</button>
                      <button onClick={() => removeAiOverlay(el.uid)}
                        style={{ padding: '9px 0', border: 'none', cursor: 'pointer', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#ef4444' }}>✕</button>
                    </div>
                    <div style={{ padding: '5px 8px 7px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <input type="range" min={0.1} max={1} step={0.05} value={el.opacity ?? 0.85}
                        onChange={e => updateAiOverlay(el.uid, { opacity: parseFloat(e.target.value) })}
                        style={{ flex: 1, accentColor, cursor: 'pointer' }} />
                      <span style={{ fontSize: 9, color: 'var(--sl-t3)', fontWeight: 700, width: 24, textAlign: 'right', flexShrink: 0 }}>{Math.round((el.opacity ?? 0.85) * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {savedAiEls.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 6 }}>Effets enregistrés ({savedAiEls.length})</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {savedAiEls.map(el => (
                <div key={el.id} onClick={() => addAiOverlay({ imageUrl: el.imageUrl, prompt: el.prompt })}
                  style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1.5px solid var(--sl-border-s)', cursor: 'pointer', background: '#000', height: 72 }}>
                  <img src={el.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>+ Ajouter</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeSavedEl(el.id); }}
                    style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.85)', color: '#fff', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Teinte d'ambiance */}
      <div>
        <SLabel>Teinte d'ambiance</SLabel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <button onClick={() => set('bgTint', '')}
            style={{ width: 28, height: 28, borderRadius: 8, cursor: 'pointer', border: `1.5px dashed ${bgTint === '' ? accentColor : 'var(--sl-border-s)'}`, background: bgTint === '' ? `${accentColor}14` : 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--sl-t3)' }}>✕</button>
          {TINT_PALETTE.map(c => (
            <button key={c} onClick={() => { set('bgTint', c); if (bgTintOp === 0) set('bgTintOp', 0.25); }}
              style={{ width: 28, height: 28, borderRadius: 8, cursor: 'pointer', border: 'none', background: c, boxShadow: bgTint === c ? `0 0 0 2px var(--sl-card), 0 0 0 4px ${c}` : 'none', transition: 'box-shadow 0.12s' }} />
          ))}
          <div style={{ position: 'relative', width: 28, height: 28, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--sl-border)', flexShrink: 0 }}>
            {bgTint && <div style={{ position: 'absolute', inset: 0, background: bgTint }} />}
            {!bgTint && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎨</div>}
            <input type="color" value={bgTint || '#000000'} onChange={e => { set('bgTint', e.target.value); if (bgTintOp === 0) set('bgTintOp', 0.25); }}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}/>
          </div>
        </div>
        {bgTint && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 600, whiteSpace: 'nowrap' }}>Intensité</span>
            <input type="range" min={0} max={0.7} step={0.05} value={bgTintOp} onChange={e => set('bgTintOp', parseFloat(e.target.value))} style={{ flex: 1, accentColor, cursor: 'pointer' }}/>
            <span style={{ fontSize: 10, color: 'var(--sl-t3)', width: 30, textAlign: 'right', fontWeight: 700 }}>{Math.round(bgTintOp * 100)}%</span>
          </div>
        )}
      </div>

      {/* Image de fond */}
      <div>
        <SLabel>Image de fond</SLabel>
        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
          {[['color', 'Couleur'], ['url', 'URL'], ['upload', 'Fichier']].map(([id, label]) => (
            <button key={id}
              onClick={() => dispatch({ type: 'PATCH', payload: id === 'color' ? { bgMode: id, bgSrc: '', bgErr: false } : { bgMode: id } })}
              style={{ padding: '6px 12px', borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${bgMode === id ? accentColor : 'var(--sl-border-s)'}`, backgroundColor: bgMode === id ? `${accentColor}16` : 'var(--sl-surface)', color: bgMode === id ? accentColor : 'var(--sl-t2)' }}>
              {label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {bgMode === 'url' && (
            <motion.div key="url" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input type="text" value={bgUrl} onChange={e => set('bgUrl', e.target.value)} onKeyDown={e => e.key === 'Enter' && applyBgUrl()} placeholder="https://…"
                style={{ flex: 1, padding: '9px 11px', borderRadius: 10, fontSize: 12, border: `1px solid ${bgErr ? '#ef4444' : 'var(--sl-border-s)'}`, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none' }} />
              <button onClick={applyBgUrl} style={{ padding: '9px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: accentColor, color: '#fff', border: 'none', cursor: 'pointer' }}>OK</button>
              {bgSrc && <button onClick={() => dispatch({ type: 'PATCH', payload: { bgSrc: '', bgErr: false } })} style={{ padding: '9px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
            </motion.div>
          )}
          {bgMode === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button onClick={() => bgFileRef.current?.click()}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: bgSrc ? `${accentColor}14` : 'var(--sl-surface)', border: bgSrc ? `1.5px solid ${accentColor}` : '1.5px dashed var(--sl-border-s)', color: bgSrc ? accentColor : 'var(--sl-t2)' }}>
                {bgSrc ? '✓ Image chargée' : '+ Choisir une image'}
              </button>
              {bgSrc && <button onClick={() => set('bgSrc', '')} style={{ padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
              <input ref={bgFileRef} type="file" accept="image/*" onChange={e => readFile(e, v => set('bgSrc', v))} style={{ display: 'none' }} />
            </motion.div>
          )}
        </AnimatePresence>
        {bgErr && <div style={{ padding: '7px 12px', borderRadius: 9, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, color: '#ef4444' }}>Image inaccessible — vérifiez le lien ou uploadez un fichier.</div>}
      </div>

      {/* Fonds IA */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, marginTop: 2 }}>
          <div style={{ width: 2, height: 13, borderRadius: 2, background: accentColor, flexShrink: 0 }} />
          <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: accentColor }}>Fonds IA</span>
          <div style={{ flex: 1, height: 1, background: 'var(--sl-border)' }} />
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 700 }}>Flux · IA</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {BG_PROMPT_SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setCustomPrompt(s)}
              style={{ padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: `1px solid ${customPrompt === s ? accentColor : 'var(--sl-border-s)'}`, background: customPrompt === s ? `${accentColor}18` : 'var(--sl-surface)', color: customPrompt === s ? accentColor : 'var(--sl-t2)', transition: 'all 0.12s' }}>
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Décris le fond que tu veux…" disabled={aiBgLoading}
            onKeyDown={e => { if (e.key !== 'Enter') return; generateBg({ dnaForBg, eventSport: event?.sport, onSuccess: imageUrl => dispatch({ type: 'PATCH', payload: { bgSrc: imageUrl, bgMode: 'url', bgErr: false, bgPreset: '' } }) }); }}
            style={{ flex: 1, padding: '9px 11px', borderRadius: 10, fontSize: 11, fontWeight: 500, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none' }} />
          <button
            disabled={aiBgLoading}
            onClick={() => aiGenerateBlocked ? onUpgradeRequired?.() : generateBg({ dnaForBg, eventSport: event?.sport, onSuccess: imageUrl => dispatch({ type: 'PATCH', payload: { bgSrc: imageUrl, bgMode: 'url', bgErr: false, bgPreset: '' } }) })}
            title={aiGenerateBlocked ? 'Quota mensuel atteint — passez au plan supérieur' : undefined}
            style={{ padding: '9px 13px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: aiBgLoading ? 'not-allowed' : 'pointer', background: aiGenerateBlocked ? 'rgba(148,163,184,0.2)' : 'linear-gradient(135deg, #a855f7, #6366f1)', color: aiGenerateBlocked ? 'var(--sl-t3)' : '#fff', border: aiGenerateBlocked ? '1.5px dashed rgba(148,163,184,0.5)' : 'none', opacity: aiBgLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {aiBgLoading ? '⏳' : aiGenerateBlocked ? '🔒' : '✨'}
          </button>
        </div>

        {aiBgLoading && <div style={{ fontSize: 10, color: '#a78bfa', textAlign: 'center', marginBottom: 8, fontWeight: 600 }}>Génération en cours… (30-60s)</div>}

        {aiBgResult && (
          <div style={{ marginBottom: 8 }}>
            {aiBgResult.imageUrl ? (
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1.5px solid rgba(139,92,246,0.4)' }}>
                <img src={aiBgResult.imageUrl} alt="Fond IA" style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', top: 5, left: 5, fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'rgba(0,0,0,0.6)', color: '#fff' }}>Pollinations IA · Gratuit</div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 5, padding: 6, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                  <button onClick={() => dispatch({ type: 'PATCH', payload: { bgSrc: aiBgResult.imageUrl, bgMode: 'url', bgErr: false, bgPreset: '' } })}
                    style={{ flex: 1, padding: '5px 0', borderRadius: 7, fontSize: 10, fontWeight: 700, background: '#fff', color: '#111', border: 'none', cursor: 'pointer' }}>Appliquer</button>
                  <button onClick={() => addSavedBg({ imageUrl: aiBgResult.imageUrl, prompt: aiBgResult.prompt, provider: aiBgResult.provider })}
                    style={{ flex: 1, padding: '5px 0', borderRadius: 7, fontSize: 10, fontWeight: 700, background: accentColor, color: '#fff', border: 'none', cursor: 'pointer' }}>Enregistrer</button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '8px 10px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 10, color: '#ef4444' }}>Génération échouée ou timeout — réessaie.</div>
            )}
          </div>
        )}

        {savedAiBgs.length > 0 && (
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 6 }}>Fonds enregistrés ({savedAiBgs.length})</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {savedAiBgs.map(bg => (
                <div key={bg.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${bgSrc === bg.imageUrl ? accentColor : 'var(--sl-border-s)'}`, cursor: 'pointer' }}
                  onClick={() => dispatch({ type: 'PATCH', payload: { bgSrc: bg.imageUrl, bgMode: 'url', bgErr: false, bgPreset: '' } })}>
                  <img src={bg.imageUrl} alt="" style={{ width: '100%', height: 56, objectFit: 'cover', display: 'block' }} />
                  {bgSrc === bg.imageUrl && (
                    <div style={{ position: 'absolute', top: 3, left: 3, width: 14, height: 14, borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 8, color: '#fff', fontWeight: 900 }}>✓</span>
                    </div>
                  )}
                  <button onClick={e => { e.stopPropagation(); removeSavedBg(bg.id); }}
                    style={{ position: 'absolute', top: 2, right: 2, width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.85)', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Logo sponsor unique */}
      <div>
        <SLabel>Logo sponsor unique (upload)</SLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => sponsorRef.current?.click()}
            style={{ flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: sponsorSrc ? `${accentColor}14` : 'var(--sl-surface)', border: sponsorSrc ? `1.5px solid ${accentColor}` : '1.5px dashed var(--sl-border-s)', color: sponsorSrc ? accentColor : 'var(--sl-t2)' }}>
            {sponsorSrc ? '✓ Logo chargé' : '+ Charger un logo'}
          </button>
          {sponsorSrc && <button onClick={() => set('sponsorSrc', '')} style={{ padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
          <input ref={sponsorRef} type="file" accept="image/*" onChange={e => readFile(e, v => set('sponsorSrc', v))} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Bandeau multi-sponsors */}
      {pageSponsors.length > 0 && (
        <div style={{ borderTop: '1px solid var(--sl-border)', paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <SLabel style={{ margin: 0 }}>🤝 Bandeau partenaires</SLabel>
            <button onClick={() => setUseBandSponsors(v => !v)}
              style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: useBandSponsors ? 'rgba(34,197,94,0.15)' : 'var(--sl-surface)', color: useBandSponsors ? '#16a34a' : 'var(--sl-t3)' }}>
              {useBandSponsors ? '● Actif' : '○ Inactif'}
            </button>
          </div>
          {useBandSponsors && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 10, color: 'var(--sl-t3)', margin: 0 }}>Tous sélectionnés par défaut — décochez pour exclure :</p>
              {pageSponsors.filter(s => s.showInPoster).map(s => {
                const isSelected = selectedSponsorIds.size === 0 || selectedSponsorIds.has(s.id);
                return (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 8px', borderRadius: 8, backgroundColor: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent' }}>
                    <input type="checkbox" checked={isSelected}
                      onChange={() => {
                        setSelectedSponsorIds(prev => {
                          const next = new Set(prev.size === 0 ? pageSponsors.map(x => x.id) : prev);
                          if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                          return next;
                        });
                      }}
                      style={{ width: 14, height: 14 }} />
                    {(s.logoWhite || s.logo) && (
                      <div style={{ width: 28, height: 20, backgroundColor: '#111', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img src={s.logoWhite || s.logo} alt="" style={{ maxWidth: 24, maxHeight: 16, objectFit: 'contain' }} />
                      </div>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--sl-t1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
