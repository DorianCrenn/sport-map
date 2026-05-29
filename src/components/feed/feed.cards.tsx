import { useState } from 'react';
import type {
  MatchFeedItem,
  CarpoolFeedItem,
  FlashFeedItem,
  SponsorFeedItem,
  FeaturedFeedItem,
  FlashBadge,
} from './feed.types';
import { PLAN_CONFIG } from './feed.types';

// ════════════════════════════════════════════════════════════════════════════
// Utilitaires partagés
// ════════════════════════════════════════════════════════════════════════════

/** Temps relatif en français, ex : "il y a 3h" */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

/** Date courte : "dim. 1 juin" */
function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

/** Date + heure d'un ISO : "dim. 1 juin · 15h00" */
function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Sous-composants partagés
// ════════════════════════════════════════════════════════════════════════════

/** Jauge visuelle des places de covoiturage */
function SeatGauge({ total, available }: { total: number; available: number }) {
  const taken = total - available;
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1.5 flex-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors duration-200 ${
              i < taken ? 'bg-emerald-500' : 'bg-[var(--sl-border)]'
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-bold tabular-nums shrink-0 ${available === 0 ? 'text-[var(--sl-t3)]' : 'text-emerald-400'}`}>
        {available}/{total}
      </span>
    </div>
  );
}

const SPORT_EMOJIS: Record<string, string> = {
  Football: '⚽', Rugby: '🏉', Basketball: '🏀',
  Handball: '🤾', Volleyball: '🏐', Tennis: '🎾', Trail: '🏃',
};

/** Icône sport avec emoji */
function SportChip({ sport }: { sport: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-indigo-400">
      <span>{SPORT_EMOJIS[sport] ?? '🏆'}</span>{sport}
    </span>
  );
}

// ── Inline SVG Icons ──────────────────────────────────────────────────────────

const CalIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 opacity-60">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const LocIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 opacity-60">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

// ════════════════════════════════════════════════════════════════════════════
// MatchCard — Carte Jour de Match
// ════════════════════════════════════════════════════════════════════════════

interface MatchCardProps {
  item: MatchFeedItem;
  onAttend: (eventId: string, attending: boolean) => Promise<void>;
  onShare: (eventId: string) => void;
}

export function MatchCard({ item, onAttend, onShare }: MatchCardProps) {
  // Optimistic local state — mis à jour immédiatement, revert en cas d'erreur
  const [attending, setAttending] = useState(item.user_is_attending);
  const [count, setCount] = useState(item.attendee_count);
  const [busy, setBusy] = useState(false);

  async function handleAttend() {
    if (busy) return;
    const next = !attending;
    setAttending(next);
    setCount(c => c + (next ? 1 : -1));
    setBusy(true);
    try {
      await onAttend(item.event_id, next);
    } catch {
      // Revert en cas d'échec réseau
      setAttending(!next);
      setCount(c => c + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-2xl overflow-hidden border border-[var(--sl-border)] bg-[var(--sl-card)] shadow-md">

      {/* ── En-tête : logo club + badge tournoi ── */}
      {(item.club_name || item.event_type === 'tournament') && (
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            {item.club_logo_url ? (
              <img src={item.club_logo_url} alt={item.club_name} className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-[var(--sl-border)]" />
            ) : item.club_name ? (
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-indigo-400">{item.club_name[0]}</span>
              </div>
            ) : null}
            {item.club_name && (
              <span className="text-[10px] font-bold text-[var(--sl-t3)] truncate max-w-[120px]">{item.club_name}</span>
            )}
          </div>
          {item.event_type === 'tournament' && (
            <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0">
              🏆 Tournoi
            </span>
          )}
        </div>
      )}

      {/* ── Hero : affiche IA ou gradient générique ── */}
      <div className="relative">
        {item.poster_url ? (
          <img
            src={item.poster_url}
            alt={`${item.home_team} vs ${item.away_team}`}
            className="w-full aspect-video object-cover"
            loading="lazy"
          />
        ) : (
          // Gradient générique quand aucune affiche n'est disponible
          <div className="w-full aspect-video bg-gradient-to-br from-[var(--sl-surface)] via-[var(--sl-bg)] to-[var(--sl-bg)] flex flex-col items-center justify-center gap-3 px-6">
            <SportChip sport={item.sport} />
            <div className="text-center w-full">
              <p className="text-[22px] font-black text-[var(--sl-t1)] tracking-tight leading-tight truncate">{item.home_team}</p>
              <div className="flex items-center gap-3 justify-center my-2">
                <div className="flex-1 h-px bg-[var(--sl-border)]" />
                <span className="text-xs font-black text-indigo-500 tracking-[0.3em]">VS</span>
                <div className="flex-1 h-px bg-[var(--sl-border)]" />
              </div>
              <p className="text-[22px] font-black text-[var(--sl-t2)] tracking-tight leading-tight truncate">{item.away_team}</p>
            </div>
          </div>
        )}

        {/* Badge "Jour de Match" en overlay */}
        <div className="absolute top-3 left-3">
          <span className="text-[9px] font-black tracking-[0.15em] uppercase px-2.5 py-1 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-900/40">
            Jour de Match
          </span>
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="px-4 pt-3 pb-4">
        {/* Nom du match (uniquement si une affiche est affichée, sinon déjà visible) */}
        {item.poster_url && (
          <p className="text-sm font-bold text-[var(--sl-t1)] mb-1">
            {item.home_team} <span className="text-indigo-400 font-normal">vs</span> {item.away_team}
          </p>
        )}

        {/* Métadonnées */}
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--sl-t2)] mt-1 flex-wrap">
          <CalIcon />
          <span>{fmtDate(item.date)} · {item.time}</span>
          <span className="text-[var(--sl-t3)]">·</span>
          <LocIcon />
          <span className="truncate max-w-[180px]">{item.venue}, {item.city}</span>
        </div>

        {/* ── Boutons d'action ── */}
        <div className="flex gap-2 mt-3.5">

          {/* J'y serai — optimistic */}
          <button
            onClick={handleAttend}
            disabled={busy}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold',
              'transition-all duration-150 active:scale-[0.97]',
              attending
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-600/12 text-indigo-400 border border-indigo-600/25 hover:bg-indigo-600/20',
              busy ? 'opacity-60 cursor-wait' : '',
            ].join(' ')}
          >
            <span className="text-[15px]">{attending ? '✓' : '+'}</span>
            <span>{attending ? 'Je serai là' : "J'y serai"}</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold tabular-nums ${
              attending ? 'bg-white/20 text-white' : 'bg-indigo-600/20 text-indigo-400'
            }`}>
              {count}
            </span>
          </button>

          {/* Partager */}
          <button
            onClick={() => onShare(item.event_id)}
            aria-label="Partager"
            className="px-3.5 py-2.5 rounded-xl bg-[var(--sl-hover)] text-[var(--sl-t3)] border border-[var(--sl-border)] transition-all active:scale-[0.97] hover:bg-[var(--sl-surface)]"
          >
            <ShareIcon />
          </button>
        </div>
      </div>
    </article>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CarpoolCard — Carte Covoiturage Logistique
// ════════════════════════════════════════════════════════════════════════════

interface CarpoolCardProps {
  item: CarpoolFeedItem;
  onBook: (rideId: string) => void;
}

export function CarpoolCard({ item, onBook }: CarpoolCardProps) {
  const full = item.available_seats === 0;

  return (
    <article className="rounded-2xl border border-[var(--sl-border)] bg-[var(--sl-card)] shadow-md overflow-hidden">

      {/* Trait d'accent couleur */}
      <div className={`h-[3px] ${full ? 'bg-[var(--sl-border)]' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`} />

      <div className="px-4 pt-3 pb-4">

        {/* ── En-tête : label + conducteur + badge complet ── */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase text-emerald-400 mb-0.5">
              🚗 Covoiturage
            </p>
            <div className="flex items-center gap-2">
              {item.driver_avatar ? (
                <img src={item.driver_avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-emerald-400">{item.driver_name[0]}</span>
                </div>
              )}
              <p className="text-[13px] font-bold text-[var(--sl-t1)]">{item.driver_name}</p>
            </div>
          </div>
          {full && (
            <span className="text-[9px] font-black tracking-wider uppercase px-2 py-1 rounded-lg bg-[var(--sl-surface)] text-[var(--sl-t3)] border border-[var(--sl-border)]">
              Complet
            </span>
          )}
        </div>

        {/* ── Trajet avec ligne visuelle ── */}
        <div className="flex gap-3 items-stretch mb-3">
          {/* Indicateur de trajet */}
          <div className="flex flex-col items-center pt-1 gap-0">
            <div className="w-2 h-2 rounded-full bg-[var(--sl-t3)] shrink-0" />
            <div className="w-px flex-1 bg-[var(--sl-border)] my-1" />
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          </div>
          {/* Villes */}
          <div className="flex flex-col justify-between gap-1.5 min-w-0">
            <p className="text-[12px] text-[var(--sl-t2)] truncate">{item.departure_location}</p>
            <p className="text-[13px] font-bold text-emerald-400 truncate">{item.destination}</p>
          </div>
        </div>

        {/* ── Date de départ ── */}
        <p className="flex items-center gap-1.5 text-[11px] text-[var(--sl-t3)] mb-3.5">
          <CalIcon />
          {fmtDateTime(item.departure_time)}
        </p>

        {/* ── Jauge places ── */}
        <div className="mb-4">
          <p className="text-[11px] text-[var(--sl-t3)] mb-1.5">
            Places disponibles
          </p>
          <SeatGauge total={item.total_seats} available={item.available_seats} />
        </div>

        {/* ── CTA ── */}
        <button
          onClick={() => !full && onBook(item.ride_id)}
          disabled={full}
          className={[
            'w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-[0.98]',
            full
              ? 'bg-[var(--sl-surface)] text-[var(--sl-t3)] cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-900/40',
          ].join(' ')}
        >
          {full ? 'Plus de places disponibles' : 'Réserver ma place →'}
        </button>
      </div>
    </article>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FlashCard — Carte Flash Info / Résultat
// ════════════════════════════════════════════════════════════════════════════

const BADGE_CFG: Record<FlashBadge, {
  icon: string; label: string;
  text: string; bg: string; border: string;
}> = {
  success: { icon: '🏆', label: 'Victoire',  text: 'text-emerald-400', bg: 'bg-emerald-500/8',  border: 'border-emerald-500/25' },
  alert:   { icon: '⚠️', label: 'Alerte',    text: 'text-orange-400',  bg: 'bg-orange-500/8',   border: 'border-orange-500/25'  },
  info:    { icon: 'ℹ️', label: 'Info',      text: 'text-sky-400',     bg: 'bg-sky-500/8',      border: 'border-sky-500/25'     },
};

interface FlashCardProps { item: FlashFeedItem }

export function FlashCard({ item }: FlashCardProps) {
  const cfg = BADGE_CFG[item.badge];
  const [expanded, setExpanded] = useState(false);
  const isLong = item.message.length > 160;

  return (
    <article className={`rounded-2xl border ${cfg.border} ${cfg.bg} px-4 py-3.5 shadow-sm`}>
      <div className="flex gap-3 items-start">

        {/* Icône badge */}
        <span className="text-xl shrink-0 mt-0.5 select-none">{cfg.icon}</span>

        <div className="min-w-0 flex-1">
          {/* Label badge + horodatage */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-black tracking-widest uppercase ${cfg.text}`}>
              {cfg.label}
            </span>
            <span className="text-[10px] text-[var(--sl-t3)]">{timeAgo(item.created_at)}</span>
          </div>

          {/* Titre optionnel */}
          {item.title && (
            <p className="text-[13px] font-bold text-[var(--sl-t1)] mb-1">{item.title}</p>
          )}

          {/* Message */}
          <p
            className="text-[13px] text-[var(--sl-t1)] leading-relaxed"
            style={expanded ? undefined : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {item.message}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-[11px] font-semibold mt-1"
              style={{ color: 'var(--sl-t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {expanded ? 'Voir moins' : 'Voir plus'}
            </button>
          )}

          {/* Auteur */}
          {item.author_name && (
            <p className="text-[11px] text-[var(--sl-t3)] mt-2">— {item.author_name}</p>
          )}
        </div>
      </div>
    </article>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FeaturedGalleryCard — Carte compacte pour la galerie horizontale
// ════════════════════════════════════════════════════════════════════════════

interface FeaturedCardProps {
  item: FeaturedFeedItem;
  onNavigate?: (eventId: string) => void;
}

export function FeaturedGalleryCard({ item, onNavigate }: FeaturedCardProps) {
  const cfg = PLAN_CONFIG[item.plan];

  return (
    <button
      onClick={() => onNavigate?.(item.event_id)}
      style={{
        width: 158, flexShrink: 0, borderRadius: 14, padding: 0,
        border: `1.5px solid ${cfg.border}`,
        boxShadow: `0 0 14px ${cfg.glow}`,
        background: `linear-gradient(155deg, ${cfg.bg} 0%, var(--sl-bg) 100%)`,
        cursor: 'pointer', textAlign: 'left', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Barre couleur plan */}
      <div style={{ height: 3, flexShrink: 0, background: `linear-gradient(to right, ${cfg.accent}, ${cfg.accent}40)` }} />

      <div style={{ flex: 1, padding: '9px 11px 10px', display: 'flex', flexDirection: 'column' }}>

        {/* Nom du club + badge plan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: cfg.accent, letterSpacing: '0.05em', textTransform: 'uppercase', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.club_name}
          </span>
          <span style={{ fontSize: 7, fontWeight: 800, padding: '2px 5px', borderRadius: 5, background: `${cfg.accent}18`, color: cfg.accent, border: `1px solid ${cfg.accent}30`, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {cfg.label}
          </span>
        </div>

        {/* Sport */}
        <span style={{ fontSize: 9, fontWeight: 800, color: '#6366f1', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          {SPORT_EMOJIS[item.sport] ?? '🏆'} {item.sport}
        </span>

        {/* Équipes ou titre */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {item.home_team && item.away_team ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px' }}>
                {item.home_team}
              </p>
              <p style={{ fontSize: 8, fontWeight: 700, color: cfg.accent, letterSpacing: '0.25em', margin: '2px 0' }}>VS</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t3)', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                {item.away_team}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', lineHeight: 1.35, margin: 0, overflow: 'hidden' }}>
              {item.title}
            </p>
          )}
        </div>

        {/* Date */}
        <p style={{ fontSize: 9, color: 'var(--sl-t3)', marginTop: 7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>
          {fmtDate(item.date)} · {item.time}
        </p>
      </div>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SponsorCard — Carte Sponsor Local (insertion native)
// ════════════════════════════════════════════════════════════════════════════

interface SponsorCardProps { item: SponsorFeedItem }

export function SponsorCard({ item }: SponsorCardProps) {
  return (
    <article
      className="rounded-2xl overflow-hidden border border-[var(--sl-border)] shadow-sm"
      style={{ background: item.bg_color ?? 'var(--sl-card)' }}
    >
      {/* Label discret "Partenaire" */}
      <div className="px-4 pt-3 pb-1.5">
        <span className="text-[9px] font-black tracking-[0.2em] uppercase text-white/25">
          Partenaire du club
        </span>
      </div>

      <div className="px-4 pb-4 flex items-start gap-3">
        {/* Logo sponsor (fallback emoji) */}
        {item.logo_url ? (
          <img
            src={item.logo_url}
            alt={item.sponsor_name}
            className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1.5 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-xl">🏪</span>
          </div>
        )}

        {/* Texte */}
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-black text-white tracking-tight leading-tight">{item.sponsor_name}</p>
          <p className="text-[11px] text-white/50 mt-1 leading-relaxed line-clamp-2">{item.tagline}</p>
          {item.cta_url && item.cta_label && (
            <a
              href={item.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white/15 text-white/90 hover:bg-white/22 transition-colors duration-150"
            >
              {item.cta_label} →
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
