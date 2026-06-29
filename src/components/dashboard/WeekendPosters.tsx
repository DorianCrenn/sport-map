// ─────────────────────────────────────────────────────────────────────────────
// WeekendPosters.tsx
// Dashboard "Mes affiches du week-end" — mobile-first, React 19 + TypeScript
//
// Usage normal  : <WeekendPosters onOpenInStudio={fn} />
// Usage mock    : <WeekendPosters matches={getMockWeekendMatches()} />
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toBlob } from 'html-to-image';
import PosterRenderer from '../poster/PosterRenderer.jsx';
import { generateCustomBackground } from '../../lib/posterVariants.js';
import { normalizeSport, getBgCache, setBgCache, SPORT_BG_PROMPTS, getOrGenerateBg } from '../../lib/sportBgCache.js';
import { useWeekendPosters } from '../../hooks/useWeekendPosters.js';
import type { WeekendMatch, ExportAction } from '../../types/sportlink.js';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface WeekendPostersProps {
  /** Surcharge les matchs (tests, données mockées, intégration personnalisée) */
  matches?: WeekendMatch[];
  /**
   * Appelé quand l'utilisateur clique sur "Modifier".
   * Le parent est responsable d'ouvrir PosterStudio avec les bonnes données.
   */
  onOpenInStudio?: (match: WeekendMatch) => void;
  className?: string;
  /** Titre de la section (défaut : "Mes affiches du week-end") */
  title?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires locaux
// ─────────────────────────────────────────────────────────────────────────────

// Méta-données visuelles par sport
const SPORT_META: Record<string, { emoji: string; label: string; gradient: string }> = {
  football:   { emoji: '⚽', label: 'Football',    gradient: 'linear-gradient(160deg,#071a0a 0%,#0f3d18 55%,#071a0a 100%)' },
  basket:     { emoji: '🏀', label: 'Basketball',  gradient: 'linear-gradient(160deg,#1a0800 0%,#4a1e00 55%,#1a0800 100%)' },
  handball:   { emoji: '🤾', label: 'Handball',    gradient: 'linear-gradient(160deg,#06061a 0%,#15256a 55%,#06061a 100%)' },
  volleyball: { emoji: '🏐', label: 'Volleyball',  gradient: 'linear-gradient(160deg,#1a1000 0%,#4a3000 55%,#1a1000 100%)' },
  tennis:     { emoji: '🎾', label: 'Tennis',      gradient: 'linear-gradient(160deg,#1a0500 0%,#5a1400 55%,#1a0500 100%)' },
  rugby:      { emoji: '🏉', label: 'Rugby',       gradient: 'linear-gradient(160deg,#1a0000 0%,#4a0808 55%,#1a0000 100%)' },
  padel:      { emoji: '🎾', label: 'Padel',       gradient: 'linear-gradient(160deg,#00101a 0%,#00305a 55%,#00101a 100%)' },
  badminton:  { emoji: '🏸', label: 'Badminton',   gradient: 'linear-gradient(160deg,#081a02 0%,#1a5a08 55%,#081a02 100%)' },
  default:    { emoji: '🏆', label: 'Sport',       gradient: 'linear-gradient(160deg,#0a0a1a 0%,#1a1a4a 55%,#0a0a1a 100%)' },
};

function getSportMeta(sport: string) {
  const key = normalizeSport(sport);
  return SPORT_META[key] ?? SPORT_META.default;
}

function fmtTime(time?: string): string {
  return time ? time.replace(':', 'h') : '';
}

function fmtWeekLabel(matches: WeekendMatch[]): string {
  if (!matches.length) return 'Ce week-end';
  const first = matches[0].date;
  const last  = matches[matches.length - 1].date;
  const opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const s = first.toLocaleDateString('fr-FR', opts);
  // Si sam + dim, on affiche "sam. 30 – dim. 31 mai"
  if (first.getDay() !== last.getDay()) {
    const e = last.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
    return `${s.split(' ')[0]}. ${first.getDate()} – ${e}`;
  }
  return s;
}

/** Attend que toutes les <img> d'un conteneur soient chargées ou en erreur. */
async function waitForImages(el: HTMLElement): Promise<void> {
  const imgs = Array.from(el.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(
    imgs.map(img =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>(res => {
            img.onload  = () => res();
            img.onerror = () => res(); // ne bloque pas sur une image cassée
          })
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonCard — état de chargement
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 rounded-2xl overflow-hidden border border-white/8 bg-white/[0.03] flex flex-col"
         style={{ width: 200 }}>
      {/* Aperçu affiche */}
      <div className="w-full bg-white/5 animate-pulse" style={{ height: 284 }} />
      {/* Infos */}
      <div className="p-3 space-y-2">
        <div className="h-2.5 w-14 bg-white/10 rounded animate-pulse" />
        <div className="h-3.5 w-full bg-white/10 rounded animate-pulse" />
        <div className="h-2.5 w-24 bg-white/8 rounded animate-pulse" />
      </div>
      {/* Actions */}
      <div className="flex border-t border-white/8">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex-1 h-10 bg-white/[0.02] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Icônes SVG — style harmonisé PosterStudio
// ─────────────────────────────────────────────────────────────────────────────

const IcoDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IcoEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IcoShare = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);
const IcoCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// PosterCard — une carte match
// ─────────────────────────────────────────────────────────────────────────────

const PREVIEW_WIDTH = 200; // px, correspond à la largeur de la carte

interface PosterCardProps {
  match: WeekendMatch;
  bgImage?: string;
  isDark: boolean;
  isExporting: boolean;
  onDownload: (m: WeekendMatch) => void;
  onShare:    (m: WeekendMatch) => void;
  onEdit:     (m: WeekendMatch) => void;
}

function PosterCard({ match, bgImage, isDark, isExporting, onDownload, onShare, onEdit }: PosterCardProps) {
  const previewHeight = Math.round((PREVIEW_WIDTH / 360) * 640);
  const accent = (match.posterData as any).accentColor || '#22d96a';
  const sportMeta = getSportMeta(match.sport);

  // Palette carte UI selon le thème
  const cardBg     = isDark ? '#0d0d14'                : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)';
  const txtPrimary = isDark ? 'rgba(255,255,255,0.92)' : '#111111';
  const txtVs      = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.38)';
  const txtMeta    = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.65)';
  const txtComp    = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.50)';
  const divider    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const btnActive  = isDark ? 'rgba(255,255,255,0.68)' : 'rgba(0,0,0,0.58)';
  const btnOff     = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
  const shadow     = isDark ? `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1.5px ${accent}30` : '0 4px 20px rgba(0,0,0,0.10)';

  // Jour de l'événement — ex: "SAM. 30 MAI · 15h00"
  const dayStr = match.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();

  const actions = [
    { key: 'dl',    Icon: IcoDownload, label: 'Télécharger', onClick: () => onDownload(match), loading: isExporting },
    { key: 'edit',  Icon: IcoEdit,     label: 'Modifier',    onClick: () => onEdit(match) },
    { key: 'share', Icon: IcoShare,    label: 'Partager',    onClick: () => onShare(match), loading: isExporting },
    { key: 'cal',   Icon: IcoCalendar, label: 'Planifier',   onClick: () => {}, disabled: true },
  ];

  return (
    <div
      className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden"
      style={{ width: PREVIEW_WIDTH, backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: shadow }}
    >
      {/* ── Bandeau sport — emoji + label + date ── */}
      <div style={{
        background: sportMeta.gradient,
        padding: '9px 12px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${accent}30`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 20, lineHeight: 1, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}>
            {sportMeta.emoji}
          </span>
          <span style={{ fontSize: 11, fontWeight: 900, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {sportMeta.label}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{dayStr}</div>
          {match.time && <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.80)', letterSpacing: '0.04em' }}>{fmtTime(match.time)}</div>}
        </div>
      </div>

      {/* ── Aperçu de l'affiche (photo sport en fond si disponible) ── */}
      <div className="relative" style={{ height: previewHeight, background: bgImage ? undefined : sportMeta.gradient }}>
        {/* Fond sport photo — apparaît dès que Pollinations répond */}
        {bgImage && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'brightness(0.55)',
          }} />
        )}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <PosterRenderer
            templateId={match.templateId}
            data={bgImage ? { ...match.posterData, bgImage } : match.posterData}
            format="story"
            previewWidth={PREVIEW_WIDTH}
            bgPresetId={bgImage ? '' : (match.bgPresetId ?? '')}
            bgImageGradient={!!bgImage}
          />
        </div>

        {/* Badge catégorie */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[9px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-black/65 text-white/75 backdrop-blur-sm border border-white/10">
            {match.category}
          </span>
        </div>

        {/* Indicateur photo en cours de chargement */}
        {!bgImage && (
          <div className="absolute bottom-2 right-2 z-10">
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', background: 'rgba(0,0,0,0.45)', padding: '2px 6px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
              photo en cours…
            </span>
          </div>
        )}

        <AnimatePresence>
          {isExporting && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm gap-2"
            >
              <div className="w-7 h-7 border-2 border-white/25 border-t-white rounded-full animate-spin" />
              <span className="text-[10px] text-white/50 font-medium">Génération…</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Infos du match ── */}
      <div style={{ padding: '9px 12px 7px', flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: txtPrimary, lineHeight: 1.35, margin: 0 }}>
          {match.homeTeam.name}
          <span style={{ color: txtVs, fontWeight: 400, margin: '0 3px' }}>vs</span>
          {match.awayTeam.name}
        </p>
        {match.venue && (
          <p style={{ fontSize: 10, color: txtMeta, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {match.venue}
          </p>
        )}
        {match.competition && (
          <p style={{ fontSize: 9, color: txtComp, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {match.competition}
          </p>
        )}
      </div>

      {/* ── Actions — style harmonisé PosterStudio ── */}
      <div style={{ display: 'flex', borderTop: `1px solid ${divider}` }}>
        {actions.map(({ key, Icon, label, onClick, loading, disabled }, i) => (
          <div key={key} style={{ display: 'contents' }}>
            <motion.button
              type="button"
              whileTap={disabled ? undefined : { scale: 0.85 }}
              onClick={disabled || loading ? undefined : onClick}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 3, padding: '9px 4px 7px',
                color: disabled ? btnOff : btnActive,
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: 'none', border: 'none',
                borderTop: `2px solid transparent`,
                transition: 'color 0.15s',
              }}
            >
              {loading
                ? <span style={{ display: 'inline-block', width: 14, height: 14, border: `2px solid currentColor`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <Icon />}
              <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1 }}>{label}</span>
            </motion.button>
            {i < actions.length - 1 && (
              <div style={{ width: 1, backgroundColor: divider, margin: '6px 0', alignSelf: 'stretch' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="mx-4 rounded-2xl border border-dashed border-white/10 p-8 flex flex-col items-center gap-2.5 text-center">
      <span className="text-4xl">📅</span>
      <p className="text-[13px] font-semibold text-white/50">Aucun match ce week-end</p>
      <p className="text-[11px] text-white/30 leading-relaxed max-w-[220px]">
        Importez votre calendrier pour générer automatiquement vos affiches.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast notification légère
// ─────────────────────────────────────────────────────────────────────────────

interface ToastState { msg: string; ok: boolean }

function Toast({ toast }: { toast: ToastState | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50
            px-4 py-2.5 rounded-xl text-[12px] font-semibold shadow-xl shadow-black/40
            backdrop-blur-md border border-white/10 whitespace-nowrap
            ${toast.ok ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}
        >
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WeekendPosters — composant principal
// ─────────────────────────────────────────────────────────────────────────────

export default function WeekendPosters({
  matches: matchesProp,
  onOpenInStudio,
  className = '',
  title = 'Mes affiches du week-end',
}: WeekendPostersProps) {
  // Données live (hook) ou mockées (prop)
  const liveMatches = useWeekendPosters();
  const matches = matchesProp ?? liveMatches;

  // Détection thème clair/sombre — réactif aux changements
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.getAttribute('data-theme') !== 'light'
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light')
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // Fonds IA — keyed par match.id (plusieurs matchs du même sport partagent la même image)
  const [bgImages, setBgImages] = useState<Record<string, string>>(() => {
    // Hydratation initiale depuis le cache localStorage
    if (!matchesProp && typeof window === 'undefined') return {};
    const init: Record<string, string> = {};
    const src = matchesProp ?? [];
    for (const m of src) {
      const url = getBgCache(normalizeSport(m.sport));
      if (url) init[m.id] = url;
    }
    return init;
  });

  // Génération parallèle — une image par sport unique, cache localStorage 7 j
  useEffect(() => {
    if (!matches.length) return;
    let cancelled = false;

    // Hydrate d'abord depuis le cache (matchs live ou mockés)
    setBgImages(prev => {
      const next = { ...prev };
      for (const m of matches) {
        if (next[m.id]) continue;
        const url = getBgCache(normalizeSport(m.sport));
        if (url) next[m.id] = url;
      }
      return next;
    });

    // Regroupe les matchs par sport pour ne générer qu'une image par sport
    const sportToIds: Record<string, string[]> = {};
    for (const m of matches) {
      const key = normalizeSport(m.sport);
      if (!sportToIds[key]) sportToIds[key] = [];
      sportToIds[key].push(m.id);
    }

    // Génère tous les sports manquants en parallèle
    Promise.all(
      Object.entries(sportToIds).map(async ([key, ids]) => {
        if (getBgCache(key)) return; // déjà en cache
        const prompt = SPORT_BG_PROMPTS[key] ?? SPORT_BG_PROMPTS.default;
        try {
          const imageUrl = await getOrGenerateBg(key, () => generateCustomBackground(prompt));
          if (!cancelled && imageUrl) {
            setBgImages(prev => {
              const next = { ...prev };
              for (const id of ids) next[id] = imageUrl;
              return next;
            });
          }
        } catch {
          // Silencieux — fond sport gradient en fallback
        }
      })
    );

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches.map(m => m.id).join(',')]);

  // Ref sur l'affiche HD cachée, rendue hors-écran pour l'export
  const exportRef = useRef<HTMLDivElement | null>(null);

  // Match en cours d'export (déclenche le rendu hors-écran)
  const [exportingMatch, setExportingMatch] = useState<WeekendMatch | null>(null);
  // L'action associée ("download" ou "share"), mémorisée dans une ref pour
  // éviter de la mettre dans le state (elle ne doit pas déclencher un re-render)
  const pendingActionRef = useRef<ExportAction | null>(null);

  // ID du match dont l'export est en cours (pour l'overlay de chargement)
  const [loadingMatchId, setLoadingMatchId] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);

  // ── Déclencheur : met en route l'export ─────────────────────────────────────
  const triggerExport = useCallback((match: WeekendMatch, action: ExportAction) => {
    pendingActionRef.current = action;
    setExportingMatch(match);
    setLoadingMatchId(match.id);
  }, []);

  // ── Effet : génère le blob une fois l'affiche HD rendue dans le DOM ─────────
  useEffect(() => {
    if (!exportingMatch || !exportRef.current) return;

    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    let cancelled = false;

    const run = async () => {
      try {
        // Attendre que les images (logos) soient chargées
        await waitForImages(exportRef.current!);
        if (cancelled) return;

        // Sur mobile : limiter le pixel ratio pour éviter les crashs mémoire.
        // iOS Safari : max 2× ; desktop : 3× pour HD.
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const pixelRatio = isMobile ? Math.min(window.devicePixelRatio, 2) : 3;

        const blob = await toBlob(exportRef.current!, {
          pixelRatio,
          cacheBust: true,
          // skipAutoScale évite un double scaling sur les écrans HiDPI
          skipAutoScale: true,
        });

        if (cancelled || !blob) return;

        if (action === 'download') {
          // ── Téléchargement PNG ─────────────────────────────────────────────
          const url = URL.createObjectURL(blob);
          const a   = document.createElement('a');
          const safe = exportingMatch.homeTeam.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          a.href     = url;
          a.download = `affiche-${safe}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          setToast({ msg: 'Affiche téléchargée ! ✅', ok: true });

        } else if (action === 'share') {
          // ── Web Share API (mobile) ─────────────────────────────────────────
          const file = new File([blob], 'affiche.png', { type: 'image/png' });
          const text = [
            `⚽ Jour de match !`,
            `${exportingMatch.homeTeam.name} reçoit ${exportingMatch.awayTeam.name}.`,
            exportingMatch.time ? `🕒 ${fmtTime(exportingMatch.time)}` : '',
            exportingMatch.venue ? `📍 ${exportingMatch.venue}` : '',
            `Venez nombreux nous soutenir ! 💪`,
          ].filter(Boolean).join('\n');

          // navigator.canShare() vérifie que le navigateur supporte le partage de fichiers
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              files: [file],
              text,
              title: `Match – ${exportingMatch.homeTeam.name} vs ${exportingMatch.awayTeam.name}`,
            });
          } else {
            // Fallback desktop ou navigateur sans support fichiers : téléchargement
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href     = url;
            a.download = 'affiche.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            setToast({ msg: 'Affiche téléchargée (partage non dispo sur ce nav.)', ok: true });
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[WeekendPosters] export error:', err);
        // Sur iOS Safari, les images cross-origin taintent le canvas.
        // Invite l'utilisateur à faire une capture d'écran dans ce cas.
        const msg = (err instanceof Error && err.message.includes('tainted'))
          ? 'Export bloqué (CORS logo). Faites une capture d\'écran.'
          : 'Export impossible sur cet appareil.';
        setToast({ msg: `❌ ${msg}`, ok: false });
      } finally {
        if (!cancelled) {
          setExportingMatch(null);
          setLoadingMatchId(null);
        }
      }
    };

    // Petit délai : laisse React effectuer le rendu de l'affiche cachée
    const timer = window.setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [exportingMatch]);

  // ── Toast auto-dismiss ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <section className={`relative ${className}`}>

      {/* En-tête de section */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <h2 className="text-[14px] font-bold text-white leading-tight">
            {title}
          </h2>
          <p className="text-[11px] text-white/35 mt-0.5 capitalize">
            {fmtWeekLabel(matches)}
          </p>
        </div>
        {matches.length > 0 && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/8 text-white/45">
            {matches.length} match{matches.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Contenu */}
      {matches.length === 0 ? (
        <EmptyState />
      ) : (
        /*
         * Scroll horizontal avec snap.
         * scrollbar-none : masque la scrollbar native (utile sur desktop).
         * snap-x + snap-mandatory : effet de "claquement" carte par carte sur mobile.
         */
        <div
          className="overflow-x-auto px-4 pb-3 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          <motion.div
            className="flex gap-3 w-max"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            initial="hidden"
            animate="show"
          >
            {matches.map(match => (
              <motion.div
                key={match.id}
                className="snap-start"
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { type: 'spring', stiffness: 320, damping: 26 },
                  },
                }}
              >
                <PosterCard
                  match={match}
                  bgImage={bgImages[match.id]}
                  isDark={isDark}
                  isExporting={loadingMatchId === match.id}
                  onDownload={m => triggerExport(m, 'download')}
                  onShare={m => triggerExport(m, 'share')}
                  onEdit={m => onOpenInStudio?.(m)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/*
       * Affiche HD cachée hors-écran — rendue uniquement pendant l'export.
       * position:fixed + top:-9999px : hors de la vue mais dans le DOM pour html-to-image.
       * previewWidth=360 = taille réelle du template (pas de scaling, pleine résolution).
       */}
      {exportingMatch && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: -9999,
            left: -9999,
            zIndex: -1,
            pointerEvents: 'none',
          }}
        >
          <div ref={exportRef}>
            <PosterRenderer
              templateId={exportingMatch.templateId}
              data={bgImages[exportingMatch.id]
                ? { ...exportingMatch.posterData, bgImage: bgImages[exportingMatch.id], darkMode: isDark }
                : { ...exportingMatch.posterData, darkMode: isDark }}
              format="story"
              previewWidth={360}
              bgPresetId={bgImages[exportingMatch.id] ? '' : (exportingMatch.bgPresetId ?? '')}
              bgImageGradient={!!bgImages[exportingMatch.id]}
            />
          </div>
        </div>
      )}

      {/* Notification toast */}
      <Toast toast={toast} />
    </section>
  );
}
