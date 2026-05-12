import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const FORMATS = [
  { id: 'story', label: 'Story', ratio: '9/16', cw: 540,  ch: 960  },
  { id: 'post',  label: 'Post',  ratio: '1/1',  cw: 1080, ch: 1080 },
];

const THEMES = [
  { id: 'dark',     label: 'Navy',    bg: '#0a1628', text: '#deeeff', sub: 'rgba(222,238,255,0.55)' },
  { id: 'light',    label: 'Blanc',   bg: '#f8fafd', text: '#0f1e3a', sub: '#475569' },
  { id: 'sport',    label: 'Sport',   bg: null,      text: '#ffffff', sub: 'rgba(255,255,255,0.7)' },
  { id: 'midnight', label: 'Minuit',  bg: '#05080f', text: '#ffffff', sub: 'rgba(255,255,255,0.55)' },
];

// ── Canvas drawing ────────────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCanvas(canvas, event, format, theme, sportColor) {
  const ctx = canvas.getContext('2d');
  const { cw, ch } = format;
  canvas.width = cw;
  canvas.height = ch;

  const bgColor = theme.id === 'sport' ? sportColor : theme.bg;
  const accent  = theme.id === 'sport' ? 'rgba(255,255,255,0.9)' : sportColor;
  const tc      = theme.text;
  const sc      = theme.sub;

  // ── Background ──────────────────────────────────────────────────────────────
  if (theme.id === 'midnight') {
    const grad = ctx.createLinearGradient(0, 0, cw * 0.6, ch);
    grad.addColorStop(0, '#050810');
    grad.addColorStop(0.5, '#0d1526');
    grad.addColorStop(1, '#050810');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = bgColor;
  }
  ctx.fillRect(0, 0, cw, ch);

  // Decorative accent circle (top-right bleed)
  ctx.fillStyle = (theme.id === 'sport' ? 'rgba(255,255,255,0.06)' : sportColor + '10');
  ctx.beginPath();
  ctx.arc(cw * 1.1, -ch * 0.05, ch * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // ── Format-specific layout ──────────────────────────────────────────────────
  if (format.id === 'story') {
    drawStory(ctx, event, cw, ch, tc, sc, accent, sportColor, theme);
  } else {
    drawPost(ctx, event, cw, ch, tc, sc, accent, sportColor, theme);
  }
}

function drawStory(ctx, event, W, H, tc, sc, accent, sportColor, theme) {
  const pad = W * 0.08;

  // ── Sport badge circle ────────────────────────────────────────────────────
  const circR = W * 0.13;
  const circX = W / 2;
  const circY = H * 0.16;

  ctx.fillStyle = accent + '20';
  ctx.beginPath();
  ctx.arc(circX, circY, circR * 1.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(circX, circY, circR, 0, Math.PI * 2);
  ctx.fill();

  // Sport initial letter inside circle
  ctx.fillStyle = theme.id === 'sport' ? sportColor : (theme.id === 'dark' || theme.id === 'midnight' ? '#0a1628' : '#fff');
  ctx.font = `900 ${circR * 1.1}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(event.sport[0].toUpperCase(), circX, circY);
  ctx.textBaseline = 'alphabetic';

  // Sport name
  ctx.fillStyle = tc;
  ctx.font = `700 ${W * 0.055}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(event.sport.toUpperCase(), W / 2, circY + circR + W * 0.07);

  // Separator line
  const sep1Y = H * 0.30;
  ctx.strokeStyle = accent + '35';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad * 2, sep1Y);
  ctx.lineTo(W - pad * 2, sep1Y);
  ctx.stroke();

  // ── Title / Teams ─────────────────────────────────────────────────────────
  const parts = event.title.split(' vs ');
  if (parts.length === 2) {
    const teamSize = W * 0.082;
    ctx.fillStyle = tc;
    ctx.font = `800 ${teamSize}px Inter,system-ui,sans-serif`;
    ctx.textAlign = 'center';
    const t1Lines = wrapText(ctx, parts[0], W - pad * 3);
    const t2Lines = wrapText(ctx, parts[1], W - pad * 3);
    const lineH = teamSize * 1.15;

    let titleY = H * 0.37;
    t1Lines.slice(0, 2).forEach(l => { ctx.fillText(l, W / 2, titleY); titleY += lineH; });

    ctx.font = `600 ${W * 0.045}px Inter,system-ui,sans-serif`;
    ctx.fillStyle = sc;
    ctx.fillText('vs', W / 2, titleY + W * 0.01);
    titleY += lineH * 0.9;

    ctx.fillStyle = tc;
    ctx.font = `800 ${teamSize}px Inter,system-ui,sans-serif`;
    t2Lines.slice(0, 2).forEach(l => { ctx.fillText(l, W / 2, titleY + lineH * 0.1); titleY += lineH; });
  } else {
    const sz = W * 0.075;
    ctx.font = `800 ${sz}px Inter,system-ui,sans-serif`;
    ctx.fillStyle = tc;
    ctx.textAlign = 'center';
    const lines = wrapText(ctx, event.title, W - pad * 2.5);
    const lh = sz * 1.2;
    const startY = H * 0.41 - ((Math.min(lines.length, 3) - 1) * lh) / 2;
    lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lh));
  }

  // ── Score ─────────────────────────────────────────────────────────────────
  let afterTitleY = H * 0.56;
  if (event.score != null) {
    afterTitleY = H * 0.52;
    ctx.font = `900 ${W * 0.20}px Inter,system-ui,sans-serif`;
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.fillText(`${event.score.home}  —  ${event.score.away}`, W / 2, afterTitleY + W * 0.22);

    ctx.font = `600 ${W * 0.038}px Inter,system-ui,sans-serif`;
    ctx.fillStyle = sc;
    ctx.fillText('SCORE FINAL', W / 2, afterTitleY + W * 0.31);
    afterTitleY += H * 0.18;
  }

  // Separator 2
  const sep2Y = Math.max(afterTitleY + H * 0.01, H * 0.68);
  ctx.strokeStyle = accent + '30';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad * 2, sep2Y);
  ctx.lineTo(W - pad * 2, sep2Y);
  ctx.stroke();

  // ── Meta ──────────────────────────────────────────────────────────────────
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  let metaY = sep2Y + H * 0.05;
  ctx.textAlign = 'center';

  ctx.font = `600 ${W * 0.048}px Inter,system-ui,sans-serif`;
  ctx.fillStyle = tc;
  ctx.fillText(dateStr, W / 2, metaY);
  metaY += H * 0.052;

  ctx.font = `400 ${W * 0.042}px Inter,system-ui,sans-serif`;
  ctx.fillStyle = sc;
  ctx.fillText(`à ${timeStr}`, W / 2, metaY);
  metaY += H * 0.048;

  if (event.venue || event.city) {
    ctx.font = `500 ${W * 0.040}px Inter,system-ui,sans-serif`;
    ctx.fillStyle = sc;
    const venue = event.venue || event.city;
    const vLines = wrapText(ctx, venue, W - pad * 2);
    vLines.slice(0, 2).forEach((l, i) => { ctx.fillText(l, W / 2, metaY + i * W * 0.046); });
  }

  // ── Watermark ─────────────────────────────────────────────────────────────
  ctx.font = `700 ${W * 0.038}px Inter,system-ui,sans-serif`;
  ctx.fillStyle = tc + '45';
  ctx.textAlign = 'center';
  ctx.fillText('SportLink · Finistère', W / 2, H * 0.955);
}

function drawPost(ctx, event, W, H, tc, sc, accent, sportColor, theme) {
  const pad = W * 0.09;

  // Sport badge (top-left)
  const circR = W * 0.085;
  const circX = pad + circR;
  const circY = pad + circR;

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(circX, circY, circR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = theme.id === 'sport' ? sportColor : (theme.id === 'light' ? '#fff' : '#0a1628');
  ctx.font = `900 ${circR * 1.1}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(event.sport[0].toUpperCase(), circX, circY);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = tc;
  ctx.font = `700 ${W * 0.048}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(event.sport.toUpperCase(), circX + circR + W * 0.025, pad + circR * 0.8);
  ctx.font = `400 ${W * 0.036}px Inter,system-ui,sans-serif`;
  ctx.fillStyle = sc;
  ctx.fillText('Finistère', circX + circR + W * 0.025, pad + circR * 1.6);

  // Horizontal rule
  ctx.strokeStyle = accent + '35';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, H * 0.26);
  ctx.lineTo(W - pad, H * 0.26);
  ctx.stroke();

  // Title
  const titleSz = W * 0.075;
  ctx.font = `800 ${titleSz}px Inter,system-ui,sans-serif`;
  ctx.fillStyle = tc;
  ctx.textAlign = 'center';
  const maxW = W - pad * 2;
  const lines = wrapText(ctx, event.title, maxW);
  const lh = titleSz * 1.22;
  const titleStartY = H * 0.36 - ((Math.min(lines.length, 3) - 1) * lh) / 2;
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, titleStartY + i * lh));

  // Score
  if (event.score != null) {
    ctx.font = `900 ${W * 0.16}px Inter,system-ui,sans-serif`;
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.fillText(`${event.score.home} — ${event.score.away}`, W / 2, H * 0.63);
    ctx.font = `600 ${W * 0.032}px Inter,system-ui,sans-serif`;
    ctx.fillStyle = sc;
    ctx.fillText('SCORE FINAL', W / 2, H * 0.67);
  }

  // Meta
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  ctx.font = `500 ${W * 0.038}px Inter,system-ui,sans-serif`;
  ctx.fillStyle = sc;
  ctx.textAlign = 'center';
  ctx.fillText(`${dateStr} · ${timeStr}`, W / 2, H * 0.80);

  if (event.venue || event.city) {
    ctx.font = `400 ${W * 0.035}px Inter,system-ui,sans-serif`;
    ctx.fillStyle = sc + 'cc';
    ctx.fillText(event.venue || event.city, W / 2, H * 0.845);
  }

  // Watermark bottom-right
  ctx.font = `700 ${W * 0.03}px Inter,system-ui,sans-serif`;
  ctx.fillStyle = tc + '45';
  ctx.textAlign = 'right';
  ctx.fillText('SportLink', W - pad, H - pad * 0.6);
}

// ── PosterStudio component ────────────────────────────────────────────────────

export default function PosterStudio({ event, onClose }) {
  const { allSports } = useSports();
  const canvasRef = useRef(null);
  const [formatIdx, setFormatIdx] = useState(0);
  const [themeIdx, setThemeIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const format = FORMATS[formatIdx];
  const theme  = THEMES[themeIdx];
  const sportColor = allSports[event.sport]?.color ?? '#22d96a';

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCanvas(canvas, event, format, theme, sportColor);
  }, [event, format, theme, sportColor]);

  useEffect(() => { redraw(); }, [redraw]);

  function handleDownload() {
    setDownloading(true);
    const canvas = canvasRef.current;
    if (!canvas) { setDownloading(false); return; }
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affiche-${event.title.replace(/\s+/g, '-').toLowerCase()}-${format.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setTimeout(() => setDownloading(false), 800);
    }, 'image/png');
  }

  // Preview scale: fit in available space
  const previewW = format.id === 'story' ? 220 : 280;
  const previewH = format.id === 'story' ? 390 : 280;
  const scaleX = previewW / format.cw;
  const scaleY = previewH / format.ch;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          backgroundColor: 'var(--sl-overlay)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          style={{
            width: '100%', maxWidth: 600,
            maxHeight: '94dvh',
            borderRadius: '22px 22px 0 0',
            backgroundColor: 'var(--sl-card)',
            border: '1px solid var(--sl-border)', borderBottom: 'none',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', borderBottom: '1px solid var(--sl-border)' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--sl-t1)', fontFamily: 'Inter, sans-serif' }}>Créer une affiche</div>
              <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>{event.title}</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Preview + Controls side-by-side on wide, stacked on narrow */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

              {/* Canvas preview */}
              <div style={{
                flexShrink: 0,
                width: previewW, height: previewH,
                borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                border: '1px solid var(--sl-border-s)',
                position: 'relative',
              }}>
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: previewW, height: previewH,
                    display: 'block',
                  }}
                />
              </div>

              {/* Options */}
              <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Format */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Format</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {FORMATS.map((f, i) => (
                      <button
                        key={f.id}
                        onClick={() => setFormatIdx(i)}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 10, border: `1.5px solid ${i === formatIdx ? sportColor : 'var(--sl-border-s)'}`,
                          cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          backgroundColor: i === formatIdx ? `${sportColor}18` : 'var(--sl-surface)',
                          color: i === formatIdx ? sportColor : 'var(--sl-t2)',
                          transition: 'all 0.14s',
                        }}
                      >
                        {f.label}
                        <div style={{ fontSize: 9, fontWeight: 500, opacity: 0.7, marginTop: 2 }}>{f.ratio}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Thème</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {THEMES.map((t, i) => {
                      const bg = t.id === 'sport' ? sportColor : t.bg;
                      const active = i === themeIdx;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setThemeIdx(i)}
                          style={{
                            padding: '8px 10px', borderRadius: 10,
                            border: `1.5px solid ${active ? sportColor : 'var(--sl-border-s)'}`,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            backgroundColor: active ? `${sportColor}12` : 'var(--sl-surface)',
                            transition: 'all 0.14s',
                          }}
                        >
                          <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, backgroundColor: bg, border: '1px solid rgba(255,255,255,0.12)', boxShadow: active ? `0 0 0 2px ${sportColor}` : 'none' }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: active ? sportColor : 'var(--sl-t2)' }}>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Info banner if score missing */}
            {event.score == null && event.source === 'user' && (
              <div style={{ padding: '10px 12px', borderRadius: 10, backgroundColor: 'rgba(77,166,255,0.08)', border: '1px solid rgba(77,166,255,0.2)', fontSize: 12, color: 'var(--sl-blue)' }}>
                💡 Ajoutez le score final dans la fiche événement pour l'afficher sur l'affiche.
              </div>
            )}

            {/* Download button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleDownload}
              disabled={downloading}
              style={{
                width: '100%', padding: '14px 0',
                borderRadius: 14, border: 'none', cursor: downloading ? 'wait' : 'pointer',
                fontSize: 15, fontWeight: 800,
                backgroundColor: downloading ? 'var(--sl-green-dim)' : 'var(--sl-green)',
                color: downloading ? 'var(--sl-green)' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: downloading ? 'none' : 'var(--sl-green-glow)',
                transition: 'all 0.2s',
              }}
            >
              {downloading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Téléchargé !
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Télécharger l'affiche PNG
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
