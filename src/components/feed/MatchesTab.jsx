import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useFavoritesContext } from '../../contexts/FavoritesContext.jsx';
import { useManagedClubs } from '../../hooks/useManagedClubs.js';
import { useMatchesForDate } from '../../hooks/useMatchesForDate.js';
import { useEliteSponsors } from '../../hooks/useEliteSponsors.js';
import ScoreEntryContainer from '../score/ScoreEntryContainer.jsx';
import { SPORTS } from '../../data/events.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateLabel(date) {
  const today     = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString())     return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  if (date.toDateString() === tomorrow.toDateString())  return 'Demain';

  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(date);
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function getStatus(event) {
  if (event.score != null) return 'finished';
  const diffMin = (new Date() - new Date(event.date)) / 60000;
  if (diffMin >= -15 && diffMin <= 110) return 'live';
  if (new Date(event.date) > new Date()) return 'upcoming';
  return 'finished';
}

function getLiveMinute(dateStr) {
  return Math.max(1, Math.min(90, Math.floor((new Date() - new Date(dateStr)) / 60000)));
}

function parseTeams(title = '') {
  const m = title.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
  if (m) return { home: m[1].trim(), away: m[2].trim() };
  const parts = title.split(' - ');
  if (parts.length === 2) return { home: parts[0].trim(), away: parts[1].trim() };
  return { home: title, away: null };
}

function parseScore(score) {
  if (score == null) return null;
  if (typeof score === 'object') return { home: score.home ?? 0, away: score.away ?? 0 };
  const m = String(score).match(/(\d+)\D+(\d+)/);
  if (m) return { home: parseInt(m[1]), away: parseInt(m[2]) };
  return null;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronDown({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return filled ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

// ─── MatchRow ─────────────────────────────────────────────────────────────────

function MatchRowInner({ event, children }) {
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const { home, away } = parseTeams(event.title);
  const score      = parseScore(event.score);
  const status     = getStatus(event);
  const isLive     = status === 'live';
  const isFinished = status === 'finished';
  const fav        = isFavorite(event.id);

  return (
    <div className="border-b border-[var(--sl-border)] last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--sl-hover)] active:bg-[var(--sl-hover)] transition-colors cursor-pointer">

        {/* Time / status */}
        <div className="w-10 shrink-0 flex flex-col items-center justify-center gap-0.5">
          {isLive ? (
            <>
              <span className="text-[10px] text-[var(--sl-t3)] leading-none">{formatTime(event.date)}</span>
              <span className="text-[11px] font-black text-red-500 leading-none">{getLiveMinute(event.date)}'</span>
            </>
          ) : (
            <>
              <span className="text-[11.5px] font-semibold text-[var(--sl-t2)] leading-none">{formatTime(event.date)}</span>
              {isFinished && (
                <span className="text-[9px] font-bold text-[var(--sl-t3)] leading-none uppercase tracking-wide mt-0.5">FT</span>
              )}
            </>
          )}
        </div>

        {/* Separator */}
        <div className="w-px h-8 shrink-0 bg-[var(--sl-border)]" />

        {/* Teams + scores */}
        <div className="flex-1 min-w-0">
          {away ? (
            <>
              <div className="flex items-center justify-between gap-2 mb-[3px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[13px] font-semibold text-[var(--sl-t1)] truncate leading-tight">{home}</span>
                  {event.team_name && (
                    <span className="text-[9px] font-bold text-[var(--sl-t3)] bg-[var(--sl-surface)] px-1.5 py-0.5 rounded-full border border-[var(--sl-border)] shrink-0 whitespace-nowrap">
                      {event.team_name}
                    </span>
                  )}
                </div>
                {score != null ? (
                  <span className={`text-[13px] font-bold shrink-0 leading-tight tabular-nums ${isLive ? 'text-red-500' : 'text-[var(--sl-t1)]'}`}>
                    {score.home}
                  </span>
                ) : (
                  <span className="text-[13px] text-[var(--sl-t3)] shrink-0 leading-tight">-</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-[var(--sl-t2)] truncate leading-tight">{away}</span>
                {score != null ? (
                  <span className={`text-[13px] font-bold shrink-0 leading-tight tabular-nums ${isLive ? 'text-red-500' : 'text-[var(--sl-t1)]'}`}>
                    {score.away}
                  </span>
                ) : (
                  <span className="text-[13px] text-[var(--sl-t3)] shrink-0 leading-tight">-</span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[13px] font-semibold text-[var(--sl-t1)] truncate leading-tight">{home}</span>
                {event.team_name && (
                  <span className="text-[9px] font-bold text-[var(--sl-t3)] bg-[var(--sl-surface)] px-1.5 py-0.5 rounded-full border border-[var(--sl-border)] shrink-0 whitespace-nowrap">
                    {event.team_name}
                  </span>
                )}
              </div>
              {isFinished && score != null && (
                <span className="text-[12px] font-bold text-[var(--sl-t1)] shrink-0 tabular-nums">{score.home}</span>
              )}
            </div>
          )}
        </div>

        {/* Heart + optional extra action */}
        <div className="flex items-center gap-0.5 shrink-0">
          {children}
          <button
            className={`w-8 h-8 flex items-center justify-center transition-all rounded-full hover:bg-[var(--sl-hover)] ${fav ? 'text-red-500' : 'text-[var(--sl-t3)] hover:text-red-400'}`}
            aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            onClick={(e) => { e.stopPropagation(); toggleFavorite(event.id); }}
          >
            <HeartIcon filled={fav} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MatchRow({ event }) {
  return <MatchRowInner event={event} />;
}

// ─── AdminMatchRow — match row with ScoreEntryContainer ──────────────────────

function AdminMatchRowFull({ event, onScoreUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const status     = getStatus(event);
  const isLive     = status === 'live';
  const hasScore   = parseScore(event.score) != null;

  const { home: homeTeam, away: awayTeam } = parseTeams(event.title);
  const sc = parseScore(event.score);

  return (
    <div className="border-b border-[var(--sl-border)] last:border-b-0 bg-[var(--sl-surface)]">
      {/* Row header — tap to expand/collapse */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--sl-hover)] transition-colors cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Time */}
        <div className="w-10 shrink-0 flex flex-col items-center justify-center gap-0.5">
          {isLive ? (
            <>
              <span className="text-[10px] text-[var(--sl-t3)] leading-none">{formatTime(event.date)}</span>
              <span className="text-[11px] font-black text-red-500 leading-none animate-pulse">{getLiveMinute(event.date)}'</span>
            </>
          ) : (
            <>
              <span className="text-[11.5px] font-semibold text-[var(--sl-t2)] leading-none">{formatTime(event.date)}</span>
              {hasScore && <span className="text-[9px] font-bold text-[var(--sl-t3)] leading-none uppercase tracking-wide mt-0.5">FT</span>}
            </>
          )}
        </div>

        <div className="w-px h-8 shrink-0 bg-[var(--sl-border)]" />

        {/* Teams + score */}
        <div className="flex-1 min-w-0">
          {awayTeam ? (
            <>
              <div className="flex items-center justify-between gap-2 mb-[3px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[13px] font-semibold text-[var(--sl-t1)] truncate leading-tight">{homeTeam}</span>
                  {event.team_name && (
                    <span className="text-[9px] font-bold text-[var(--sl-t3)] bg-[var(--sl-card)] px-1.5 py-0.5 rounded-full border border-[var(--sl-border)] shrink-0 whitespace-nowrap">
                      {event.team_name}
                    </span>
                  )}
                </div>
                <span className={`text-[13px] font-bold shrink-0 tabular-nums ${isLive ? 'text-red-500' : 'text-[var(--sl-t1)]'}`}>{sc != null ? sc.home : '-'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-[var(--sl-t2)] truncate leading-tight">{awayTeam}</span>
                <span className={`text-[13px] font-bold shrink-0 tabular-nums ${isLive ? 'text-red-500' : 'text-[var(--sl-t1)]'}`}>{sc != null ? sc.away : '-'}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[13px] font-semibold text-[var(--sl-t1)] truncate">{homeTeam}</span>
              {event.team_name && (
                <span className="text-[9px] font-bold text-[var(--sl-t3)] bg-[var(--sl-card)] px-1.5 py-0.5 rounded-full border border-[var(--sl-border)] shrink-0 whitespace-nowrap">
                  {event.team_name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Edit chip */}
        <div className={`flex items-center gap-1 text-[11px] font-semibold shrink-0 px-2 py-1 rounded-full transition-colors ${expanded ? 'bg-indigo-500/20 text-indigo-400' : 'bg-[var(--sl-pill-bg)] text-[var(--sl-t3)]'}`}>
          <EditIcon />
          <span>{hasScore ? 'Modifier' : 'Saisir'}</span>
        </div>
      </div>

      {/* ScoreEntryContainer — sport-aware form */}
      {expanded && (
        <div className="px-4 pb-1" onClick={e => e.stopPropagation()}>
          <ScoreEntryContainer event={event} onUpdateEvent={onScoreUpdated} />
        </div>
      )}
    </div>
  );
}

// ─── SportGroup ───────────────────────────────────────────────────────────────

function SportGroup({ sport, matches, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const def   = SPORTS[sport];
  const color = def?.color ?? '#4f46e5';

  return (
    <div className="border-b border-[var(--sl-border)]">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--sl-hover)] transition-colors text-left"
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}22`, border: `1px solid ${color}40` }}
        >
          <span className="text-[17px] select-none leading-none">{def?.emoji ?? '🏅'}</span>
        </div>
        <span className="flex-1 text-[13px] font-bold text-[var(--sl-t1)]">{sport}</span>
        <span className="text-[12px] font-semibold text-[var(--sl-t3)] mr-1">{matches.length}</span>
        <ChevronDown className={`text-[var(--sl-t3)] transition-transform shrink-0 ${expanded ? '' : '-rotate-90'}`} />
      </button>

      {expanded && (
        <div className="bg-[var(--sl-surface)]">
          {matches.map(m => <MatchRow key={m.id} event={m} />)}
        </div>
      )}
    </div>
  );
}

// ─── SportGridCard ────────────────────────────────────────────────────────────

function SportGridCard({ sport, count, isSelected, onClick }) {
  const def   = SPORTS[sport];
  const color = def?.color ?? '#4f46e5';

  return (
    <button
      onClick={onClick}
      className={[
        'aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl border p-2 transition-all active:scale-95 relative',
        isSelected
          ? 'border-indigo-500 bg-indigo-500/15'
          : 'border-[var(--sl-border)] bg-[var(--sl-card)] hover:border-[var(--sl-border-s)]',
      ].join(' ')}
    >
      {count > 0 && (
        <span className="absolute top-1.5 right-1.5 text-[9px] font-black text-[var(--sl-t3)]">{count}</span>
      )}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}22` }}
      >
        <span className="text-2xl select-none leading-none">{def?.emoji ?? '🏅'}</span>
      </div>
      <span className="text-[10px] font-bold text-[var(--sl-t2)] text-center leading-tight w-full truncate px-1">
        {sport}
      </span>
    </button>
  );
}

// ─── Elite sponsor banner ─────────────────────────────────────────────────────

function EliteSponsorBanner({ sponsor }) {
  const bg = sponsor.bg_color || 'var(--sl-card)';

  function handleCta(e) {
    e.stopPropagation();
    if (sponsor.cta_url) window.open(sponsor.cta_url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div
      className="mx-4 my-3 rounded-2xl overflow-hidden border border-[var(--sl-border)]"
      style={{ background: bg }}
    >
      {/* Elite label */}
      <div className="px-3 pt-2.5 pb-0 flex items-center gap-1.5">
        <span
          className="text-[9px] font-black tracking-[0.2em] uppercase px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(245,158,11,0.18)', color: '#f59e0b' }}
        >
          Partenaire Élite
        </span>
      </div>

      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Logo */}
        {sponsor.logo_url ? (
          <img
            src={sponsor.logo_url}
            alt={sponsor.sponsor_name}
            className="w-11 h-11 rounded-xl object-contain shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          />
        ) : (
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-[18px] select-none"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            🤝
          </div>
        )}

        {/* Name + tagline + club */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[var(--sl-t1)] truncate leading-tight">
            {sponsor.sponsor_name}
          </p>
          {sponsor.tagline && (
            <p className="text-[11px] text-[var(--sl-t2)] truncate leading-tight mt-0.5">
              {sponsor.tagline}
            </p>
          )}
          {sponsor.clubs?.name && (
            <p className="text-[10px] text-[var(--sl-t3)] truncate leading-tight mt-1">
              Partenaire de {sponsor.clubs.name}
            </p>
          )}
        </div>

        {/* CTA */}
        {sponsor.cta_url && (
          <button
            onClick={handleCta}
            className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors"
            style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}
          >
            {sponsor.cta_label || 'Voir'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function MatchesSkeleton() {
  return (
    <div className="animate-pulse">
      {[0, 1, 2].map(gi => (
        <div key={gi} className="border-b border-[var(--sl-border)]">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--sl-card)]" />
            <div className="h-3 w-28 bg-[var(--sl-card)] rounded-full" />
          </div>
          {[0, 1].map(mi => (
            <div key={mi} className="flex items-center gap-3 px-4 py-3 bg-[var(--sl-surface)]">
              <div className="w-10 h-6 bg-[var(--sl-card)] rounded" />
              <div className="w-px h-8 bg-[var(--sl-border)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-3/4 bg-[var(--sl-card)] rounded-full" />
                <div className="h-2.5 w-1/2 bg-[var(--sl-card)] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function MatchesEmpty({ subTab, statusFilter }) {
  const msgs = {
    all:          { emoji: '📅', title: 'Aucun match ce jour', sub: "Naviguez vers un autre jour ou ajoutez des sports favoris dans votre profil." },
    favorites:    { emoji: '⭐', title: 'Aucun match pour vos clubs', sub: 'Suivez plus de clubs pour voir leurs rencontres ici.' },
    'my-club':    { emoji: '🏟️', title: 'Aucun match ce jour', sub: 'Naviguez vers un autre jour pour trouver les matchs de votre club.' },
    competitions: { emoji: '🏆', title: 'Aucun sport disponible', sub: '' },
  };
  const statusMsgs = {
    live:     { emoji: '📡', title: 'Aucun match en direct', sub: "Revenez pendant les horaires de rencontres." },
    finished: { emoji: '🔒', title: 'Aucun match terminé', sub: 'Les résultats apparaîtront ici après les rencontres.' },
    upcoming: { emoji: '⏳', title: 'Aucun match à venir', sub: 'Consultez un autre jour pour voir les prochaines rencontres.' },
  };

  const { emoji, title, sub } = statusFilter ? (statusMsgs[statusFilter] ?? msgs.all) : (msgs[subTab] ?? msgs.all);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <span className="text-5xl mb-4 select-none">{emoji}</span>
      <p className="text-[13px] font-semibold text-[var(--sl-t1)] mb-1.5">{title}</p>
      {sub && <p className="text-[12px] text-[var(--sl-t3)] max-w-[220px] leading-relaxed">{sub}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const BASE_SUB_TABS = [
  { key: 'all',          label: 'Tous' },
  { key: 'favorites',    label: 'Favoris' },
  { key: 'competitions', label: 'Compétitions' },
];

const STATUS_FILTERS = [
  { key: 'live',     label: 'Live' },
  { key: 'finished', label: 'Terminé' },
  { key: 'upcoming', label: 'À venir' },
];

export default function MatchesTab({ followedClubIds = [] }) {
  const { currentUser } = useAuth();
  const { managedClubs } = useManagedClubs();
  const favoriteSports = currentUser?.favoriteSports ?? [];

  const managedClubIds = useMemo(
    () => managedClubs.map(c => String(c.id)),
    [managedClubs],
  );

  const isManager = managedClubs.length > 0;

  // Inject "Mon Club" between Favoris and Compétitions only for managers
  const SUB_TABS = useMemo(() => {
    if (!isManager) return BASE_SUB_TABS;
    return [
      { key: 'all',          label: 'Tous' },
      { key: 'favorites',    label: 'Favoris' },
      { key: 'my-club',      label: 'Mon Club' },
      { key: 'competitions', label: 'Compétitions' },
    ];
  }, [isManager]);

  const [subTab,       setSubTab]       = useState('all');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [statusFilter, setStatusFilter] = useState(null);
  const [sportFilter,  setSportFilter]  = useState(null);

  const { sponsors: eliteSponsors } = useEliteSponsors();

  const goToPrevDay = useCallback(() => {
    setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  }, []);

  const goToToday = useCallback(() => setSelectedDate(new Date()), []);

  // "Tous" data
  const allSports = useMemo(() => {
    if (sportFilter) return [sportFilter];
    if (favoriteSports.length > 0) return favoriteSports;
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sportFilter, currentUser?.favoriteSports]);

  const { matches: allMatches, loading: allLoading } = useMatchesForDate({
    date:   selectedDate,
    sports: allSports,
    skip:   subTab === 'favorites' || subTab === 'my-club',
  });

  // "Favoris" data — followed clubs
  const { matches: favMatches, loading: favLoading } = useMatchesForDate({
    date:    selectedDate,
    clubIds: followedClubIds,
    skip:    subTab !== 'favorites',
  });

  // "Mon Club" data — managed clubs only
  const { matches: myClubMatches, loading: myClubLoading } = useMatchesForDate({
    date:    selectedDate,
    clubIds: managedClubIds,
    skip:    subTab !== 'my-club',
  });

  const currentMatches = subTab === 'favorites' ? favMatches
    : subTab === 'my-club' ? myClubMatches
    : allMatches;

  const loading = subTab === 'favorites' ? favLoading
    : subTab === 'my-club' ? myClubLoading
    : allLoading;

  const liveCount = useMemo(
    () => currentMatches.filter(m => getStatus(m) === 'live').length,
    [currentMatches],
  );

  const filteredMatches = useMemo(() => {
    if (!statusFilter) return currentMatches;
    return currentMatches.filter(m => getStatus(m) === statusFilter);
  }, [currentMatches, statusFilter]);

  const groups = useMemo(() => {
    const map = {};
    for (const m of filteredMatches) {
      const key = m.sport || 'Autre';
      if (!map[key]) map[key] = [];
      map[key].push(m);
    }
    return Object.entries(map).map(([sport, matches]) => ({ sport, matches }));
  }, [filteredMatches]);

  const sportCounts = useMemo(() => {
    const counts = {};
    for (const m of allMatches) {
      const s = m.sport || 'Autre';
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return Object.keys(SPORTS).map(s => ({ sport: s, count: counts[s] ?? 0 }));
  }, [allMatches]);

  function handleSubTabChange(key) {
    setSubTab(key);
    setStatusFilter(null);
    if (key !== 'competitions') setSportFilter(null);
  }

  function handleCompetitionClick(sport) {
    setSportFilter(sport === sportFilter ? null : sport);
    setSubTab('all');
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="flex flex-col h-full bg-[var(--sl-bg)]">

      {/* ══ Sticky header ════════════════════════════════════════════════════ */}
      <div className="shrink-0 bg-[var(--sl-bg)] border-b border-[var(--sl-border)]">

        {/* Sub-tabs */}
        <div className="flex border-b border-[var(--sl-border)]">
          {SUB_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleSubTabChange(tab.key)}
              className={[
                'flex-1 py-3 text-[13px] font-bold transition-colors relative',
                subTab === tab.key ? 'text-indigo-500' : 'text-[var(--sl-t3)] hover:text-[var(--sl-t2)]',
              ].join(' ')}
            >
              {tab.label}
              {subTab === tab.key && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-indigo-500" />
              )}
            </button>
          ))}
        </div>

        {/* Date navigator (hidden on Compétitions) */}
        {subTab !== 'competitions' && (
          <div className="flex items-center justify-between px-4 py-2">
            <button
              onClick={goToPrevDay}
              aria-label="Jour précédent"
              className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--sl-t2)] hover:bg-[var(--sl-surface)] hover:text-[var(--sl-t1)] transition-colors"
            >
              <ChevronLeft />
            </button>

            <button
              onClick={goToToday}
              className={[
                'text-[14px] font-bold capitalize transition-colors px-2 py-1 rounded-lg',
                isToday
                  ? 'text-indigo-500'
                  : 'text-[var(--sl-t1)] hover:bg-[var(--sl-surface)]',
              ].join(' ')}
            >
              {formatDateLabel(selectedDate)}
            </button>

            <button
              onClick={goToNextDay}
              aria-label="Jour suivant"
              className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--sl-t2)] hover:bg-[var(--sl-surface)] hover:text-[var(--sl-t1)] transition-colors"
            >
              <ChevronRight />
            </button>
          </div>
        )}

        {/* Status filters (hidden on Compétitions) */}
        {subTab !== 'competitions' && (
          <div
            className="flex gap-2 px-4 pb-3 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {STATUS_FILTERS.map(f => {
              const isActive  = statusFilter === f.key;
              const isLiveBtn = f.key === 'live';

              return (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(isActive ? null : f.key)}
                  className={[
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all shrink-0',
                    isActive && isLiveBtn
                      ? 'bg-red-600 text-white shadow-sm'
                      : isActive
                      ? 'bg-[var(--sl-t1)] text-[var(--sl-bg)]'
                      : 'bg-[var(--sl-pill-bg)] text-[var(--sl-pill-text)] border border-[var(--sl-border)] hover:border-[var(--sl-border-s)]',
                  ].join(' ')}
                >
                  {isLiveBtn && (
                    <span
                      className={[
                        'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
                        isActive ? 'bg-white' : liveCount > 0 ? 'bg-red-500' : 'bg-[var(--sl-t3)]',
                      ].join(' ')}
                    />
                  )}
                  {f.label}
                  {isLiveBtn && liveCount > 0 && (
                    <span className={`font-black ${isActive ? 'text-white/80' : 'text-red-500'}`}>
                      ({liveCount})
                    </span>
                  )}
                </button>
              );
            })}

            {/* Active sport filter pill */}
            {sportFilter && (
              <button
                onClick={() => setSportFilter(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0 whitespace-nowrap"
              >
                <span>{SPORTS[sportFilter]?.emoji}</span>
                <span>{sportFilter}</span>
                <span className="text-[10px] opacity-70">✕</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ══ Scrollable content ═══════════════════════════════════════════════ */}
      <main
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >

        {/* ── Compétitions grid ── */}
        {subTab === 'competitions' && (
          <div className="p-4">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[var(--sl-t3)] mb-3">
              Sports disponibles
            </p>
            <div className="grid grid-cols-4 gap-2">
              {sportCounts.map(({ sport, count }) => (
                <SportGridCard
                  key={sport}
                  sport={sport}
                  count={count}
                  isSelected={sportFilter === sport}
                  onClick={() => handleCompetitionClick(sport)}
                />
              ))}
            </div>

            {/* Today's count summary */}
            {allMatches.length > 0 && (
              <p className="text-[11px] text-[var(--sl-t3)] text-center mt-5">
                {allMatches.length} rencontre{allMatches.length > 1 ? 's' : ''} aujourd&apos;hui
              </p>
            )}
          </div>
        )}

        {/* ── Mon Club tab — admin score management ── */}
        {subTab === 'my-club' && (
          loading ? (
            <MatchesSkeleton />
          ) : myClubMatches.length === 0 ? (
            <MatchesEmpty subTab="my-club" statusFilter={statusFilter} />
          ) : (
            <>
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-black tracking-[0.18em] uppercase text-[var(--sl-t3)]">
                  {managedClubs.map(c => c.name).join(' · ')}
                </p>
              </div>
              {(statusFilter
                ? myClubMatches.filter(m => getStatus(m) === statusFilter)
                : myClubMatches
              ).map(m => (
                <AdminMatchRowFull key={m.id} event={m} />
              ))}
            </>
          )
        )}

        {/* ── Match list (Tous + Favoris) ── */}
        {subTab !== 'competitions' && subTab !== 'my-club' && (
          loading ? (
            <MatchesSkeleton />
          ) : groups.length === 0 ? (
            <MatchesEmpty subTab={subTab} statusFilter={statusFilter} />
          ) : (
            groups.flatMap(({ sport, matches }, idx) => {
              const nodes = [<SportGroup key={sport} sport={sport} matches={matches} />];
              const shouldInject = subTab === 'all' && eliteSponsors.length > 0 && (idx + 1) % 2 === 0;
              if (shouldInject) {
                const sponsor = eliteSponsors[Math.floor(idx / 2) % eliteSponsors.length];
                nodes.push(<EliteSponsorBanner key={`spo-${idx}`} sponsor={sponsor} />);
              }
              return nodes;
            })
          )
        )}
      </main>
    </div>
  );
}
