import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';

const FORMATS = [
  { id: 'story', label: 'Story', ratio: '9/16', cw: 540,  ch: 960  },
  { id: 'post',  label: 'Post',  ratio: '1/1',  cw: 1080, ch: 1080 },
];

const TEMPLATES = [
  { id: 'classic', label: 'Classic',  desc: 'Badge centré' },
  { id: 'impact',  label: 'Impact',   desc: 'Typographie forte' },
  { id: 'journal', label: 'Journal',  desc: 'Style presse' },
];

const COLOR_THEMES = [
  { id: 'navy',     label: 'Navy',   bg: '#0a1628', text: '#deeeff', sub: 'rgba(222,238,255,0.55)' },
  { id: 'blanc',    label: 'Blanc',  bg: '#f8fafd', text: '#0f1e3a', sub: '#475569' },
  { id: 'sport',    label: 'Sport',  bg: null,       text: '#ffffff', sub: 'rgba(255,255,255,0.75)' },
  { id: 'midnight', label: 'Minuit', bg: '#05080f',  text: '#ffffff', sub: 'rgba(255,255,255,0.55)' },
];

const BG_FILTERS = [
  { id: 'none', label: 'Aucun' },
  { id: 'dark', label: 'Sombre' },
  { id: 'blur', label: 'Flou' },
  { id: 'bw',   label: 'N&B' },
];

const TEXT_POSITIONS = [
  { id: 'top',    label: 'Haut' },
  { id: 'center', label: 'Centre' },
  { id: 'bottom', label: 'Bas' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('load'));
    img.src = src;
  });
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function applyBackground(ctx, W, H, colorTheme, sportColor, bgImage, bgFilter) {
  const bgColor = colorTheme.id === 'sport' ? sportColor : colorTheme.bg;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  if (bgImage) {
    const iw = bgImage.naturalWidth || bgImage.width;
    const ih = bgImage.naturalHeight || bgImage.height;
    const scale = Math.max(W / iw, H / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (W - dw) / 2, dy = (H - dh) / 2;

    if (bgFilter === 'bw')   ctx.filter = 'grayscale(1)';
    else if (bgFilter === 'blur') ctx.filter = 'blur(14px)';
    else ctx.filter = 'none';

    ctx.drawImage(bgImage, dx, dy, dw, dh);
    ctx.filter = 'none';

    if (bgFilter === 'dark') {
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.fillRect(0, 0, W, H);
    } else if (bgFilter === 'blur' || bgFilter === 'bw') {
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(0, 0, W, H);
    }
  }
}

// ── Classic template ──────────────────────────────────────────────────────────

function drawClassicStory(ctx, event, W, H, tc, sc, accent, sportColor, colorTheme) {
  const pad = W * 0.08;
  const circR = W * 0.13, circX = W / 2, circY = H * 0.16;
  ctx.fillStyle = accent + '20';
  ctx.beginPath(); ctx.arc(circX, circY, circR * 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(circX, circY, circR, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = colorTheme.id === 'sport' ? sportColor
    : (colorTheme.id === 'blanc' ? '#fff' : '#0a1628');
  ctx.font = `900 ${circR * 1.1}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(event.sport[0].toUpperCase(), circX, circY);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = tc; ctx.font = `700 ${W * 0.055}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(event.sport.toUpperCase(), W / 2, circY + circR + W * 0.07);

  ctx.strokeStyle = accent + '35'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad * 2, H * 0.30); ctx.lineTo(W - pad * 2, H * 0.30); ctx.stroke();

  const parts = event.title.split(' vs ');
  if (parts.length === 2) {
    const sz = W * 0.082; const lh = sz * 1.15;
    ctx.fillStyle = tc; ctx.font = `800 ${sz}px Inter,system-ui,sans-serif`; ctx.textAlign = 'center';
    const t1 = wrapText(ctx, parts[0], W - pad * 3);
    const t2 = wrapText(ctx, parts[1], W - pad * 3);
    let y = H * 0.37;
    t1.slice(0, 2).forEach(l => { ctx.fillText(l, W / 2, y); y += lh; });
    ctx.font = `600 ${W * 0.045}px Inter,system-ui,sans-serif`; ctx.fillStyle = sc;
    ctx.fillText('vs', W / 2, y + W * 0.01); y += lh * 0.9;
    ctx.fillStyle = tc; ctx.font = `800 ${sz}px Inter,system-ui,sans-serif`;
    t2.slice(0, 2).forEach(l => { ctx.fillText(l, W / 2, y + lh * 0.1); y += lh; });
  } else {
    const sz = W * 0.075; ctx.font = `800 ${sz}px Inter,system-ui,sans-serif`;
    ctx.fillStyle = tc; ctx.textAlign = 'center';
    const lines = wrapText(ctx, event.title, W - pad * 2.5);
    const lh = sz * 1.2;
    const startY = H * 0.41 - ((Math.min(lines.length, 3) - 1) * lh) / 2;
    lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lh));
  }

  const sep2Y = H * 0.68;
  ctx.strokeStyle = accent + '30'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad * 2, sep2Y); ctx.lineTo(W - pad * 2, sep2Y); ctx.stroke();

  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  let metaY = sep2Y + H * 0.05;
  ctx.textAlign = 'center';
  ctx.font = `600 ${W * 0.048}px Inter,system-ui,sans-serif`; ctx.fillStyle = tc;
  ctx.fillText(dateStr, W / 2, metaY); metaY += H * 0.052;
  ctx.font = `400 ${W * 0.042}px Inter,system-ui,sans-serif`; ctx.fillStyle = sc;
  ctx.fillText(`à ${timeStr}`, W / 2, metaY); metaY += H * 0.048;
  if (event.venue || event.city) {
    const vLines = wrapText(ctx, event.venue || event.city, W - pad * 2);
    ctx.font = `500 ${W * 0.040}px Inter,system-ui,sans-serif`; ctx.fillStyle = sc;
    vLines.slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, metaY + i * W * 0.046));
  }
  ctx.font = `700 ${W * 0.038}px Inter,system-ui,sans-serif`; ctx.fillStyle = tc + '45';
  ctx.textAlign = 'center'; ctx.fillText('SportLink · Finistère', W / 2, H * 0.955);
}

function drawClassicPost(ctx, event, W, H, tc, sc, accent, sportColor, colorTheme) {
  const pad = W * 0.09;
  const circR = W * 0.085, circX = pad + circR, circY = pad + circR;
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(circX, circY, circR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colorTheme.id === 'sport' ? sportColor : (colorTheme.id === 'blanc' ? '#fff' : '#0a1628');
  ctx.font = `900 ${circR * 1.1}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(event.sport[0].toUpperCase(), circX, circY); ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = tc; ctx.font = `700 ${W * 0.048}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left';
  ctx.fillText(event.sport.toUpperCase(), circX + circR + W * 0.025, pad + circR * 0.8);
  ctx.font = `400 ${W * 0.036}px Inter,system-ui,sans-serif`; ctx.fillStyle = sc;
  ctx.fillText('Finistère', circX + circR + W * 0.025, pad + circR * 1.6);

  ctx.strokeStyle = accent + '35'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, H * 0.26); ctx.lineTo(W - pad, H * 0.26); ctx.stroke();

  const titleSz = W * 0.075; ctx.font = `800 ${titleSz}px Inter,system-ui,sans-serif`;
  ctx.fillStyle = tc; ctx.textAlign = 'center';
  const lines = wrapText(ctx, event.title, W - pad * 2);
  const lh = titleSz * 1.22;
  const startY = H * 0.36 - ((Math.min(lines.length, 3) - 1) * lh) / 2;
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lh));

  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  ctx.font = `500 ${W * 0.038}px Inter,system-ui,sans-serif`; ctx.fillStyle = sc; ctx.textAlign = 'center';
  ctx.fillText(`${dateStr} · ${timeStr}`, W / 2, H * 0.80);
  if (event.venue || event.city) {
    ctx.font = `400 ${W * 0.035}px Inter,system-ui,sans-serif`; ctx.fillStyle = sc + 'cc';
    ctx.fillText(event.venue || event.city, W / 2, H * 0.845);
  }
  ctx.font = `700 ${W * 0.030}px Inter,system-ui,sans-serif`; ctx.fillStyle = tc + '45';
  ctx.textAlign = 'right'; ctx.fillText('SportLink', W - pad, H - pad * 0.6);
}

// ── Impact template ───────────────────────────────────────────────────────────

function drawImpactStory(ctx, event, W, H, tc, sc, accent, sportColor, textPos) {
  const pad = W * 0.09;
  const barW = W * 0.055;

  // Left accent bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, barW, H);

  // Sport pill at top
  const pillX = barW + W * 0.07;
  const pillY = H * 0.07;
  roundRect(ctx, pillX, pillY - 14, W * 0.38, 26, 8);
  ctx.fillStyle = accent + '22'; ctx.fill();
  ctx.fillStyle = accent;
  ctx.font = `800 ${W * 0.043}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(event.sport.toUpperCase(), pillX + 10, pillY); ctx.textBaseline = 'alphabetic';

  // Huge sport initial
  ctx.fillStyle = accent + '18';
  ctx.font = `900 ${W * 0.60}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left';
  const yOff = textPos === 'top' ? H * 0.15 : textPos === 'bottom' ? H * 0.65 : H * 0.4;
  ctx.fillText(event.sport[0].toUpperCase(), W * 0.22, yOff + W * 0.5);

  // Title
  const titleY = textPos === 'top' ? H * 0.25 : textPos === 'bottom' ? H * 0.60 : H * 0.38;
  const parts = event.title.split(' vs ');
  const titleX = barW + W * 0.07;
  if (parts.length === 2) {
    const sz = W * 0.1; const lh = sz * 1.1;
    ctx.fillStyle = tc; ctx.font = `900 ${sz}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left';
    const t1 = wrapText(ctx, parts[0].toUpperCase(), W - titleX - pad * 0.5);
    const t2 = wrapText(ctx, parts[1].toUpperCase(), W - titleX - pad * 0.5);
    let y = titleY;
    t1.slice(0, 2).forEach(l => { ctx.fillText(l, titleX, y); y += lh; });
    ctx.fillStyle = accent; ctx.font = `800 ${W * 0.07}px Inter,system-ui,sans-serif`;
    ctx.fillText('VS', titleX, y + lh * 0.1); y += lh * 0.85;
    ctx.fillStyle = tc; ctx.font = `900 ${sz}px Inter,system-ui,sans-serif`;
    t2.slice(0, 2).forEach(l => { ctx.fillText(l, titleX, y); y += lh; });
  } else {
    const sz = W * 0.095; ctx.font = `900 ${sz}px Inter,system-ui,sans-serif`;
    ctx.fillStyle = tc; ctx.textAlign = 'left';
    const lines = wrapText(ctx, event.title.toUpperCase(), W - titleX - pad * 0.5);
    const lh = sz * 1.1;
    lines.slice(0, 4).forEach((l, i) => ctx.fillText(l, titleX, titleY + i * lh));
  }

  // Meta bottom section
  const metaBaseY = H * 0.83;
  ctx.strokeStyle = accent + '55'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(titleX, metaBaseY - 16); ctx.lineTo(W - pad * 0.5, metaBaseY - 16); ctx.stroke();

  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  ctx.fillStyle = tc; ctx.font = `700 ${W * 0.05}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left';
  ctx.fillText(dateStr, titleX, metaBaseY + 4);
  ctx.fillStyle = accent; ctx.font = `700 ${W * 0.055}px Inter,system-ui,sans-serif`;
  ctx.fillText(timeStr, titleX, metaBaseY + H * 0.052);
  if (event.venue || event.city) {
    ctx.fillStyle = sc; ctx.font = `500 ${W * 0.040}px Inter,system-ui,sans-serif`;
    ctx.fillText(event.venue || event.city, titleX, metaBaseY + H * 0.10);
  }

  ctx.fillStyle = tc + '40'; ctx.font = `700 ${W * 0.033}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'right'; ctx.fillText('SportLink · Finistère', W - pad * 0.5, H * 0.965);
}

function drawImpactPost(ctx, event, W, H, tc, sc, accent) {
  const pad = W * 0.09;

  // Top color bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, H * 0.04);

  // Sport name row
  ctx.fillStyle = tc; ctx.font = `900 ${W * 0.07}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'left'; ctx.letterSpacing = '0.12em';
  ctx.fillText(event.sport.toUpperCase(), pad, H * 0.15);
  ctx.letterSpacing = '0';

  // Divider
  ctx.strokeStyle = accent; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(pad, H * 0.20); ctx.lineTo(W * 0.18, H * 0.20); ctx.stroke();

  // Big title
  const titleSz = W * 0.11;
  ctx.font = `900 ${titleSz}px Inter,system-ui,sans-serif`; ctx.fillStyle = tc; ctx.textAlign = 'left';
  const lines = wrapText(ctx, event.title.toUpperCase(), W - pad * 2);
  const lh = titleSz * 1.08;
  const titleY = H * 0.30;
  lines.slice(0, 4).forEach((l, i) => ctx.fillText(l, pad, titleY + i * lh));

  // Bottom divider
  ctx.strokeStyle = accent + '60'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, H * 0.76); ctx.lineTo(W - pad, H * 0.76); ctx.stroke();

  // Meta
  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  ctx.fillStyle = tc; ctx.font = `600 ${W * 0.042}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left';
  ctx.fillText(dateStr, pad, H * 0.82);
  ctx.fillStyle = accent; ctx.font = `800 ${W * 0.055}px Inter,system-ui,sans-serif`;
  ctx.fillText(timeStr, pad, H * 0.88);
  if (event.venue || event.city) {
    ctx.fillStyle = sc; ctx.font = `400 ${W * 0.036}px Inter,system-ui,sans-serif`;
    ctx.fillText(event.venue || event.city, pad, H * 0.93);
  }

  // Bottom bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, H * 0.975, W, H * 0.025);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${W * 0.028}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('SportLink · Finistère', W / 2, H * 0.987); ctx.textBaseline = 'alphabetic';
}

// ── Journal template ──────────────────────────────────────────────────────────

function drawJournalStory(ctx, event, W, H, tc, sc, accent) {
  const pad = W * 0.08;

  // Header masthead
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, H * 0.115);
  ctx.fillStyle = '#fff'; ctx.font = `800 ${W * 0.065}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('SPORTLINK', W / 2, H * 0.058); ctx.textBaseline = 'alphabetic';

  // Edition sub-line
  ctx.fillStyle = tc + 'bb'; ctx.font = `500 ${W * 0.036}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'center';
  const d = new Date(event.date);
  ctx.fillText(d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(), W / 2, H * 0.135);

  // Double border rule
  ctx.strokeStyle = accent; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(pad, H * 0.155); ctx.lineTo(W - pad, H * 0.155); ctx.stroke();
  ctx.strokeStyle = accent + '50'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, H * 0.163); ctx.lineTo(W - pad, H * 0.163); ctx.stroke();

  // Sport pill
  ctx.fillStyle = accent + '1A';
  roundRect(ctx, pad, H * 0.178, W * 0.38, 24, 6); ctx.fill();
  ctx.fillStyle = accent; ctx.font = `700 ${W * 0.038}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(event.sport.toUpperCase(), pad + 10, H * 0.190); ctx.textBaseline = 'alphabetic';

  // Main headline
  const titleSz = W * 0.092;
  ctx.fillStyle = tc; ctx.font = `900 ${titleSz}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left';
  const lines = wrapText(ctx, event.title, W - pad * 2);
  const lh = titleSz * 1.15;
  const titleStartY = H * 0.235;
  lines.slice(0, 4).forEach((l, i) => ctx.fillText(l, pad, titleStartY + i * lh));

  // Separator after title
  const afterTitleY = titleStartY + Math.min(lines.length, 4) * lh + H * 0.02;
  ctx.strokeStyle = tc + '30'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, afterTitleY); ctx.lineTo(W - pad, afterTitleY); ctx.stroke();

  // Meta grid
  const gridY = afterTitleY + H * 0.028;
  const col2X = W / 2;

  const drawCell = (label, val, x, y) => {
    ctx.fillStyle = accent; ctx.font = `700 ${W * 0.030}px Inter,system-ui,sans-serif`;
    ctx.textAlign = 'left'; ctx.fillText(label.toUpperCase(), x, y);
    ctx.fillStyle = tc; ctx.font = `600 ${W * 0.042}px Inter,system-ui,sans-serif`;
    ctx.fillText(val, x, y + H * 0.038);
  };

  const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateShort = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();

  drawCell('DATE', dateShort, pad, gridY);
  drawCell('HEURE', timeStr, col2X, gridY);
  drawCell('LIEU', (event.venue || event.city || '—').slice(0, 18), pad, gridY + H * 0.085);

  // Bottom border
  ctx.strokeStyle = accent; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(pad, H * 0.945); ctx.lineTo(W - pad, H * 0.945); ctx.stroke();
  ctx.strokeStyle = accent + '50'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, H * 0.953); ctx.lineTo(W - pad, H * 0.953); ctx.stroke();

  ctx.fillStyle = tc + '55'; ctx.font = `600 ${W * 0.036}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'center'; ctx.fillText('Finistère', W / 2, H * 0.974);
}

function drawJournalPost(ctx, event, W, H, tc, sc, accent) {
  const pad = W * 0.09;

  // Top masthead
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, H * 0.1);
  ctx.fillStyle = '#fff'; ctx.font = `900 ${W * 0.07}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('SPORTLINK', W / 2, H * 0.05); ctx.textBaseline = 'alphabetic';

  // Thick + thin double rule
  ctx.strokeStyle = accent; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(pad, H * 0.13); ctx.lineTo(W - pad, H * 0.13); ctx.stroke();
  ctx.strokeStyle = accent + '55'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, H * 0.14); ctx.lineTo(W - pad, H * 0.14); ctx.stroke();

  // Sport label
  ctx.fillStyle = accent; ctx.font = `800 ${W * 0.042}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left';
  ctx.fillText(event.sport.toUpperCase(), pad, H * 0.19);

  // Main title
  const titleSz = W * 0.095;
  ctx.fillStyle = tc; ctx.font = `900 ${titleSz}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left';
  const lines = wrapText(ctx, event.title, W - pad * 2);
  const lh = titleSz * 1.1;
  const titleY = H * 0.235;
  lines.slice(0, 4).forEach((l, i) => ctx.fillText(l, pad, titleY + i * lh));

  // Rule
  const ruleY = titleY + Math.min(lines.length, 4) * lh + H * 0.03;
  ctx.strokeStyle = tc + '25'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, ruleY); ctx.lineTo(W - pad, ruleY); ctx.stroke();

  // Date/time
  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  ctx.fillStyle = accent; ctx.font = `700 ${W * 0.036}px Inter,system-ui,sans-serif`; ctx.textAlign = 'left';
  ctx.fillText(dateStr, pad, ruleY + H * 0.055);
  ctx.fillStyle = tc; ctx.font = `800 ${W * 0.052}px Inter,system-ui,sans-serif`;
  ctx.fillText(timeStr, pad, ruleY + H * 0.105);
  if (event.venue || event.city) {
    ctx.fillStyle = sc; ctx.font = `500 ${W * 0.038}px Inter,system-ui,sans-serif`;
    ctx.fillText(event.venue || event.city, pad, ruleY + H * 0.145);
  }

  // Bottom masthead
  ctx.fillStyle = accent;
  ctx.fillRect(0, H * 0.91, W, H * 0.09);
  ctx.fillStyle = '#fff'; ctx.font = `600 ${W * 0.035}px Inter,system-ui,sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Finistère Sports · SportLink', W / 2, H * 0.955); ctx.textBaseline = 'alphabetic';
}

// ── Main draw ─────────────────────────────────────────────────────────────────

async function drawCanvas(canvas, event, format, templateId, colorTheme, sportColor, bgImage, bgFilter, textPos) {
  const ctx = canvas.getContext('2d');
  const { cw: W, ch: H } = format;
  canvas.width = W; canvas.height = H;

  const accent = colorTheme.id === 'sport' ? 'rgba(255,255,255,0.9)' : sportColor;
  const tc     = bgImage ? '#ffffff' : colorTheme.text;
  const sc     = bgImage ? 'rgba(255,255,255,0.7)' : colorTheme.sub;

  await applyBackground(ctx, W, H, colorTheme, sportColor, bgImage, bgFilter);

  // Decorative bg circle (only without bg image in classic)
  if (!bgImage && templateId === 'classic') {
    ctx.fillStyle = (colorTheme.id === 'sport' ? 'rgba(255,255,255,0.06)' : sportColor + '10');
    ctx.beginPath(); ctx.arc(W * 1.1, -H * 0.05, H * 0.55, 0, Math.PI * 2); ctx.fill();
  }

  if (templateId === 'classic') {
    if (format.id === 'story') drawClassicStory(ctx, event, W, H, tc, sc, accent, sportColor, colorTheme);
    else drawClassicPost(ctx, event, W, H, tc, sc, accent, sportColor, colorTheme);
  } else if (templateId === 'impact') {
    if (format.id === 'story') drawImpactStory(ctx, event, W, H, tc, sc, accent, sportColor, textPos);
    else drawImpactPost(ctx, event, W, H, tc, sc, accent);
  } else {
    if (format.id === 'story') drawJournalStory(ctx, event, W, H, tc, sc, accent);
    else drawJournalPost(ctx, event, W, H, tc, sc, accent);
  }
}

// ── PosterStudio component ────────────────────────────────────────────────────

export default function PosterStudio({ event, onClose }) {
  const { allSports } = useSports();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formatIdx, setFormatIdx]     = useState(0);
  const [templateIdx, setTemplateIdx] = useState(0);
  const [themeIdx, setThemeIdx]       = useState(0);
  const [bgFilter, setBgFilter]       = useState('none');
  const [textPos, setTextPos]         = useState('center');
  const [bgImageSrc, setBgImageSrc]   = useState('');
  const [bgUrlInput, setBgUrlInput]   = useState('');
  const [bgMode, setBgMode]           = useState('color'); // 'color' | 'url' | 'upload'
  const [downloading, setDownloading] = useState(false);
  const [bgError, setBgError]         = useState(false);

  const format   = FORMATS[formatIdx];
  const template = TEMPLATES[templateIdx];
  const theme    = COLOR_THEMES[themeIdx];
  const sportColor = allSports[event.sport]?.color ?? '#22d96a';

  const redraw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let bgImg = null;
    if (bgImageSrc) {
      try { bgImg = await loadImage(bgImageSrc); setBgError(false); }
      catch { setBgError(true); }
    }
    await drawCanvas(canvas, event, format, template.id, theme, sportColor, bgImg, bgFilter, textPos);
  }, [event, format, template, theme, sportColor, bgImageSrc, bgFilter, textPos]);

  useEffect(() => { redraw(); }, [redraw]);

  function handleUrlApply() {
    const url = bgUrlInput.trim();
    if (!url) { setBgImageSrc(''); return; }
    setBgImageSrc(url);
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setBgImageSrc(ev.target.result); };
    reader.readAsDataURL(file);
  }

  function clearBg() { setBgImageSrc(''); setBgUrlInput(''); }

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

  const previewW = format.id === 'story' ? 210 : 270;
  const previewH = format.id === 'story' ? 373 : 270;

  const OptionLabel = ({ children }) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
      {children}
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 2500, backgroundColor: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          style={{
            width: '100%', maxWidth: 620, maxHeight: '94dvh',
            borderRadius: '22px 22px 0 0',
            backgroundColor: 'var(--sl-card)',
            border: '1px solid var(--sl-border)', borderBottom: 'none',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', borderBottom: '1px solid var(--sl-border)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={sportColor} strokeWidth="2" strokeLinecap="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--sl-t1)' }}>Creative Studio</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>{event.title}</div>
            </div>
            <button onClick={onClose} aria-label="Fermer"
              style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Preview + right panel */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Canvas preview */}
              <div style={{ flexShrink: 0, width: previewW, height: previewH, borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 36px rgba(0,0,0,0.45)', border: '1px solid var(--sl-border-s)', position: 'relative' }}>
                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: previewW, height: previewH, display: 'block' }} />
              </div>

              {/* Options column */}
              <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Format */}
                <div>
                  <OptionLabel>Format</OptionLabel>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {FORMATS.map((f, i) => (
                      <button key={f.id} onClick={() => setFormatIdx(i)}
                        style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: `1.5px solid ${i === formatIdx ? sportColor : 'var(--sl-border-s)'}`, cursor: 'pointer', fontSize: 12, fontWeight: 700, backgroundColor: i === formatIdx ? `${sportColor}18` : 'var(--sl-surface)', color: i === formatIdx ? sportColor : 'var(--sl-t2)', transition: 'all 0.14s' }}>
                        {f.label}
                        <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{f.ratio}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template */}
                <div>
                  <OptionLabel>Modèle</OptionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {TEMPLATES.map((t, i) => (
                      <button key={t.id} onClick={() => setTemplateIdx(i)}
                        style={{ padding: '7px 10px', borderRadius: 10, border: `1.5px solid ${i === templateIdx ? sportColor : 'var(--sl-border-s)'}`, cursor: 'pointer', textAlign: 'left', backgroundColor: i === templateIdx ? `${sportColor}12` : 'var(--sl-surface)', transition: 'all 0.14s' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: i === templateIdx ? sportColor : 'var(--sl-t1)' }}>{t.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1 }}>{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <OptionLabel>Thème</OptionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                    {COLOR_THEMES.map((t, i) => {
                      const bg = t.id === 'sport' ? sportColor : t.bg;
                      const active = i === themeIdx;
                      return (
                        <button key={t.id} onClick={() => setThemeIdx(i)}
                          style={{ padding: '7px 8px', borderRadius: 10, border: `1.5px solid ${active ? sportColor : 'var(--sl-border-s)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, backgroundColor: active ? `${sportColor}12` : 'var(--sl-surface)', transition: 'all 0.14s' }}>
                          <div style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, backgroundColor: bg, border: '1px solid rgba(255,255,255,0.12)', boxShadow: active ? `0 0 0 2px ${sportColor}` : 'none' }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: active ? sportColor : 'var(--sl-t2)' }}>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Background image section */}
            <div>
              <OptionLabel>Image de fond</OptionLabel>
              <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                {[['color', 'Couleur'], ['url', 'URL'], ['upload', 'Fichier']].map(([id, label]) => (
                  <button key={id} onClick={() => { setBgMode(id); if (id === 'color') clearBg(); }}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${bgMode === id ? sportColor : 'var(--sl-border-s)'}`, backgroundColor: bgMode === id ? `${sportColor}14` : 'var(--sl-surface)', color: bgMode === id ? sportColor : 'var(--sl-t2)', transition: 'all 0.14s' }}>
                    {label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {bgMode === 'url' && (
                  <motion.div key="url" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text" value={bgUrlInput} onChange={e => setBgUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUrlApply()}
                      placeholder="https://…"
                      style={{ flex: 1, padding: '8px 10px', borderRadius: 10, fontSize: 12, border: `1px solid ${bgError ? '#ef4444' : 'var(--sl-border-s)'}`, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none' }}
                    />
                    <button onClick={handleUrlApply} style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: sportColor, color: '#fff', border: 'none', cursor: 'pointer' }}>OK</button>
                    {bgImageSrc && <button onClick={clearBg} style={{ padding: '8px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
                  </motion.div>
                )}
                {bgMode === 'upload' && (
                  <motion.div key="upload" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={() => fileInputRef.current?.click()}
                      style={{ flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, backgroundColor: 'var(--sl-surface)', border: '1.5px dashed var(--sl-border-s)', color: 'var(--sl-t2)', cursor: 'pointer', textAlign: 'center' }}>
                      {bgImageSrc ? '✓ Image chargée' : '+ Choisir une image'}
                    </button>
                    {bgImageSrc && <button onClick={clearBg} style={{ padding: '9px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </motion.div>
                )}
              </AnimatePresence>

              {bgImageSrc && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {/* Filter */}
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 5 }}>FILTRE</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {BG_FILTERS.map(f => (
                        <button key={f.id} onClick={() => setBgFilter(f.id)}
                          style={{ flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${bgFilter === f.id ? sportColor : 'var(--sl-border-s)'}`, backgroundColor: bgFilter === f.id ? `${sportColor}14` : 'var(--sl-surface)', color: bgFilter === f.id ? sportColor : 'var(--sl-t3)', transition: 'all 0.12s' }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text position */}
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 5 }}>POSITION</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {TEXT_POSITIONS.map(p => (
                        <button key={p.id} onClick={() => setTextPos(p.id)}
                          style={{ flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${textPos === p.id ? sportColor : 'var(--sl-border-s)'}`, backgroundColor: textPos === p.id ? `${sportColor}14` : 'var(--sl-surface)', color: textPos === p.id ? sportColor : 'var(--sl-t3)', transition: 'all 0.12s' }}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {bgError && (
              <div style={{ padding: '8px 12px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#ef4444' }}>
                Image non chargeable — vérifiez l'URL ou utilisez un lien direct vers une image.
              </div>
            )}

            {/* Download */}
            <motion.button
              whileTap={{ scale: 0.97 }} onClick={handleDownload} disabled={downloading}
              style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', cursor: downloading ? 'wait' : 'pointer', fontSize: 15, fontWeight: 800, backgroundColor: downloading ? 'var(--sl-green-dim)' : 'var(--sl-green)', color: downloading ? 'var(--sl-green)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: downloading ? 'none' : 'var(--sl-green-glow)', transition: 'all 0.2s' }}
            >
              {downloading ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Téléchargé !</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Télécharger l'affiche PNG</>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
