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
// @ts-expect-error — JS non typé
import PosterRenderer from '../poster/PosterRenderer.jsx';
// @ts-expect-error — JS non typé
import { generateCustomBackground } from '../../lib/posterVariants.js';
import { useWeekendPosters } from '../../hooks/useWeekendPosters.js';
import type { WeekendMatch, ExportAction } from '../../types/sportlink.js';

// ── Prompts Pollinations.ai par sport ─────────────────────────────────────────
// Phrases courtes, colorées, sans personnes ni logos — Flux les rend bien en format portrait
const SPORT_BG_PROMPTS: Record<string, string> = {
  football:   'vibrant green football grass close-up, stadium floodlights bokeh, electric match atmosphere, lush field texture',
  foot:       'vibrant green football grass close-up, stadium floodlights bokeh, electric match atmosphere',
  soccer:     'vibrant green football grass close-up, stadium floodlights bokeh, electric match atmosphere',
  basket:     'basketball court hardwood parquet texture, arena neon spotlights, orange energy, dynamic vibrant colors',
  basketball: 'basketball court hardwood parquet texture, arena neon spotlights, orange energy, dynamic vibrant colors',
  handball:   'handball parquet court blue lines detail, sports hall dramatic lighting, vibrant blue and orange',
  hand:       'handball parquet court blue lines detail, sports hall dramatic lighting, vibrant blue and orange',
  volleyball: 'beach volleyball golden sand court, sunset orange sky, ocean blues, summer vibrant energy',
  volley:     'beach volleyball golden sand court, sunset orange sky, ocean blues, summer vibrant energy',
  tennis:     'clay tennis court deep orange-red texture, Roland Garros atmosphere, vibrant court lines detail',
  rugby:      'green rugby field grass close-up, dramatic storm sky, vibrant stadium floodlights, intense atmosphere',
  padel:      'padel court glass walls blue artificial turf, modern neon arena lighting, vibrant colors',
  squash:     'squash court orange walls glass detail, dramatic arena lighting, vibrant colors',
  badminton:  'badminton court colorful lines, sports hall bright lighting, vibrant energy shuttlecock',
  default:    'sports arena dramatic colorful lighting, vibrant energy, athletic stadium atmosphere at night',
};

// ── Cache localStorage — clé par sport, TTL 7 jours ──────────────────────────

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function normalizeSport(sport: string): string {
  const s = sport.toLowerCase();
  if (s.includes('foot') || s.includes('soccer')) return 'football';
  if (s.includes('basket'))    return 'basket';
  if (s.includes('hand'))      return 'handball';
  if (s.includes('volley'))    return 'volleyball';
  if (s.includes('tennis'))    return 'tennis';
  if (s.includes('rugby'))     return 'rugby';
  if (s.includes('padel'))     return 'padel';
  if (s.includes('squash'))    return 'squash';
  if (s.includes('badminton')) return 'badminton';
  return 'default';
}

function getBgCache(sport: string): string | null {
  try {
    const raw = localStorage.getItem(`sl-sport-bg-${sport}`);
    if (!raw) return null;
    const { imageUrl, ts } = JSON.parse(raw) as { imageUrl: string; ts: number };
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(`sl-sport-bg-${sport}`); return null; }
    return imageUrl;
  } catch { return null; }
}

function setBgCache(sport: string, imageUrl: string): void {
  try {
    localStorage.setItem(`sl-sport-bg-${sport}`, JSON.stringify({ imageUrl, ts: Date.now() }));
  } catch { /* localStorage plein — silencieux */ }
}

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
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires locaux
// ─────────────────────────────────────────────────────────────────────────────

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
// ActionBtn — bouton d'action rapide
// ─────────────────────────────────────────────────────────────────────────────

interface ActionBtnProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  accent?: string;
}

function ActionBtn({ icon, label, onClick, loading, disabled, accent }: ActionBtnProps) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.84 }}
      onClick={disabled || loading ? undefined : onClick}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 select-none"
      style={{
        color: disabled
          ? 'rgba(255,255,255,0.15)'
          : accent || 'rgba(255,255,255,0.55)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span className="text-base leading-none">
        {loading ? (
          <span className="inline-block w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
        ) : icon}
      </span>
      <span className="text-[9px] font-semibold leading-none tracking-wide">
        {label}
      </span>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PosterCard — une carte match
// ─────────────────────────────────────────────────────────────────────────────

const PREVIEW_WIDTH = 200; // px, correspond à la largeur de la carte

interface PosterCardProps {
  match: WeekendMatch;
  bgImage?: string;
  isExporting: boolean;
  onDownload: (m: WeekendMatch) => void;
  onShare:    (m: WeekendMatch) => void;
  onEdit:     (m: WeekendMatch) => void;
}

function PosterCard({ match, bgImage, isExporting, onDownload, onShare, onEdit }: PosterCardProps) {
  const previewHeight = Math.round((PREVIEW_WIDTH / 360) * 640); // ratio story 9:16

  return (
    <div
      className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d14] shadow-xl shadow-black/50"
      style={{ width: PREVIEW_WIDTH }}
    >
      {/* ── Aperçu de l'affiche ── */}
      <div className="relative" style={{ height: previewHeight }}>
        <PosterRenderer
          templateId={match.templateId}
          data={bgImage ? { ...match.posterData, bgImage } : match.posterData}
          format="story"
          previewWidth={PREVIEW_WIDTH}
          bgPresetId={bgImage ? '' : (match.bgPresetId ?? '')}
          bgImageOverlay={0.28}
        />

        {/* Badge catégorie */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[9px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-black/65 text-white/75 backdrop-blur-sm border border-white/10">
            {match.category}
          </span>
        </div>

        {/* Overlay de chargement pendant l'export */}
        <AnimatePresence>
          {isExporting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
      <div className="px-3 pt-2.5 pb-1.5 flex-1">
        <p className="text-[11px] font-bold text-white leading-snug">
          {match.homeTeam.name}
          <span className="text-white/35 font-normal mx-1">vs</span>
          {match.awayTeam.name}
        </p>
        {(match.time || match.venue) && (
          <p className="text-[10px] text-white/40 mt-0.5 truncate">
            {match.time && <span>{fmtTime(match.time)}</span>}
            {match.time && match.venue && <span className="mx-1 text-white/20">·</span>}
            {match.venue && <span>{match.venue}</span>}
          </p>
        )}
        {match.competition && (
          <p className="text-[9px] text-white/25 mt-0.5 truncate">{match.competition}</p>
        )}
      </div>

      {/* ── Actions rapides ── */}
      <div className="flex border-t border-white/8">
        <ActionBtn
          icon="↓"
          label="Télécharger"
          onClick={() => onDownload(match)}
          loading={isExporting}
        />
        <div className="w-px bg-white/8 self-stretch my-1.5" />
        <ActionBtn
          icon="✏"
          label="Modifier"
          onClick={() => onEdit(match)}
        />
        <div className="w-px bg-white/8 self-stretch my-1.5" />
        <ActionBtn
          icon="↗"
          label="Partager"
          onClick={() => onShare(match)}
          loading={isExporting}
        />
        <div className="w-px bg-white/8 self-stretch my-1.5" />
        <ActionBtn
          icon="📅"
          label="Planifier"
          onClick={() => {}}
          disabled
        />
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
}: WeekendPostersProps) {
  // Données live (hook) ou mockées (prop)
  const liveMatches = useWeekendPosters();
  const matches = matchesProp ?? liveMatches;

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

  // Génération séquentielle — une image par sport unique, cache localStorage 7 j
  useEffect(() => {
    if (!matches.length) return;
    let cancelled = false;

    // Hydrate d'abord depuis le cache pour les matchs live (pas injectés en prop)
    setBgImages(prev => {
      const next = { ...prev };
      for (const m of matches) {
        if (next[m.id]) continue;
        const url = getBgCache(normalizeSport(m.sport));
        if (url) next[m.id] = url;
      }
      return next;
    });

    // Ne génère que les sports sans cache
    const run = async () => {
      const done = new Set<string>();
      for (const match of matches) {
        if (cancelled) break;
        const key = normalizeSport(match.sport);
        if (done.has(key)) continue;
        done.add(key);
        if (getBgCache(key)) continue; // déjà en cache
        const prompt = SPORT_BG_PROMPTS[key] ?? SPORT_BG_PROMPTS.default;
        try {
          const { imageUrl } = await generateCustomBackground(prompt);
          if (!cancelled && imageUrl) {
            setBgCache(key, imageUrl);
            // Applique à tous les matchs du même sport
            setBgImages(prev => {
              const next = { ...prev };
              for (const m of matches) {
                if (normalizeSport(m.sport) === key) next[m.id] = imageUrl;
              }
              return next;
            });
          }
        } catch {
          // Silencieux — fond statique bgPreset en fallback
        }
      }
    };

    run();
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
            Mes affiches du week-end
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
                ? { ...exportingMatch.posterData, bgImage: bgImages[exportingMatch.id] }
                : exportingMatch.posterData}
              format="story"
              previewWidth={360}
              bgPresetId={bgImages[exportingMatch.id] ? '' : (exportingMatch.bgPresetId ?? '')}
              bgImageOverlay={0.28}
            />
          </div>
        </div>
      )}

      {/* Notification toast */}
      <Toast toast={toast} />
    </section>
  );
}
