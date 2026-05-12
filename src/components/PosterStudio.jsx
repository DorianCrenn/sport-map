import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const FORMATS = [
  { id: 'story', label: 'Story',  ratio: '9:16', cw: 540,  ch: 960  },
  { id: 'post',  label: 'Carré',  ratio: '1:1',  cw: 1080, ch: 1080 },
];

const TEMPLATES = [
  { id: 'ultra_impact',  label: 'ULTRA-IMPACT',  desc: 'Derby & choc',      icon: '⚡', color: '#ef4444' },
  { id: 'minimaliste',   label: 'MINIMALISTE',   desc: 'Épuré & moderne',   icon: '◯',  color: '#6366f1' },
  { id: 'retro_gazette', label: 'RÉTRO GAZETTE', desc: 'Style presse',      icon: '📰', color: '#d97706' },
  { id: 'street',        label: 'STREET',        desc: 'Brut & urbain',     icon: '🎨', color: '#22c55e' },
  { id: 'champion',      label: 'CHAMPION',      desc: 'Or & prestige',     icon: '🏆', color: '#fbbf24' },
];

const COLOR_THEMES = [
  { id: 'navy',     label: 'Navy',   bg: '#0a1628', text: '#deeeff', sub: 'rgba(222,238,255,0.55)' },
  { id: 'blanc',    label: 'Blanc',  bg: '#f8fafd', text: '#0f1e3a', sub: '#64748b' },
  { id: 'sport',    label: 'Sport',  bg: null,       text: '#ffffff', sub: 'rgba(255,255,255,0.72)' },
  { id: 'midnight', label: 'Minuit', bg: '#05080f',  text: '#ffffff', sub: 'rgba(255,255,255,0.5)' },
  { id: 'gold',     label: 'Gold',   bg: '#120d00',  text: '#ffe89a', sub: '#b8890b' },
];

const BG_FILTERS = [
  { id: 'none', label: 'Aucun' },
  { id: 'dark', label: 'Sombre' },
  { id: 'blur', label: 'Flou'   },
  { id: 'bw',   label: 'N&B'    },
];

const SHAPES = [
  { id: 'none',     label: 'Aucune'   },
  { id: 'diagonal', label: 'Diagonal' },
  { id: 'rounded',  label: 'Bloc'     },
  { id: 'torn',     label: 'Déchiré'  },
];

const TEXT_POSITIONS = [
  { id: 'top',    label: 'Haut'   },
  { id: 'center', label: 'Centre' },
  { id: 'bottom', label: 'Bas'    },
];

// ── Canvas primitives ─────────────────────────────────────────────────────────

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('load'));
    img.src = src;
  });
}

function wrap(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Effect helpers ────────────────────────────────────────────────────────────

async function applyBg(ctx, W, H, theme, sportColor, img, filter) {
  ctx.fillStyle = theme.id === 'sport' ? sportColor : (theme.bg ?? '#0a1628');
  ctx.fillRect(0, 0, W, H);
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const s = Math.max(W / iw, H / ih);
  const dw = iw * s, dh = ih * s;
  ctx.filter = filter === 'bw' ? 'grayscale(1)' : filter === 'blur' ? 'blur(14px)' : 'none';
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  ctx.filter = 'none';
  ctx.fillStyle = filter === 'dark' ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.40)';
  ctx.fillRect(0, 0, W, H);
}

function setShadow(ctx, on) {
  if (on) {
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur  = 16;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
  }
}

function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0; }

function fillT(ctx, text, x, y, stroke) {
  if (stroke) {
    const prev = ctx.fillStyle;
    noShadow(ctx);
    ctx.strokeStyle = 'rgba(0,0,0,0.92)';
    ctx.lineWidth = Math.max(ctx.font.match(/\d+/)?.[0] / 10 * 1.2, 6);
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = prev;
    // re-apply shadow for fill
  }
  ctx.fillText(text, x, y);
}

function shapeMask(ctx, type, x, y, w, h, color, a = 0.72) {
  if (type === 'none') return;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color;
  if (type === 'diagonal') {
    const sk = h * 0.13;
    ctx.beginPath();
    ctx.moveTo(x + sk, y); ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - sk, y + h); ctx.lineTo(x, y + h);
    ctx.closePath(); ctx.fill();
  } else if (type === 'rounded') {
    rrect(ctx, x, y, w, h, Math.min(h * 0.22, 30));
    ctx.fill();
  } else if (type === 'torn') {
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h);
    const steps = 28; const sw = w / steps;
    for (let i = steps; i >= 0; i--) {
      ctx.lineTo(x + i * sw, y + h + Math.sin(i * 1.1) * 15 + Math.sin(i * 2.6) * 8);
    }
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function grungeLines(ctx, W, H) {
  ctx.save(); ctx.globalAlpha = 0.055; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.8;
  for (let i = -H; i < W + H; i += 9) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H * 0.55, H); ctx.stroke();
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.10; ctx.fillStyle = '#fff';
  for (let i = 0; i < 70; i++) {
    const a = i * 137.508 * Math.PI / 180;
    const r = Math.sqrt(i / 70) * Math.min(W, H) * 0.44;
    ctx.beginPath();
    ctx.arc((W / 2 + Math.cos(a) * r + W) % W, (H / 2 + Math.sin(a) * r + H) % H, (i % 5) * 0.35 + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function lensFlare(ctx, cx, cy, size) {
  ctx.save(); ctx.globalAlpha = 0.5;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
  g.addColorStop(0,    'rgba(255,242,120,0.9)');
  g.addColorStop(0.12, 'rgba(255,200,50,0.55)');
  g.addColorStop(0.4,  'rgba(255,150,0,0.15)');
  g.addColorStop(1,    'transparent');
  ctx.fillStyle = g; ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.20; ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5;
  ctx.translate(cx, cy);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const len = size * (0.5 + 0.5 * Math.abs(Math.sin(i * 2.4)));
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len); ctx.stroke();
  }
  ctx.restore();
}

// ── Template: ULTRA-IMPACT ────────────────────────────────────────────────────

function drawUltraImpact(ctx, ev, W, H, tc, sc, accent, tShadow, tStroke, pos, shape) {
  const IS = H > W;
  const pad = W * 0.065;

  // Huge background letter
  ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = accent;
  ctx.font = `900 ${W * 0.62}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.translate(W * 1.05, H * 0.98); ctx.rotate(-8 * Math.PI / 180);
  ctx.fillText(ev.sport[0].toUpperCase(), 0, 0);
  ctx.restore();

  // Left accent bar
  ctx.fillStyle = accent; ctx.fillRect(0, 0, W * 0.030, H);

  // Diagonal accent stripe
  ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = accent;
  const stripeY = IS ? H * 0.34 : H * 0.30;
  ctx.beginPath();
  ctx.moveTo(0, stripeY); ctx.lineTo(W, stripeY - H * 0.025);
  ctx.lineTo(W, stripeY + H * 0.055 - H * 0.025); ctx.lineTo(0, stripeY + H * 0.055);
  ctx.closePath(); ctx.fill(); ctx.restore();

  // Sport pill
  const pillX = W * 0.065; const pillY = IS ? H * 0.06 : H * 0.055;
  ctx.fillStyle = accent; ctx.globalAlpha = 0.9;
  rrect(ctx, pillX, pillY - 14, W * 0.42, 26, 8); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = tc === '#ffffff' ? '#0a1628' : '#fff';
  ctx.font = `800 ${W * 0.040}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(ev.sport.toUpperCase(), pillX + 10, pillY); ctx.textBaseline = 'alphabetic';

  // Title zone
  const baseY = pos === 'top' ? H * 0.17 : pos === 'bottom' ? H * 0.52 : IS ? H * 0.25 : H * 0.22;
  const parts = ev.title.split(' vs ');
  const sz = IS ? W * 0.112 : W * 0.092; const lh = sz * 1.08;
  const maxTW = W - W * 0.065 - pad;

  setShadow(ctx, tShadow);

  if (parts.length === 2) {
    const maskH = lh * 3.8 + H * 0.04;
    shapeMask(ctx, shape, 0, baseY - sz * 0.6, W, maskH, '#080d18');

    [parts[0], null, parts[1]].forEach((p, idx) => {
      ctx.save();
      const yy = baseY + idx * lh * 1.2;
      ctx.translate(W / 2, yy);
      ctx.rotate(-5 * Math.PI / 180);
      ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      if (p === null) {
        ctx.fillStyle = accent;
        ctx.font = `800 ${sz * 0.52}px Inter,system-ui,sans-serif`;
        ctx.fillText('VS', 0, 0);
      } else {
        ctx.fillStyle = tc;
        ctx.font = `900 ${sz}px Inter,system-ui,sans-serif`;
        fillT(ctx, p.toUpperCase(), 0, 0, tStroke);
      }
      ctx.restore();
    });
  } else {
    ctx.font = `900 ${sz}px Inter,system-ui,sans-serif`;
    const lines = wrap(ctx, ev.title.toUpperCase(), maxTW);
    const maskH = lines.length * lh + H * 0.05;
    shapeMask(ctx, shape, 0, baseY - sz * 0.8, W, maskH, '#080d18');
    ctx.fillStyle = tc; ctx.textAlign = 'left';
    ctx.save();
    ctx.translate(W * 0.065, baseY); ctx.rotate(-5 * Math.PI / 180); ctx.textBaseline = 'top';
    lines.slice(0, 4).forEach((l, i) => fillT(ctx, l, 0, i * lh, tStroke));
    ctx.restore();
  }

  noShadow(ctx);

  // Meta bottom
  const metaY = IS ? H * 0.79 : H * 0.76;
  const d = new Date(ev.date);
  const ds = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  const ts = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = accent; ctx.font = `800 ${W * 0.050}px Inter,system-ui,sans-serif`;
  ctx.fillText(ds, W * 0.065, metaY);
  ctx.fillStyle = tc; ctx.font = `700 ${W * 0.046}px Inter,system-ui,sans-serif`;
  ctx.fillText(ts, W * 0.065, metaY + H * 0.048);
  if (ev.venue || ev.city) {
    ctx.fillStyle = sc; ctx.font = `500 ${W * 0.036}px Inter,system-ui,sans-serif`;
    ctx.fillText((ev.venue || ev.city).slice(0, 24), W * 0.065, metaY + H * 0.090);
  }

  ctx.fillStyle = tc + '38'; ctx.font = `600 ${W * 0.028}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'right'; ctx.fillText('SportLink · Finistère', W - W * 0.04, H * 0.97);
}

// ── Template: MINIMALISTE PRO ─────────────────────────────────────────────────

function drawMinimaliste(ctx, ev, W, H, tc, sc, accent, tShadow, tStroke) {
  const IS = H > W; const pad = W * 0.10;

  // Thin accent line top
  ctx.fillStyle = accent; ctx.fillRect(W * 0.38, IS ? H * 0.055 : H * 0.06, W * 0.24, 2);

  // Sport initial circle (minimal)
  const cR = W * 0.05; const cX = W / 2; const cY = IS ? H * 0.12 : H * 0.13;
  ctx.strokeStyle = accent; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cX, cY, cR, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = accent; ctx.font = `700 ${cR * 0.95}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ev.sport[0].toUpperCase(), cX, cY); ctx.textBaseline = 'alphabetic';

  // Sport name (wide tracking)
  ctx.fillStyle = tc; ctx.globalAlpha = 0.40;
  ctx.font = `300 ${W * 0.028}px Inter,system-ui,sans-serif`; ctx.textAlign = 'center';
  ctx.letterSpacing = '0.28em';
  ctx.fillText(ev.sport.toUpperCase(), W / 2, cY + cR + W * 0.06);
  ctx.letterSpacing = '0'; ctx.globalAlpha = 1;

  // Separator
  ctx.strokeStyle = tc; ctx.globalAlpha = 0.10; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad * 2, IS ? H * 0.245 : H * 0.265);
  ctx.lineTo(W - pad * 2, IS ? H * 0.245 : H * 0.265); ctx.stroke(); ctx.globalAlpha = 1;

  // Title
  const tY = IS ? H * 0.38 : H * 0.40;
  const tSz = IS ? W * 0.068 : W * 0.060;
  const lh = tSz * 1.45;
  setShadow(ctx, tShadow);
  ctx.fillStyle = tc; ctx.font = `300 ${tSz}px Inter,system-ui,sans-serif`; ctx.textAlign = 'center';
  const lines = wrap(ctx, ev.title, W - pad * 2.5);
  lines.slice(0, 3).forEach((l, i) => fillT(ctx, l, W / 2, tY + i * lh, tStroke));
  noShadow(ctx);

  // Accent dot separator
  const afterY = tY + Math.min(lines.length, 3) * lh + H * 0.038;
  for (let i = -1; i <= 1; i++) {
    ctx.fillStyle = i === 0 ? accent : (tc + '40');
    ctx.beginPath(); ctx.arc(W / 2 + i * 14, afterY, i === 0 ? 3.5 : 2, 0, Math.PI * 2); ctx.fill();
  }

  // Meta
  const d = new Date(ev.date);
  const ds = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const ts = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const mY = afterY + H * 0.06;
  ctx.fillStyle = tc; ctx.globalAlpha = 0.55; ctx.font = `300 ${W * 0.036}px Inter,system-ui,sans-serif`; ctx.textAlign = 'center';
  ctx.letterSpacing = '0.04em'; ctx.fillText(ds, W / 2, mY); ctx.letterSpacing = '0';
  ctx.fillText(ts, W / 2, mY + H * 0.044); ctx.globalAlpha = 1;
  if (ev.venue || ev.city) {
    ctx.fillStyle = tc; ctx.globalAlpha = 0.35; ctx.font = `300 ${W * 0.030}px Inter,system-ui,sans-serif`;
    ctx.fillText(ev.venue || ev.city, W / 2, mY + H * 0.088); ctx.globalAlpha = 1;
  }

  // Bottom accent line
  ctx.fillStyle = accent; ctx.fillRect(W * 0.38, IS ? H * 0.945 : H * 0.940, W * 0.24, 2);
  ctx.fillStyle = tc + '28'; ctx.font = `300 ${W * 0.026}px Inter,system-ui,sans-serif`; ctx.textAlign = 'center';
  ctx.fillText('SportLink · Finistère', W / 2, IS ? H * 0.963 : H * 0.960);
}

// ── Template: RÉTRO GAZETTE ───────────────────────────────────────────────────

function drawRetroGazette(ctx, ev, W, H, tc, sc, accent, tShadow, tStroke, shape) {
  const IS = H > W; const pad = W * 0.065; const fi = W * 0.042;

  // Cream tint
  ctx.fillStyle = 'rgba(255,248,220,0.06)'; ctx.fillRect(0, 0, W, H);

  // Thick frame
  ctx.strokeStyle = '#fff'; ctx.lineWidth = W * 0.036;
  ctx.strokeRect(fi / 2, fi / 2, W - fi, H - fi);
  // Inner frame
  ctx.globalAlpha = 0.45; ctx.lineWidth = 1.5;
  const ii = fi + W * 0.016;
  ctx.strokeRect(ii, ii, W - ii * 2, H - ii * 2);
  ctx.globalAlpha = 1;

  // Masthead
  const mhH = IS ? H * 0.108 : H * 0.115;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(fi, fi, W - fi * 2, mhH);
  ctx.fillStyle = '#0f1e3a'; ctx.font = `900 ${IS ? W * 0.063 : W * 0.056}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('SPORTLINK', W / 2, fi + mhH / 2); ctx.textBaseline = 'alphabetic';

  // Edition date
  const d = new Date(ev.date);
  const iss = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  ctx.fillStyle = tc; ctx.globalAlpha = 0.5; ctx.font = `400 ${W * 0.026}px Inter,system-ui,sans-serif`; ctx.textAlign = 'center';
  ctx.fillText(iss, W / 2, fi + mhH + H * 0.026); ctx.globalAlpha = 1;

  // Sport badge row
  const bY = fi + mhH + H * 0.052;
  ctx.fillStyle = accent; ctx.globalAlpha = 0.92;
  rrect(ctx, pad * 0.7, bY - 13, W * 0.44, 25, 5); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = tc === '#ffffff' ? '#0a1628' : '#fff';
  ctx.font = `800 ${W * 0.033}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(ev.sport.toUpperCase(), pad * 0.7 + 10, bY); ctx.textBaseline = 'alphabetic';

  // Double rule
  ctx.strokeStyle = tc; ctx.lineWidth = 3; ctx.globalAlpha = 0.75;
  ctx.beginPath(); ctx.moveTo(pad * 0.7, bY + 20); ctx.lineTo(W - pad * 0.7, bY + 20); ctx.stroke();
  ctx.lineWidth = 1.2; ctx.globalAlpha = 0.22;
  ctx.beginPath(); ctx.moveTo(pad * 0.7, bY + 25); ctx.lineTo(W - pad * 0.7, bY + 25); ctx.stroke();
  ctx.globalAlpha = 1;

  // Headline
  const hY = bY + H * 0.062;
  const hSz = IS ? W * 0.085 : W * 0.076; const lh = hSz * 1.15;
  setShadow(ctx, tShadow);
  ctx.fillStyle = tc; ctx.font = `900 ${hSz}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left';
  const lines = wrap(ctx, ev.title, W - pad * 1.4);
  lines.slice(0, 4).forEach((l, i) => fillT(ctx, l, pad * 0.7, hY + i * lh, tStroke));
  noShadow(ctx);

  // Shape mask under title
  const afterH = hY + Math.min(lines.length, 4) * lh;
  shapeMask(ctx, shape, pad * 0.7 - 10, hY - hSz * 0.7, W - pad * 0.7, lines.length * lh + hSz * 0.9, '#0a1628');

  // Rule after
  const rY = afterH + H * 0.022;
  ctx.strokeStyle = tc; ctx.lineWidth = 1; ctx.globalAlpha = 0.2;
  ctx.beginPath(); ctx.moveTo(pad * 0.7, rY); ctx.lineTo(W - pad * 0.7, rY); ctx.stroke();
  ctx.globalAlpha = 1;

  // Meta grid
  const gY = rY + H * 0.030;
  const drawCell = (label, val, x, y) => {
    ctx.fillStyle = accent; ctx.globalAlpha = 0.8;
    ctx.font = `700 ${W * 0.024}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left';
    ctx.fillText(label, x, y); ctx.globalAlpha = 1;
    ctx.fillStyle = tc; ctx.font = `600 ${W * 0.038}px Inter,system-ui,sans-serif`;
    ctx.fillText(val, x, y + H * 0.034);
  };
  const ts = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const ds = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  drawCell('DATE', ds, pad * 0.7, gY);
  drawCell('HEURE', ts, W / 2, gY);
  if (ev.venue || ev.city) drawCell('LIEU', (ev.venue || ev.city).slice(0, 16), pad * 0.7, gY + H * 0.082);

  ctx.fillStyle = tc + '30'; ctx.font = `400 ${W * 0.026}px Inter,system-ui,sans-serif`; ctx.textAlign = 'center';
  ctx.fillText('SportLink · Finistère', W / 2, H - fi - W * 0.024);
}

// ── Template: STREET / URBAIN ─────────────────────────────────────────────────

function drawStreet(ctx, ev, W, H, tc, sc, accent, tShadow, tStroke, pos, shape) {
  const IS = H > W;

  grungeLines(ctx, W, H);

  // Diagonal accent bars (top + bottom)
  const diagBar = (yS, h, a = 0.88) => {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(0, yS); ctx.lineTo(W, yS - H * 0.022);
    ctx.lineTo(W, yS + h - H * 0.022); ctx.lineTo(0, yS + h);
    ctx.closePath(); ctx.fill(); ctx.restore();
  };
  diagBar(IS ? H * 0.055 : H * 0.055, H * 0.058);
  diagBar(IS ? H * 0.882 : H * 0.875, H * 0.060);

  // Sport in top bar
  ctx.fillStyle = tc === '#ffffff' ? '#0a1628' : '#fff';
  ctx.font = `900 ${W * 0.048}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ev.sport.toUpperCase(), W / 2, IS ? H * 0.083 : H * 0.083); ctx.textBaseline = 'alphabetic';

  // Title
  const baseY = pos === 'top' ? H * 0.19 : pos === 'bottom' ? H * 0.56 : IS ? H * 0.29 : H * 0.25;
  const parts = ev.title.split(' vs ');
  const sz = IS ? W * 0.108 : W * 0.090; const lh = sz * 1.06;

  setShadow(ctx, tShadow);

  if (parts.length === 2) {
    shapeMask(ctx, shape, 0, baseY - sz * 0.9, W, lh * 3.6 + H * 0.04, '#060b14');
    [parts[0], null, parts[1]].forEach((p, idx) => {
      ctx.save();
      ctx.translate(W / 2, baseY + idx * lh * 1.22);
      ctx.rotate(-3 * Math.PI / 180);
      ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      if (p === null) {
        ctx.fillStyle = accent; ctx.font = `900 ${sz * 0.6}px Inter,system-ui,sans-serif`;
        ctx.fillText('✕', 0, 0);
      } else {
        ctx.fillStyle = tc; ctx.font = `900 ${sz}px Inter,system-ui,sans-serif`;
        fillT(ctx, p.toUpperCase(), 0, 0, tStroke);
      }
      ctx.restore();
    });
  } else {
    ctx.font = `900 ${sz}px Inter,system-ui,sans-serif`;
    const lines = wrap(ctx, ev.title.toUpperCase(), W * 0.9);
    shapeMask(ctx, shape, 0, baseY - sz * 1.1, W, lines.length * lh + H * 0.06, '#060b14');
    ctx.fillStyle = tc; ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(W / 2, baseY); ctx.rotate(-3 * Math.PI / 180); ctx.textBaseline = 'top';
    lines.slice(0, 4).forEach((l, i) => fillT(ctx, l, 0, i * lh, tStroke));
    ctx.restore();
  }
  noShadow(ctx);

  // Meta in bottom bar
  const d = new Date(ev.date);
  const ds = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  const ts = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  ctx.fillStyle = tc === '#ffffff' ? '#0a1628' : '#fff';
  ctx.font = `800 ${W * 0.048}px Inter,system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${ds}  ·  ${ts}`, W / 2, IS ? H * 0.912 : H * 0.906); ctx.textBaseline = 'alphabetic';
}

// ── Template: CHAMPION ────────────────────────────────────────────────────────

function drawChampion(ctx, ev, W, H, tc, sc, accent, tShadow, tStroke, shape) {
  const IS = H > W; const pad = W * 0.09;

  // Gold overlay
  const gg = ctx.createLinearGradient(0, 0, W, H);
  gg.addColorStop(0, 'rgba(255,215,0,0.07)'); gg.addColorStop(0.5, 'rgba(255,165,0,0.02)'); gg.addColorStop(1, 'rgba(255,215,0,0.09)');
  ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);

  // Lens flares
  lensFlare(ctx, W * 0.07, H * 0.045, IS ? W * 0.52 : W * 0.44);
  lensFlare(ctx, W * 0.93, H * 0.955, IS ? W * 0.44 : W * 0.36);

  // Gold border lines (double)
  const lineY1 = IS ? H * 0.155 : H * 0.158; const lineY2 = IS ? H * 0.845 : H * 0.840;
  [lineY1, lineY2].forEach(ly => {
    ctx.save();
    ctx.strokeStyle = '#ffd700'; ctx.globalAlpha = 0.40; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad * 0.7, ly); ctx.lineTo(W - pad * 0.7, ly); ctx.stroke();
    ctx.lineWidth = 0.8; ctx.globalAlpha = 0.18;
    ctx.beginPath(); ctx.moveTo(pad * 0.7, ly + 4); ctx.lineTo(W - pad * 0.7, ly + 4); ctx.stroke();
    ctx.restore();
  });

  // Sport name (elegant)
  ctx.fillStyle = '#ffd700'; ctx.globalAlpha = 0.72;
  ctx.font = `300 ${W * 0.032}px Inter,system-ui,sans-serif`; ctx.textAlign = 'center';
  ctx.letterSpacing = '0.22em';
  ctx.fillText(ev.sport.toUpperCase(), W / 2, IS ? H * 0.125 : H * 0.128);
  ctx.letterSpacing = '0'; ctx.globalAlpha = 1;

  // Title
  const cY = IS ? H * 0.46 : H * 0.47;
  const tSz = IS ? W * 0.082 : W * 0.072; const lh = tSz * 1.22;
  const parts = ev.title.split(' vs ');
  setShadow(ctx, tShadow);

  if (parts.length === 2) {
    shapeMask(ctx, shape, pad * 0.4, cY - lh * 2.0, W - pad * 0.8, lh * 4, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = tc; ctx.font = `800 ${tSz}px Inter,system-ui,sans-serif`; ctx.textAlign = 'center';
    fillT(ctx, parts[0], W / 2, cY - lh * 0.7, tStroke);
    ctx.fillStyle = '#ffd700'; ctx.globalAlpha = 0.85;
    ctx.font = `300 ${tSz * 0.46}px Inter,system-ui,sans-serif`;
    ctx.letterSpacing = '0.18em'; ctx.fillText('CONTRE', W / 2, cY + lh * 0.05); ctx.letterSpacing = '0'; ctx.globalAlpha = 1;
    ctx.fillStyle = tc; ctx.font = `800 ${tSz}px Inter,system-ui,sans-serif`;
    fillT(ctx, parts[1], W / 2, cY + lh * 0.85, tStroke);
  } else {
    const lines = wrap(ctx, ev.title, W - pad * 2.4);
    shapeMask(ctx, shape, pad * 0.4, cY - (lines.length * lh) / 2 - lh * 0.8, W - pad * 0.8, lines.length * lh + lh, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = tc; ctx.font = `800 ${tSz}px Inter,system-ui,sans-serif`; ctx.textAlign = 'center';
    const sY = cY - ((lines.length - 1) * lh) / 2;
    lines.slice(0, 3).forEach((l, i) => fillT(ctx, l, W / 2, sY + i * lh, tStroke));
  }
  noShadow(ctx);

  // Meta
  const d = new Date(ev.date);
  const ds = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const ts = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const mY = IS ? H * 0.775 : H * 0.760;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700'; ctx.globalAlpha = 0.80;
  ctx.font = `300 ${W * 0.034}px Inter,system-ui,sans-serif`;
  ctx.letterSpacing = '0.05em'; ctx.fillText(ds, W / 2, mY); ctx.letterSpacing = '0'; ctx.globalAlpha = 1;
  ctx.fillStyle = tc; ctx.font = `700 ${W * 0.050}px Inter,system-ui,sans-serif`;
  ctx.fillText(ts, W / 2, mY + H * 0.052);
  if (ev.venue || ev.city) {
    ctx.fillStyle = sc; ctx.globalAlpha = 0.65; ctx.font = `300 ${W * 0.032}px Inter,system-ui,sans-serif`;
    ctx.fillText(ev.venue || ev.city, W / 2, mY + H * 0.092); ctx.globalAlpha = 1;
  }

  ctx.fillStyle = '#ffd700'; ctx.globalAlpha = 0.30;
  ctx.font = `300 ${W * 0.028}px Inter,system-ui,sans-serif`;
  ctx.letterSpacing = '0.10em'; ctx.fillText('SPORTLINK · FINISTÈRE', W / 2, H * 0.966);
  ctx.letterSpacing = '0'; ctx.globalAlpha = 1;
}

// ── Main draw orchestrator ────────────────────────────────────────────────────

async function drawCanvas(canvas, ev, format, templateId, theme, sportColor, bgImg, bgFilter, tShadow, tStroke, shape, pos, sponsorImg, qrImg) {
  const ctx = canvas.getContext('2d');
  const { cw: W, ch: H } = format;
  canvas.width = W; canvas.height = H;

  const hasBg    = !!bgImg;
  const accent   = theme.id === 'sport' ? 'rgba(255,255,255,0.92)' : sportColor;
  const tc       = hasBg ? '#ffffff' : theme.text;
  const sc       = hasBg ? 'rgba(255,255,255,0.65)' : theme.sub;

  await applyBg(ctx, W, H, theme, sportColor, bgImg, bgFilter);

  switch (templateId) {
    case 'ultra_impact':  drawUltraImpact(ctx, ev, W, H, tc, sc, accent, tShadow, tStroke, pos, shape);  break;
    case 'minimaliste':   drawMinimaliste(ctx, ev, W, H, tc, sc, accent, tShadow, tStroke);               break;
    case 'retro_gazette': drawRetroGazette(ctx, ev, W, H, tc, sc, accent, tShadow, tStroke, shape);       break;
    case 'street':        drawStreet(ctx, ev, W, H, tc, sc, accent, tShadow, tStroke, pos, shape);        break;
    case 'champion':      drawChampion(ctx, ev, W, H, tc, sc, accent, tShadow, tStroke, shape);           break;
    default:              drawUltraImpact(ctx, ev, W, H, tc, sc, accent, tShadow, tStroke, pos, shape);
  }

  // ── Sponsor logo overlay ──
  if (sponsorImg) {
    const maxH = H * 0.068; const maxW = W * 0.26;
    const s = Math.min(maxW / sponsorImg.width, maxH / sponsorImg.height);
    const sw = sponsorImg.width * s; const sh = sponsorImg.height * s;
    const sx = W - sw - W * 0.05; const sy = H - sh - H * 0.024;
    ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffffff';
    rrect(ctx, sx - 10, sy - 8, sw + 20, sh + 16, 10); ctx.fill(); ctx.restore();
    ctx.drawImage(sponsorImg, sx, sy, sw, sh);
    ctx.fillStyle = '#64748b'; ctx.font = `500 ${W * 0.020}px Inter,system-ui,sans-serif`;
    ctx.textAlign = 'right'; ctx.fillText('Partenaire du match', sx + sw + 10, sy - 10);
  }

  // ── QR code overlay ──
  if (qrImg) {
    const qrSize = H * 0.088;
    const qx = W * 0.038; const qy = H - qrSize - H * 0.024;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(qx - 5, qy - 5, qrSize + 10, qrSize + 10);
    ctx.drawImage(qrImg, qx, qy, qrSize, qrSize);
    ctx.fillStyle = 'rgba(100,116,139,0.85)'; ctx.font = `500 ${W * 0.020}px Inter,system-ui,sans-serif`;
    ctx.textAlign = 'left'; ctx.fillText('Scanner pour infos', qx, qy - 9);
  }
}

// ── PosterStudio Component ────────────────────────────────────────────────────

const TABS = [
  { id: 'model',    label: 'Modèle',   icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="7" height="9" rx="1"/><rect x="9" y="3" width="13" height="5" rx="1"/><rect x="9" y="12" width="13" height="9" rx="1"/><rect x="2" y="16" width="7" height="5" rx="1"/></svg>
  )},
  { id: 'style',    label: 'Style',    icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 20a8 8 0 1 1 8-8c0 2.5-1 4-3 4s-3-1.5-3-4a4 4 0 1 0-4 4H12z"/></svg>
  )},
  { id: 'shapes',   label: 'Formes',   icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 22 20 2 20"/><rect x="4" y="9" width="6" height="6" rx="1"/></svg>
  )},
  { id: 'business', label: 'Business', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
  )},
];

export default function PosterStudio({ event, onClose }) {
  const { allSports } = useSports();
  const canvasRef    = useRef(null);
  const fileRef      = useRef(null);
  const sponsorRef   = useRef(null);

  const sportColor = allSports[event.sport]?.color ?? '#22d96a';

  // ── State ──
  const [formatIdx,    setFormatIdx]    = useState(0);
  const [templateIdx,  setTemplateIdx]  = useState(0);
  const [themeIdx,     setThemeIdx]     = useState(0);
  const [bgMode,       setBgMode]       = useState('color');  // color | url | upload
  const [bgFilter,     setBgFilter]     = useState('none');
  const [bgSrc,        setBgSrc]        = useState('');
  const [bgUrl,        setBgUrl]        = useState('');
  const [tShadow,      setTShadow]      = useState(true);
  const [tStroke,      setTStroke]      = useState(false);
  const [shape,        setShape]        = useState('none');
  const [textPos,      setTextPos]      = useState('center');
  const [sponsorSrc,   setSponsorSrc]   = useState('');
  const [showQR,       setShowQR]       = useState(false);
  const [activeTab,    setActiveTab]    = useState('model');
  const [downloading,  setDownloading]  = useState(false);
  const [sharing,      setSharing]      = useState(false);
  const [bgErr,        setBgErr]        = useState(false);

  const format   = FORMATS[formatIdx];
  const template = TEMPLATES[templateIdx];
  const theme    = COLOR_THEMES[themeIdx];

  // ── Redraw ──
  const redraw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let bgImg = null, sponsorImg = null, qrImg = null;

    if (bgSrc) {
      try { bgImg = await loadImg(bgSrc); setBgErr(false); }
      catch { setBgErr(true); }
    }
    if (sponsorSrc) {
      try { sponsorImg = await loadImg(sponsorSrc); } catch {}
    }
    if (showQR) {
      const eventUrl = `https://sportlink.fr/events/${event.id ?? 'demo'}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(eventUrl)}&bgcolor=ffffff&color=000000&margin=4`;
      try { qrImg = await loadImg(qrUrl); } catch {}
    }

    await drawCanvas(canvas, event, format, template.id, theme, sportColor, bgImg, bgFilter, tShadow, tStroke, shape, textPos, sponsorImg, qrImg);
  }, [event, format, template, theme, sportColor, bgSrc, bgFilter, tShadow, tStroke, shape, textPos, sponsorSrc, showQR]);

  useEffect(() => { redraw(); }, [redraw]);

  // ── Handlers ──
  function applyBgUrl() {
    const u = bgUrl.trim();
    setBgSrc(u || '');
    if (!u) setBgErr(false);
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => setBgSrc(ev.target.result);
    r.readAsDataURL(f);
  }

  function handleSponsor(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => setSponsorSrc(ev.target.result);
    r.readAsDataURL(f);
  }

  function clearBg() { setBgSrc(''); setBgUrl(''); setBgErr(false); }

  function handleDownload() {
    setDownloading(true);
    const canvas = canvasRef.current;
    if (!canvas) { setDownloading(false); return; }
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affiche-${event.title.replace(/\s+/g, '-').toLowerCase()}-${format.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setTimeout(() => setDownloading(false), 900);
    }, 'image/png', 1.0);
  }

  async function handleShareWhatsApp() {
    setSharing(true);
    const canvas = canvasRef.current;
    if (!canvas) { setSharing(false); return; }
    canvas.toBlob(async blob => {
      try {
        const file = new File([blob], 'affiche-sportlink.png', { type: 'image/png' });
        const d = new Date(event.date);
        const text = `🏟️ *${event.title}*\n📅 ${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}\n⏰ ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n📍 ${event.city ?? ''}\n\nVia SportLink Finistère`;
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text, title: event.title });
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }
      } catch {}
      finally { setSharing(false); }
    }, 'image/png', 1.0);
  }

  // ── Preview dimensions ──
  const isStory  = format.id === 'story';
  const prevW    = isStory ? 188 : 256;
  const prevH    = isStory ? 334 : 256;

  // ── UI helpers ──
  const SectionLabel = ({ children }) => (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--sl-t3)', marginBottom: 7, marginTop: 2 }}>
      {children}
    </div>
  );

  const Chip = ({ active, onClick, children, color }) => (
    <button onClick={onClick} style={{
      padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
      border: `1.5px solid ${active ? (color ?? sportColor) : 'var(--sl-border-s)'}`,
      backgroundColor: active ? `${color ?? sportColor}16` : 'var(--sl-surface)',
      color: active ? (color ?? sportColor) : 'var(--sl-t2)',
      transition: 'all 0.13s', lineHeight: 1.3,
    }}>
      {children}
    </button>
  );

  const Toggle = ({ label, value, onChange, icon }) => (
    <button onClick={() => onChange(!value)} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
      backgroundColor: 'var(--sl-surface)', border: `1.5px solid ${value ? sportColor : 'var(--sl-border-s)'}`,
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: value ? sportColor : 'var(--sl-t2)' }}>{label}</span>
      </div>
      <div style={{
        width: 36, height: 20, borderRadius: 10, position: 'relative', transition: 'background 0.2s',
        backgroundColor: value ? sportColor : 'var(--sl-border)',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16,
          borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 2500, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        style={{
          width: '100%', maxWidth: 640, height: '96dvh',
          borderRadius: '22px 22px 0 0',
          backgroundColor: 'var(--sl-card)',
          border: '1px solid var(--sl-border)', borderBottom: 'none',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 12px', borderBottom: '1px solid var(--sl-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${sportColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sportColor} strokeWidth="2" strokeLinecap="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--sl-t1)', letterSpacing: '-0.01em' }}>Creative Studio</div>
              <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'var(--sl-surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ── Body: Preview + Controls ── */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Preview + format switcher */}
          <div style={{ flexShrink: 0, display: 'flex', gap: 14, padding: '14px 18px', alignItems: 'flex-start', borderBottom: '1px solid var(--sl-border)' }}>
            {/* Canvas */}
            <div style={{ flexShrink: 0, width: prevW, height: prevH, borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', border: '1px solid var(--sl-border-s)', position: 'relative', backgroundColor: '#050810' }}>
              <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: prevW, height: prevH }} />
            </div>

            {/* Right of preview */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Format */}
              <div>
                <SectionLabel>Format</SectionLabel>
                <div style={{ display: 'flex', gap: 6 }}>
                  {FORMATS.map((f, i) => (
                    <button key={f.id} onClick={() => setFormatIdx(i)}
                      style={{ flex: 1, padding: '9px 0', borderRadius: 11, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${i === formatIdx ? sportColor : 'var(--sl-border-s)'}`, backgroundColor: i === formatIdx ? `${sportColor}16` : 'var(--sl-surface)', color: i === formatIdx ? sportColor : 'var(--sl-t2)', transition: 'all 0.14s', textAlign: 'center' }}>
                      {f.label}
                      <div style={{ fontSize: 9, opacity: 0.65, marginTop: 1 }}>{f.ratio}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template preview pills */}
              <div>
                <SectionLabel>Modèle actif</SectionLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 12, backgroundColor: `${template.color}14`, border: `1.5px solid ${template.color}` }}>
                  <span style={{ fontSize: 18 }}>{template.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: template.color }}>{template.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{template.desc}</div>
                  </div>
                </div>
              </div>

              {/* Text effects mini */}
              <div>
                <SectionLabel>Effets texte</SectionLabel>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setTShadow(v => !v)}
                    style={{ flex: 1, padding: '8px 6px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${tShadow ? '#6366f1' : 'var(--sl-border-s)'}`, backgroundColor: tShadow ? 'rgba(99,102,241,0.12)' : 'var(--sl-surface)', color: tShadow ? '#6366f1' : 'var(--sl-t3)', transition: 'all 0.14s' }}>
                    Ombre
                  </button>
                  <button onClick={() => setTStroke(v => !v)}
                    style={{ flex: 1, padding: '8px 6px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${tStroke ? '#ef4444' : 'var(--sl-border-s)'}`, backgroundColor: tStroke ? 'rgba(239,68,68,0.10)' : 'var(--sl-surface)', color: tStroke ? '#ef4444' : 'var(--sl-t3)', transition: 'all 0.14s' }}>
                    Contour
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div style={{ flexShrink: 0, display: 'flex', borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 4px', cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? sportColor : 'transparent'}`, color: activeTab === tab.id ? sportColor : 'var(--sl-t3)', transition: 'color 0.15s' }}>
                {tab.icon}
                <span style={{ fontSize: 9, fontWeight: 700 }}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── Tab content ── */}
          <div style={{ flex: 1, padding: '14px 18px 20px', overflowY: 'auto' }}>

            {/* ── MODÈLE TAB ── */}
            {activeTab === 'model' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <SectionLabel>Choisir un modèle</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {TEMPLATES.map((t, i) => (
                    <button key={t.id} onClick={() => setTemplateIdx(i)}
                      style={{
                        gridColumn: i === 4 ? 'span 2' : 'span 1',
                        padding: '12px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                        border: `2px solid ${i === templateIdx ? t.color : 'var(--sl-border-s)'}`,
                        backgroundColor: i === templateIdx ? `${t.color}14` : 'var(--sl-surface)',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{t.icon}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: i === templateIdx ? t.color : 'var(--sl-t1)' }}>{t.label}</div>
                          <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1 }}>{t.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STYLE TAB ── */}
            {activeTab === 'style' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Color themes */}
                <div>
                  <SectionLabel>Thème de couleur</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {COLOR_THEMES.map((t, i) => {
                      const bg = t.id === 'sport' ? sportColor : (t.bg ?? '#1a1200');
                      const active = i === themeIdx;
                      return (
                        <button key={t.id} onClick={() => setThemeIdx(i)}
                          style={{ padding: '9px 10px', borderRadius: 11, border: `1.5px solid ${active ? sportColor : 'var(--sl-border-s)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, backgroundColor: active ? `${sportColor}12` : 'var(--sl-surface)', transition: 'all 0.14s' }}>
                          <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, backgroundColor: bg, border: '1px solid rgba(255,255,255,0.12)', boxShadow: active ? `0 0 0 2px ${sportColor}` : 'none' }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: active ? sportColor : 'var(--sl-t2)' }}>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Background */}
                <div>
                  <SectionLabel>Image de fond</SectionLabel>
                  <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                    {[['color', 'Couleur'], ['url', 'URL'], ['upload', 'Fichier']].map(([id, label]) => (
                      <Chip key={id} active={bgMode === id} onClick={() => { setBgMode(id); if (id === 'color') clearBg(); }}>{label}</Chip>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {bgMode === 'url' && (
                      <motion.div key="url" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                        <input type="text" value={bgUrl} onChange={e => setBgUrl(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && applyBgUrl()}
                          placeholder="https://…"
                          style={{ flex: 1, padding: '9px 11px', borderRadius: 11, fontSize: 12, border: `1px solid ${bgErr ? '#ef4444' : 'var(--sl-border-s)'}`, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none' }}
                        />
                        <button onClick={applyBgUrl} style={{ padding: '9px 14px', borderRadius: 11, fontSize: 12, fontWeight: 700, backgroundColor: sportColor, color: '#fff', border: 'none', cursor: 'pointer' }}>OK</button>
                        {bgSrc && <button onClick={clearBg} style={{ padding: '9px 10px', borderRadius: 11, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
                      </motion.div>
                    )}
                    {bgMode === 'upload' && (
                      <motion.div key="upload" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                        <button onClick={() => fileRef.current?.click()} style={{ flex: 1, padding: '10px 12px', borderRadius: 11, fontSize: 12, fontWeight: 600, backgroundColor: bgSrc ? `${sportColor}14` : 'var(--sl-surface)', border: bgSrc ? `1.5px solid ${sportColor}` : '1.5px dashed var(--sl-border-s)', color: bgSrc ? sportColor : 'var(--sl-t2)', cursor: 'pointer' }}>
                          {bgSrc ? '✓ Image chargée' : '+ Choisir une image'}
                        </button>
                        {bgSrc && <button onClick={clearBg} style={{ padding: '10px 12px', borderRadius: 11, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {bgErr && <div style={{ padding: '7px 12px', borderRadius: 9, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, color: '#ef4444', marginBottom: 8 }}>Image non accessible — vérifiez le lien ou uploadez un fichier.</div>}

                  {bgSrc && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 6 }}>FILTRE IMAGE</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {BG_FILTERS.map(f => (
                          <Chip key={f.id} active={bgFilter === f.id} onClick={() => setBgFilter(f.id)}>{f.label}</Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Text effects */}
                <div>
                  <SectionLabel>Effets du texte</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Toggle label="Ombre portée" value={tShadow} onChange={setTShadow} icon="🌑" />
                    <Toggle label="Contour (stroke)" value={tStroke} onChange={setTStroke} icon="🔲" />
                  </div>
                </div>
              </div>
            )}

            {/* ── FORMES TAB ── */}
            {activeTab === 'shapes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <SectionLabel>Masque de forme sous le texte</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {SHAPES.map(s => (
                      <button key={s.id} onClick={() => setShape(s.id)}
                        style={{ padding: '11px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', border: `1.5px solid ${shape === s.id ? sportColor : 'var(--sl-border-s)'}`, backgroundColor: shape === s.id ? `${sportColor}14` : 'var(--sl-surface)', color: shape === s.id ? sportColor : 'var(--sl-t1)', fontSize: 12, fontWeight: 700, transition: 'all 0.14s' }}>
                        {s.id === 'none' && '✕ '}
                        {s.id === 'diagonal' && '◪ '}
                        {s.id === 'rounded' && '▬ '}
                        {s.id === 'torn' && '〜 '}
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <SectionLabel>Position du texte principal</SectionLabel>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {TEXT_POSITIONS.map(p => (
                      <button key={p.id} onClick={() => setTextPos(p.id)}
                        style={{ flex: 1, padding: '11px 0', borderRadius: 12, cursor: 'pointer', textAlign: 'center', border: `1.5px solid ${textPos === p.id ? sportColor : 'var(--sl-border-s)'}`, backgroundColor: textPos === p.id ? `${sportColor}14` : 'var(--sl-surface)', color: textPos === p.id ? sportColor : 'var(--sl-t1)', fontSize: 12, fontWeight: 700, transition: 'all 0.14s' }}>
                        {p.id === 'top' ? '⬆️' : p.id === 'center' ? '⬛' : '⬇️'}<br />
                        <span style={{ fontSize: 10, marginTop: 2 }}>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── BUSINESS TAB ── */}
            {activeTab === 'business' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Sponsor */}
                <div>
                  <SectionLabel>Logo partenaire du match</SectionLabel>
                  <div style={{ padding: '12px', borderRadius: 14, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', marginBottom: 8 }}>
                    <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: '0 0 10px', lineHeight: 1.5 }}>
                      Le logo sera placé en bas à droite de l'affiche dans un encart blanc.
                    </p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => sponsorRef.current?.click()}
                        style={{ flex: 1, padding: '10px 12px', borderRadius: 11, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: sponsorSrc ? `${sportColor}14` : 'var(--sl-card)', border: sponsorSrc ? `1.5px solid ${sportColor}` : '1.5px dashed var(--sl-border-s)', color: sponsorSrc ? sportColor : 'var(--sl-t2)' }}>
                        {sponsorSrc ? '✓ Logo chargé' : '+ Uploader le logo sponsor'}
                      </button>
                      {sponsorSrc && (
                        <button onClick={() => setSponsorSrc('')}
                          style={{ padding: '10px 12px', borderRadius: 11, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-card)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>
                      )}
                    </div>
                    <input ref={sponsorRef} type="file" accept="image/*" onChange={handleSponsor} style={{ display: 'none' }} />
                  </div>
                  {sponsorSrc && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, backgroundColor: `${sportColor}10`, border: `1px solid ${sportColor}30` }}>
                      <img src={sponsorSrc} alt="Sponsor" style={{ height: 32, maxWidth: 80, objectFit: 'contain', borderRadius: 4 }} />
                      <span style={{ fontSize: 11, color: 'var(--sl-green)', fontWeight: 600 }}>Logo actif — visible sur l'affiche</span>
                    </div>
                  )}
                </div>

                {/* QR Code */}
                <div>
                  <SectionLabel>QR Code intelligent</SectionLabel>
                  <div style={{ padding: '12px', borderRadius: 14, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', marginBottom: 8 }}>
                    <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: '0 0 10px', lineHeight: 1.5 }}>
                      Un QR code renvoyant vers la fiche de l'événement sera placé en bas à gauche de l'affiche.
                    </p>
                    <Toggle label="Afficher le QR code" value={showQR} onChange={setShowQR} icon="📱" />
                  </div>
                  {showQR && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>Chargement du QR code au prochain rendu…</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          <div style={{ flexShrink: 0, padding: '10px 18px 18px', display: 'flex', gap: 10, borderTop: '1px solid var(--sl-border)' }}>
            <motion.button
              whileTap={{ scale: 0.96 }} onClick={handleDownload} disabled={downloading}
              style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', cursor: downloading ? 'wait' : 'pointer', fontSize: 14, fontWeight: 800, backgroundColor: downloading ? 'var(--sl-green-dim)' : 'var(--sl-green)', color: downloading ? 'var(--sl-green)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: downloading ? 'none' : 'var(--sl-green-glow)', transition: 'all 0.2s' }}
            >
              {downloading
                ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Téléchargé !</>
                : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>PNG HD</>
              }
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }} onClick={handleShareWhatsApp} disabled={sharing}
              style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', cursor: sharing ? 'wait' : 'pointer', fontSize: 14, fontWeight: 800, backgroundColor: sharing ? 'rgba(37,211,102,0.12)' : '#25D366', color: sharing ? '#25D366' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.2s' }}
            >
              {sharing
                ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>Envoi…</>
                : <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.855L.057 23.882l6.233-1.635A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894c-1.897 0-3.66-.51-5.182-1.398l-.371-.22-3.851 1.01 1.029-3.763-.242-.387A9.855 9.855 0 012.106 12c0-5.457 4.437-9.894 9.894-9.894 5.457 0 9.894 4.437 9.894 9.894 0 5.457-4.437 9.894-9.894 9.894z"/></svg>
                    WhatsApp
                  </>
              }
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
