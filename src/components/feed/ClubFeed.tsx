/**
 * ClubFeed — Fil d'actualité utilitaire d'un club sportif.
 *
 * Agrège 4 types de contenus :
 *   - Jour de Match (PosterStudio + events)
 *   - Covoiturage Logistique (module rides)
 *   - Flash Info / Résultat (club_announcements)
 *   - Sponsor Local (insertion native toutes les N cartes)
 *
 * Usage :
 *   <ClubFeed clubId="xxx" clubName="AG Plouvorn" />
 *
 * Passer mockItems / mockSponsors pour la démo (données fictives par défaut).
 * En production : brancher useFeedItems() sur Supabase (voir TODO).
 */

import { useState, useMemo, useCallback } from 'react';
import type { FeedItem, FeedFilter, SponsorFeedItem, FeaturedFeedItem } from './feed.types';
import { MatchCard, CarpoolCard, FlashCard, SponsorCard, FeaturedGalleryCard } from './feed.cards';
import { MOCK_FEED_ITEMS, MOCK_SPONSORS, MOCK_FEATURED } from './feed.mock';
import NextTrainingCard from '../NextTrainingCard.jsx';

// ════════════════════════════════════════════════════════════════════════════
// Props
// ════════════════════════════════════════════════════════════════════════════

interface ClubFeedProps {
  clubId: string;
  clubName: string;
  /** Données réelles (Supabase). Prioritaire sur mockItems si fourni. */
  items?: FeedItem[];
  loading?: boolean;
  /** Événements "À la Une" promus — affichés en galerie horizontale. */
  featuredItems?: FeaturedFeedItem[];
  /** Sponsors réels (Supabase). Prioritaire sur mockSponsors si fourni. */
  sponsorItems?: SponsorFeedItem[];
  /** Données mock — utilisées uniquement si items n'est pas fourni. */
  mockItems?: FeedItem[];
  mockSponsors?: SponsorFeedItem[];
  mockFeatured?: FeaturedFeedItem[];
  /** Appelé quand l'utilisateur clique "Voir l'événement" sur une FeaturedCard */
  onNavigateEvent?: (eventId: string) => void;
  /** Callbacks métier */
  onAttend?: (eventId: string, attending: boolean) => Promise<void>;
  onBookRide?: (rideId: string) => void;
  onShareEvent?: (eventId: string) => void;
  /** Widget prochain entraînement */
  currentUser?: unknown;
  onNavigateClubs?: () => void;
}

// ════════════════════════════════════════════════════════════════════════════
// Injection sponsors
// ════════════════════════════════════════════════════════════════════════════

/** Insère une carte sponsor toutes les N cartes de contenu, à partir d'un décalage aléatoire. */
function injectSponsors(
  items: FeedItem[],
  sponsors: SponsorFeedItem[],
  interval = 5,
  startOffset = 0,
): FeedItem[] {
  if (!sponsors.length) return items;
  const out: FeedItem[] = [];
  let sIdx = startOffset;
  items.forEach((item, i) => {
    out.push(item);
    if ((i + 1) % interval === 0) {
      out.push({ ...sponsors[sIdx % sponsors.length], id: `__spo_${i}` });
      sIdx++;
    }
  });
  return out;
}

// ════════════════════════════════════════════════════════════════════════════
// Configuration des filtres
// ════════════════════════════════════════════════════════════════════════════

const FILTERS: { key: FeedFilter; label: string; emoji: string }[] = [
  { key: 'all',     label: 'Tout',    emoji: '🗂️' },
  { key: 'match',   label: 'Matchs',  emoji: '⚽' },
  { key: 'carpool', label: 'Covoit',  emoji: '🚗' },
  { key: 'flash',   label: 'Infos',   emoji: '📢' },
];

// ════════════════════════════════════════════════════════════════════════════
// Skeleton de chargement
// ════════════════════════════════════════════════════════════════════════════

function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`rounded-2xl bg-[var(--sl-card)] border border-[var(--sl-border)] p-4 animate-pulse ${tall ? 'h-64' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-20 bg-[var(--sl-surface)] rounded-full" />
      </div>
      <div className="h-36 bg-[var(--sl-surface)] rounded-xl mb-4" />
      <div className="space-y-2 mb-5">
        <div className="h-3 w-3/4 bg-[var(--sl-surface)] rounded-full" />
        <div className="h-2.5 w-1/2 bg-[var(--sl-surface)] rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 flex-1 bg-[var(--sl-surface)] rounded-xl" />
        <div className="h-10 w-11 bg-[var(--sl-surface)] rounded-xl" />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// État vide
// ════════════════════════════════════════════════════════════════════════════

const EMPTY_MSGS: Record<FeedFilter, { emoji: string; title: string; sub: string }> = {
  all:     { emoji: '📭', title: "Aucune actualité pour l'instant",  sub: 'Les matchs, covoiturages et infos du club apparaîtront ici.' },
  match:   { emoji: '⚽', title: 'Aucun match programmé',            sub: 'Les prochaines rencontres seront affichées dès leur ajout.' },
  carpool: { emoji: '🚗', title: 'Pas de covoiturage proposé',       sub: 'Aucun équipier ne propose de trajet pour l\'instant.' },
  flash:   { emoji: '📢', title: 'Aucune info du club',              sub: 'Les annonces et résultats du staff apparaîtront ici.' },
};

function EmptyState({ filter }: { filter: FeedFilter }) {
  const { emoji, title, sub } = EMPTY_MSGS[filter];
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
      <span className="text-5xl mb-4 select-none">{emoji}</span>
      <p className="text-[13px] font-semibold text-[var(--sl-t1)] mb-1.5">{title}</p>
      <p className="text-[12px] text-[var(--sl-t3)] max-w-[200px] leading-relaxed">{sub}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Fin du feed
// ════════════════════════════════════════════════════════════════════════════

function FeedEndMarker() {
  return (
    <div className="flex items-center gap-3 py-10 px-2">
      <div className="flex-1 h-px bg-[var(--sl-border)]" />
      <span className="text-[9px] font-black tracking-[0.2em] uppercase text-[var(--sl-t3)]">
        Fin du fil
      </span>
      <div className="flex-1 h-px bg-[var(--sl-border)]" />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Composant principal ClubFeed
// ════════════════════════════════════════════════════════════════════════════

export default function ClubFeed({
  clubId: _clubId,
  clubName,
  items: realItems,
  loading: externalLoading,
  featuredItems: realFeatured,
  sponsorItems,
  mockItems    = MOCK_FEED_ITEMS,
  mockSponsors = MOCK_SPONSORS,
  mockFeatured = MOCK_FEATURED,
  onNavigateEvent,
  onAttend,
  onBookRide,
  onShareEvent,
  currentUser,
  onNavigateClubs,
}: ClubFeedProps) {
  const [filter, setFilter] = useState<FeedFilter>('all');
  // Graine aléatoire fixée au montage — varie l'ordre des sponsors + featured à chaque visite
  const [rotationSeed] = useState(() => Math.floor(Math.random() * 997));

  // Priorité : données réelles → mock
  const sourceItems    = realItems    ?? mockItems;
  const sourceFeatured = realFeatured ?? mockFeatured;
  const loading        = externalLoading ?? false;

  // Galerie featured : rotation de l'ordre selon la graine
  const rotatedFeatured = useMemo(() => {
    if (sourceFeatured.length <= 1) return sourceFeatured;
    const offset = rotationSeed % sourceFeatured.length;
    return [...sourceFeatured.slice(offset), ...sourceFeatured.slice(0, offset)];
  }, [sourceFeatured, rotationSeed]);

  // Filtre + injection sponsors (décalage de départ variable)
  const feedItems = useMemo<FeedItem[]>(() => {
    const base = filter === 'all'
      ? sourceItems.filter(i => i.type !== 'sponsor' && i.type !== 'featured')
      : sourceItems.filter(i => i.type === filter);

    const sponsors = sponsorItems ?? mockSponsors;
    const interval = realItems ? 5 : 3;
    const startOffset = sponsors.length ? rotationSeed % sponsors.length : 0;
    return injectSponsors(base, sponsors, interval, startOffset);
  }, [sourceItems, sponsorItems, mockSponsors, filter, realItems, rotationSeed]);

  // Callbacks stables
  const handleAttend = useCallback(async (eventId: string, attending: boolean) => {
    await onAttend?.(eventId, attending);
  }, [onAttend]);

  const handleBook = useCallback((rideId: string) => {
    onBookRide?.(rideId);
  }, [onBookRide]);

  const handleShare = useCallback((eventId: string) => {
    onShareEvent?.(eventId);
  }, [onShareEvent]);

  return (
    <div className="flex flex-col h-full bg-[var(--sl-bg)]">

      {/* ══════════════════════════════════════════════════════════
          Header sticky — nom du club + onglets filtres
      ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-10 bg-[var(--sl-bg)]/96 backdrop-blur-sm border-b border-[var(--sl-border)]">
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] font-black tracking-[0.18em] uppercase text-[var(--sl-t3)] mb-0.5">
                Fil d'actualité
              </p>
              <h1 className="text-[17px] font-black text-[var(--sl-t1)] tracking-tight leading-none">
                {clubName}
              </h1>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-indigo-600/15 border border-indigo-600/25 flex items-center justify-center">
              <span className="text-base select-none">🏟️</span>
            </div>
          </div>
        </div>

        {/* ── Onglets filtres — scroll horizontal sur mobile ── */}
        <div
          className="flex gap-1.5 px-4 pb-3 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={[
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold',
                  'whitespace-nowrap transition-all duration-150 shrink-0',
                  active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50'
                    : 'bg-[var(--sl-pill-bg)] text-[var(--sl-pill-text)] hover:bg-[var(--sl-hover)] border border-[var(--sl-border)]',
                ].join(' ')}
              >
                <span className="text-[13px]">{f.emoji}</span>
                {f.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          Feed — liste scrollable des cartes
      ══════════════════════════════════════════════════════════ */}
      <main
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >

        {/* ── Widget prochain entraînement ── */}
        {!loading && currentUser && (
          <div className="px-4 pt-3">
            <NextTrainingCard currentUser={currentUser} onNavigateClubs={onNavigateClubs} />
          </div>
        )}

        {/* ── Galerie horizontale "À la Une" ── */}
        {!loading && rotatedFeatured.length > 0 && (
          <div className="border-b border-[var(--sl-border)]">
            <p className="px-4 pt-3 pb-1.5 text-[9px] font-black tracking-[0.18em] uppercase text-[var(--sl-t3)]">
              ⭐ À la Une
            </p>
            <div
              className="flex gap-2.5 px-4 pb-3 overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
              {rotatedFeatured.map(item => (
                <FeaturedGalleryCard key={item.id} item={item} onNavigate={onNavigateEvent} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 p-4 pb-28" role="list" aria-label="Fil d'actualité du club">

          {/* ── État chargement : squelettes ── */}
          {loading && (
            <>
              <SkeletonCard tall />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {/* ── État vide ── */}
          {!loading && feedItems.length === 0 && (
            <EmptyState filter={filter} />
          )}

          {/* ── Cartes du feed ── */}
          {!loading && feedItems.map(item => (
            <div key={item.id} role="listitem">
              {item.type === 'match' && (
                <MatchCard item={item} onAttend={handleAttend} onShare={handleShare} />
              )}
              {item.type === 'carpool' && (
                <CarpoolCard item={item} onBook={handleBook} />
              )}
              {item.type === 'flash' && (
                <FlashCard item={item} />
              )}
              {item.type === 'sponsor' && (
                <SponsorCard item={item} />
              )}
            </div>
          ))}

          {/* ── Marqueur de fin de feed ── */}
          {!loading && feedItems.length > 0 && <FeedEndMarker />}
        </div>
      </main>
    </div>
  );
}
