import { useState, useRef, useCallback, useEffect } from 'react';
import PosterRenderer, { BASE_DIMS } from './PosterRenderer.jsx';

const BLOCK_IDS = ['title', 'champ', 'home-team', 'away-team', 'teams', 'info', 'meta', 'tagline'];
const FONT_FAMILIES = [
  { label: 'Par défaut', value: '' },
  { label: 'Inter', value: '"Inter", sans-serif' },
  { label: 'Oswald', value: '"Oswald", sans-serif' },
  { label: 'Bebas Neue', value: '"Bebas Neue", sans-serif' },
  { label: 'Montserrat', value: '"Montserrat", sans-serif' },
  { label: 'Roboto Condensed', value: '"Roboto Condensed", sans-serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
  { label: 'Anton', value: '"Anton", sans-serif' },
  { label: 'Barlow Condensed', value: '"Barlow Condensed", sans-serif' },
];
const BLOCK_LABELS = {
  title: 'Titre',
  champ: 'Compétition',
  'home-team': 'Domicile',
  'away-team': 'Visiteur',
  teams: 'Équipes',
  info: 'Infos tournoi',
  meta: 'Date · Lieu',
  tagline: 'Accroche',
};
const ACCENT = '#63FFB8';
const SNAP_THRESHOLD = 8;
const PREVIEW_W = 300;

export default function PosterEditor({ templateId, data, format, transforms, onChange, onClose }) {
  const { w, h } = BASE_DIMS[format] || BASE_DIMS.story;
  const previewH = Math.round(h * (PREVIEW_W / w));
  const scale = PREVIEW_W / w;

  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const dragRef = useRef(null);

  const [activeBlock, setActiveBlock] = useState(null);
  const [blockRects, setBlockRects] = useState({});
  const [snapGuides, setSnapGuides] = useState({ x: false, y: false });

  // Measure block positions after each render where transforms may have changed
  useEffect(() => {
    if (!outerRef.current) return;
    const outerRect = outerRef.current.getBoundingClientRect();
    const rects = {};
    BLOCK_IDS.forEach(id => {
      const el = outerRef.current.querySelector(`[data-block="${id}"]`);
      if (!el) return;
      const elRect = el.getBoundingClientRect();

      // Walk all text nodes + SVG/img to get the true visual bounding box
      let minL = Infinity, minT = Infinity, maxR = -Infinity, maxB = -Infinity;
      const textWalker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = textWalker.nextNode())) {
        if (!node.textContent.trim()) continue;
        try {
          const r = document.createRange();
          r.selectNodeContents(node);
          const cr = r.getBoundingClientRect();
          if (cr.width > 0 && cr.height > 0) {
            minL = Math.min(minL, cr.left); minT = Math.min(minT, cr.top);
            maxR = Math.max(maxR, cr.right); maxB = Math.max(maxB, cr.bottom);
          }
        } catch (_) {}
      }
      el.querySelectorAll('svg, img').forEach(child => {
        const cr = child.getBoundingClientRect();
        if (cr.width > 0 && cr.height > 0) {
          minL = Math.min(minL, cr.left); minT = Math.min(minT, cr.top);
          maxR = Math.max(maxR, cr.right); maxB = Math.max(maxB, cr.bottom);
        }
      });

      const pad = 4;
      const tight = (minL < Infinity) ? {
        left: minL - outerRect.left - pad,
        top: minT - outerRect.top - pad,
        width: maxR - minL + pad * 2,
        height: maxB - minT + pad * 2,
      } : null;

      rects[id] = tight ?? {
        left: elRect.left - outerRect.left,
        top: elRect.top - outerRect.top,
        width: elRect.width,
        height: elRect.height,
      };
    });
    setBlockRects(rects);
  }, [transforms, templateId, format]);

  const alignBlock = useCallback((direction) => {
    const rect = blockRects[activeBlock];
    if (!rect || !activeBlock) return;
    const t = transforms[activeBlock] || {};
    const currentDx = t.dx ?? 0;
    const naturalLeft = rect.left - currentDx * scale;
    const pad = 12; // px in preview space
    let newDx;
    if (direction === 'left')  newDx = (pad - naturalLeft) / scale;
    else if (direction === 'right') newDx = (PREVIEW_W - pad - rect.width - naturalLeft) / scale;
    else newDx = (PREVIEW_W / 2 - naturalLeft - rect.width / 2) / scale;
    onChange(activeBlock, { ...t, dx: newDx });
  }, [activeBlock, blockRects, transforms, scale, onChange]);

  const handlePointerDown = useCallback((e, blockId) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveBlock(blockId);
    const t = transforms[blockId] || {};
    dragRef.current = {
      blockId,
      startX: e.clientX,
      startY: e.clientY,
      startDx: t.dx ?? 0,
      startDy: t.dy ?? 0,
    };
  }, [transforms]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const { blockId, startX, startY, startDx, startDy } = dragRef.current;
    let newDx = startDx + (e.clientX - startX) / scale;
    let newDy = startDy + (e.clientY - startY) / scale;
    const guides = { x: false, y: false };
    if (Math.abs(newDx) < SNAP_THRESHOLD) { newDx = 0; guides.x = true; }
    if (Math.abs(newDy) < SNAP_THRESHOLD) { newDy = 0; guides.y = true; }
    setSnapGuides(guides);
    onChange(blockId, { ...(transforms[blockId] || {}), dx: newDx, dy: newDy });
  }, [scale, transforms, onChange]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setSnapGuides({ x: false, y: false });
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const t = activeBlock ? (transforms[activeBlock] || {}) : {};

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.93)',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: `${ACCENT}18`, border: `1px solid ${ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>Éditeur visuel</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Faites glisser les éléments pour les repositionner</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Preview area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>

        {/* Snap guide vertical (x=0) */}
        {snapGuides.x && (
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: '50%', width: 1,
            background: `${ACCENT}70`,
            pointerEvents: 'none', zIndex: 20,
          }} />
        )}
        {/* Snap guide horizontal (y=0) */}
        {snapGuides.y && (
          <div style={{
            position: 'absolute', left: 0, right: 0,
            top: '50%', height: 1,
            background: `${ACCENT}70`,
            pointerEvents: 'none', zIndex: 20,
          }} />
        )}

        {/* Poster + handles wrapper */}
        <div style={{ position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', borderRadius: 6, overflow: 'hidden' }}>
          <PosterRenderer
            templateId={templateId}
            data={data}
            format={format}
            previewWidth={PREVIEW_W}
            outerRef={outerRef}
            innerRef={innerRef}
            transforms={transforms}
          />

          {/* Block handles — absolutely positioned over poster */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {BLOCK_IDS.map((blockId) => {
              const rect = blockRects[blockId];
              if (!rect || rect.width < 2 || rect.height < 2) return null;
              const isActive = activeBlock === blockId;
              const blockTransform = transforms[blockId] || {};
              if (blockTransform.hidden) return null;

              return (
                <div
                  key={blockId}
                  onPointerDown={(e) => handlePointerDown(e, blockId)}
                  style={{
                    position: 'absolute',
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                    border: `1.5px dashed ${isActive ? ACCENT : 'rgba(255,255,255,0.3)'}`,
                    borderRadius: 3,
                    cursor: 'move',
                    boxSizing: 'border-box',
                    pointerEvents: 'auto',
                    backgroundColor: isActive ? `${ACCENT}08` : 'transparent',
                    transition: 'border-color 0.12s, background-color 0.12s',
                  }}
                >
                  {/* Label chip */}
                  <div style={{
                    position: 'absolute',
                    top: -18,
                    left: 0,
                    background: isActive ? ACCENT : 'rgba(255,255,255,0.55)',
                    color: '#000',
                    fontSize: 8,
                    fontWeight: 800,
                    padding: '2px 5px',
                    borderRadius: 3,
                    letterSpacing: '0.06em',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.4,
                  }}>
                    {BLOCK_LABELS[blockId]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom panel */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        minHeight: 120,
      }}>
        {activeBlock ? (
          <div style={{ padding: '14px 20px' }}>
            {/* Panel header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: ACCENT, letterSpacing: '0.06em' }}>
                {BLOCK_LABELS[activeBlock]}
              </span>
              <div style={{ display: 'flex', gap: 5 }}>
                {/* Alignment buttons */}
                {[
                  { dir: 'left', title: 'Aligner à gauche', icon: <><rect x="3" y="5" width="12" height="2" rx="1" fill="currentColor"/><rect x="3" y="9" width="18" height="2" rx="1" fill="currentColor"/><rect x="3" y="13" width="10" height="2" rx="1" fill="currentColor"/></> },
                  { dir: 'center', title: 'Centrer', icon: <><rect x="6" y="5" width="12" height="2" rx="1" fill="currentColor"/><rect x="3" y="9" width="18" height="2" rx="1" fill="currentColor"/><rect x="7" y="13" width="10" height="2" rx="1" fill="currentColor"/></> },
                  { dir: 'right', title: 'Aligner à droite', icon: <><rect x="9" y="5" width="12" height="2" rx="1" fill="currentColor"/><rect x="3" y="9" width="18" height="2" rx="1" fill="currentColor"/><rect x="11" y="13" width="10" height="2" rx="1" fill="currentColor"/></> },
                ].map(({ dir, title, icon }) => (
                  <button
                    key={dir}
                    onClick={() => alignBlock(dir)}
                    title={title}
                    style={{
                      width: 28, height: 28, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'none', border: '1px solid rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24">{icon}</svg>
                  </button>
                ))}
                <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
                <button
                  onClick={() => onChange(activeBlock, {})}
                  style={{
                    fontSize: 10, fontWeight: 600, padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
                    background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => onChange(activeBlock, { ...(transforms[activeBlock] || {}), hidden: !(transforms[activeBlock]?.hidden) })}
                  style={{
                    fontSize: 10, fontWeight: 600, padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
                    background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  {transforms[activeBlock]?.hidden ? 'Afficher' : 'Masquer'}
                </button>
              </div>
            </div>

            {/* Font controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 10 }}>
              {/* Font size */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Taille</span>
                  <span style={{ fontSize: 10, color: t.fontSize != null ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                    {t.fontSize != null ? `${Math.round(t.fontSize)}px` : 'Auto'}
                  </span>
                </div>
                <input
                  type="range"
                  min={8} max={120} step={1}
                  value={t.fontSize ?? 32}
                  disabled={t.fontSize == null}
                  onChange={e => onChange(activeBlock, { ...(transforms[activeBlock] || {}), fontSize: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', accentColor: ACCENT, cursor: t.fontSize == null ? 'default' : 'pointer', opacity: t.fontSize == null ? 0.3 : 1 }}
                />
                <button
                  onClick={() => {
                    if (t.fontSize != null) {
                      const { fontSize: _, ...rest } = transforms[activeBlock] || {};
                      onChange(activeBlock, rest);
                    } else {
                      onChange(activeBlock, { ...(transforms[activeBlock] || {}), fontSize: 32 });
                    }
                  }}
                  style={{ marginTop: 4, fontSize: 9, fontWeight: 600, color: t.fontSize != null ? ACCENT : 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {t.fontSize != null ? '↩ Auto' : '+ Personnaliser'}
                </button>
              </div>
              {/* Font family */}
              <div>
                <div style={{ marginBottom: 5 }}>
                  <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Police</span>
                </div>
                <select
                  value={t.fontFamily ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    onChange(activeBlock, { ...(transforms[activeBlock] || {}), fontFamily: val || undefined });
                  }}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.8)', borderRadius: 6, padding: '5px 8px', fontSize: 10,
                    cursor: 'pointer', outline: 'none',
                  }}
                >
                  {FONT_FAMILIES.map(f => (
                    <option key={f.value} value={f.value} style={{ background: '#1a1a2e' }}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px 16px' }}>
              {[
                { label: 'Échelle', key: 'scale', min: 0.4, max: 2, step: 0.01, def: 1, fmt: v => `${Math.round(v * 100)}%` },
                { label: 'Opacité', key: 'opacity', min: 0, max: 1, step: 0.01, def: 1, fmt: v => `${Math.round(v * 100)}%` },
                { label: 'Rotation', key: 'rotation', min: -180, max: 180, step: 1, def: 0, fmt: v => `${Math.round(v)}°` },
              ].map(({ label, key, min, max, step, def, fmt }) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>{fmt(t[key] ?? def)}</span>
                  </div>
                  <input
                    type="range"
                    min={min} max={max} step={step}
                    value={t[key] ?? def}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      onChange(activeBlock, { ...(transforms[activeBlock] || {}), [key]: val });
                    }}
                    style={{ width: '100%', accentColor: ACCENT, cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.28)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M5 9l4-4 4 4"/><path d="M5 15l4 4 4-4"/>
                <path d="M15 5l4 4-4 4"/><path d="M19 9H9"/>
              </svg>
              <span style={{ fontSize: 12, lineHeight: 1.5 }}>Sélectionnez un bloc sur l'affiche pour le modifier</span>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '11px 22px', borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 8,
                minHeight: 44,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Fermer l'éditeur
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
