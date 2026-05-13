import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toBlob } from 'html-to-image';
import { useSports } from '../hooks/useSports.js';
import { champLabel } from './poster/posterUtils.js';
import PosterRenderer, { POSTER_TEMPLATES, BASE_DIMS } from './poster/PosterRenderer.jsx';
import PosterEditor from './poster/PosterEditor.jsx';

// ── Sidebar tabs ───────────────────────────────────────────────────────────────

const SIDEBAR_TABS = [
  {
    id: 'template', label: 'Style',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="7" height="9" rx="1"/><rect x="13" y="3" width="9" height="5" rx="1"/><rect x="13" y="12" width="9" height="9" rx="1"/><rect x="2" y="16" width="7" height="5" rx="1"/></svg>,
  },
  {
    id: 'teams', label: 'Équipes',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    id: 'visuel', label: 'Visuel',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 20a8 8 0 1 1 8-8c0 2.5-1 4-3 4s-3-1.5-3-4a4 4 0 1 0-4 4H12z"/></svg>,
  },
  {
    id: 'pro', label: 'Pro',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  },
];

// ── Reusable UI helpers ────────────────────────────────────────────────────────

function SLabel({ children }) {
  return (
    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 8, marginTop: 2 }}>
      {children}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <SLabel>{label}</SLabel>}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 11px', borderRadius: 10, fontSize: 12, fontWeight: 500,
          border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)',
          color: 'var(--sl-t1)', outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function ColorSwatch({ color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 28, height: 28, borderRadius: 8, backgroundColor: color, border: 'none', cursor: 'pointer',
        boxShadow: active ? `0 0 0 2px var(--sl-card), 0 0 0 4px ${color}` : '0 1px 3px rgba(0,0,0,0.25)',
        transition: 'box-shadow 0.15s', flexShrink: 0,
      }}
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PosterStudio({ event, onClose }) {
  const { allSports } = useSports();
  const posterRef = useRef(null);
  const exportRef = useRef(null);
  const sponsorRef = useRef(null);
  const bgFileRef = useRef(null);
  const homeLogoRef = useRef(null);
  const awayLogoRef = useRef(null);

  const sportColor = allSports[event?.sport]?.color ?? '#22D96A';

  // ── State ──
  const [format, setFormat] = useState('story');
  const [templateId, setTemplateId] = useState('editorial');
  const [activeTab, setActiveTab] = useState('template');

  // Visual
  const [accentColor, setAccentColor] = useState(sportColor);
  const [bgSrc, setBgSrc] = useState('');
  const [bgUrl, setBgUrl] = useState('');
  const [bgErr, setBgErr] = useState(false);
  const [bgMode, setBgMode] = useState('color');

  // Teams
  const [homeName, setHomeName] = useState('');
  const [awayName, setAwayName] = useState('');
  const [homeLogo, setHomeLogo] = useState('');
  const [awayLogo, setAwayLogo] = useState('');
  const [championship, setChampionship] = useState(() => champLabel(event?.eventType, event?.level));
  const [tagline, setTagline] = useState('Venez nombreux !');

  // Pro
  const [sponsorSrc, setSponsorSrc] = useState('');

  // Visual editor
  const [transforms, setTransforms] = useState({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewFull, setPreviewFull] = useState(false);

  // Export
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  // ── Poster data object ──
  const posterData = {
    event,
    homeTeam: { name: homeName, logo: homeLogo },
    awayTeam: { name: awayName, logo: awayLogo },
    championship,
    tagline,
    accentColor,
    bgImage: bgSrc || null,
    sponsor: sponsorSrc || null,
  };

  // ── Preview dims ──
  const { w, h } = BASE_DIMS[format] || BASE_DIMS.story;
  const PREVIEW_W = 160;
  const previewH = Math.round(h * (PREVIEW_W / w));

  // ── Export helpers ──
  async function getBlob() {
    // Use the hidden full-size renderer (no CSS transform) for correct HD output
    const node = exportRef.current;
    if (!node) return null;
    return toBlob(node, { pixelRatio: 3, cacheBust: true });
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affiche-${(event?.title || 'match').replace(/\s+/g, '-').toLowerCase()}-${format}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloading(false), 900);
    }
  }

  async function handleShareWhatsApp() {
    setSharing(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const d = new Date(event?.date);
      const text = `🏟️ *${event?.title || 'Match'}*\n📅 ${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}\n⏰ ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n📍 ${event?.city ?? ''}\n\nVia SportLink Finistère`;
      const file = new File([blob], 'affiche-sportlink.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: event?.title });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
    } catch {}
    finally { setSharing(false); }
  }

  // ── File helpers ──
  function readFile(e, setter) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => setter(ev.target.result);
    r.readAsDataURL(f);
  }

  function applyBgUrl() {
    const u = bgUrl.trim();
    setBgSrc(u);
    setBgErr(false);
  }

  const ACCENT_PALETTE = [
    '#D4AF37', '#22D96A', '#3b82f6', '#ef4444', '#f97316', '#a855f7', '#ec4899', '#ffffff',
  ];

  const activeTpl = POSTER_TEMPLATES.find(t => t.id === templateId) || POSTER_TEMPLATES[0];

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
        {/* ── Hidden full-size renderer for HD export (scale=1, no transform) ── */}
        <div style={{ position: 'fixed', left: -9999, top: 0, width: w, height: h, pointerEvents: 'none', zIndex: -1 }}>
          <PosterRenderer
            templateId={templateId}
            data={posterData}
            format={format}
            previewWidth={w}
            innerRef={exportRef}
            transforms={transforms}
          />
        </div>

        {/* ── Fullscreen preview overlay ── */}
        <AnimatePresence>
          {previewFull && (
            <motion.div
              key="fullpreview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              style={{ position: 'absolute', inset: 0, zIndex: 40, backgroundColor: 'var(--sl-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, borderRadius: 'inherit' }}
            >
              <PosterRenderer
                templateId={templateId}
                data={posterData}
                format={format}
                previewWidth={Math.min(300, 320)}
                transforms={transforms}
              />
              <button
                onClick={() => setPreviewFull(false)}
                style={{ padding: '9px 22px', borderRadius: 12, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Fermer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Visual editor overlay ── */}
        <AnimatePresence>
          {editorOpen && (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ position: 'absolute', inset: 0, zIndex: 50, borderRadius: 'inherit' }}
            >
              <PosterEditor
                templateId={templateId}
                data={posterData}
                format={format}
                transforms={transforms}
                onChange={(blockId, patch) => setTransforms(prev => ({ ...prev, [blockId]: patch }))}
                onClose={() => setEditorOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Header ── */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 12px', borderBottom: '1px solid var(--sl-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${accentColor}1E`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--sl-t1)', letterSpacing: '-0.01em' }}>Creative Studio</div>
              <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event?.title}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'var(--sl-surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

          {/* ── Canvas row: preview (left) + sidebar (right) ── */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-bg)' }}>

            {/* Preview area */}
            <div style={{ flex: 1, minWidth: 0, padding: '12px 10px 12px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>

              {/* Format + active template row */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {(['story', 'post']).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    style={{ padding: '5px 11px', borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${f === format ? accentColor : 'var(--sl-border-s)'}`, backgroundColor: f === format ? `${accentColor}16` : 'var(--sl-surface)', color: f === format ? accentColor : 'var(--sl-t2)', transition: 'all 0.14s' }}>
                    {f === 'story' ? 'Story 9:16' : 'Post 4:5'}
                  </button>
                ))}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 9, backgroundColor: `${activeTpl.color}12`, border: `1px solid ${activeTpl.color}30`, overflow: 'hidden' }}>
                  <span style={{ fontSize: 12, flexShrink: 0 }}>{activeTpl.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: activeTpl.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeTpl.label}</span>
                </div>
              </div>

              {/* Poster preview */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{
                  width: PREVIEW_W, height: previewH,
                  borderRadius: 10, overflow: 'hidden',
                  boxShadow: '0 10px 36px rgba(0,0,0,0.5)',
                  border: '1px solid var(--sl-border-s)',
                  flexShrink: 0,
                }}>
                  <PosterRenderer
                    templateId={templateId}
                    data={posterData}
                    format={format}
                    previewWidth={PREVIEW_W}
                    innerRef={posterRef}
                    transforms={transforms}
                  />
                </div>
                {/* Fullscreen + Edit buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    onClick={() => setPreviewFull(true)}
                    title="Aperçu plein écran"
                    style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: 'var(--sl-surface)', border: '1.5px solid var(--sl-border-s)',
                      cursor: 'pointer', color: 'var(--sl-t2)', transition: 'all 0.14s',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditorOpen(true)}
                    title="Éditeur visuel"
                    style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: `${accentColor}16`, border: `1.5px solid ${accentColor}50`,
                      cursor: 'pointer', color: accentColor, transition: 'all 0.14s',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Vertical Sidebar ── */}
            <div style={{
              width: 62, flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              borderLeft: '1px solid var(--sl-border)',
              paddingTop: 4, paddingBottom: 6,
            }}>
              {SIDEBAR_TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(isActive ? null : tab.id)}
                    style={{
                      width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 3, padding: '10px 0',
                      background: isActive ? `${accentColor}12` : 'transparent',
                      border: 'none',
                      borderLeft: `2.5px solid ${isActive ? accentColor : 'transparent'}`,
                      cursor: 'pointer',
                      color: isActive ? accentColor : 'var(--sl-t3)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tab.icon}
                    <span style={{ fontSize: 8.5, fontWeight: 700 }}>{tab.label}</span>
                  </button>
                );
              })}

              <div style={{ flex: 1 }} />
              <div style={{ width: 34, height: 1, backgroundColor: 'var(--sl-border)', marginBottom: 8 }} />

              {/* PNG export */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleDownload}
                disabled={downloading}
                title="Télécharger PNG HD"
                style={{
                  width: 42, height: 42, borderRadius: 12,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 2, cursor: downloading ? 'wait' : 'pointer',
                  backgroundColor: downloading ? 'var(--sl-surface)' : `${accentColor}18`,
                  border: `1.5px solid ${downloading ? 'var(--sl-border)' : accentColor + '55'}`,
                  color: downloading ? 'var(--sl-t3)' : accentColor,
                  transition: 'all 0.15s', marginBottom: 6,
                }}
              >
                {downloading
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                }
                <span style={{ fontSize: 8, fontWeight: 700 }}>{downloading ? 'OK' : 'PNG'}</span>
              </motion.button>

              {/* WhatsApp */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleShareWhatsApp}
                disabled={sharing}
                title="Partager WhatsApp"
                style={{
                  width: 42, height: 42, borderRadius: 12,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 2, cursor: sharing ? 'wait' : 'pointer',
                  backgroundColor: sharing ? 'rgba(37,211,102,0.06)' : 'rgba(37,211,102,0.14)',
                  border: '1.5px solid rgba(37,211,102,0.38)',
                  color: '#25D366',
                  transition: 'all 0.15s', marginBottom: 4,
                }}
              >
                {sharing
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.855L.057 23.882l6.233-1.635A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894c-1.897 0-3.66-.51-5.182-1.398l-.371-.22-3.851 1.01 1.029-3.763-.242-.387A9.855 9.855 0 012.106 12c0-5.457 4.437-9.894 9.894-9.894 5.457 0 9.894 4.437 9.894 9.894 0 5.457-4.437 9.894-9.894 9.894z"/></svg>
                }
                <span style={{ fontSize: 8, fontWeight: 700 }}>{sharing ? '…' : 'WA'}</span>
              </motion.button>
            </div>
          </div>

          {/* ── Panel area ── */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <AnimatePresence mode="wait">
              {activeTab ? (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                  style={{ padding: '14px 18px 28px' }}
                >

                  {/* ── TEMPLATE PANEL ── */}
                  {activeTab === 'template' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <SLabel>Choisir un style</SLabel>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {POSTER_TEMPLATES.map(t => {
                          const active = templateId === t.id;
                          return (
                            <button key={t.id} onClick={() => setTemplateId(t.id)}
                              style={{
                                padding: '14px 12px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                                position: 'relative',
                                border: `2px solid ${active ? t.color : 'var(--sl-border-s)'}`,
                                backgroundColor: active ? `${t.color}12` : 'var(--sl-surface)',
                                transition: 'all 0.15s',
                              }}>
                              {t.isPremium && (
                                <div style={{
                                  position: 'absolute', top: 7, right: 7,
                                  fontSize: 8, fontWeight: 800,
                                  color: '#000', backgroundColor: '#D4AF37',
                                  padding: '2px 5px', borderRadius: 5,
                                  letterSpacing: '0.04em', lineHeight: 1.4,
                                }}>👑</div>
                              )}
                              <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: active ? t.color : 'var(--sl-t1)', marginBottom: 2 }}>{t.label}</div>
                              <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{t.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── TEAMS PANEL ── */}
                  {activeTab === 'teams' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <TextInput label="Équipe domicile" value={homeName} onChange={setHomeName} placeholder={`Extrait du titre automatiquement`} />
                      <div style={{ marginBottom: 10 }}>
                        <SLabel>Logo domicile</SLabel>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => homeLogoRef.current?.click()}
                            style={{ flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer', backgroundColor: homeLogo ? `${accentColor}14` : 'var(--sl-surface)', border: homeLogo ? `1.5px solid ${accentColor}` : '1.5px dashed var(--sl-border-s)', color: homeLogo ? accentColor : 'var(--sl-t2)' }}>
                            {homeLogo ? '✓ Logo chargé' : '+ Uploader le logo'}
                          </button>
                          {homeLogo && <button onClick={() => setHomeLogo('')} style={{ padding: '9px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
                          <input ref={homeLogoRef} type="file" accept="image/*" onChange={e => readFile(e, setHomeLogo)} style={{ display: 'none' }} />
                        </div>
                      </div>

                      <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0 10px' }} />

                      <TextInput label="Équipe extérieure" value={awayName} onChange={setAwayName} placeholder="Extrait du titre automatiquement" />
                      <div style={{ marginBottom: 10 }}>
                        <SLabel>Logo extérieur</SLabel>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => awayLogoRef.current?.click()}
                            style={{ flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer', backgroundColor: awayLogo ? `${accentColor}14` : 'var(--sl-surface)', border: awayLogo ? `1.5px solid ${accentColor}` : '1.5px dashed var(--sl-border-s)', color: awayLogo ? accentColor : 'var(--sl-t2)' }}>
                            {awayLogo ? '✓ Logo chargé' : '+ Uploader le logo'}
                          </button>
                          {awayLogo && <button onClick={() => setAwayLogo('')} style={{ padding: '9px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
                          <input ref={awayLogoRef} type="file" accept="image/*" onChange={e => readFile(e, setAwayLogo)} style={{ display: 'none' }} />
                        </div>
                      </div>

                      <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0 10px' }} />

                      <TextInput label="Badge compétition" value={championship} onChange={setChampionship} placeholder="Championnat D1, Coupe…" />
                      <TextInput label="Accroche" value={tagline} onChange={setTagline} placeholder="Venez nombreux !" />
                    </div>
                  )}

                  {/* ── VISUEL PANEL ── */}
                  {activeTab === 'visuel' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <SLabel>Couleur d'accent</SLabel>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {ACCENT_PALETTE.map(c => (
                            <ColorSwatch key={c} color={c} active={accentColor === c} onClick={() => setAccentColor(c)} />
                          ))}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                            <label style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 600 }}>Autre :</label>
                            <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                              style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2, backgroundColor: 'transparent' }} />
                          </div>
                        </div>
                      </div>

                      <div>
                        <SLabel>Image de fond</SLabel>
                        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                          {[['color', 'Couleur'], ['url', 'URL'], ['upload', 'Fichier']].map(([id, label]) => (
                            <button key={id}
                              onClick={() => { setBgMode(id); if (id === 'color') { setBgSrc(''); setBgErr(false); } }}
                              style={{ padding: '6px 12px', borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${bgMode === id ? accentColor : 'var(--sl-border-s)'}`, backgroundColor: bgMode === id ? `${accentColor}16` : 'var(--sl-surface)', color: bgMode === id ? accentColor : 'var(--sl-t2)', transition: 'all 0.13s' }}>
                              {label}
                            </button>
                          ))}
                        </div>

                        <AnimatePresence mode="wait">
                          {bgMode === 'url' && (
                            <motion.div key="url" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                              <input type="text" value={bgUrl} onChange={e => setBgUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyBgUrl()}
                                placeholder="https://…"
                                style={{ flex: 1, padding: '9px 11px', borderRadius: 10, fontSize: 12, border: `1px solid ${bgErr ? '#ef4444' : 'var(--sl-border-s)'}`, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none' }} />
                              <button onClick={applyBgUrl} style={{ padding: '9px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: accentColor, color: '#fff', border: 'none', cursor: 'pointer' }}>OK</button>
                              {bgSrc && <button onClick={() => { setBgSrc(''); setBgErr(false); }} style={{ padding: '9px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
                            </motion.div>
                          )}
                          {bgMode === 'upload' && (
                            <motion.div key="upload" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                              <button onClick={() => bgFileRef.current?.click()}
                                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: bgSrc ? `${accentColor}14` : 'var(--sl-surface)', border: bgSrc ? `1.5px solid ${accentColor}` : '1.5px dashed var(--sl-border-s)', color: bgSrc ? accentColor : 'var(--sl-t2)' }}>
                                {bgSrc ? '✓ Image chargée' : '+ Choisir une image'}
                              </button>
                              {bgSrc && <button onClick={() => setBgSrc('')} style={{ padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
                              <input ref={bgFileRef} type="file" accept="image/*" onChange={e => readFile(e, setBgSrc)} style={{ display: 'none' }} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {bgErr && <div style={{ padding: '7px 12px', borderRadius: 9, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, color: '#ef4444' }}>Image inaccessible — vérifiez le lien ou uploadez un fichier.</div>}
                      </div>
                    </div>
                  )}

                  {/* ── PRO PANEL ── */}
                  {activeTab === 'pro' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <SLabel>Logo partenaire / sponsor</SLabel>
                        <div style={{ padding: '12px', borderRadius: 14, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', marginBottom: 8 }}>
                          <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: '0 0 10px', lineHeight: 1.5 }}>
                            Le logo sera affiché en bas à droite de l'affiche.
                          </p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => sponsorRef.current?.click()}
                              style={{ flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: sponsorSrc ? `${accentColor}14` : 'var(--sl-card)', border: sponsorSrc ? `1.5px solid ${accentColor}` : '1.5px dashed var(--sl-border-s)', color: sponsorSrc ? accentColor : 'var(--sl-t2)' }}>
                              {sponsorSrc ? '✓ Logo chargé' : '+ Uploader le logo sponsor'}
                            </button>
                            {sponsorSrc && <button onClick={() => setSponsorSrc('')} style={{ padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-card)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
                            <input ref={sponsorRef} type="file" accept="image/*" onChange={e => readFile(e, setSponsorSrc)} style={{ display: 'none' }} />
                          </div>
                        </div>
                        {sponsorSrc && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, backgroundColor: `${accentColor}10`, border: `1px solid ${accentColor}30` }}>
                            <img src={sponsorSrc} alt="Sponsor" style={{ height: 32, maxWidth: 80, objectFit: 'contain', borderRadius: 4 }} />
                            <span style={{ fontSize: 11, color: 'var(--sl-green)', fontWeight: 600 }}>Logo actif sur l'affiche</span>
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '14px', borderRadius: 14, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>Export HD</div>
                        <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: '0 0 10px', lineHeight: 1.5 }}>
                          L'export PNG est en 3× (1080×1920 story, 1080×1350 post) — prêt pour Instagram et WhatsApp.
                        </p>
                        <motion.button
                          whileTap={{ scale: 0.96 }} onClick={handleDownload} disabled={downloading}
                          style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, backgroundColor: accentColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          {downloading ? 'Téléchargement…' : 'Télécharger PNG HD'}
                        </motion.button>
                      </div>
                    </div>
                  )}

                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '32px 24px', color: 'var(--sl-t3)', textAlign: 'center' }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12h6M12 9v6"/>
                  </svg>
                  <p style={{ fontSize: 12, margin: 0, lineHeight: 1.6 }}>Choisissez un onglet à droite pour personnaliser votre affiche</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
