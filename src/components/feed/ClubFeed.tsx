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
import type { FeedItem, FeedFilter, SponsorFeedItem } from './feed.types';
import { MatchCard, CarpoolCard, FlashCard, SponsorCard } from './feed.cards';
import { MOCK_FEED_ITEMS, MOCK_SPONSORS } from './feed.mock';

// ════════════════════════════════════════════════════════════════════════════
// Props
// ════════════════════════════════════════════════════════════════════════════

interface ClubFeedProps {
  clubId: string;
  clubName: string;
  /** Données réelles (Supabase). Prioritaire sur mockItems si fourni. */
  items?: FeedItem[];
  loading?: boolean;
  /** Données mock — utilisées uniquement si items n'est pas fourni. */
  mockItems?: FeedItem[];
  mockSponsors?: SponsorFeedItem[];
  /** Callbacks métier */
  onAttend?: (eventId: string, attending: boolean) => Promise<void>;
  onBookRide?: (rideId: string) => void;
  onShareEvent?: (eventId: string) => void;
}

// ════════════════════════════════════════════════════════════════════════════
// Injection sponsors
// ════════════════════════════════════════════════════════════════════════════

/** Insère une carte sponsor toutes les N cartes de contenu. */
function injectSponsors(
  items: FeedItem[],
  sponsors: SponsorFeedItem[],
  interval = 5,
): FeedItem[] {
  if (!sponsors.length) return items;
  const out: FeedItem[] = [];
  let sIdx = 0;
  items.forEach((item, i) => {
    out.push(item);
    if ((i + 1) % interval === 0) {
      // id unique pour éviter les collisions de clé React
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
    <div className={`rounded-2xl bg-slate-900 border border-white/6 p-4 animate-pulse ${tall ? 'h-64' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-20 bg-slate-800 rounded-full" />
      </div>
      <div className="h-36 bg-slate-800 rounded-xl mb-4" />
      <div className="space-y-2 mb-5">
        <div className="h-3 w-3/4 bg-slate-800 rounded-full" />
        <div className="h-2.5 w-1/2 bg-slate-800 rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 flex-1 bg-slate-800 rounded-xl" />
        <div className="h-10 w-11 bg-slate-800 rounded-xl" />
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
      <p className="text-[13px] font-semibold text-slate-300 mb-1.5">{title}</p>
      <p className="text-[12px] text-slate-500 max-w-[200px] leading-relaxed">{sub}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Fin du feed
// ════════════════════════════════════════════════════════════════════════════

function FeedEndMarker() {
  return (
    <div className="flex items-center gap-3 py-10 px-2">
      <div className="flex-1 h-px bg-white/6" />
      <span className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-700">
        Fin du fil
      </span>
      <div className="flex-1 h-px bg-white/6" />
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
  mockItems = MOCK_FEED_ITEMS,
  mockSponsors = MOCK_SPONSORS,
  onAttend,
  onBookRide,
  onShareEvent,
}: ClubFeedProps) {
  const [filter, setFilter] = useState<FeedFilter>('all');

  // Priorité : données réelles → mock
  const sourceItems = realItems ?? mockItems;
  const loading = externalLoading ?? false;

  // Filtre les items (les sponsors sont exclus du filtre — injectés séparément)
  const filteredWithSponsors = useMemo<FeedItem[]>(() => {
    const base = filter === 'all'
      ? sourceItems.filter(i => i.type !== 'sponsor')
      : sourceItems.filter(i => i.type === filter);
    return injectSponsors(base, mockSponsors);
  }, [sourceItems, mockSponsors, filter]);

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
    <div className="flex flex-col h-full bg-[#080d18]">

      {/* ══════════════════════════════════════════════════════════
          Header sticky — nom du club + onglets filtres
      ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-10 bg-[#080d18]/96 backdrop-blur-sm border-b border-white/6">
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] font-black tracking-[0.18em] uppercase text-slate-600 mb-0.5">
                Fil d'actualité
              </p>
              <h1 className="text-[17px] font-black text-white tracking-tight leading-none">
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
                    : 'bg-white/6 text-slate-400 hover:bg-white/10 border border-white/8',
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
          {!loading && filteredWithSponsors.length === 0 && (
            <EmptyState filter={filter} />
          )}

          {/* ── Cartes du feed ── */}
          {!loading && filteredWithSponsors.map(item => (
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
          {!loading && filteredWithSponsors.length > 0 && <FeedEndMarker />}
        </div>
      </main>
    </div>
  );
}
