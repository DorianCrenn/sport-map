import { useRef, useState, useEffect, useMemo, useReducer, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toBlob } from 'html-to-image';
import { useSports } from '../hooks/useSports.js';
import { Z } from '../constants/zIndex.js';
import PosterRenderer, { POSTER_TEMPLATES, BASE_DIMS, BG_PRESETS } from './poster/PosterRenderer.jsx';
import ExportPanel       from './poster/panels/ExportPanel.jsx';
import TemplatePanelTab  from './poster/panels/TemplatePanelTab.jsx';
import TeamsPanelTab     from './poster/panels/TeamsPanelTab.jsx';
import StylePanelTab     from './poster/panels/StylePanelTab.jsx';
import PlayersPanelTab   from './poster/panels/PlayersPanelTab.jsx';
import BackgroundPanelTab from './poster/panels/BackgroundPanelTab.jsx';
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
import { useClubSponsorsPage } from '../hooks/useClubSponsorsPage.js';
import { useClubPlan } from '../hooks/useClubPlan.js';
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
  const { isPremium: clubHasPlan } = useClubPlan(club?.id);
  const hasPremium = currentUser?.role === 'admin' || currentUser?.role === 'superadmin'
    || currentUser?.role === 'club_admin' || currentUser?.isPremium || clubHasPlan;

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

  const pageSponsors = useClubSponsorsPage(club?.id);
  const [useBandSponsors, setUseBandSponsors] = useState(false);
  const [selectedSponsorIds, setSelectedSponsorIds] = useState(new Set());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
  // Mode Simple : wizard 3 étapes (désactivé en quickMode / resultMode qui sont déjà des raccourcis)
  const [simpleMode,    setSimpleMode]    = useState(!quickMode && !resultMode);
  const [wizardStep,    setWizardStep]    = useState(1);
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

  // Mode Simple → ouvrir l'export quand l'utilisateur arrive à l'étape 3
  useEffect(() => {
    if (!simpleMode || wizardStep !== 3) return;
    const t = setTimeout(() => setExportOpen(true), 250);
    return () => clearTimeout(t);
  }, [simpleMode, wizardStep]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const activeBandLogos = useMemo(() => {
    if (!useBandSponsors) return [];
    const pool = pageSponsors.filter(s => s.showInPoster);
    const selected = pool.filter(s => selectedSponsorIds.has(s.id));
    const source = selected.length > 0 ? selected : pool;
    return source.map(s => s.logoWhite || s.logo).filter(Boolean).slice(0, 6);
  }, [useBandSponsors, pageSponsors, selectedSponsorIds]);

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
    <>
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
            <PosterRenderer templateId={templateId} data={posterData} format={format} previewWidth={w} innerRef={exportRef} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} sponsorLogos={activeBandLogos} showWatermark={!hasPremium} />
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
            <PosterRenderer templateId={templateId} data={posterData} format={altFormat} previewWidth={altW} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} sponsorLogos={activeBandLogos} showWatermark={!hasPremium} />
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
              <PosterRenderer templateId={templateId} data={posterData} format={format} previewWidth={Math.min(300, 320)} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} sponsorLogos={activeBandLogos} showWatermark={!hasPremium} />
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
            {/* Bascule Mode Simple ↔ Expert */}
            <button
              onClick={() => { setSimpleMode(v => !v); if (simpleMode) setActiveTab('template'); }}
              title={simpleMode ? 'Passer en mode expert (tous les outils)' : 'Passer en mode simple (3 étapes)'}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '7px 10px', borderRadius: 10,
                border: '1px solid var(--sl-border)',
                backgroundColor: simpleMode ? 'var(--sl-surface)' : `${accentColor}15`,
                cursor: 'pointer', fontSize: 11, fontWeight: 700,
                color: simpleMode ? 'var(--sl-t2)' : accentColor, flexShrink: 0,
              }}>
              {simpleMode ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Expert
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
                  Simple
                </>
              )}
            </button>
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
                      <PosterRenderer templateId={templateId} data={posterData} format="story" previewWidth={240} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} sponsorLogos={activeBandLogos} showWatermark={!hasPremium} />
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
                        <PosterRenderer templateId={templateId} data={posterData} format="post" previewWidth={290} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} sponsorLogos={activeBandLogos} showWatermark={!hasPremium} />
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
                            <PosterRenderer templateId={templateId} data={posterData} format="post" previewWidth={232} transforms={transforms} bgPresetId={bgPreset} effects={posterEffects} overlayElements={overlayElements || []} aiOverlayElements={aiOverlayElements || []} playerLayers={playerLayers || []} sponsorLogos={activeBandLogos} showWatermark={!hasPremium} />
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

        {/* ── Indicateur de progression — mode Simple ──────────────────────────── */}
        {simpleMode && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '8px 20px', borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', gap: 0 }}>
            {['Style', 'Infos', 'Exporter'].map((label, i) => (
              <React.Fragment key={label}>
                <button
                  type="button"
                  onClick={() => i + 1 < wizardStep && setWizardStep(i + 1)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: i + 1 < wizardStep ? 'pointer' : 'default' }}
                  aria-label={`Étape ${i + 1} : ${label}${i + 1 < wizardStep ? ' (cliquer pour revenir)' : ''}`}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    backgroundColor: i + 1 < wizardStep ? 'var(--sl-green)' : i + 1 === wizardStep ? accentColor : 'var(--sl-surface)',
                    border: `2px solid ${i + 1 <= wizardStep ? (i + 1 < wizardStep ? 'var(--sl-green)' : accentColor) : 'var(--sl-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: i + 1 <= wizardStep ? '#fff' : 'var(--sl-t3)',
                    transition: 'all 0.2s',
                  }}>
                    {i + 1 < wizardStep
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : i + 1}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: i + 1 === wizardStep ? accentColor : i + 1 < wizardStep ? 'var(--sl-green)' : 'var(--sl-t3)' }}>
                    {label}
                  </span>
                </button>
                {i < 2 && (
                  <div style={{ flex: 1, height: 2, margin: '0 8px 16px', backgroundColor: i + 1 < wizardStep ? 'var(--sl-green)' : 'var(--sl-border)', transition: 'background-color 0.3s' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ── FORMAT + ACTIVE TEMPLATE — mode Expert uniquement ────────────────── */}
        {!simpleMode && <div style={{
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
        </div>}

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
        {/* Export panel (positioned absolute, shown when exportOpen) */}
        <AnimatePresence>
          {exportOpen && <ExportPanel ps={{
            accentColor, hasPremium, watermarkVisible, setWatermarkVisible,
            downloading, exportingAll, sharing, sharingIG, linkCopied,
            handleDownload, handleDownloadAll, handleShareWhatsApp, handleShareIG,
            handleShareFacebook, handleCopyLink, setExportOpen,
          }} />}
        </AnimatePresence>

        {/* ── Wizard panels — mode Simple ─────────────────────────────────────── */}
        {simpleMode && (
          <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '44dvh', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
            <div style={{ padding: '16px 16px 8px' }}>

              {/* ──── ÉTAPE 1 : Style ──── */}
              {wizardStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Format */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', margin: '0 0 8px' }}>Format</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[{ id: 'post', label: 'Post 4:5' }, { id: 'story', label: 'Story 9:16' }].map(f => (
                        <button key={f.id} onClick={() => set('format', f.id)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: `2px solid ${format === f.id ? accentColor : 'var(--sl-border)'}`, backgroundColor: format === f.id ? `${accentColor}14` : 'var(--sl-surface)', color: format === f.id ? accentColor : 'var(--sl-t2)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Templates curatés */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', margin: '0 0 8px' }}>Style de l'affiche</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {displayTemplates.slice(0, 8).map(tpl => (
                        <button key={tpl.id} onClick={() => set('templateId', tpl.id)} style={{ padding: '8px 4px', borderRadius: 10, border: `2px solid ${templateId === tpl.id ? accentColor : 'var(--sl-border)'}`, backgroundColor: templateId === tpl.id ? `${accentColor}14` : 'var(--sl-surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 16, lineHeight: 1 }}>{tpl.icon ?? '🎨'}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: templateId === tpl.id ? accentColor : 'var(--sl-t2)', textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word' }}>{tpl.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Couleur principale */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', margin: '0 0 8px' }}>Couleur principale</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {[...sportColors.slice(0, 2), ...COLOR_PRESETS.slice(0, 4).map(c => c.color)].map((col, i) => (
                        <button key={i} onClick={() => set('accentColor', col)} aria-label={`Couleur ${col}`} style={{ width: 30, height: 30, borderRadius: '50%', border: `3px solid ${accentColor === col ? '#fff' : 'transparent'}`, backgroundColor: col, cursor: 'pointer', boxShadow: accentColor === col ? `0 0 0 2px ${col}` : `0 2px 6px ${col}60`, flexShrink: 0 }} />
                      ))}
                      {/* Color picker libre */}
                      <label title="Couleur personnalisée" style={{ width: 30, height: 30, borderRadius: '50%', background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                        <input type="color" value={accentColor} onChange={e => set('accentColor', e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ──── ÉTAPE 2 : Infos ──── */}
              {wizardStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: '0 0 4px', lineHeight: 1.5 }}>
                    Vérifiez ou modifiez les informations de l'affiche.
                  </p>
                  {!isTournamentEvent ? (
                    <>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', margin: '0 0 6px' }}>Équipe domicile</p>
                        <input type="text" value={homeName} onChange={e => set('homeName', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', margin: '0 0 6px' }}>Équipe visiteur</p>
                        <input type="text" value={awayName} onChange={e => set('awayName', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
                      </div>
                    </>
                  ) : (
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', margin: '0 0 6px' }}>Nom du tournoi</p>
                      <input type="text" value={homeName} onChange={e => set('homeName', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', margin: '0 0 6px' }}>Compétition</p>
                    <input type="text" value={championship} onChange={e => set('championship', e.target.value)} placeholder="Ex : Championnat Départemental…" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                </div>
              )}

              {/* ──── ÉTAPE 3 : Export ──── */}
              {wizardStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0 4px' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(34,217,106,0.12)', border: '1px solid rgba(34,217,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--sl-t1)', textAlign: 'center', margin: 0 }}>Votre affiche est prête !</p>
                  <p style={{ fontSize: 12, color: 'var(--sl-t3)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                    Téléchargez-la ou partagez-la directement<br />sur WhatsApp ou Instagram.
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Tab panels — mode Expert uniquement */}
        {!simpleMode && <AnimatePresence mode='wait'>
          {activeTab && (
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.16 }}
              style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '42dvh', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}
            >
              <div style={{ padding: '14px 16px 16px' }}>
                {(() => {
                  const ps = {
                    poster, dispatch, set,
                    format, templateId, accentColor, bgSrc, bgUrl, bgErr, bgMode, bgPreset,
                    bgTint, bgTintOp, homeName, awayName, homeLogo, awayLogo,
                    championship, tagline, sponsorSrc, transforms,
                    overlayElements, aiOverlayElements, playerLayers, scoreHome, scoreAway,
                    activeTab, setActiveTab, exportOpen, setExportOpen,
                    watermarkVisible, setWatermarkVisible,
                    libName, setLibName, libFilter, setLibFilter, favVersion, setFavVersion,
                    mediaSearch, setMediaSearch, mediaFavOnly, setMediaFavOnly, mediaFolder, setMediaFolder,
                    tagEditingId, setTagEditingId, tagInput, setTagInput,
                    isDragOver, playerName, setPlayerName,
                    variants, setVariants, variantSeed, setVariantSeed, variantsOpen, setVariantsOpen,
                    aiPosterLoading, aiPosterHint, setAiPosterHint, aiPosterVariants,
                    aiElEditorUid, setAiElEditorUid, savedAiBgs, savedAiEls,
                    useBandSponsors, setUseBandSponsors, selectedSponsorIds, setSelectedSponsorIds,
                    showUpgradeModal, setShowUpgradeModal,
                    clubMedia, clubDNA, pageSponsors, hasPremium, aiUsage,
                    aiBgLoading, aiBgResult, customPrompt, setCustomPrompt, generateBg,
                    aiElLoading, elementPrompt, setElementPrompt, generateElement,
                    aiGenerateBlocked, aiImportBlocked, isTournamentEvent,
                    favTplHook, libHook, defTplHook,
                    posterData, activeBandLogos, posterEffects, sportColors, clubColors,
                    displayTemplates, hasLayerChanges, activeTpl,
                    w, h, altFormat, altW, altH, PREVIEW_W, previewH,
                    exportWrapperRef, altExportWrapperRef, sponsorRef, bgFileRef,
                    homeLogoRef, awayLogoRef, playerFileRef, replaceFileRef, replaceTargetId, dnaFileRef,
                    handleDownload, handleDownloadAll, handleShareWhatsApp, handleShareIG,
                    handleShareFacebook, handleCopyLink, handleGenerateAIPoster,
                    handlePlayerFile, handleDragOver, handleDragLeave, handleDrop,
                    addPlayerLayer, removePlayerLayer, updatePlayerLayer,
                    addOverlayElement, removeOverlayElement, updateOverlayElement,
                    addAiOverlay, removeAiOverlay, updateAiOverlay,
                    addSavedBg, removeSavedBg, addSavedEl, removeSavedEl,
                    saveToLib, loadFromLibrary, toggleFavTpl, setLayerProp, resetLayers,
                    applyBgUrl, readFile, handleTabClick,
                    event, club,
                  };
                  if (activeTab === 'template') return <TemplatePanelTab ps={ps} />;
                  if (activeTab === 'teams')    return <TeamsPanelTab ps={ps} />;
                  if (activeTab === 'style')    return <StylePanelTab ps={ps} />;
                  if (activeTab === 'joueurs')  return <PlayersPanelTab ps={ps} />;
                  if (activeTab === 'fond')     return <BackgroundPanelTab ps={ps} />;
                  return null;
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>}

        {/* ── BOTTOM NAV BAR — mode Expert uniquement ─────────────────────────── */}
        {!simpleMode && <div style={{
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
        </div>}

        {/* ── Wizard footer — mode Simple ──────────────────────────────────────── */}
        {simpleMode && (
          <div style={{
            flexShrink: 0, display: 'flex', gap: 10, padding: '12px 16px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
            borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)',
          }}>
            {/* Bouton gauche : Annuler (étape 1) ou Précédent (étapes 2-3) */}
            {wizardStep > 1 ? (
              <button
                onClick={() => setWizardStep(s => s - 1)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: '1px solid var(--sl-border)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Précédent
              </button>
            ) : (
              <button
                onClick={onClose}
                style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: '1px solid var(--sl-border)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Annuler
              </button>
            )}

            {/* Bouton droit : Suivant (étapes 1-2) ou Télécharger (étape 3) */}
            {wizardStep < 3 ? (
              <button
                onClick={() => setWizardStep(s => s + 1)}
                style={{ flex: 2, padding: '12px 0', borderRadius: 14, border: 'none', backgroundColor: accentColor, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: `0 4px 16px ${accentColor}50` }}
              >
                Suivant
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ) : (
              <button
                onClick={() => setExportOpen(true)}
                style={{ flex: 2, padding: '12px 0', borderRadius: 14, border: 'none', backgroundColor: 'var(--sl-green)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 14px rgba(34,217,106,0.4)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Télécharger / Partager
              </button>
            )}
          </div>
        )}

        </div>

      </motion.div>
    </motion.div>

    {/* ── Modal Upgrade Premium ── */}
    {showUpgradeModal && (
      <div
        onClick={() => setShowUpgradeModal(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 env(safe-area-inset-bottom)' }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 480, backgroundColor: 'var(--sl-card)', borderRadius: '20px 20px 0 0', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              👑
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--sl-t1)' }}>Template Premium</div>
              <div style={{ fontSize: 12, color: 'var(--sl-t3)' }}>Disponible dès 10 €/mois</div>
            </div>
          </div>

          {/* Avantages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['🎨', '20+ templates exclusifs (Éditorial, Luxe, Neon…)'],
              ['🚫', 'Suppression du filigrane SportLink'],
              ['🤖', "Génération de fond par IA (10 crédits/mois)"],
              ['🤝', 'Intégration automatique des logos sponsors'],
            ].map(([emoji, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, backgroundColor: 'var(--sl-surface)' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>
                <span style={{ fontSize: 12, color: 'var(--sl-t2)' }}>{text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href="mailto:contact@sportlink.app?subject=Abonnement Premium SportLink"
            style={{ display: 'block', width: '100%', padding: '13px 0', borderRadius: 14, backgroundColor: '#D4AF37', color: '#0B1E3D', textAlign: 'center', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}
          >
            Passer au plan Premium — 10 €/mois
          </a>

          <button
            onClick={() => setShowUpgradeModal(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sl-t3)', fontSize: 12, padding: 0 }}
          >
            Continuer avec les templates gratuits
          </button>
        </div>
      </div>
    )}
    </>
  );
}
