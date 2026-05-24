import { useRef, useState, useEffect, useMemo, useReducer, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toBlob } from 'html-to-image';
import { useSports } from '../hooks/useSports.js';
import { Z } from '../constants/zIndex.js';
import PosterRenderer, { POSTER_TEMPLATES, BASE_DIMS, BG_PRESETS } from './poster/PosterRenderer.jsx';
import { ELEMENT_LIBRARY } from './poster/posterElements.jsx';
import PosterEditor from './poster/PosterEditor.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  usePosterDraft,
  usePosterLibrary,
  useFavoriteTemplates,
  useDefaultTemplate,
} from '../hooks/usePosterDraft.js';
import { useClubMedia } from '../hooks/useClubMedia.js';
import { useClubDNA } from '../hooks/useClubDNA.js';
import { deriveInitialFields } from '../lib/posterVariables.js';
import { generateVariants, generateAIBackground } from '../lib/posterVariants.js';
import { supabase } from '../lib/supabase.js';
import { sanitizeFilename } from '../lib/sanitize.js';

// ── Reducer ────────────────────────────────────────────────────────────────────

function posterReducer(state, action) {
  if (action.type === 'PATCH') return { ...state, ...action.payload };
  return { ...state, [action.type]: action.value };
}

// ── Color system ───────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  { id: 'neon',     label: 'Neon',    color: '#00F5FF' },
  { id: 'fire',     label: 'Feu',     color: '#FF4500' },
  { id: 'gold',     label: 'Or',      color: '#D4AF37' },
  { id: 'electric', label: 'Vert',    color: '#22D96A' },
  { id: 'royal',    label: 'Mauve',   color: '#8b5cf6' },
  { id: 'ice',      label: 'Bleu',    color: '#3b82f6' },
  { id: 'crimson',  label: 'Rouge',   color: '#ef4444' },
  { id: 'solar',    label: 'Orange',  color: '#f97316' },
  { id: 'rose',     label: 'Rose',    color: '#ec4899' },
  { id: 'silver',   label: 'Blanc',   color: '#ffffff' },
  { id: 'lime',     label: 'Lime',    color: '#84cc16' },
  { id: 'cyber',    label: 'Cyber',   color: '#a855f7' },
];

const SPORT_PALETTE = {
  football: ['#22c55e', '#4ade80', '#16a34a'],
  tennis:   ['#F5A87C', '#fbbf24', '#C0542A'],
  basket:   ['#EA580C', '#FB923C', '#f97316'],
  handball: ['#3b82f6', '#60A5FA', '#1d4ed8'],
  volleyball: ['#8b5cf6', '#A78BFA', '#6d28d9'],
  rugby:    ['#ef4444', '#F87171', '#dc2626'],
  padel:    ['#0ea5e9', '#38BDF8', '#0369a1'],
  squash:   ['#0ea5e9', '#38BDF8', '#0369a1'],
  badminton:['#10b981', '#34D399', '#059669'],
};

const TINT_PALETTE = ['#FF4500', '#00F5FF', '#8b5cf6', '#D4AF37', '#22D96A', '#ef4444', '#f97316', '#ec4899'];

// Blocks that templates expose via data-block="..." for layer control
const LAYER_BLOCKS = [
  { id: 'title',   label: 'Titre',       icon: '▬' },
  { id: 'meta',    label: 'Date & lieu', icon: '📍' },
  { id: 'champ',   label: 'Compétition', icon: '🏆' },
  { id: 'vs',      label: 'VS / Score',  icon: '⚔' },
  { id: 'tagline', label: 'Accroche',    icon: '◈' },
  { id: 'teams',   label: 'Équipes',     icon: '◉' },
];

// ── Shared UI atoms ────────────────────────────────────────────────────────────

function SLabel({ children, accent }) {
  if (accent) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, marginTop: 2 }}>
        <div style={{ width: 2, height: 13, borderRadius: 2, background: accent, flexShrink: 0 }} />
        <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: accent }}>{children}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--sl-border)' }} />
      </div>
    );
  }
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

function ColorSwatch({ color, active, onClick, size = 28 }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: 8, backgroundColor: color, border: 'none', cursor: 'pointer',
        boxShadow: active ? `0 0 0 2px var(--sl-card), 0 0 0 4px ${color}` : '0 1px 3px rgba(0,0,0,0.25)',
        transition: 'box-shadow 0.15s', flexShrink: 0,
      }}
    />
  );
}

function MiniToggle({ value, onChange, accent }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 28, height: 16, borderRadius: 8, cursor: 'pointer', position: 'relative',
        background: value ? accent : 'rgba(255,255,255,0.1)', transition: 'background 0.15s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: value ? 13 : 2, width: 12, height: 12,
        borderRadius: '50%', background: 'white', transition: 'left 0.15s',
      }} />
    </div>
  );
}

// ── Tab icons ──────────────────────────────────────────────────────────────────

function IcoModeles({ c }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
}
function IcoEquipes({ c }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IcoStyle({ c }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}
function IcoFond({ c }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  );
}
function IcoJoueurs({ c }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeOpacity="0.5"/>
    </svg>
  );
}
function IcoExporter({ c }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

const PANEL_TABS = [
  { id: 'template', label: 'Modèles',  Icon: IcoModeles },
  { id: 'teams',    label: 'Équipes',  Icon: IcoEquipes },
  { id: 'style',    label: 'Style',    Icon: IcoStyle   },
  { id: 'fond',     label: 'Fond',     Icon: IcoFond    },
  { id: 'joueurs',  label: 'Joueurs',  Icon: IcoJoueurs },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function PosterStudio({ event, onClose, club }) {
  const { allSports } = useSports();
  const { currentUser } = useAuth();
  const hasPremium = currentUser?.role === 'admin' || currentUser?.role === 'superadmin'
    || currentUser?.role === 'club_admin' || currentUser?.isPremium;

  const posterRef   = useRef(null);
  const exportRef   = useRef(null);
  const sponsorRef  = useRef(null);
  const bgFileRef   = useRef(null);
  const homeLogoRef = useRef(null);
  const awayLogoRef = useRef(null);

  const isTournamentEvent = event?.eventType === 'tournament';
  const sportColor    = allSports[event?.sport]?.color ?? '#22D96A';
  const clubAccent    = club?.theme?.primary ?? club?.theme?.accent ?? null;
  const initialAccent = clubAccent ?? (isTournamentEvent ? '#8b5cf6' : sportColor);
  const initialFields = deriveInitialFields(event, club);

  const draftHook  = usePosterDraft(event?.id);
  const libHook    = usePosterLibrary();
  const favTplHook = useFavoriteTemplates();
  const defTplHook = useDefaultTemplate(club?.id);
  const clubMedia  = useClubMedia(club?.id);
  const clubDNA    = useClubDNA(club?.id);

  const [poster, dispatch] = useReducer(posterReducer, {
    format: 'story', templateId: isTournamentEvent ? 'tr-premium' : 'simple',
    accentColor: initialAccent,
    bgSrc: '', bgUrl: '', bgErr: false, bgMode: 'color',
    bgPreset: '',
    bgTint: '', bgTintOp: 0,
    overlayElements: [],
    playerLayers: [],
    homeName: initialFields.homeName, awayName: initialFields.awayName,
    homeLogo: initialFields.homeLogo, awayLogo: initialFields.awayLogo,
    championship: initialFields.championship, tagline: initialFields.tagline,
    sponsorSrc: '', transforms: {},
  });

  const {
    format, templateId, accentColor, bgSrc, bgUrl, bgErr, bgMode, bgPreset,
    bgTint, bgTintOp,
    homeName, awayName, homeLogo, awayLogo, championship, tagline,
    sponsorSrc, transforms, overlayElements, playerLayers,
  } = poster;
  const set = (key, value) => dispatch({ type: key, value });

  const [activeTab,     setActiveTab]     = useState('template');
  const [exportOpen,    setExportOpen]    = useState(false);
  const [editorOpen,    setEditorOpen]    = useState(false);
  const [previewFull,   setPreviewFull]   = useState(false);
  const [downloading,   setDownloading]   = useState(false);
  const [sharing,       setSharing]       = useState(false);
  const [sharingIG,     setSharingIG]     = useState(false);
  const [lastSavedAt,   setLastSavedAt]   = useState(null);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [libName,       setLibName]       = useState('');
  const [libFilter,     setLibFilter]     = useState('all');
  const [favVersion,    setFavVersion]    = useState(0);
  const [canvasH,       setCanvasH]       = useState(260);
  const [mediaSearch,   setMediaSearch]   = useState('');
  const [mediaFavOnly,  setMediaFavOnly]  = useState(false);
  const [isDragOver,    setIsDragOver]    = useState(false);
  const [playerName,    setPlayerName]    = useState('');
  const [variants,      setVariants]      = useState([]);
  const [variantSeed,   setVariantSeed]   = useState(0);
  const [variantsOpen,  setVariantsOpen]  = useState(false);
  const [aiBgLoading,   setAiBgLoading]   = useState(false);
  const [aiBgResult,    setAiBgResult]    = useState(null); // { imageUrl, prompt, apiMode }
  const skipAutoSave  = useRef(true);
  const canvasAreaRef = useRef(null);
  const playerFileRef = useRef(null);
  const dnaFileRef    = useRef(null);

  useEffect(() => {
    favTplHook.loadFromDB();
    const draft = draftHook.loadDraft();
    if (draft?.state) {
      const merged = { ...draft.state };
      if (!merged.homeLogo && initialFields.homeLogo) merged.homeLogo = initialFields.homeLogo;
      if (!merged.awayLogo && initialFields.awayLogo) merged.awayLogo = initialFields.awayLogo;
      dispatch({ type: 'PATCH', payload: merged });
      setRestoredDraft(true);
      setTimeout(() => setRestoredDraft(false), 3000);
    } else {
      const defaultTpl = defTplHook.get();
      if (defaultTpl) set('templateId', defaultTpl);
    }
    setTimeout(() => { skipAutoSave.current = false; }, 150);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setCanvasH(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const draftState = useMemo(() => {
    const { bgUrl: _, bgErr: __, ...rest } = poster;
    return rest;
  }, [poster]);

  useEffect(() => {
    if (skipAutoSave.current) return;
    const t = setTimeout(() => {
      draftHook.saveDraft(draftState);
      setLastSavedAt(new Date().toISOString());
    }, 2000);
    return () => clearTimeout(t);
  }, [draftState]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sport & club color palettes ──
  const sportColors = useMemo(() => {
    const sport = (event?.sport || '').toLowerCase();
    for (const [key, colors] of Object.entries(SPORT_PALETTE)) {
      if (sport.includes(key)) return colors;
    }
    return [];
  }, [event?.sport]);

  const clubColors = useMemo(() => {
    const colors = [];
    if (club?.theme?.primary)   colors.push(club.theme.primary);
    if (club?.theme?.accent)    colors.push(club.theme.accent);
    if (club?.theme?.secondary) colors.push(club.theme.secondary);
    return [...new Set(colors)].slice(0, 4);
  }, [club?.theme]);

  // ── Library ──
  function saveToLib() { libHook.save(draftState, libName.trim() || undefined); setLibName(''); }
  function loadFromLibrary(entry) { dispatch({ type: 'PATCH', payload: entry.state }); setActiveTab('template'); }

  // ── Templates ──
  const displayTemplates = useMemo(() => {
    const byType = isTournamentEvent
      ? POSTER_TEMPLATES.filter(t => t.isTournament)
      : POSTER_TEMPLATES.filter(t => !t.isTournament);
    if (libFilter === 'all') return byType;
    return byType.filter(t => favTplHook.isFav(t.id));
  }, [libFilter, favVersion, isTournamentEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleFavTpl(id) { favTplHook.toggle(id); setFavVersion(v => v + 1); }

  // ── Layer helpers ──
  function setLayerProp(blockId, key, value) {
    set('transforms', { ...transforms, [blockId]: { ...(transforms[blockId] || {}), [key]: value } });
  }
  function resetLayers() { set('transforms', {}); }
  const hasLayerChanges = Object.values(transforms).some(t => t.visible === false || (t.opacity !== undefined && t.opacity < 1));

  // ── Overlay element helpers ──
  function addOverlayElement(type) {
    const meta = ELEMENT_LIBRARY.find(e => e.id === type);
    const uid = `el-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    const newEl = { uid, type, color: meta?.defaultColor ?? accentColor, opacity: 0.70, above: false };
    set('overlayElements', [...(overlayElements || []), newEl]);
  }
  function removeOverlayElement(uid) {
    set('overlayElements', (overlayElements || []).filter(e => e.uid !== uid));
  }
  function updateOverlayElement(uid, patch) {
    set('overlayElements', (overlayElements || []).map(e => e.uid === uid ? { ...e, ...patch } : e));
  }

  // ── Player layer helpers ──
  function addPlayerLayer(asset) {
    const uid = `pl-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    const layer = {
      uid,
      assetId: asset.id,
      assetUrl: asset.processedDataUrl,
      thumbUrl: asset.thumbDataUrl,
      name: asset.name,
      x: 50, yBottom: 0, scale: 1.0,
      opacity: 1.0, shadow: true, glow: false, flip: false,
      zAbove: true,
    };
    set('playerLayers', [...(playerLayers || []), layer]);
  }
  function removePlayerLayer(uid) {
    set('playerLayers', (playerLayers || []).filter(p => p.uid !== uid));
  }
  function updatePlayerLayer(uid, patch) {
    set('playerLayers', (playerLayers || []).map(p => p.uid === uid ? { ...p, ...patch } : p));
  }

  // ── Player upload handler ──
  async function handlePlayerFile(file) {
    if (!file) return;
    clubMedia.resetUpload();
    try {
      const asset = await clubMedia.uploadPlayer(file, playerName);
      setPlayerName('');
      addPlayerLayer(asset);
    } catch {}
  }

  // ── Drag & drop handlers ──
  const handleDragOver = useCallback(e => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);
  const handleDrop = useCallback(e => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handlePlayerFile(file);
  }, [playerName, clubMedia]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poster data ──
  const posterData = {
    event,
    homeTeam: { name: homeName, logo: homeLogo },
    awayTeam: { name: awayName, logo: awayLogo },
    championship, tagline, accentColor,
    bgImage: bgSrc || null,
    sponsor: sponsorSrc || null,
  };

  const posterEffects = { tint: bgTint || null, tintOp: bgTintOp };

  const { w, h } = BASE_DIMS[format] || BASE_DIMS.story;
  const maxPosterH = Math.max(canvasH - 20, 80);
  const PREVIEW_W  = Math.min(Math.floor(maxPosterH * (w / h)), 200);
  const previewH   = Math.round(h * (PREVIEW_W / w));

  // ── Export helpers ──
  async function getBlob() {
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
      a.download = `affiche-${sanitizeFilename(event?.title ?? 'match')}-${format}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setTimeout(() => setDownloading(false), 900); }
  }

  async function handleShareWhatsApp() {
    setSharing(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const d = new Date(event?.date);
      const eventUrl = event?.id ? `${window.location.origin}${window.location.pathname}#event/${event.id}` : window.location.origin;
      const text = `🏟️ *${event?.title || 'Match'}*\n📅 ${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}\n⏰ ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n📍 ${event?.city ?? ''}\n\n${eventUrl}`;
      const file = new File([blob], 'affiche-sportlink.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: event?.title });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
    } catch {} finally { setSharing(false); }
  }

  async function handleShareIG() {
    setSharingIG(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const file = new File([blob], 'affiche-sportlink.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: event?.title ?? 'SportLink' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `affiche-sportlink-${format}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {} finally { setSharingIG(false); }
  }

  function handleShareFacebook() {
    const eventUrl = event?.id
      ? `${window.location.origin}${window.location.pathname}#event/${event.id}`
      : window.location.origin;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, '_blank', 'noopener,noreferrer,width=600,height=400');
  }

  function readFile(e, setter) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => setter(ev.target.result);
    r.readAsDataURL(f);
  }

  function applyBgUrl() {
    dispatch({ type: 'PATCH', payload: { bgSrc: bgUrl.trim(), bgErr: false } });
  }

  const activeTpl = POSTER_TEMPLATES.find(t => t.id === templateId) || POSTER_TEMPLATES[0];

  function handleTabClick(id) {
    setExportOpen(false);
    setActiveTab(prev => prev === id ? null : id);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: Z.posterStudio,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
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
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Hidden HD renderer for export */}
        <div style={{ position: 'fixed', left: -9999, top: 0, width: w, height: h, pointerEvents: 'none', zIndex: -1 }}>
          <PosterRenderer templateId={templateId} data={posterData} format={format} previewWidth={w} innerRef={exportRef} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} playerLayers={playerLayers || []} />
        </div>

        {/* Fullscreen preview */}
        <AnimatePresence>
          {previewFull && (
            <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, zIndex: 40, backgroundColor: 'var(--sl-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, borderRadius: 'inherit' }}>
              <PosterRenderer templateId={templateId} data={posterData} format={format} previewWidth={Math.min(300, 320)} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} playerLayers={playerLayers || []} />
              <button onClick={() => setPreviewFull(false)}
                style={{ padding: '9px 22px', borderRadius: 12, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Fermer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visual editor overlay */}
        <AnimatePresence>
          {editorOpen && (
            <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, zIndex: 50, borderRadius: 'inherit' }}>
              <PosterEditor
                templateId={templateId} data={posterData} format={format} transforms={transforms}
                onChange={(blockId, patch) => dispatch({ type: 'transforms', value: { ...transforms, [blockId]: patch } })}
                onClose={() => setEditorOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export popover */}
        <AnimatePresence>
          {exportOpen && (
            <motion.div
              key="exportpopover"
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              style={{
                position: 'absolute', bottom: 72, right: 12, left: 12, zIndex: 30,
                backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
                borderRadius: 20, boxShadow: '0 12px 40px rgba(0,0,0,0.3)', padding: 8,
              }}
            >
              {/* PNG */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleDownload(); setExportOpen(false); }} disabled={downloading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 13, border: 'none', cursor: 'pointer', backgroundColor: `${accentColor}10` }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{downloading ? 'Téléchargement…' : 'Télécharger en PNG'}</div>
                  <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>HD 3× — prêt pour Instagram</div>
                </div>
              </motion.button>

              <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0' }} />

              {/* WhatsApp */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleShareWhatsApp(); setExportOpen(false); }} disabled={sharing}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 13, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(37,211,102,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.855L.057 23.882l6.233-1.635A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894c-1.897 0-3.66-.51-5.182-1.398l-.371-.22-3.851 1.01 1.029-3.763-.242-.387A9.855 9.855 0 012.106 12c0-5.457 4.437-9.894 9.894-9.894 5.457 0 9.894 4.437 9.894 9.894 0 5.457-4.437 9.894-9.894 9.894z"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{sharing ? 'Partage…' : 'Partager sur WhatsApp'}</div>
                  <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Image + texte de l'événement</div>
                </div>
              </motion.button>

              {/* Instagram */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleShareIG(); setExportOpen(false); }} disabled={sharingIG}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 13, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(225,48,108,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2.3" strokeLinecap="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{sharingIG ? 'Partage…' : 'Partager sur Instagram'}</div>
                  <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Via le partage natif ou téléchargement</div>
                </div>
              </motion.button>

              {/* Facebook */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleShareFacebook(); setExportOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 13, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(24,119,242,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Partager sur Facebook</div>
                  <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Partage du lien de l'événement</div>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px 11px', borderBottom: '1px solid var(--sl-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: `${accentColor}1E`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--sl-t1)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>Creative Studio</div>
              <div style={{ fontSize: 10, color: 'var(--sl-t3)', maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event?.title}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AnimatePresence>
              {restoredDraft && (
                <motion.span key="restored" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700 }}>Brouillon restauré</motion.span>
              )}
              {!restoredDraft && lastSavedAt && (
                <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ fontSize: 10, color: 'var(--sl-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Sauvegardé
                </motion.span>
              )}
            </AnimatePresence>
            <button onClick={onClose}
              style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'var(--sl-surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── FORMAT + ACTIVE TEMPLATE ─────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, padding: '8px 14px', borderBottom: '1px solid var(--sl-border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            display: 'inline-flex', gap: 2, flexShrink: 0,
            backgroundColor: 'var(--sl-surface)', borderRadius: 13,
            padding: 3, border: '1px solid var(--sl-border)',
          }}>
            {[
              { id: 'post',  label: 'Post 4:5',   icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/></svg> },
              { id: 'story', label: 'Story 9:16',  icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="6" y="1" width="12" height="22" rx="2"/></svg> },
            ].map(f => {
              const active = f.id === format;
              return (
                <button key={f.id} onClick={() => set('format', f.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 11,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: 'none', whiteSpace: 'nowrap',
                    backgroundColor: active ? accentColor : 'transparent',
                    color: active ? '#fff' : 'var(--sl-t2)',
                    transition: 'all 0.16s',
                  }}>
                  {f.icon}
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Active template pill */}
          <div style={{
            flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 9px', borderRadius: 10,
            backgroundColor: `${activeTpl.color}12`,
            border: `1px solid ${activeTpl.color}30`, overflow: 'hidden',
          }}>
            <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1 }}>{activeTpl.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: activeTpl.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeTpl.label}</span>
          </div>

          {/* Accent color dot */}
          <div style={{ width: 24, height: 24, borderRadius: 7, background: accentColor, flexShrink: 0, boxShadow: `0 0 8px ${accentColor}60` }} />
        </div>

        {/* ── CANVAS AREA ─────────────────────────────────────────────────────── */}
        <div
          ref={canvasAreaRef}
          style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--sl-bg)', position: 'relative', overflow: 'hidden' }}
          onClick={() => exportOpen && setExportOpen(false)}
        >
          <div style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{
              width: PREVIEW_W, height: previewH,
              borderRadius: 12, overflow: 'hidden', flexShrink: 0,
              boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.18)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <PosterRenderer
                templateId={templateId} data={posterData} format={format}
                previewWidth={PREVIEW_W} innerRef={posterRef} transforms={transforms}
                bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []}
                playerLayers={playerLayers || []}
              />
            </div>

            {/* Floating action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
              <button onClick={() => setPreviewFull(true)} title="Aperçu plein écran"
                style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', cursor: 'pointer', color: 'var(--sl-t2)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              </button>
              <button onClick={() => setEditorOpen(true)} title="Éditeur visuel"
                style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${accentColor}16`, border: `1px solid ${accentColor}50`, cursor: 'pointer', color: accentColor, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── PANEL CONTENT ───────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.16 }}
              style={{
                flexShrink: 0, overflowY: 'auto', maxHeight: '42dvh',
                borderTop: '1px solid var(--sl-border)',
                backgroundColor: 'var(--sl-card)',
              }}
            >
              <div style={{ padding: '14px 16px 16px' }}>

                {/* ── MODÈLES ── */}
                {activeTab === 'template' && (
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
                          <button key={t.id} onClick={() => { if (!locked) set('templateId', t.id); }}
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

                    {/* ── VARIANTES IA — PS-UX-014→018 ── */}
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

                        {/* Generate button */}
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
                              color: '#fff', border: 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}>
                            <span style={{ fontSize: 16 }}>✨</span>
                            Générer des variantes
                            <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>basées sur votre style club</span>
                          </button>
                        )}

                        {/* Variants gallery — PS-UX-015 */}
                        {variants.length > 0 && (
                          <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                              {variants.map(v => (
                                <button
                                  key={v.variantId}
                                  onClick={() => {
                                    dispatch({ type: 'PATCH', payload: v.state });
                                  }}
                                  style={{
                                    padding: 0, border: `2px solid ${templateId === v.templateId && accentColor === v.accentColor ? v.tplColor : 'var(--sl-border-s)'}`,
                                    borderRadius: 10, cursor: 'pointer', overflow: 'hidden',
                                    background: 'var(--sl-surface)',
                                    transition: 'border-color 0.15s',
                                  }}>
                                  {/* Mini PosterRenderer preview */}
                                  <div style={{ width: '100%', aspectRatio: format === 'story' ? '9/16' : '4/5', overflow: 'hidden', pointerEvents: 'none' }}>
                                    <PosterRenderer
                                      templateId={v.templateId}
                                      data={{ ...posterData, accentColor: v.accentColor }}
                                      format={format}
                                      previewWidth={72}
                                      transforms={{}}
                                      bgPresetId={v.state.bgPreset}
                                      effects={{ tint: null, tintOp: 0 }}
                                      overlayElements={v.state.overlayElements || []}
                                      playerLayers={[]}
                                    />
                                  </div>
                                  {/* PS-UX-018 label */}
                                  <div style={{ padding: '4px 5px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 3, background: v.accentColor, flexShrink: 0, boxShadow: `0 0 4px ${v.accentColor}80` }} />
                                    <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--sl-t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.label}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <div style={{ marginTop: 8, fontSize: 9.5, color: 'var(--sl-t3)', textAlign: 'center' }}>
                              Cliquer pour appliquer · {variants.length} variantes générées depuis votre style {clubDNA.daProfile.styleLabel}
                            </div>

                            {/* ── PS-VAR-006 — Fonds IA section ── */}
                            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--sl-border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--sl-t3)' }}>Fond IA</span>
                                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 700 }}>Fal.ai Flux</span>
                              </div>

                              {!aiBgResult && (
                                <button
                                  disabled={aiBgLoading}
                                  onClick={async () => {
                                    setAiBgLoading(true);
                                    const res = await generateAIBackground(clubDNA.daProfile, event?.sport, supabase);
                                    setAiBgResult(res);
                                    setAiBgLoading(false);
                                    if (res.imageUrl) {
                                      dispatch({ type: 'PATCH', payload: { bgSrc: res.imageUrl, bgMode: 'image', bgErr: false } });
                                    }
                                  }}
                                  style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: aiBgLoading ? 'wait' : 'pointer',
                                    border: '1px dashed rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.07)', color: '#a78bfa',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: aiBgLoading ? 0.7 : 1,
                                  }}>
                                  {aiBgLoading
                                    ? <><span style={{ fontSize: 14 }}>⏳</span> Génération en cours…</>
                                    : <><span style={{ fontSize: 14 }}>🎨</span> Générer un fond IA</>}
                                </button>
                              )}

                              {aiBgResult && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {aiBgResult.imageUrl ? (
                                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `1.5px solid rgba(139,92,246,0.4)` }}>
                                      <img src={aiBgResult.imageUrl} alt="AI background" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                                      <div style={{ position: 'absolute', top: 5, right: 5, fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'rgba(139,92,246,0.85)', color: '#fff' }}>{aiBgResult.provider === 'fal' ? 'Fal.ai' : 'IA'}</div>
                                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0, transition: 'opacity 0.15s', background: 'rgba(0,0,0,0.4)' }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                        onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                        <button onClick={() => dispatch({ type: 'PATCH', payload: { bgSrc: aiBgResult.imageUrl, bgMode: 'image', bgErr: false } })}
                                          style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10, fontWeight: 700, background: '#fff', color: '#111', border: 'none', cursor: 'pointer' }}>Appliquer</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ padding: '8px 10px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 10, color: '#ef4444' }}>
                                      Fal.ai non configuré — FAL_API_KEY requis dans les secrets Edge Function.
                                    </div>
                                  )}
                                  <button onClick={() => setAiBgResult(null)}
                                    style={{ fontSize: 10, color: 'var(--sl-t3)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textAlign: 'left' }}>
                                    Régénérer un fond IA
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── ÉQUIPES ── */}
                {activeTab === 'teams' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <TextInput label="Équipe domicile" value={homeName} onChange={v => set('homeName', v)} placeholder="Extrait du titre automatiquement" />
                    <div style={{ marginBottom: 10 }}>
                      <SLabel>Logo domicile</SLabel>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => homeLogoRef.current?.click()}
                          style={{ flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer', backgroundColor: homeLogo ? `${accentColor}14` : 'var(--sl-surface)', border: homeLogo ? `1.5px solid ${accentColor}` : '1.5px dashed var(--sl-border-s)', color: homeLogo ? accentColor : 'var(--sl-t2)' }}>
                          {homeLogo ? '✓ Logo chargé' : '+ Uploader le logo'}
                        </button>
                        {homeLogo && <button onClick={() => set('homeLogo', '')} style={{ padding: '9px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
                        <input ref={homeLogoRef} type="file" accept="image/*" onChange={e => readFile(e, v => set('homeLogo', v))} style={{ display: 'none' }} />
                      </div>
                    </div>
                    <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0 10px' }} />
                    <TextInput label="Équipe extérieure" value={awayName} onChange={v => set('awayName', v)} placeholder="Extrait du titre automatiquement" />
                    <div style={{ marginBottom: 10 }}>
                      <SLabel>Logo extérieur</SLabel>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => awayLogoRef.current?.click()}
                          style={{ flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer', backgroundColor: awayLogo ? `${accentColor}14` : 'var(--sl-surface)', border: awayLogo ? `1.5px solid ${accentColor}` : '1.5px dashed var(--sl-border-s)', color: awayLogo ? accentColor : 'var(--sl-t2)' }}>
                          {awayLogo ? '✓ Logo chargé' : '+ Uploader le logo'}
                        </button>
                        {awayLogo && <button onClick={() => set('awayLogo', '')} style={{ padding: '9px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
                        <input ref={awayLogoRef} type="file" accept="image/*" onChange={e => readFile(e, v => set('awayLogo', v))} style={{ display: 'none' }} />
                      </div>
                    </div>
                    <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0 10px' }} />
                    <TextInput label="Badge compétition" value={championship} onChange={v => set('championship', v)} placeholder="Championnat D1, Coupe…" />
                    <TextInput label="Accroche" value={tagline} onChange={v => set('tagline', v)} placeholder="Venez nombreux !" />
                  </div>
                )}

                {/* ── STYLE ── */}
                {activeTab === 'style' && (
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
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                transition: 'all 0.12s',
                              }}>
                              <div style={{ width: 22, height: 22, borderRadius: 7, background: p.color, boxShadow: active ? `0 0 10px ${p.color}80` : 'none', transition: 'box-shadow 0.12s' }} />
                              <span style={{ fontSize: 8.5, fontWeight: 700, color: active ? p.color : 'var(--sl-t3)', letterSpacing: '0.04em' }}>{p.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      {/* Custom picker row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
                        <input type="color" value={accentColor} onChange={e => set('accentColor', e.target.value)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2, backgroundColor: 'transparent', flexShrink: 0 }}/>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: `linear-gradient(90deg, #000 0%, ${accentColor} 50%, #fff 100%)` }}/>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{accentColor.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Sport palette */}
                    {sportColors.length > 0 && (
                      <div>
                        <SLabel>Couleurs {event?.sport || 'sport'}</SLabel>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {sportColors.map(c => (
                            <ColorSwatch key={c} color={c} active={accentColor === c} onClick={() => set('accentColor', c)} />
                          ))}
                          <span style={{ fontSize: 10, color: 'var(--sl-t3)', marginLeft: 4 }}>Cliquer pour appliquer</span>
                        </div>
                      </div>
                    )}

                    {/* Club palette */}
                    {clubColors.length > 0 && (
                      <div>
                        <SLabel>Couleurs du club</SLabel>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {clubColors.map(c => (
                            <ColorSwatch key={c} color={c} active={accentColor === c} onClick={() => set('accentColor', c)} />
                          ))}
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
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 10px', borderRadius: 10,
                                backgroundColor: 'var(--sl-surface)',
                                border: `1px solid ${visible ? 'var(--sl-border)' : 'rgba(239,68,68,0.2)'}`,
                                opacity: visible ? 1 : 0.5, transition: 'opacity 0.15s, border-color 0.15s',
                              }}>
                              <span style={{ fontSize: 12, width: 18, textAlign: 'center', flexShrink: 0 }}>{block.icon}</span>
                              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--sl-t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.label}</span>
                              {/* Opacity slider */}
                              <input
                                type="range" min={0.1} max={1} step={0.05} value={opacity}
                                onChange={e => setLayerProp(block.id, 'opacity', parseFloat(e.target.value))}
                                style={{ width: 46, accentColor, cursor: 'pointer', flexShrink: 0 }}
                              />
                              <span style={{ fontSize: 9, color: 'var(--sl-t3)', width: 22, textAlign: 'right', flexShrink: 0 }}>{Math.round(opacity * 100)}%</span>
                              {/* Visibility toggle */}
                              <MiniToggle value={visible} onChange={v => setLayerProp(block.id, 'visible', v)} accent={accentColor} />
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 8, background: `${accentColor}08`, border: `1px solid ${accentColor}20`, fontSize: 10, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
                        Position & rotation → bouton ✏️ sur l'aperçu
                      </div>
                    </div>

                    {/* ── IDENTITÉ VISUELLE ── */}
                    {(() => {
                      const { daProfile, analyzing, analyzeError } = clubDNA;
                      const STYLE_ICONS = { premium: '✦', bold: '⚡', cinematic: '🎬', minimalist: '◻', street: '🔥', esport: '⚙', classic: '◈' };
                      return (
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

                          {/* Upload zone — shown when no profile yet */}
                          {!daProfile && !analyzing && (
                            <div onClick={() => dnaFileRef.current?.click()}
                              style={{
                                padding: '20px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                                border: `2px dashed ${accentColor}50`,
                                background: `${accentColor}07`,
                                transition: 'all 0.15s',
                              }}>
                              <div style={{ fontSize: 26, marginBottom: 6 }}>🎨</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 3 }}>
                                Importez une affiche existante
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
                                Notre IA analyse votre identité visuelle<br />et adapte les templates à votre style de club
                              </div>
                            </div>
                          )}

                          {/* Analyzing state */}
                          {analyzing && (
                            <div style={{ padding: '20px 16px', borderRadius: 14, background: 'var(--sl-surface)', border: `1px solid ${accentColor}30`, textAlign: 'center' }}>
                              <div style={{ fontSize: 24, marginBottom: 8 }}>🎨</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, marginBottom: 6 }}>
                                Analyse de votre identité visuelle…
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginBottom: 10 }}>
                                Extraction des couleurs et classification du style
                              </div>
                              <div style={{ height: 3, borderRadius: 2, background: 'var(--sl-border)', overflow: 'hidden' }}>
                                <motion.div
                                  style={{ height: '100%', background: accentColor, borderRadius: 2 }}
                                  animate={{ width: ['0%', '60%', '90%'] }}
                                  transition={{ duration: 2.2, ease: 'easeInOut' }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Analysis result */}
                          {daProfile && !analyzing && (
                            <div style={{ borderRadius: 14, background: 'var(--sl-surface)', border: `1.5px solid ${daProfile.colors.accent}40`, overflow: 'hidden' }}>
                              {/* Color palette header */}
                              <div style={{ display: 'flex', height: 10 }}>
                                {daProfile.palette.map((hex, i) => (
                                  <div key={i} style={{ flex: 1, background: hex }} />
                                ))}
                              </div>
                              <div style={{ padding: '12px 14px' }}>
                                {/* Style label + confidence */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${daProfile.colors.accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                                    {STYLE_ICONS[daProfile.style] || '🎨'}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 2 }}>{daProfile.styleLabel}</div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      {daProfile.mood.slice(0, 3).map(m => (
                                        <span key={m} style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: `${daProfile.colors.accent}18`, color: daProfile.colors.accent, textTransform: 'capitalize' }}>{m}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#22D96A' }}>{Math.round(daProfile.confidence * 100)}%</div>
                                    <div style={{ fontSize: 8.5, color: 'var(--sl-t3)' }}>confiance</div>
                                  </div>
                                </div>

                                {/* 5 color swatches */}
                                <div style={{ marginBottom: 10 }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 6 }}>Palette extraite</div>
                                  <div style={{ display: 'flex', gap: 5 }}>
                                    {daProfile.palette.map((hex, i) => (
                                      <button key={i} onClick={() => set('accentColor', hex)} title={hex}
                                        style={{ flex: 1, height: 28, borderRadius: 7, background: hex, border: accentColor === hex ? `2px solid white` : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.12s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                                    ))}
                                  </div>
                                  <div style={{ fontSize: 9, color: 'var(--sl-t3)', marginTop: 4 }}>Cliquer pour appliquer comme couleur principale</div>
                                </div>

                                {/* Template recommendations */}
                                {daProfile.templateAffinities?.length > 0 && (
                                  <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 6 }}>Templates recommandés</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                      {daProfile.templateAffinities.map(tpl => (
                                        <span key={tpl} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${daProfile.colors.accent}14`, color: daProfile.colors.accent, border: `1px solid ${daProfile.colors.accent}30`, textTransform: 'capitalize' }}>
                                          {tpl}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Apply button */}
                                <button
                                  onClick={() => {
                                    clubDNA.applyToStudio(dispatch);
                                    // Also apply the dominant color to accent
                                    set('accentColor', daProfile.colors.accent);
                                  }}
                                  style={{
                                    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800,
                                    background: `linear-gradient(135deg, ${daProfile.colors.accent}, ${daProfile.colors.dominant})`,
                                    color: '#fff', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                  }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  Appliquer à mes affiches
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Error */}
                          {analyzeError && (
                            <div style={{ marginTop: 8, padding: '7px 11px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, color: '#ef4444' }}>
                              {analyzeError}
                            </div>
                          )}

                          {/* Clear */}
                          {daProfile && (
                            <button onClick={() => clubDNA.clearDNA()}
                              style={{ marginTop: 8, width: '100%', padding: '7px', borderRadius: 9, fontSize: 10, fontWeight: 600, color: 'var(--sl-t3)', background: 'none', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>
                              Supprimer l'analyse
                            </button>
                          )}

                          {/* Mode test notice */}
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
                      );
                    })()}
                  </div>
                )}

                {/* ── JOUEURS ── */}
                {activeTab === 'joueurs' && (() => {
                  const { uploadPhase, uploadError, lastUpload } = clubMedia;
                  const isUploading = uploadPhase && uploadPhase !== 'done' && uploadPhase !== 'error';
                  const filteredAssets = mediaSearch
                    ? clubMedia.searchAssets(mediaSearch)
                    : mediaFavOnly ? clubMedia.filterByFavorites() : clubMedia.assets;
                  const PHASE_LABELS = {
                    compressing: 'Compression…',
                    processing:  'Détourage IA…',
                    thumbnail:   'Finalisation…',
                  };
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                      {/* Mode test notice */}
                      <div style={{ padding: '7px 11px', borderRadius: 9, background: `${accentColor}10`, border: `1px solid ${accentColor}25`, fontSize: 10, color: 'var(--sl-t3)', display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 13 }}>🧪</span>
                        <span>Mode test — détourage local par couleur de fond. Intégration Remove.bg en Phase 4.</span>
                      </div>

                      {/* Upload zone */}
                      {!isUploading && uploadPhase !== 'done' && (
                        <div>
                          <SLabel accent={accentColor}>Ajouter un joueur</SLabel>
                          <div style={{ marginBottom: 8 }}>
                            <input
                              value={playerName}
                              onChange={e => setPlayerName(e.target.value)}
                              placeholder="Nom du joueur (optionnel)"
                              style={{ width: '100%', padding: '8px 10px', borderRadius: 9, fontSize: 12, fontWeight: 500, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => playerFileRef.current?.click()}
                            style={{
                              padding: '22px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                              border: `2px dashed ${isDragOver ? accentColor : 'var(--sl-border-s)'}`,
                              background: isDragOver ? `${accentColor}10` : 'var(--sl-surface)',
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ fontSize: 26, marginBottom: 6 }}>📸</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 3 }}>
                              {isDragOver ? 'Déposer l\'image' : 'Déposer une photo ou cliquer'}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>JPEG · PNG · max 10 Mo · fond uni recommandé</div>
                          </div>
                          <input ref={playerFileRef} type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => handlePlayerFile(e.target.files?.[0])} />
                          {uploadError && (
                            <div style={{ marginTop: 8, padding: '7px 11px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, color: '#ef4444' }}>
                              {uploadError}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Upload progress */}
                      {isUploading && (
                        <div style={{ padding: '22px 16px', borderRadius: 14, background: 'var(--sl-surface)', border: `1px solid ${accentColor}30`, textAlign: 'center' }}>
                          <div style={{ fontSize: 26, marginBottom: 8 }}>
                            {uploadPhase === 'compressing' ? '📦' : uploadPhase === 'processing' ? '✂️' : '🖼️'}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, marginBottom: 6 }}>
                            {PHASE_LABELS[uploadPhase] || 'Traitement…'}
                          </div>
                          <div style={{ height: 3, borderRadius: 2, background: 'var(--sl-border)', overflow: 'hidden' }}>
                            <motion.div
                              style={{ height: '100%', background: accentColor, borderRadius: 2 }}
                              animate={{ width: uploadPhase === 'compressing' ? '30%' : uploadPhase === 'processing' ? '75%' : '100%' }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Upload result preview */}
                      {uploadPhase === 'done' && lastUpload && (
                        <div style={{ padding: '14px', borderRadius: 14, background: `${accentColor}0E`, border: `1.5px solid ${accentColor}40` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 60, height: 80, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sl-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img src={lastUpload.thumbDataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 3 }}>{lastUpload.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Détourage effectué · Fond supprimé</div>
                              <div style={{ fontSize: 10, color: accentColor, marginTop: 2 }}>✓ Ajouté sur l'affiche</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 7 }}>
                            <button onClick={clubMedia.resetUpload}
                              style={{ flex: 1, padding: '8px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'var(--sl-surface)', color: 'var(--sl-t2)', border: '1px solid var(--sl-border)' }}>
                              + Autre joueur
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Joueurs sur cette affiche */}
                      {(playerLayers || []).length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <SLabel accent={accentColor}>Sur cette affiche ({playerLayers.length})</SLabel>
                            <button onClick={() => set('playerLayers', [])}
                              style={{ fontSize: 9.5, color: 'var(--sl-t3)', border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 5, textDecoration: 'underline' }}>
                              Tout retirer
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(playerLayers || []).map(pl => (
                              <div key={pl.uid} style={{ padding: '10px 12px', borderRadius: 12, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
                                {/* Row 1: thumb + name + controls */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                                  <div style={{ width: 36, height: 44, borderRadius: 7, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {pl.thumbUrl
                                      ? <img src={pl.thumbUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                      : <span style={{ fontSize: 18 }}>🧍</span>
                                    }
                                  </div>
                                  <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</span>
                                  {/* Z-order toggle */}
                                  <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--sl-border)', flexShrink: 0 }}>
                                    {[['Fond', false], ['Dessus', true]].map(([lbl, val]) => (
                                      <button key={lbl} onClick={() => updatePlayerLayer(pl.uid, { zAbove: val })}
                                        style={{ padding: '3px 8px', border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 800, backgroundColor: pl.zAbove === val ? accentColor : 'var(--sl-surface)', color: pl.zAbove === val ? '#fff' : 'var(--sl-t3)', transition: 'all 0.12s' }}>
                                        {lbl}
                                      </button>
                                    ))}
                                  </div>
                                  <button onClick={() => removePlayerLayer(pl.uid)}
                                    style={{ width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.10)', color: '#ef4444', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    ✕
                                  </button>
                                </div>
                                {/* Row 2: scale + opacity */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 9, color: 'var(--sl-t3)', width: 38, flexShrink: 0 }}>Taille</span>
                                    <input type="range" min={0.3} max={1.6} step={0.05} value={pl.scale}
                                      onChange={e => updatePlayerLayer(pl.uid, { scale: parseFloat(e.target.value) })}
                                      style={{ flex: 1, accentColor, cursor: 'pointer' }} />
                                    <span style={{ fontSize: 9, color: 'var(--sl-t3)', width: 26, textAlign: 'right', flexShrink: 0 }}>{Math.round(pl.scale * 100)}%</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 9, color: 'var(--sl-t3)', width: 38, flexShrink: 0 }}>Opacité</span>
                                    <input type="range" min={0.1} max={1} step={0.05} value={pl.opacity}
                                      onChange={e => updatePlayerLayer(pl.uid, { opacity: parseFloat(e.target.value) })}
                                      style={{ flex: 1, accentColor, cursor: 'pointer' }} />
                                    <span style={{ fontSize: 9, color: 'var(--sl-t3)', width: 26, textAlign: 'right', flexShrink: 0 }}>{Math.round(pl.opacity * 100)}%</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 9, color: 'var(--sl-t3)', width: 38, flexShrink: 0 }}>Position</span>
                                    <input type="range" min={5} max={95} step={1} value={pl.x}
                                      onChange={e => updatePlayerLayer(pl.uid, { x: parseInt(e.target.value) })}
                                      style={{ flex: 1, accentColor, cursor: 'pointer' }} />
                                    <span style={{ fontSize: 9, color: 'var(--sl-t3)', width: 26, textAlign: 'right', flexShrink: 0 }}>↔</span>
                                  </div>
                                </div>
                                {/* Row 3: effects */}
                                <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
                                  {[
                                    { key: 'shadow', label: '🌑 Ombre' },
                                    { key: 'glow',   label: '✨ Glow'  },
                                    { key: 'flip',   label: '↔ Miroir' },
                                  ].map(({ key, label }) => (
                                    <button key={key} onClick={() => updatePlayerLayer(pl.uid, { [key]: !pl[key] })}
                                      style={{ padding: '4px 10px', borderRadius: 7, fontSize: 9.5, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${pl[key] ? accentColor : 'var(--sl-border-s)'}`, background: pl[key] ? `${accentColor}16` : 'var(--sl-surface)', color: pl[key] ? accentColor : 'var(--sl-t3)', transition: 'all 0.12s' }}>
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bibliothèque */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <SLabel>Bibliothèque ({clubMedia.assets.length}/{10})</SLabel>
                          <button onClick={() => setMediaFavOnly(v => !v)}
                            style={{ fontSize: 9.5, color: mediaFavOnly ? '#ef4444' : 'var(--sl-t3)', border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                            {mediaFavOnly ? '❤ Favoris' : '♡ Favoris'}
                          </button>
                        </div>
                        <input
                          value={mediaSearch} onChange={e => setMediaSearch(e.target.value)}
                          placeholder="Rechercher un joueur…"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 9, fontSize: 12, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                        />
                        {filteredAssets.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--sl-t3)', fontSize: 11 }}>
                            {clubMedia.assets.length === 0 ? 'Ajoutez votre premier joueur ci-dessus.' : 'Aucun résultat.'}
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                            {filteredAssets.map(asset => (
                              <div key={asset.id} style={{ position: 'relative' }}>
                                <button
                                  onClick={() => addPlayerLayer(asset)}
                                  style={{ width: '100%', aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--sl-border)', background: 'var(--sl-surface)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {asset.thumbDataUrl
                                    ? <img src={asset.thumbDataUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <span style={{ fontSize: 22 }}>🧍</span>
                                  }
                                </button>
                                <button onClick={() => clubMedia.toggleFavorite(asset.id)}
                                  style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.45)', color: asset.isFavorite ? '#ef4444' : 'rgba(255,255,255,0.7)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                  {asset.isFavorite ? '❤' : '♡'}
                                </button>
                                <button onClick={() => clubMedia.deleteAsset(asset.id)}
                                  style={{ position: 'absolute', top: 4, left: 4, width: 18, height: 18, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.55)', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                  ✕
                                </button>
                                <div style={{ marginTop: 3, fontSize: 9, color: 'var(--sl-t3)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                                  {asset.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* ── FOND ── */}
                {activeTab === 'fond' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* ── Éléments décoratifs ── */}
                    <div>
                      <SLabel accent={accentColor}>Éléments décoratifs</SLabel>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                        {ELEMENT_LIBRARY.map(el => (
                          <button
                            key={el.id}
                            onClick={() => addOverlayElement(el.id)}
                            style={{
                              padding: '8px 4px 7px', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--sl-border)',
                              backgroundColor: 'var(--sl-surface)', display: 'flex', flexDirection: 'column',
                              alignItems: 'center', gap: 4, transition: 'border-color 0.12s, background 0.12s',
                            }}
                          >
                            <div style={{ width: '100%', height: 28, borderRadius: 6, background: el.preview, flexShrink: 0 }} />
                            <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--sl-t1)', lineHeight: 1, textAlign: 'center' }}>{el.label}</span>
                          </button>
                        ))}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 10, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
                        Cliquer pour ajouter sur l'affiche — régler ci-dessous
                      </div>
                    </div>

                    {/* ── Active elements list ── */}
                    {(overlayElements || []).length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <SLabel accent={accentColor}>Éléments actifs ({(overlayElements || []).length})</SLabel>
                          <button
                            onClick={() => set('overlayElements', [])}
                            style={{ fontSize: 9.5, color: 'var(--sl-t3)', border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 5, textDecoration: 'underline' }}
                          >
                            Tout effacer
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(overlayElements || []).map(el => {
                            const meta = ELEMENT_LIBRARY.find(e => e.id === el.type);
                            return (
                              <div key={el.uid} style={{ padding: '10px 12px', borderRadius: 12, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
                                {/* Row 1: icon + label + z-toggle + remove */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                                  <span style={{ fontSize: 15, flexShrink: 0 }}>{meta?.icon}</span>
                                  <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta?.label}</span>
                                  {/* Z-order toggle: Fond = below content, Dessus = above content */}
                                  <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--sl-border)', flexShrink: 0 }}>
                                    {[['Fond', false], ['Dessus', true]].map(([lbl, val]) => (
                                      <button key={lbl} onClick={() => updateOverlayElement(el.uid, { above: val })}
                                        style={{
                                          padding: '3px 9px', border: 'none', cursor: 'pointer',
                                          fontSize: 9, fontWeight: 800, letterSpacing: '0.04em',
                                          backgroundColor: el.above === val ? accentColor : 'var(--sl-surface)',
                                          color: el.above === val ? '#fff' : 'var(--sl-t3)',
                                          transition: 'all 0.12s',
                                        }}>
                                        {lbl}
                                      </button>
                                    ))}
                                  </div>
                                  <button onClick={() => removeOverlayElement(el.uid)}
                                    style={{ width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.10)', color: '#ef4444', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    ✕
                                  </button>
                                </div>
                                {/* Row 2: color + opacity */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ position: 'relative', width: 26, height: 26, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--sl-border)', flexShrink: 0 }}>
                                    <div style={{ position: 'absolute', inset: 0, background: el.color }} />
                                    <input type="color" value={el.color}
                                      onChange={e => updateOverlayElement(el.uid, { color: e.target.value })}
                                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                                  </div>
                                  <input type="range" min={0.05} max={1} step={0.05} value={el.opacity}
                                    onChange={e => updateOverlayElement(el.uid, { opacity: parseFloat(e.target.value) })}
                                    style={{ flex: 1, accentColor, cursor: 'pointer' }} />
                                  <span style={{ fontSize: 10, color: 'var(--sl-t3)', width: 28, textAlign: 'right', fontWeight: 700, flexShrink: 0 }}>
                                    {Math.round(el.opacity * 100)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Teinte d'ambiance */}
                    <div>
                      <SLabel>Teinte d'ambiance</SLabel>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {/* "None" option */}
                        <button onClick={() => set('bgTint', '')}
                          style={{
                            width: 28, height: 28, borderRadius: 8, cursor: 'pointer', border: `1.5px dashed ${bgTint === '' ? accentColor : 'var(--sl-border-s)'}`,
                            background: bgTint === '' ? `${accentColor}14` : 'var(--sl-surface)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--sl-t3)',
                          }}>
                          ✕
                        </button>
                        {TINT_PALETTE.map(c => (
                          <button key={c} onClick={() => { set('bgTint', c); if (bgTintOp === 0) set('bgTintOp', 0.25); }}
                            style={{
                              width: 28, height: 28, borderRadius: 8, cursor: 'pointer', border: 'none',
                              background: c,
                              boxShadow: bgTint === c ? `0 0 0 2px var(--sl-card), 0 0 0 4px ${c}` : 'none',
                              transition: 'box-shadow 0.12s',
                            }}
                          />
                        ))}
                        {/* Custom tint picker */}
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
                          <input type="range" min={0} max={0.7} step={0.05} value={bgTintOp}
                            onChange={e => set('bgTintOp', parseFloat(e.target.value))}
                            style={{ flex: 1, accentColor, cursor: 'pointer' }}/>
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
                            <input type="text" value={bgUrl} onChange={e => set('bgUrl', e.target.value)} onKeyDown={e => e.key === 'Enter' && applyBgUrl()}
                              placeholder="https://…"
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

                    {/* Logo partenaire */}
                    <div>
                      <SLabel>Logo partenaire / sponsor</SLabel>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => sponsorRef.current?.click()}
                          style={{ flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: sponsorSrc ? `${accentColor}14` : 'var(--sl-surface)', border: sponsorSrc ? `1.5px solid ${accentColor}` : '1.5px dashed var(--sl-border-s)', color: sponsorSrc ? accentColor : 'var(--sl-t2)' }}>
                          {sponsorSrc ? '✓ Logo sponsor chargé' : '+ Ajouter un logo sponsor'}
                        </button>
                        {sponsorSrc && <button onClick={() => set('sponsorSrc', '')} style={{ padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
                        <input ref={sponsorRef} type="file" accept="image/*" onChange={e => readFile(e, v => set('sponsorSrc', v))} style={{ display: 'none' }} />
                      </div>
                      {sponsorSrc && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, backgroundColor: `${accentColor}10`, border: `1px solid ${accentColor}30`, marginTop: 8 }}>
                          <img src={sponsorSrc} alt="Sponsor" style={{ height: 28, maxWidth: 70, objectFit: 'contain', borderRadius: 4 }} />
                          <span style={{ fontSize: 11, color: 'var(--sl-green)', fontWeight: 600 }}>Logo actif sur l'affiche</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BOTTOM NAV BAR ──────────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'stretch',
          borderTop: '1px solid var(--sl-border)',
          backgroundColor: 'var(--sl-card)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {PANEL_TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            const color = isActive ? accentColor : 'var(--sl-t3)';
            const hasBadge = (id === 'style' && hasLayerChanges)
              || (id === 'fond' && (overlayElements || []).length > 0)
              || (id === 'joueurs' && (playerLayers || []).length > 0);
            return (
              <button key={id} onClick={() => handleTabClick(id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 3, padding: '9px 4px 7px',
                  border: 'none', borderTop: `2px solid ${isActive ? accentColor : 'transparent'}`,
                  cursor: 'pointer', background: 'transparent',
                  color, transition: 'color 0.15s', position: 'relative',
                }}>
                {hasBadge && (
                  <div style={{ position: 'absolute', top: 7, right: '30%', width: 6, height: 6, borderRadius: '50%', background: accentColor }} />
                )}
                <Icon c={color} />
                <span style={{ fontSize: 9, fontWeight: 700 }}>{label}</span>
              </button>
            );
          })}

          {/* Export button */}
          {(() => {
            const color = exportOpen ? accentColor : 'var(--sl-t3)';
            return (
              <button
                onClick={() => { setActiveTab(null); setExportOpen(prev => !prev); }}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 3, padding: '9px 4px 7px',
                  border: 'none', borderTop: `2px solid ${exportOpen ? accentColor : 'transparent'}`,
                  cursor: 'pointer', background: 'transparent',
                  color, transition: 'color 0.15s',
                }}>
                <IcoExporter c={color} />
                <span style={{ fontSize: 9, fontWeight: 700 }}>Exporter</span>
              </button>
            );
          })()}
        </div>

      </motion.div>
    </motion.div>
  );
}
