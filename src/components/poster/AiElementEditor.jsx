import { useState, useRef, useCallback, useEffect } from 'react';
import PosterRenderer, { BASE_DIMS } from './PosterRenderer.jsx';

const ACCENT = '#a78bfa';
const PREVIEW_W = 300;

export default function AiElementEditor({ elements, initialUid, posterData, templateId, format, bgPresetId, effects, overlayElements, onChange, onRemove, onClose }) {
  const { w, h } = BASE_DIMS[format] || BASE_DIMS.story;
  const scale = PREVIEW_W / w;

  const [activeUid, setActiveUid] = useState(initialUid ?? elements[0]?.uid ?? null);
  const dragRef = useRef(null);

  // Auto-select first element if active one is removed
  useEffect(() => {
    if (!elements.find(e => e.uid === activeUid)) {
      setActiveUid(elements[0]?.uid ?? null);
    }
  }, [elements, activeUid]);

  const activeEl = elements.find(e => e.uid === activeUid) ?? null;

  const handlePointerDown = useCallback((e, uid) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveUid(uid);
    const el = elements.find(x => x.uid === uid);
    dragRef.current = {
      uid,
      startX: e.clientX,
      startY: e.clientY,
      startDx: el?.dx ?? 0,
      startDy: el?.dy ?? 0,
    };
  }, [elements]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const { uid, startX, startY, startDx, startDy } = dragRef.current;
    const newDx = startDx + (e.clientX - startX) / scale;
    const newDy = startDy + (e.clientY - startY) / scale;
    onChange(uid, { dx: newDx, dy: newDy });
  }, [scale, onChange]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  if (!elements.length) return null;

  const el = activeEl;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      userSelect: 'none',
    }}>
      {/* ── Header ── */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: `${ACCENT}18`, border: `1px solid ${ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>Éditeur d'effets IA</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Glissez pour repositionner · Ajustez les paramètres</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Element chips (selector) ── */}
      {elements.length > 1 && (
        <div style={{ flexShrink: 0, padding: '10px 20px', display: 'flex', gap: 8, overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {elements.map((e, i) => {
            const isActive = e.uid === activeUid;
            return (
              <button
                key={e.uid}
                onClick={() => setActiveUid(e.uid)}
                style={{
                  flexShrink: 0,
                  padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  background: isActive ? ACCENT : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${isActive ? ACCENT : 'rgba(255,255,255,0.12)'}`,
                  color: isActive ? '#000' : 'rgba(255,255,255,0.6)',
                }}
              >
                Effet {i + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Preview ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 16 }}>
        <div style={{ position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', borderRadius: 6, overflow: 'hidden' }}>
          <PosterRenderer
            templateId={templateId}
            data={posterData}
            format={format}
            previewWidth={PREVIEW_W}
            bgPresetId={bgPresetId}
            effects={effects}
            overlayElements={overlayElements}
            aiOverlayElements={elements}
          />

          {/* Drag handles — one invisible capture layer + one visual layer per element */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {elements.map((e, i) => {
              const isActive = e.uid === activeUid;
              const tx = (e.dx ?? 0) * scale;
              const ty = (e.dy ?? 0) * scale;
              const sc = e.scale ?? 1;
              const rot = e.rotation ?? 0;
              return (
                <div
                  key={e.uid}
                  onPointerDown={(ev) => handlePointerDown(ev, e.uid)}
                  style={{
                    position: 'absolute', inset: 0,
                    border: `2px dashed ${isActive ? ACCENT : 'rgba(255,255,255,0.2)'}`,
                    cursor: 'move', pointerEvents: 'auto',
                    backgroundColor: isActive ? `${ACCENT}09` : 'transparent',
                    transform: `translate(${tx}px, ${ty}px) scale(${sc}) rotate(${rot}deg)`,
                    transformOrigin: 'center center',
                    transition: dragRef.current?.uid === e.uid ? 'none' : 'border-color 0.12s',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 4, left: 4,
                    background: isActive ? ACCENT : 'rgba(255,255,255,0.5)',
                    color: '#000', fontSize: 8, fontWeight: 800,
                    padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', pointerEvents: 'none',
                  }}>
                    Effet {i + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom controls ── */}
      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}>
        {el ? (
          <div style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: ACCENT, letterSpacing: '0.06em' }}>Effet {elements.indexOf(el) + 1}</span>
              <div style={{ display: 'flex', gap: 7 }}>
                {/* Reset position */}
                <button
                  onClick={() => onChange(el.uid, { dx: 0, dy: 0, scale: 1, rotation: 0 })}
                  style={{ fontSize: 10, fontWeight: 600, padding: '5px 11px', borderRadius: 7, cursor: 'pointer', background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)' }}
                >
                  Réinitialiser
                </button>
                {/* Above / Below toggle */}
                <button
                  onClick={() => onChange(el.uid, { above: !el.above })}
                  style={{ fontSize: 10, fontWeight: 600, padding: '5px 11px', borderRadius: 7, cursor: 'pointer', background: 'none', border: `1px solid ${el.above ? `${ACCENT}60` : 'rgba(255,255,255,0.15)'}`, color: el.above ? ACCENT : 'rgba(255,255,255,0.55)' }}
                >
                  {el.above ? 'Au-dessus' : 'En-dessous'}
                </button>
                {/* Delete */}
                <button
                  onClick={() => { onRemove(el.uid); }}
                  style={{ fontSize: 10, fontWeight: 600, padding: '5px 11px', borderRadius: 7, cursor: 'pointer', background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.8)' }}
                >
                  Supprimer
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px 16px' }}>
              {[
                { label: 'Opacité',   key: 'opacity',  min: 0.1, max: 1,    step: 0.01, def: 0.85, fmt: v => `${Math.round(v * 100)}%` },
                { label: 'Échelle',   key: 'scale',    min: 0.3, max: 3,    step: 0.01, def: 1,    fmt: v => `${Math.round(v * 100)}%` },
                { label: 'Rotation',  key: 'rotation', min: -180, max: 180,  step: 1,   def: 0,    fmt: v => `${Math.round(v)}°` },
              ].map(({ label, key, min, max, step, def, fmt }) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>{fmt(el[key] ?? def)}</span>
                  </div>
                  <input
                    type="range"
                    min={min} max={max} step={step}
                    value={el[key] ?? def}
                    onChange={e => onChange(el.uid, { [key]: parseFloat(e.target.value) })}
                    style={{ width: '100%', accentColor: ACCENT, cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
            Aucun effet actif
          </div>
        )}
      </div>
    </div>
  );
}
