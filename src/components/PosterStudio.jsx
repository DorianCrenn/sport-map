import { useRef, useState, useEffect, useMemo, useReducer, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toBlob } from 'html-to-image';
import { useSports } from '../hooks/useSports.js';
import { Z } from '../constants/zIndex.js';
import PosterRenderer, { POSTER_TEMPLATES, BASE_DIMS, BG_PRESETS } from './poster/PosterRenderer.jsx';
import { ELEMENT_LIBRARY } from './poster/posterElements.jsx';
import PosterEditor from './poster/PosterEditor.jsx';
import AiElementEditor from './poster/AiElementEditor.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  usePosterDraft,
  usePosterLibrary,
  useFavoriteTemplates,
  useDefaultTemplate,
} from '../hooks/usePosterDraft.js';
import { useClubMedia } from '../hooks/useClubMedia.js';
import { useClubDNA } from '../hooks/useClubDNA.js';
import { useClubAIUsage } from '../hooks/useClubAIUsage.js';
import { usePosterAI } from '../hooks/usePosterAI.js';
import { deriveInitialFields } from '../lib/posterVariables.js';
import { generateVariants, generateAIBackground, generateCustomBackground, generateCustomElement, generateMatchPoster, BG_PROMPT_SUGGESTIONS, ELEMENT_PROMPT_SUGGESTIONS, POSTER_STYLE_SUGGESTIONS } from '../lib/posterVariants.js';
import { getBgCache, normalizeSport } from '../lib/sportBgCache.js';
import { supabase } from '../lib/supabase.js';
import { sanitizeFilename } from '../lib/sanitize.js';
import {
  SLabel, TextInput, ColorSwatch, MiniToggle,
  IcoExporter,
} from './poster/PosterAtoms.jsx';
import {
  COLOR_PRESETS, SPORT_PALETTE, TINT_PALETTE, LAYER_BLOCKS, PANEL_TABS,
  loadSavedBgs, persistSavedBgs, loadSavedEls, persistSavedEls,
} from './poster/posterConstants.js';

// ── Reducer ────────────────────────────────────────────────────────────────────

function posterReducer(state, action) {
  if (action.type === 'PATCH') return { ...state, ...action.payload };
  return { ...state, [action.type]: action.value };
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PosterStudio({ event, onClose, club, quickMode = false, resultMode = null, initialBgSrc = null }) {
  const { allSports } = useSports();
  const { currentUser } = useAuth();
  const hasPremium = currentUser?.role === 'admin' || currentUser?.role === 'superadmin'
    || currentUser?.role === 'club_admin' || currentUser?.isPremium;

  const posterRef           = useRef(null);
  const exportRef           = useRef(null);
  const exportWrapperRef    = useRef(null);
  const altExportWrapperRef = useRef(null);
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
  const { usage: aiUsage, optimisticIncrement: aiIncrement } = useClubAIUsage(club?.id);
  const aiGenerateBlocked = !hasPremium && aiUsage.generate_count >= aiUsage.monthly_limit;
  const aiImportBlocked   = !hasPremium && aiUsage.import_count   >= aiUsage.monthly_limit;

  const [poster, dispatch] = useReducer(posterReducer, {
    format: 'story', templateId: isTournamentEvent ? 'tr-premium' : (resultMode ? 'impact' : 'simple'),
    accentColor: initialAccent,
    scoreHome: resultMode?.home !== undefined ? resultMode.home : undefined,
    scoreAway: resultMode?.away !== undefined ? resultMode.away : undefined,
    bgSrc: '', bgUrl: '', bgErr: false, bgMode: 'color',
    bgPreset: '',
    bgTint: '', bgTintOp: 0,
    overlayElements: [],
    aiOverlayElements: [],
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
    sponsorSrc, transforms, overlayElements, aiOverlayElements, playerLayers,
    scoreHome, scoreAway,
  } = poster;
  const set = (key, value) => dispatch({ type: key, value });
  const altFormat = format === 'story' ? 'post' : 'story';
  const { w: altW, h: altH } = BASE_DIMS[altFormat];

  const [activeTab,     setActiveTab]     = useState('template');
  const [exportOpen,    setExportOpen]    = useState(false);
  const [quickBannerDismissed, setQuickBannerDismissed] = useState(false);
  const [watermarkVisible, setWatermarkVisible] = useState(true);
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
  const [mediaFolder,   setMediaFolder]   = useState(null);
  const [tagEditingId,  setTagEditingId]  = useState(null);
  const [tagInput,      setTagInput]      = useState('');
  const [isDragOver,    setIsDragOver]    = useState(false);
  const [playerName,    setPlayerName]    = useState('');
  const [variants,      setVariants]      = useState([]);
  const [variantSeed,   setVariantSeed]   = useState(0);
  const [variantsOpen,  setVariantsOpen]  = useState(false);
  const {
    aiBgLoading, aiBgResult,
    customPrompt, setCustomPrompt, generateBg,
    aiElLoading, elementPrompt, setElementPrompt, generateElement,
  } = usePosterAI({ aiGenerateBlocked, onTrack: trackAIGeneration });
  const [aiPosterLoading,  setAiPosterLoading]  = useState(false);
  const [aiPosterHint,     setAiPosterHint]     = useState('');
  const [aiPosterVariants, setAiPosterVariants] = useState([]);
  const [exportingAll,    setExportingAll]    = useState(false);
  const [linkCopied,      setLinkCopied]      = useState(false);
  const [platformPreview, setPlatformPreview] = useState(null);
  const [aiElEditorUid, setAiElEditorUid] = useState(null);
  const [savedAiBgs,    setSavedAiBgs]    = useState(() => loadSavedBgs(club?.id));
  const [savedAiEls,    setSavedAiEls]    = useState(() => loadSavedEls(club?.id));
  const skipAutoSave  = useRef(true);
  const canvasAreaRef = useRef(null);
  const playerFileRef = useRef(null);
  const replaceFileRef = useRef(null);
  const replaceTargetId = useRef(null);
  const dnaFileRef    = useRef(null);

  useEffect(() => {
    favTplHook.loadFromDB();
    const draft = draftHook.loadDraft();
    const sportKey = normalizeSport(event?.sport || '');
    const cachedSportBg = getBgCache(sportKey);
    if (draft?.state) {
      const merged = { ...draft.state };
      if (!merged.homeLogo && initialFields.homeLogo) merged.homeLogo = initialFields.homeLogo;
      if (!merged.awayLogo && initialFields.awayLogo) merged.awayLogo = initialFields.awayLogo;
      if (initialBgSrc) {
        merged.bgSrc = initialBgSrc;
        merged.bgMode = 'url';
        merged.bgErr = false;
        merged.bgPreset = '';
      } else if (!merged.bgSrc && !merged.bgPreset && cachedSportBg) {
        merged.bgSrc = cachedSportBg;
        merged.bgMode = 'url';
      }
      dispatch({ type: 'PATCH', payload: merged });
      setRestoredDraft(true);
      setTimeout(() => setRestoredDraft(false), 3000);
    } else {
      const defaultTpl = defTplHook.get();
      if (defaultTpl) set('templateId', defaultTpl);
      if (initialBgSrc) {
        dispatch({ type: 'PATCH', payload: { bgSrc: initialBgSrc, bgMode: 'url', bgErr: false, bgPreset: '' } });
      } else if (cachedSportBg) {
        dispatch({ type: 'PATCH', payload: { bgSrc: cachedSportBg, bgMode: 'url', bgErr: false } });
      }
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

  useEffect(() => {
    if (!quickMode && !resultMode) return;
    const t = setTimeout(() => setExportOpen(true), 900);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── AI background favorites helpers ──
  function addSavedBg(bgEntry) {
    const newBgs = [{ ...bgEntry, id: `bg-${Date.now()}`, savedAt: new Date().toISOString() }, ...savedAiBgs].slice(0, 12);
    setSavedAiBgs(newBgs);
    persistSavedBgs(club?.id, newBgs);
  }
  function removeSavedBg(bgId) {
    const newBgs = savedAiBgs.filter(b => b.id !== bgId);
    setSavedAiBgs(newBgs);
    persistSavedBgs(club?.id, newBgs);
  }

  function addSavedEl(elEntry) {
    const newEls = [{ ...elEntry, id: `el-${Date.now()}`, savedAt: new Date().toISOString() }, ...savedAiEls].slice(0, 12);
    setSavedAiEls(newEls);
    persistSavedEls(club?.id, newEls);
  }
  function removeSavedEl(elId) {
    const newEls = savedAiEls.filter(e => e.id !== elId);
    setSavedAiEls(newEls);
    persistSavedEls(club?.id, newEls);
  }

  // ── AI overlay element helpers ──
  function addAiOverlay(el) {
    dispatch({ type: 'PATCH', payload: { aiOverlayElements: [...(aiOverlayElements || []), { uid: `ai-${Date.now()}`, above: false, opacity: 0.85, blendMode: 'screen', ...el }] } });
  }
  function removeAiOverlay(uid) {
    dispatch({ type: 'PATCH', payload: { aiOverlayElements: (aiOverlayElements || []).filter(e => e.uid !== uid) } });
  }
  function updateAiOverlay(uid, patch) {
    dispatch({ type: 'PATCH', payload: { aiOverlayElements: (aiOverlayElements || []).map(e => e.uid === uid ? { ...e, ...patch } : e) } });
  }

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
      ? POSTER_TEMPLATES.filter(t => t.isTournament && !t.isAiTemplate)
      : POSTER_TEMPLATES.filter(t => !t.isTournament && !t.isAiTemplate);
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
      trackAIImport();
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

  // ── AI full poster — génère 4 variantes en parallèle ──
  async function handleGenerateAIPoster() {
    setAiPosterLoading(true);
    setAiPosterVariants([]);
    const baseStyles = ['Sombre et dramatique', 'Chaud et festif', 'Cinématique intense', 'Néon futuriste'];
    const hint = aiPosterHint.trim();
    const styles = hint
      ? [hint, ...baseStyles.filter(s => s !== hint).slice(0, 3)]
      : baseStyles;
    const eventData = {
      sport: event?.sport, homeTeam: homeName, awayTeam: awayName, championship,
      date: event?.date, time: event?.time, venue: event?.venue || event?.city,
      isTournament: isTournamentEvent, title: event?.title,
    };
    try {
      const results = await Promise.allSettled(styles.map(s => generateMatchPoster(eventData, s)));
      const variants = results
        .map((r, i) => r.status === 'fulfilled' && r.value?.imageUrl
          ? { imageUrl: r.value.imageUrl, style: styles[i] }
          : null)
        .filter(Boolean);
      setAiPosterVariants(variants);
      if (variants.length > 0) {
        dispatch({ type: 'PATCH', payload: { bgSrc: variants[0].imageUrl, bgMode: 'url', bgErr: false, bgPreset: '', templateId: 'ai-full' } });
      }
    } catch {
      // silencieux
    } finally {
      setAiPosterLoading(false);
    }
  }

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

  // ── Export / AI tracking helpers ──
  function trackExport(channel) {
    if (!currentUser?.id || !club?.id) return;
    supabase.from('poster_exports').insert({
      club_id: String(club.id),
      event_id: event?.id ? String(event.id) : null,
      user_id: currentUser.id,
      format,
      channel,
    }).then(() => {});
  }

  function trackAIGeneration() {
    if (!club?.id) return;
    aiIncrement('generate_count');
    supabase.rpc('increment_ai_generate_count', { p_club_id: String(club.id) }).then(() => {});
  }

  function trackAIImport() {
    if (!club?.id) return;
    aiIncrement('import_count');
    supabase.rpc('increment_ai_import_count', { p_club_id: String(club.id) }).then(() => {});
  }

  async function getBlob() {
    const node = exportWrapperRef.current;
    if (!node) return null;
    let blob = await toBlob(node, { pixelRatio: 3, cacheBust: true });
    // Safari iOS peut retourner un blob vide — retry après délai
    if (!blob || blob.size < 10_000) {
      await new Promise(r => setTimeout(r, 350));
      blob = await toBlob(node, { pixelRatio: 3, cacheBust: true });
    }
    return blob;
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
      trackExport('download');
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
      trackExport('whatsapp');
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
      trackExport('instagram');
    } catch {} finally { setSharingIG(false); }
  }

  function handleShareFacebook() {
    const eventUrl = event?.id
      ? `${window.location.origin}${window.location.pathname}#event/${event.id}`
      : window.location.origin;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, '_blank', 'noopener,noreferrer,width=600,height=400');
    trackExport('facebook');
  }

  async function handleDownloadAll() {
    setExportingAll(true);
    try {
      const blob1 = await getBlob();
      if (blob1) {
        const url1 = URL.createObjectURL(blob1);
        const a1 = document.createElement('a');
        a1.href = url1;
        a1.download = `affiche-${sanitizeFilename(event?.title ?? 'match')}-${format}.png`;
        a1.click();
        URL.revokeObjectURL(url1);
      }
      await new Promise(r => setTimeout(r, 400));
      const altNode = altExportWrapperRef.current;
      if (altNode) {
        let blob2 = await toBlob(altNode, { pixelRatio: 3, cacheBust: true });
        if (!blob2 || blob2.size < 10_000) {
          await new Promise(r => setTimeout(r, 350));
          blob2 = await toBlob(altNode, { pixelRatio: 3, cacheBust: true });
        }
        if (blob2) {
          const url2 = URL.createObjectURL(blob2);
          const a2 = document.createElement('a');
          a2.href = url2;
          a2.download = `affiche-${sanitizeFilename(event?.title ?? 'match')}-${altFormat}.png`;
          a2.click();
          URL.revokeObjectURL(url2);
        }
      }
      trackExport('download_all');
    } finally { setTimeout(() => setExportingAll(false), 900); }
  }

  function handleCopyLink() {
    const url = event?.id
      ? `${window.location.origin}${window.location.pathname}#event/${event.id}`
      : window.location.origin;
    navigator.clipboard.writeText(url).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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
    setTagEditingId(null);
    setTagInput('');
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
        <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none', zIndex: -1 }}>
          <div ref={exportWrapperRef} style={{ position: 'relative', width: w, height: h, overflow: 'hidden' }}>
            <PosterRenderer templateId={templateId} data={posterData} format={format} previewWidth={w} innerRef={exportRef} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} />
            {scoreHome !== undefined && scoreAway !== undefined && (
              <div style={{
                position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)',
                whiteSpace: 'nowrap', zIndex: 10,
                backgroundColor: 'rgba(0,0,0,0.82)', borderRadius: 16, padding: '12px 28px',
                display: 'flex', alignItems: 'center', gap: 16,
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: 'white', lineHeight: 1, fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', fontVariantNumeric: 'tabular-nums' }}>{scoreHome}</span>
                <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>—</span>
                <span style={{ fontSize: 52, fontWeight: 900, color: 'white', lineHeight: 1, fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', fontVariantNumeric: 'tabular-nums' }}>{scoreAway}</span>
              </div>
            )}
            {watermarkVisible && (
              <div style={{ position: 'absolute', bottom: 10, right: 12, padding: '3px 9px', borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.38)' }}>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif' }}>
                  {club?.name ? `${club.name} · SportLink` : 'Créé avec SportLink'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hidden HD renderer — alt format */}
        <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none', zIndex: -1 }}>
          <div ref={altExportWrapperRef} style={{ position: 'relative', width: altW, height: altH, overflow: 'hidden' }}>
            <PosterRenderer templateId={templateId} data={posterData} format={altFormat} previewWidth={altW} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} />
            {scoreHome !== undefined && scoreAway !== undefined && (
              <div style={{
                position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)',
                whiteSpace: 'nowrap', zIndex: 10,
                backgroundColor: 'rgba(0,0,0,0.82)', borderRadius: 16, padding: '12px 28px',
                display: 'flex', alignItems: 'center', gap: 16,
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: 'white', lineHeight: 1, fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', fontVariantNumeric: 'tabular-nums' }}>{scoreHome}</span>
                <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>—</span>
                <span style={{ fontSize: 52, fontWeight: 900, color: 'white', lineHeight: 1, fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', fontVariantNumeric: 'tabular-nums' }}>{scoreAway}</span>
              </div>
            )}
            {watermarkVisible && (
              <div style={{ position: 'absolute', bottom: 10, right: 12, padding: '3px 9px', borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.38)' }}>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif' }}>
                  {club?.name ? `${club.name} · SportLink` : 'Créé avec SportLink'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen preview */}
        <AnimatePresence>
          {previewFull && (
            <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, zIndex: 40, backgroundColor: 'var(--sl-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, borderRadius: 'inherit' }}>
              <PosterRenderer templateId={templateId} data={posterData} format={format} previewWidth={Math.min(300, 320)} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} />
              <button onClick={() => setPreviewFull(false)}
                style={{ padding: '12px 22px', borderRadius: 12, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Fermer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Element editor — full-screen overlay */}
        {aiElEditorUid !== null && (aiOverlayElements || []).length > 0 && (
          <AiElementEditor
            elements={aiOverlayElements || []}
            initialUid={aiElEditorUid}
            posterData={posterData}
            templateId={templateId}
            format={format}
            bgPresetId={bgPreset}
            effects={posterEffects}
            overlayElements={overlayElements || []}
            onChange={(uid, patch) => updateAiOverlay(uid, patch)}
            onRemove={(uid) => { removeAiOverlay(uid); if ((aiOverlayElements || []).length <= 1) setAiElEditorUid(null); }}
            onClose={() => setAiElEditorUid(null)}
          />
        )}

        {/* Visual editor overlay */}
        <AnimatePresence>
          {editorOpen && (
            <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, zIndex: 50, borderRadius: 'inherit' }}>
              <PosterEditor
                templateId={templateId} data={posterData} format={format} transforms={transforms}
                onChange={(blockId, patch) => dispatch({ type: 'transforms', value: { ...transforms, [blockId]: patch } })}
                playerLayers={playerLayers || []}
                onPlayerLayerChange={updatePlayerLayer}
                onClose={() => setEditorOpen(false)}
              />
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
            <button
              onClick={() => { setActiveTab(null); setExportOpen(prev => !prev); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 12px', borderRadius: 10, border: `1px solid ${accentColor}40`, backgroundColor: `${accentColor}12`, cursor: 'pointer', color: accentColor, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Partager
            </button>
            <button onClick={onClose}
              style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'var(--sl-surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── QUICK MODE BANNER ───────────────────────────────────────────────── */}
        {quickMode && !quickBannerDismissed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', backgroundColor: 'rgba(34,217,106,0.07)', borderBottom: '1px solid rgba(34,217,106,0.18)' }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--sl-green)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-green)', flex: 1, lineHeight: 1.4 }}>
              {resultMode
                ? `Score ${resultMode.home}–${resultMode.away} · Affiche résultat prête !`
                : 'Affiche prête — personnalisez ou partagez directement'
              }
            </span>
            <button onClick={() => { setExportOpen(true); setQuickBannerDismissed(true); }}
              style={{ padding: '5px 12px', borderRadius: 8, border: 'none', backgroundColor: 'var(--sl-green)', color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>
              Partager
            </button>
            <button onClick={() => setQuickBannerDismissed(true)}
              style={{ width: 22, height: 22, borderRadius: 6, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--sl-t3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </motion.div>
        )}

        {/* ── Static content wrapper — overlays contained here, no Framer Motion transform ── */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Platform preview overlay — DISTRIB-001c */}
        <AnimatePresence>
          {platformPreview && (
            <motion.div key="platform-preview"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 42, backgroundColor: 'var(--sl-card)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--sl-border)', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Aperçu plateformes</span>
                <button onClick={() => setPlatformPreview(null)}
                  style={{ width: 32, height: 32, borderRadius: 9, border: 'none', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              {/* Tabs */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '10px 16px', flexShrink: 0, borderBottom: '1px solid var(--sl-border)' }}>
                {[
                  { id: 'ig-story', label: 'Story IG',  color: '#E1306C' },
                  { id: 'ig-post',  label: 'Post IG',   color: '#E1306C' },
                  { id: 'whatsapp', label: 'WhatsApp',  color: '#25D366' },
                ].map(p => (
                  <button key={p.id} onClick={() => setPlatformPreview(p.id)}
                    style={{ padding: '7px 16px', borderRadius: 10, border: `1.5px solid ${platformPreview === p.id ? p.color : 'var(--sl-border)'}`, backgroundColor: platformPreview === p.id ? `${p.color}16` : 'transparent', fontSize: 12, fontWeight: 700, color: platformPreview === p.id ? p.color : 'var(--sl-t2)', cursor: 'pointer' }}>
                    {p.label}
                  </button>
                ))}
              </div>
              {/* Preview area */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
                {platformPreview === 'ig-story' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: '#E1306C', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Instagram Story · 9:16</span>
                    <div style={{ width: 240, height: 427, borderRadius: 20, overflow: 'hidden', position: 'relative', boxShadow: '0 0 0 3px #E1306C66, 0 28px 70px rgba(0,0,0,0.6)', backgroundColor: '#000', flexShrink: 0 }}>
                      <PosterRenderer templateId={templateId} data={posterData} format="story" previewWidth={240} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} />
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)', zIndex: 10, display: 'flex', alignItems: 'flex-start', padding: '10px 12px 0', gap: 7 }}>
                        <div style={{ flex: 1, height: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)', marginTop: 6 }} />
                        <div style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid white', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' }}>
                          {club?.logo ? <img src={club.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 9, fontWeight: 900, color: 'white' }}>{(club?.name || 'C')[0]}</span>}
                        </div>
                        <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.9)', fontWeight: 700, lineHeight: '26px', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club?.name || 'Votre club'}</span>
                      </div>
                    </div>
                  </div>
                )}
                {platformPreview === 'ig-post' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: '#E1306C', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Instagram Post · 4:5</span>
                    <div style={{ width: 290, backgroundColor: 'var(--sl-card)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.35)', border: '1px solid var(--sl-border)', flexShrink: 0 }}>
                      <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--sl-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {club?.logo ? <img src={club.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--sl-t1)' }}>{(club?.name || 'C')[0]}</span>}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t1)' }}>{club?.name || 'Votre club'}</div>
                          <div style={{ fontSize: 9, color: 'var(--sl-t3)' }}>Bretagne · SportLink</div>
                        </div>
                        <svg style={{ marginLeft: 'auto' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <PosterRenderer templateId={templateId} data={posterData} format="post" previewWidth={290} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} />
                      </div>
                      <div style={{ padding: '8px 12px 10px', display: 'flex', gap: 14, alignItems: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        <svg style={{ marginLeft: 'auto' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                      </div>
                    </div>
                  </div>
                )}
                {platformPreview === 'whatsapp' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: '#25D366', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>WhatsApp</span>
                    <div style={{ width: 290, backgroundColor: '#111b21', borderRadius: 18, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', flexShrink: 0 }}>
                      <div style={{ padding: '11px 14px', backgroundColor: '#202c33', display: 'flex', alignItems: 'center', gap: 9 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#2a3942', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {club?.logo ? <img src={club.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 10, fontWeight: 900, color: '#aebac1' }}>{(club?.name || 'C')[0]}</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: '#e9edef', fontWeight: 700 }}>{club?.name || 'Votre club'}</div>
                          <div style={{ fontSize: 9.5, color: '#8696a0' }}>en ligne</div>
                        </div>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                      </div>
                      <div style={{ padding: '14px 10px 14px', backgroundColor: '#0b141a' }}>
                        <div style={{ maxWidth: '88%', marginLeft: 'auto', backgroundColor: '#005c4b', borderRadius: '10px 2px 10px 10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                          <div style={{ overflow: 'hidden' }}>
                            <PosterRenderer templateId={templateId} data={posterData} format="post" previewWidth={232} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} />
                          </div>
                          <div style={{ padding: '4px 10px 6px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>maintenant</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#53bdeb" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 12 5 16 11 8"/><polyline points="7 12 11 16 17 8"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                position: 'absolute', bottom: 'calc(62px + env(safe-area-inset-bottom, 0px))', right: 12, left: 12, zIndex: 30,
                backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
                borderRadius: 20, boxShadow: '0 12px 40px rgba(0,0,0,0.3)', padding: 8,
              }}
            >
              {/* Watermark toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 4px' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: hasPremium ? 'var(--sl-t1)' : 'var(--sl-t3)' }}>Masquer le watermark</div>
                  {!hasPremium && <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Plan Club Pro requis</div>}
                </div>
                {hasPremium ? (
                  <MiniToggle value={!watermarkVisible} onChange={(v) => setWatermarkVisible(!v)} accent={accentColor} />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                )}
              </div>
              <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0' }} />

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

              {/* Tout télécharger — DISTRIB-001a */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleDownloadAll(); setExportOpen(false); }} disabled={exportingAll}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 13, border: 'none', cursor: 'pointer', backgroundColor: `${accentColor}10` }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', backgroundColor: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 7, fontWeight: 900, color: '#fff', lineHeight: 1 }}>2</span>
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{exportingAll ? 'Téléchargement…' : 'Tout télécharger'}</div>
                  <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Story 9:16 + Post 4:5 · HD 3×</div>
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

              <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0' }} />

              {/* Copier le lien — DISTRIB-001b */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleCopyLink}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 13, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: linkCopied ? 'rgba(34,217,106,0.14)' : 'rgba(148,163,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                  {linkCopied ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22D96A" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  )}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: linkCopied ? 'var(--sl-green)' : 'var(--sl-t1)', transition: 'color 0.2s' }}>{linkCopied ? 'Lien copié !' : 'Copier le lien'}</div>
                  <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Lien vers l'événement SportLink</div>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

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
              borderRadius: 12, overflow: 'hidden', flexShrink: 0, position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.18)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <PosterRenderer
                templateId={templateId} data={posterData} format={format}
                previewWidth={PREVIEW_W} innerRef={posterRef} transforms={transforms}
                bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []}
                aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []}
              />
              {watermarkVisible && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = club?.id
                      ? `${window.location.origin}/clubs/${club.id}`
                      : window.location.origin;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  style={{
                    position: 'absolute', bottom: Math.round(10 * previewH / h), right: Math.round(12 * previewH / h),
                    padding: `${Math.round(3 * previewH / h)}px ${Math.round(9 * previewH / h)}px`,
                    borderRadius: Math.round(6 * previewH / h),
                    backgroundColor: 'rgba(0,0,0,0.38)', border: 'none', cursor: 'pointer', zIndex: 6,
                  }}
                  title={club?.id ? `Voir la page ${club.name}` : 'Créé avec SportLink'}
                >
                  <span style={{ fontSize: Math.round(8 * previewH / h), fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {club?.name ? `${club.name} · SportLink` : 'Créé avec SportLink'}
                  </span>
                </button>
              )}
              {scoreHome !== undefined && scoreAway !== undefined && (
                <div style={{
                  position: 'absolute', bottom: Math.round(72 * previewH / h), left: '50%', transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap', zIndex: 5,
                  backgroundColor: 'rgba(0,0,0,0.82)', borderRadius: Math.round(16 * previewH / h),
                  padding: `${Math.round(12 * previewH / h)}px ${Math.round(28 * previewH / h)}px`,
                  display: 'flex', alignItems: 'center', gap: Math.round(16 * previewH / h),
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  <span style={{ fontSize: Math.round(52 * previewH / h), fontWeight: 900, color: 'white', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{scoreHome}</span>
                  <span style={{ fontSize: Math.round(20 * previewH / h), color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>—</span>
                  <span style={{ fontSize: Math.round(52 * previewH / h), fontWeight: 900, color: 'white', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{scoreAway}</span>
                </div>
              )}
            </div>

            {/* Floating action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
              <button onClick={() => setPreviewFull(true)} title="Aperçu plein écran"
                style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', cursor: 'pointer', color: 'var(--sl-t2)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              </button>
              <button onClick={() => setPlatformPreview('ig-story')} title="Aperçu plateformes"
                style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', cursor: 'pointer', color: 'var(--sl-t2)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
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

                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Affiche IA — PS-AI-POSTER-001 ── */}
                    <div>
                      <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '2px 0 12px' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                        <div style={{ width: 2, height: 13, borderRadius: 2, background: '#6366f1', flexShrink: 0 }} />
                        <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#818cf8' }}>Affiche IA</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--sl-border)' }} />
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 700 }}>Flux · IA</span>
                      </div>

                      {/* Context auto-summary */}
                      <div style={{ padding: '8px 11px', borderRadius: 10, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', marginBottom: 10, fontSize: 10.5, lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, color: 'var(--sl-t1)' }}>
                          {homeName && awayName ? `${homeName} vs ${awayName}` : event?.title || 'Événement'}
                        </span>
                        {(championship || event?.sport) && (
                          <span style={{ color: 'var(--sl-t3)' }}>{' · '}{championship || event?.sport}</span>
                        )}
                        {event?.date && (
                          <span style={{ color: 'var(--sl-t3)' }}>{' · '}{new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                        )}
                      </div>

                      {/* Style suggestions */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                        {POSTER_STYLE_SUGGESTIONS.map(s => (
                          <button key={s} onClick={() => setAiPosterHint(aiPosterHint === s ? '' : s)}
                            style={{
                              padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                              border: `1px solid ${aiPosterHint === s ? '#818cf8' : 'var(--sl-border-s)'}`,
                              background: aiPosterHint === s ? 'rgba(99,102,241,0.12)' : 'var(--sl-surface)',
                              color: aiPosterHint === s ? '#818cf8' : 'var(--sl-t2)',
                              transition: 'all 0.12s',
                            }}>
                            {s}
                          </button>
                        ))}
                      </div>

                      {/* Input + generate */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <input
                          value={aiPosterHint}
                          onChange={e => setAiPosterHint(e.target.value)}
                          placeholder="Ajouter des indications (optionnel)…"
                          disabled={aiPosterLoading}
                          onKeyDown={e => { if (e.key === 'Enter' && !aiPosterLoading) handleGenerateAIPoster(); }}
                          style={{
                            flex: 1, padding: '9px 11px', borderRadius: 10, fontSize: 11, fontWeight: 500,
                            border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)',
                            color: 'var(--sl-t1)', outline: 'none',
                          }}
                        />
                        <button
                          disabled={aiPosterLoading}
                          onClick={handleGenerateAIPoster}
                          style={{
                            padding: '9px 13px', borderRadius: 10, fontSize: 14, fontWeight: 800,
                            cursor: aiPosterLoading ? 'wait' : 'pointer',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            color: '#fff', border: 'none', opacity: aiPosterLoading ? 0.6 : 1,
                            flexShrink: 0,
                          }}>
                          {aiPosterLoading ? '⏳' : '✨'}
                        </button>
                      </div>

                      {aiPosterLoading && (
                        <div style={{ fontSize: 10, color: '#818cf8', textAlign: 'center', fontWeight: 600 }}>
                          Génération de 4 affiches… 20-60 sec
                        </div>
                      )}

                      {/* Grille de variantes IA */}
                      {aiPosterVariants.length > 0 && !aiPosterLoading && (
                        <div>
                          <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7, marginTop: 4 }}>
                            Choisissez un design
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                            {aiPosterVariants.map((v, i) => {
                              const isSelected = bgSrc === v.imageUrl;
                              return (
                                <button key={i} onClick={() =>
                                  dispatch({ type: 'PATCH', payload: { bgSrc: v.imageUrl, bgMode: 'url', bgErr: false, bgPreset: '', templateId: 'ai-full' } })
                                } style={{
                                  position: 'relative', borderRadius: 8, overflow: 'hidden', padding: 0,
                                  border: `2px solid ${isSelected ? '#6366f1' : 'transparent'}`,
                                  cursor: 'pointer', aspectRatio: '9 / 16', background: '#111',
                                  boxShadow: isSelected ? '0 0 0 1px #6366f1' : 'none',
                                  transition: 'border-color 0.12s',
                                }}>
                                  <img src={v.imageUrl} alt={v.style} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                  <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    padding: '10px 4px 4px',
                                    background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))',
                                    fontSize: 7.5, color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontWeight: 700, lineHeight: 1.2,
                                  }}>
                                    {v.style.split(' ').slice(0, 2).join(' ')}
                                  </div>
                                  {isSelected && (
                                    <div style={{
                                      position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%',
                                      background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff',
                                    }}>✓</div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
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
                                style={{ width: 70, accentColor, cursor: 'pointer', flexShrink: 0, touchAction: 'none' }}
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
                  const baseAssets = mediaSearch
                    ? clubMedia.searchAssets(mediaSearch)
                    : mediaFavOnly ? clubMedia.filterByFavorites()
                    : mediaFolder ? clubMedia.filterByFolder(mediaFolder)
                    : clubMedia.assets;
                  const filteredAssets = baseAssets;
                  const availableFolders = clubMedia.getAvailableFolders();
                  const teamFolders = (club?.categories ?? []).flatMap(c => (c.teams ?? []).map(t => t.name)).filter(Boolean);
                  const allFolders = [...new Set([...teamFolders, ...availableFolders])];
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

                      {/* Import quota badge — MEDIA-001c */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 9, backgroundColor: aiImportBlocked ? 'rgba(239,68,68,0.07)' : `${accentColor}0D`, border: `1px solid ${aiImportBlocked ? 'rgba(239,68,68,0.2)' : accentColor + '25'}` }}>
                        <span style={{ fontSize: 10, color: aiImportBlocked ? '#ef4444' : 'var(--sl-t3)', fontWeight: 600 }}>
                          {aiImportBlocked
                            ? `Quota mensuel atteint (${aiUsage.monthly_limit} imports)`
                            : hasPremium
                              ? 'Imports illimités — Plan Club Pro'
                              : `${Math.max(0, aiUsage.monthly_limit - aiUsage.import_count)}/${aiUsage.monthly_limit} imports restants ce mois`
                          }
                        </span>
                        {aiImportBlocked && (
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.06em' }}>PRO</span>
                        )}
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
                          <input ref={replaceFileRef} type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file && replaceTargetId.current) clubMedia.replaceAsset(replaceTargetId.current, file);
                              e.target.value = '';
                            }} />
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
                        {/* Folder filter tabs */}
                        {allFolders.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                            <button
                              onClick={() => setMediaFolder(null)}
                              style={{ fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 10, border: `1px solid ${!mediaFolder ? accentColor : 'var(--sl-border)'}`, backgroundColor: !mediaFolder ? `${accentColor}18` : 'transparent', color: !mediaFolder ? accentColor : 'var(--sl-t3)', cursor: 'pointer' }}
                            >
                              Tous
                            </button>
                            {allFolders.map(f => (
                              <button key={f}
                                onClick={() => setMediaFolder(mediaFolder === f ? null : f)}
                                style={{ fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 10, border: `1px solid ${mediaFolder === f ? accentColor : 'var(--sl-border)'}`, backgroundColor: mediaFolder === f ? `${accentColor}18` : 'transparent', color: mediaFolder === f ? accentColor : 'var(--sl-t3)', cursor: 'pointer' }}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        )}
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
                            {filteredAssets.map(asset => {
                              const isTagging = tagEditingId === asset.id;
                              return (
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
                                <button
                                  onClick={() => { replaceTargetId.current = asset.id; replaceFileRef.current?.click(); }}
                                  title="Remplacer l'image (conserve l'ID)"
                                  style={{ position: 'absolute', bottom: 24, left: 4, width: 18, height: 18, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'rgba(99,102,241,0.7)', color: '#fff', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                  ↺
                                </button>
                                {(asset.versions ?? []).length > 0 && (
                                  <span style={{ position: 'absolute', bottom: 24, right: 4, fontSize: 7.5, fontWeight: 700, padding: '1px 4px', borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' }}>
                                    v{(asset.versions ?? []).length + 1}
                                  </span>
                                )}
                                {/* Name + tag toggle + folder */}
                                <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                  <span style={{ fontSize: 9, color: 'var(--sl-t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'center' }}>
                                    {asset.name}
                                  </span>
                                  <button
                                    onClick={() => { setTagEditingId(isTagging ? null : asset.id); setTagInput(''); }}
                                    title="Tags"
                                    style={{ flexShrink: 0, fontSize: 9, lineHeight: 1, padding: '1px 3px', border: 'none', background: 'none', cursor: 'pointer', color: (asset.tags ?? []).length > 0 ? accentColor : 'var(--sl-t3)', opacity: 0.8 }}>
                                    🏷
                                  </button>
                                </div>
                                {/* Folder badge + quick-assign */}
                                {allFolders.length > 0 && (
                                  <div style={{ marginTop: 2 }}>
                                    <select
                                      value={asset.folder ?? ''}
                                      onChange={e => clubMedia.setFolder(asset.id, e.target.value || null)}
                                      title="Dossier virtuel"
                                      style={{ width: '100%', fontSize: 8, padding: '1px 3px', borderRadius: 4, border: `1px solid ${asset.folder ? accentColor + '60' : 'var(--sl-border)'}`, backgroundColor: asset.folder ? `${accentColor}10` : 'transparent', color: asset.folder ? accentColor : 'var(--sl-t3)', outline: 'none', cursor: 'pointer' }}
                                    >
                                      <option value="">📁 Dossier…</option>
                                      {allFolders.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                  </div>
                                )}
                                {/* Tag chips (always visible when tags exist) */}
                                {asset.tags.length > 0 && !isTagging && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 2 }}>
                                    {asset.tags.map(tag => (
                                      <span key={tag} style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: `${accentColor}18`, color: accentColor, fontWeight: 600, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {/* Tag editor (inline when tagEditingId matches) */}
                                {isTagging && (
                                  <div style={{ marginTop: 4 }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 4 }}>
                                      {asset.tags.map(tag => (
                                        <button
                                          key={tag}
                                          onClick={() => clubMedia.updateTags(asset.id, asset.tags.filter(t => t !== tag))}
                                          title="Supprimer ce tag"
                                          style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: `${accentColor}18`, color: accentColor, fontWeight: 600, border: `1px solid ${accentColor}40`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                                          {tag} <span style={{ opacity: 0.6 }}>✕</span>
                                        </button>
                                      ))}
                                    </div>
                                    <input
                                      autoFocus
                                      value={tagInput}
                                      onChange={e => setTagInput(e.target.value)}
                                      placeholder="+ tag"
                                      onKeyDown={e => {
                                        if (e.key === 'Enter' || e.key === ',') {
                                          e.preventDefault();
                                          const val = tagInput.trim().replace(/,$/, '');
                                          if (val && !asset.tags.includes(val)) {
                                            clubMedia.updateTags(asset.id, [...asset.tags, val]);
                                          }
                                          setTagInput('');
                                        } else if (e.key === 'Escape') {
                                          setTagEditingId(null);
                                          setTagInput('');
                                        }
                                      }}
                                      style={{ width: '100%', fontSize: 9, padding: '3px 5px', borderRadius: 5, border: `1px solid ${accentColor}60`, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                )}
                              </div>
                              );
                            })}
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

                    {/* ── Éléments IA ── */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, marginTop: 2 }}>
                        <div style={{ width: 2, height: 13, borderRadius: 2, background: accentColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: accentColor }}>Éléments IA</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--sl-border)' }} />
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 700 }}>Screen blend</span>
                      </div>

                      {/* Suggestions */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                        {ELEMENT_PROMPT_SUGGESTIONS.map(s => (
                          <button key={s} onClick={() => setElementPrompt(s)}
                            style={{
                              padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                              border: `1px solid ${elementPrompt === s ? accentColor : 'var(--sl-border-s)'}`,
                              background: elementPrompt === s ? `${accentColor}18` : 'var(--sl-surface)',
                              color: elementPrompt === s ? accentColor : 'var(--sl-t2)',
                              transition: 'all 0.12s',
                            }}>
                            {s}
                          </button>
                        ))}
                      </div>

                      {/* Input + generate */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <input
                          value={elementPrompt}
                          onChange={e => setElementPrompt(e.target.value)}
                          placeholder="Décris l'effet décoratif…"
                          disabled={aiElLoading}
                          onKeyDown={e => {
                            if (e.key !== 'Enter') return;
                            generateElement({ accentColor, onSuccess: res => addAiOverlay({ imageUrl: res.imageUrl, prompt: res.prompt }) });
                          }}
                          style={{
                            flex: 1, padding: '9px 11px', borderRadius: 10, fontSize: 11, fontWeight: 500,
                            border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)',
                            color: 'var(--sl-t1)', outline: 'none',
                          }}
                        />
                        <button
                          disabled={aiElLoading || !elementPrompt.trim() || aiGenerateBlocked}
                          title={aiGenerateBlocked ? `Quota mensuel atteint — Plan Club Pro requis` : undefined}
                          onClick={() => generateElement({ accentColor, onSuccess: res => addAiOverlay({ imageUrl: res.imageUrl, prompt: res.prompt }) })}
                          style={{
                            padding: '9px 13px', borderRadius: 10, fontSize: 12, fontWeight: 800, flexShrink: 0,
                            cursor: (aiElLoading || !elementPrompt.trim() || aiGenerateBlocked) ? 'not-allowed' : 'pointer',
                            background: aiGenerateBlocked ? 'rgba(148,163,184,0.2)' : `linear-gradient(135deg, #a855f7, #6366f1)`,
                            color: aiGenerateBlocked ? 'var(--sl-t3)' : '#fff', border: 'none',
                            opacity: (aiElLoading || !elementPrompt.trim() || aiGenerateBlocked) ? 0.5 : 1,
                          }}>
                          {aiElLoading ? '⏳' : '✨'}
                        </button>
                      </div>
                      {aiElLoading && (
                        <div style={{ fontSize: 10, color: '#a78bfa', textAlign: 'center', marginBottom: 6, fontWeight: 600 }}>
                          Génération en cours… (30-60s)
                        </div>
                      )}

                      {/* Active AI elements — portrait 2-col grid */}
                      {(aiOverlayElements || []).length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)' }}>
                              Actifs ({(aiOverlayElements || []).length})
                            </span>
                            <button onClick={() => dispatch({ type: 'PATCH', payload: { aiOverlayElements: [] } })}
                              style={{ fontSize: 9.5, color: 'var(--sl-t3)', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                              Tout effacer
                            </button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                            {(aiOverlayElements || []).map(el => {
                              const isSaved = savedAiEls.some(s => s.imageUrl === el.imageUrl);
                              return (
                                <div key={el.uid} style={{ borderRadius: 10, border: '1px solid var(--sl-border)', overflow: 'hidden', background: 'var(--sl-surface)' }}>
                                  {/* Compact portrait thumbnail — fixed 90px */}
                                  <div style={{ position: 'relative', height: 90, background: '#000' }}>
                                    <img src={el.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    {/* Above/below pill bottom-left */}
                                    <button onClick={() => updateAiOverlay(el.uid, { above: !el.above })}
                                      style={{ position: 'absolute', bottom: 4, left: 4, padding: '2px 7px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 8, fontWeight: 800, background: el.above ? accentColor : 'rgba(0,0,0,0.65)', color: el.above ? '#000' : '#fff' }}>
                                      {el.above ? 'Dessus' : 'Fond'}
                                    </button>
                                  </div>
                                  {/* Action row — big tap targets */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--sl-border)' }}>
                                    <button onClick={() => setAiElEditorUid(el.uid)}
                                      style={{ padding: '9px 0', border: 'none', borderRight: '1px solid var(--sl-border)', cursor: 'pointer', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }} title="Éditer">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                    </button>
                                    <button onClick={() => addSavedEl({ imageUrl: el.imageUrl, prompt: el.prompt })}
                                      style={{ padding: '9px 0', border: 'none', borderRight: '1px solid var(--sl-border)', cursor: 'pointer', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: isSaved ? '#ef4444' : 'var(--sl-t3)' }} title="Enregistrer">
                                      ♥
                                    </button>
                                    <button onClick={() => removeAiOverlay(el.uid)}
                                      style={{ padding: '9px 0', border: 'none', cursor: 'pointer', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#ef4444' }}>
                                      ✕
                                    </button>
                                  </div>
                                  {/* Opacity slider */}
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

                      {/* Saved AI elements grid */}
                      {savedAiEls.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 6 }}>
                            Effets enregistrés ({savedAiEls.length})
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                            {savedAiEls.map(el => (
                              <div key={el.id}
                                onClick={() => addAiOverlay({ imageUrl: el.imageUrl, prompt: el.prompt })}
                                style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1.5px solid var(--sl-border-s)', cursor: 'pointer', background: '#000', height: 72 }}>
                                <img src={el.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}>
                                  <span style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>+ Ajouter</span>
                                </div>
                                <button
                                  onClick={e => { e.stopPropagation(); removeSavedEl(el.id); }}
                                  style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.85)', color: '#fff', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                  ✕
                                </button>
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

                    {/* ── Fonds IA ── */}
                    {(() => {
                      const dnaForBg = clubDNA.daProfile || { style: 'classic', mood: [], colors: { accent: accentColor } };
                      return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, marginTop: 2 }}>
                          <div style={{ width: 2, height: 13, borderRadius: 2, background: accentColor, flexShrink: 0 }} />
                          <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: accentColor }}>Fonds IA</span>
                          <div style={{ flex: 1, height: 1, background: 'var(--sl-border)' }} />
                          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 700 }}>Flux · IA</span>
                        </div>

                        {/* Prompt suggestions */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                          {BG_PROMPT_SUGGESTIONS.map(s => (
                            <button key={s} onClick={() => setCustomPrompt(s)}
                              style={{
                                padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                                border: `1px solid ${customPrompt === s ? accentColor : 'var(--sl-border-s)'}`,
                                background: customPrompt === s ? `${accentColor}18` : 'var(--sl-surface)',
                                color: customPrompt === s ? accentColor : 'var(--sl-t2)',
                                transition: 'all 0.12s',
                              }}>
                              {s}
                            </button>
                          ))}
                        </div>

                        {/* Custom prompt input */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                          <input
                            value={customPrompt}
                            onChange={e => setCustomPrompt(e.target.value)}
                            placeholder="Décris le fond que tu veux…"
                            disabled={aiBgLoading}
                            onKeyDown={e => {
                              if (e.key !== 'Enter') return;
                              generateBg({ dnaForBg, eventSport: event?.sport, onSuccess: imageUrl => dispatch({ type: 'PATCH', payload: { bgSrc: imageUrl, bgMode: 'url', bgErr: false, bgPreset: '' } }) });
                            }}
                            style={{
                              flex: 1, padding: '9px 11px', borderRadius: 10, fontSize: 11, fontWeight: 500,
                              border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)',
                              color: 'var(--sl-t1)', outline: 'none',
                            }}
                          />
                          <button
                            disabled={aiBgLoading || aiGenerateBlocked}
                            title={aiGenerateBlocked ? `Quota mensuel atteint (${aiUsage.monthly_limit} générations) — Plan Club Pro requis` : undefined}
                            onClick={() => generateBg({ dnaForBg, eventSport: event?.sport, onSuccess: imageUrl => dispatch({ type: 'PATCH', payload: { bgSrc: imageUrl, bgMode: 'url', bgErr: false, bgPreset: '' } }) })}
                            style={{
                              padding: '9px 13px', borderRadius: 10, fontSize: 12, fontWeight: 800,
                              cursor: (aiBgLoading || aiGenerateBlocked) ? 'not-allowed' : 'pointer',
                              background: aiGenerateBlocked ? 'rgba(148,163,184,0.2)' : `linear-gradient(135deg, #a855f7, #6366f1)`,
                              color: aiGenerateBlocked ? 'var(--sl-t3)' : '#fff', border: 'none', opacity: (aiBgLoading || aiGenerateBlocked) ? 0.6 : 1,
                              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                            }}>
                            {aiBgLoading ? '⏳' : '✨'}
                          </button>
                        </div>

                        {aiBgLoading && (
                          <div style={{ fontSize: 10, color: '#a78bfa', textAlign: 'center', marginBottom: 8, fontWeight: 600 }}>
                            Génération en cours… (30-60s)
                          </div>
                        )}

                        {/* Generated result */}
                        {aiBgResult && (
                          <div style={{ marginBottom: 8 }}>
                            {aiBgResult.imageUrl ? (
                              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `1.5px solid rgba(139,92,246,0.4)` }}>
                                <img src={aiBgResult.imageUrl} alt="Fond IA" style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                                <div style={{ position: 'absolute', top: 5, left: 5, fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                                  Pollinations IA · Gratuit
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 5, padding: 6, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                                  <button
                                    onClick={() => dispatch({ type: 'PATCH', payload: { bgSrc: aiBgResult.imageUrl, bgMode: 'url', bgErr: false, bgPreset: '' } })}
                                    style={{ flex: 1, padding: '5px 0', borderRadius: 7, fontSize: 10, fontWeight: 700, background: '#fff', color: '#111', border: 'none', cursor: 'pointer' }}>
                                    Appliquer
                                  </button>
                                  <button
                                    onClick={() => addSavedBg({ imageUrl: aiBgResult.imageUrl, prompt: aiBgResult.prompt, provider: aiBgResult.provider })}
                                    style={{ flex: 1, padding: '5px 0', borderRadius: 7, fontSize: 10, fontWeight: 700, background: accentColor, color: '#fff', border: 'none', cursor: 'pointer' }}>
                                    Enregistrer
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ padding: '8px 10px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 10, color: '#ef4444' }}>
                                Génération échouée ou timeout — réessaie.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Saved backgrounds grid */}
                        {savedAiBgs.length > 0 && (
                          <div>
                            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 6 }}>
                              Fonds enregistrés ({savedAiBgs.length})
                            </div>
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
                                  <button
                                    onClick={e => { e.stopPropagation(); removeSavedBg(bg.id); }}
                                    style={{ position: 'absolute', top: 2, right: 2, width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.85)', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      );
                    })()}

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
                  gap: 3, padding: '11px 4px 9px',
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
                  gap: 3, padding: '11px 4px 9px',
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
        </div>

      </motion.div>
    </motion.div>
  );
}
