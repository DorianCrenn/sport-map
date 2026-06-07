import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { Z } from '../constants/zIndex.js';
import PosterRenderer, { POSTER_TEMPLATES, BASE_DIMS } from './poster/PosterRenderer.jsx';
import ExportPanel       from './poster/panels/ExportPanel.jsx';
import TemplatePanelTab  from './poster/panels/TemplatePanelTab.jsx';
import TeamsPanelTab     from './poster/panels/TeamsPanelTab.jsx';
import StylePanelTab     from './poster/panels/StylePanelTab.jsx';
import PlayersPanelTab   from './poster/panels/PlayersPanelTab.jsx';
import BackgroundPanelTab from './poster/panels/BackgroundPanelTab.jsx';
import PosterEditor from './poster/PosterEditor.jsx';
import AiElementEditor from './poster/AiElementEditor.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useAndroidBack } from '../hooks/useAndroidBack.js';
import { useClubMedia } from '../hooks/useClubMedia.js';
import { useClubDNA } from '../hooks/useClubDNA.js';
import { useClubSponsorsPage } from '../hooks/useClubSponsorsPage.js';
import { useClubFeatures } from '../hooks/useClubFeatures.js';
import { useClubAIUsage } from '../hooks/useClubAIUsage.js';
import { usePosterAI } from '../hooks/usePosterAI.js';
import { usePosterState } from '../hooks/usePosterState.js';
import { deriveInitialFields } from '../lib/posterVariables.js';
import { generateMatchPoster } from '../lib/posterVariants.js';
import { supabase } from '../lib/supabase.js';
import { IcoExporter } from './poster/PosterAtoms.jsx';
import {
  SPORT_PALETTE, PANEL_TABS,
} from './poster/posterConstants.js';
import { usePosterAssets } from '../hooks/usePosterAssets.js';
import { usePosterExport } from '../hooks/usePosterExport.js';
import { WizardStepBar, WizardContent, WizardFooter } from './poster/PosterWizard.jsx';
import PlatformPreviewPanel from './poster/PlatformPreviewPanel.jsx';

// ── Main component ─────────────────────────────────────────────────────────────

export default function PosterStudio({ event, onClose, club, quickMode = false, resultMode = null, initialBgSrc = null }) {
  const { allSports } = useSports();
  const { currentUser } = useAuth();
  const features = useClubFeatures(club?.id);

  // Feature flags explicites — remplacent le booléen hasPremium générique
  const hasPremium       = features.can('POSTER_WATERMARK_REMOVE');  // Starter+
  const canUseAI         = features.can('POSTER_AI_BACKGROUND');      // Elite
  // eslint-disable-next-line no-unused-vars
  const canUseSponsors   = features.can('POSTER_SPONSORS_LOGOS');     // Pro+ (réservé pour un futur check côté serveur)

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

  const {
    poster, dispatch, set,
    draftState, lastSavedAt, restoredDraft,
    libHook, favTplHook, defTplHook,
  } = usePosterState({ event, club, initialAccent, initialFields, initialBgSrc, isTournamentEvent, resultMode });

  const clubMedia  = useClubMedia(club?.id);
  const clubDNA    = useClubDNA(club?.id);
  const { usage: aiUsage, optimisticIncrement: aiIncrement } = useClubAIUsage(club?.id);
  // Quota IA depuis le plan — aiImportsPerMonth passé aux panels via ps
  const { aiImportsPerMonth } = features.quotas;
  const aiGenerateBlocked = !canUseAI || features.overQuota('aiGeneratesPerMonth', aiUsage.generate_count);
  const aiImportBlocked   = !canUseAI || features.overQuota('aiImportsPerMonth',   aiUsage.import_count);

  const pageSponsors = useClubSponsorsPage(club?.id);
  const [useBandSponsors, setUseBandSponsors] = useState(false);
  const [selectedSponsorIds, setSelectedSponsorIds] = useState(new Set());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const {
    format, templateId, accentColor, bgSrc, bgUrl, bgErr, bgMode, bgPreset,
    bgTint, bgTintOp,
    homeName, awayName, homeLogo, awayLogo, championship, tagline,
    sponsorSrc, transforms, overlayElements, aiOverlayElements, playerLayers,
    scoreHome, scoreAway,
  } = poster;
  const altFormat = format === 'story' ? 'post' : 'story';
  const { w: altW, h: altH } = BASE_DIMS[altFormat];

  const [activeTab,     setActiveTab]     = useState('template');
  const [exportOpen,    setExportOpen]    = useState(false);
  const [quickBannerDismissed, setQuickBannerDismissed] = useState(false);
  // Mode Simple : wizard 3 étapes (désactivé en quickMode / resultMode qui sont déjà des raccourcis)
  const [simpleMode,    setSimpleMode]    = useState(!quickMode && !resultMode);
  const [wizardStep,    setWizardStep]    = useState(1);
  const [isDesktop,     setIsDesktop]     = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  useEffect(() => {
    if (isDesktop && activeTab === 'template') setActiveTab('style');
  }, [isDesktop]); // eslint-disable-line
  const [watermarkVisible, setWatermarkVisible] = useState(true);
  const [editorOpen,    setEditorOpen]    = useState(false);
  const [previewFull,   setPreviewFull]   = useState(false);
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
  } = usePosterAI({ aiGenerateBlocked, onTrack: trackAIGeneration, clubId: club?.id });
  const [aiPosterLoading,  setAiPosterLoading]  = useState(false);
  const [aiPosterHint,     setAiPosterHint]     = useState('');
  const [aiPosterVariants, setAiPosterVariants] = useState([]);
  const [aiElEditorUid, setAiElEditorUid] = useState(null);

  // ── Hooks extraits ─────────────────────────────────────────────────────────
  const {
    savedAiBgs, savedAiEls,
    addSavedBg, removeSavedBg, addSavedEl, removeSavedEl,
    addAiOverlay, removeAiOverlay, updateAiOverlay,
    addOverlayElement, removeOverlayElement, updateOverlayElement,
    addPlayerLayer, removePlayerLayer, updatePlayerLayer,
  } = usePosterAssets({ clubId: club?.id, accentColor, dispatch, overlayElements, aiOverlayElements, playerLayers });
  const canvasAreaRef = useRef(null);
  const playerFileRef = useRef(null);
  const replaceFileRef = useRef(null);
  const replaceTargetId = useRef(null);
  const dnaFileRef    = useRef(null);

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

  // Android back — chaîné comme Escape : ferme d'abord la sous-vue la plus haute
  useAndroidBack(
    true,
    () => {
      if (editorOpen)          { setEditorOpen(false); return; }
      if (previewFull)         { setPreviewFull(false); return; }
      if (aiElEditorUid !== null) { setAiElEditorUid(null); return; }
      if (exportOpen)          { setExportOpen(false); return; }
      if (showUpgradeModal)    { setShowUpgradeModal(false); return; }
      onClose();
    },
  );

  // Fermeture via Escape — ne ferme que si aucune sous-fenêtre n'est ouverte
  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (editorOpen) { setEditorOpen(false); return; }
      if (previewFull) { setPreviewFull(false); return; }
      if (aiElEditorUid !== null) { setAiElEditorUid(null); return; }
      if (exportOpen) { setExportOpen(false); return; }
      if (showUpgradeModal) { setShowUpgradeModal(false); return; }
      onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editorOpen, previewFull, aiElEditorUid, exportOpen, showUpgradeModal, onClose]);

  // Mode Simple → ouvrir l'export quand l'utilisateur arrive à l'étape 3
  useEffect(() => {
    if (!simpleMode || wizardStep !== 3) return;
    const t = setTimeout(() => setExportOpen(true), 250);
    return () => clearTimeout(t);
  }, [simpleMode, wizardStep]);  

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

  // ── Player upload handler ──
  async function handlePlayerFile(file) {
    if (!file) return;
    clubMedia.resetUpload();
    try {
      const asset = await clubMedia.uploadPlayer(file, playerName);
      setPlayerName('');
      addPlayerLayer(asset);
      trackAIImport();
    } catch { /* upload échoué — silencieux */ }
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
  const maxPosterH = Math.max(canvasH - 20, 120);
  const PREVIEW_W  = Math.min(Math.floor(maxPosterH * (w / h)), 260);
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

  // ── Export/partage (extrait dans usePosterExport) ─────────────────────────
  const {
    downloading, sharing, sharingIG, exportingAll, linkCopied,
    platformPreview, setPlatformPreview,
    handleDownload, handleShareWhatsApp, handleShareIG,
    handleShareFacebook, handleDownloadAll, handleCopyLink,
  } = usePosterExport({ exportWrapperRef, altExportWrapperRef, format, altFormat, event, trackExport });

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
        display: 'flex', alignItems: isDesktop ? 'center' : 'flex-end', justifyContent: 'center',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: isDesktop ? 0 : '100%', opacity: isDesktop ? 0 : 1 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: isDesktop ? 0 : '100%', opacity: isDesktop ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        style={{
          width: '100%',
          maxWidth: isDesktop ? 1100 : 640,
          height: isDesktop ? '90dvh' : '96dvh',
          borderRadius: isDesktop ? 16 : '22px 22px 0 0',
          backgroundColor: 'var(--sl-card)',
          border: '1px solid var(--sl-border)', borderBottom: isDesktop ? '1px solid var(--sl-border)' : 'none',
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
        <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: isDesktop && !simpleMode ? 'row' : 'column' }}>

        {/* Platform preview overlay — DISTRIB-001c */}
        <AnimatePresence>
          {platformPreview && (
            <PlatformPreviewPanel
              platformPreview={platformPreview}
              setPlatformPreview={setPlatformPreview}
              templateId={templateId}
              posterData={posterData}
              format={format}
              transforms={transforms}
              bgPreset={bgPreset}
              effects={posterEffects}
              overlayElements={overlayElements}
              aiOverlayElements={aiOverlayElements}
              playerLayers={playerLayers}
              activeBandLogos={activeBandLogos}
              hasPremium={hasPremium}
              club={club}
            />
          )}
        </AnimatePresence>

        {/* ── Colonne gauche — Templates (desktop expert uniquement) ──────────── */}
        {isDesktop && !simpleMode && (() => {
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
            aiGenerateBlocked, aiImportBlocked, aiImportsPerMonth, isTournamentEvent,
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
          return (
            <div style={{
              width: 236, flexShrink: 0,
              borderRight: '1px solid var(--sl-border)',
              backgroundColor: 'var(--sl-surface)',
              overflowY: 'auto', overflowX: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ padding: '10px 10px 4px', flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)' }}>
                  Templates
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 12px' }}>
                <TemplatePanelTab ps={ps} />
              </div>
            </div>
          );
        })()}

        {/* ── Indicateur de progression — mode Simple ──────────────────────────── */}
        {simpleMode && <WizardStepBar ps={{ wizardStep, setWizardStep, accentColor }} />}

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
          style={{ flex: 1, minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--sl-bg)', position: 'relative', overflow: 'hidden' }}
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
        {simpleMode && <WizardContent ps={{ wizardStep, set, format, accentColor, templateId, displayTemplates, sportColors, homeName, awayName, championship, isTournamentEvent, bgPreset, bgSrc, dispatch }} />}

        {/* Tab panels — mode Expert uniquement */}
        {!simpleMode && <AnimatePresence mode='wait'>
          {activeTab && (
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.16 }}
              style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '38dvh', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}
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
                    aiGenerateBlocked, aiImportBlocked, aiImportsPerMonth, isTournamentEvent,
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
          {PANEL_TABS.filter(t => !(isDesktop && t.id === 'template')).map(({ id, label, Icon }) => {
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
        {simpleMode && <WizardFooter ps={{ wizardStep, setWizardStep, onClose, accentColor, handleDownload, downloading }} />}

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
          {/* Badge + close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              👑
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--sl-t1)' }}>Template Premium</div>
              <div style={{ fontSize: 12, color: 'var(--sl-t3)' }}>Disponible dès 10 €/mois</div>
            </div>
            <button
              onClick={() => setShowUpgradeModal(false)}
              aria-label="Fermer"
              style={{ width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
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
