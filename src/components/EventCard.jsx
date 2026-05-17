import { forwardRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useShare } from '../hooks/useShare.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useAttendeeCount } from '../contexts/AttendeeCountContext.jsx';
import { downloadICS } from '../utils/exportICS.js';
import SportIcon from './SportIcon.jsx';
import PosterStudio from './PosterStudio.jsx';

const EVENT_TYPE_META = {
  championship: { label: 'Championnat', color: '#3b82f6' },
  cup:          { label: 'Coupe',        color: '#f97316' },
  friendly:     { label: 'Amical',       color: '#22d96a' },
};

const STATUS_META = {
  upcoming:  { label: 'À venir',   color: '#4da6ff', bg: 'rgba(77,166,255,0.12)' },
  live:      { label: '● En direct', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  done:      { label: 'Terminé',   color: '#64748b', bg: 'rgba(100,116,139,0.10)' },
  postponed: { label: 'Reporté',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  cancelled: { label: 'Annulé',    color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
};

function getEffectiveStatus(event) {
  if (event.status && event.status !== 'upcoming') return event.status;
  return new Date(event.date) < new Date() ? 'done' : 'upcoming';
}

function EventTypeBadge({ event }) {
  const meta = EVENT_TYPE_META[event.eventType];
  if (!meta) {
    return event.level
      ? <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', flexShrink: 0 }}>{event.level}</span>
      : null;
  }
  if (event.eventType === 'championship') {
    return (
      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, color: meta.color, backgroundColor: `${meta.color}20`, letterSpacing: '0.05em', flexShrink: 0 }}>
        {event.level || meta.label}
      </span>
    );
  }
  if (event.eventType === 'cup' && event.cupType) {
    const short = event.cupType.replace(/^Coupe (?:de |du |d'|des )?/i, '') || event.cupType;
    return (
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, color: meta.color, backgroundColor: `${meta.color}20`, flexShrink: 0, maxWidth: 82, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {short}
      </span>
    );
  }
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, color: meta.color, backgroundColor: `${meta.color}20`, flexShrink: 0 }}>
      {meta.label}
    </span>
  );
}

function StatusBadge({ event }) {
  const status = getEffectiveStatus(event);
  if (status === 'upcoming') return null;
  const m = STATUS_META[status];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, color: m.color, backgroundColor: m.bg, flexShrink: 0 }}>
      {m.label}
    </span>
  );
}

function StandingsRow({ team, rank, wins, draws, losses, points }) {
  const played = (wins ?? 0) + (draws ?? 0) + (losses ?? 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0' }}>
      <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: 10, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)' }}>{rank}</span>
      <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sl-t1)' }}>{team}</span>
      <span style={{ width: 20, textAlign: 'center', color: 'var(--sl-t3)' }}>{played || '-'}</span>
      <span style={{ width: 20, textAlign: 'center', color: '#22d96a', fontWeight: 600 }}>{wins ?? '-'}</span>
      <span style={{ width: 20, textAlign: 'center', color: 'var(--sl-t3)' }}>{draws ?? '-'}</span>
      <span style={{ width: 20, textAlign: 'center', color: '#ef4444' }}>{losses ?? '-'}</span>
      {points !== null && points !== undefined && (
        <span style={{ width: 24, textAlign: 'center', fontWeight: 700, color: 'var(--sl-t1)' }}>{points}</span>
      )}
    </div>
  );
}

function ShareBtn({ event }) {
  const { share } = useShare();
  const [copied, setCopied] = useState(false);

  async function handleShare(e) {
    e.stopPropagation();
    const dateObj = new Date(event.date);
    const dateLabel = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeLabel = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const venue = event.venue || event.city || '';
    const lines = [event.title, `📅 ${dateLabel} à ${timeLabel}`];
    if (venue) lines.push(`📍 ${venue}`);
    const result = await share({ title: event.title, text: lines.join('\n'), url: window.location.href });
    if (result.success && result.method === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button onClick={handleShare} title={copied ? 'Copié !' : 'Partager'} style={{
      display: 'flex', alignItems: 'center', gap: 5, fontSize: 11,
      padding: '5px 9px', borderRadius: 9, cursor: 'pointer',
      color: copied ? 'var(--sl-green)' : 'var(--sl-t2)',
      border: `1px solid ${copied ? 'var(--sl-green)' : 'var(--sl-border-s)'}`,
      backgroundColor: copied ? 'var(--sl-green-dim)' : 'transparent',
    }}>
      {copied
        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      }
      {copied ? 'Copié !' : 'Partager'}
    </button>
  );
}

function AttendBtn({ event, isAttending, onToggle }) {
  const attending = isAttending?.(event.id) ?? false;
  function handleClick(e) { e.stopPropagation(); onToggle?.(event.id); }
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, fontSize: 11,
        padding: '5px 9px', borderRadius: 9, cursor: 'pointer',
        color: attending ? 'var(--sl-green)' : 'var(--sl-t2)',
        border: `1px solid ${attending ? 'var(--sl-green)' : 'var(--sl-border-s)'}`,
        backgroundColor: attending ? 'var(--sl-green-dim)' : 'transparent',
        transition: 'all 0.15s',
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill={attending ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      {attending ? "J'y serai ✓" : "J'y serai"}
    </motion.button>
  );
}

function NavBtn({ event }) {
  function handleNav(e) {
    e.stopPropagation();
    const addr = encodeURIComponent([event.venue, event.city].filter(Boolean).join(', '));
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    window.open(isIOS ? `maps://maps.apple.com/?q=${addr}` : `https://maps.google.com/?q=${addr}`, '_blank');
  }
  return (
    <button onClick={handleNav} title="M'y rendre" style={{
      display: 'flex', alignItems: 'center', gap: 5, fontSize: 11,
      padding: '5px 9px', borderRadius: 9, cursor: 'pointer',
      color: 'var(--sl-t2)', border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent',
    }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
      </svg>
      M'y rendre
    </button>
  );
}

function QuickScoreEdit({ event, onUpdateEvent }) {
  const [home, setHome] = useState(String(event.score?.home ?? ''));
  const [away, setAway] = useState(String(event.score?.away ?? ''));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHome(String(event.score?.home ?? ''));
    setAway(String(event.score?.away ?? ''));
  }, [event.score?.home, event.score?.away]);

  function handleSave(e) {
    e.stopPropagation();
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    onUpdateEvent(event.id, { score: { home: h, away: a } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sl-border)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
        {event.score != null ? 'Modifier le score' : 'Saisir le score'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number" min="0" max="99" value={home}
          onChange={e => setHome(e.target.value)}
          onClick={e => e.stopPropagation()}
          aria-label="Score domicile"
          style={{ width: 50, textAlign: 'center', fontWeight: 800, fontSize: 18, padding: '5px 0', borderRadius: 8, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)', color: 'var(--sl-t1)' }}
        />
        <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--sl-t3)' }}>—</span>
        <input
          type="number" min="0" max="99" value={away}
          onChange={e => setAway(e.target.value)}
          onClick={e => e.stopPropagation()}
          aria-label="Score extérieur"
          style={{ width: 50, textAlign: 'center', fontWeight: 800, fontSize: 18, padding: '5px 0', borderRadius: 8, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)', color: 'var(--sl-t1)' }}
        />
        <button
          onClick={handleSave}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 8, border: saved ? '1px solid var(--sl-green)' : 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700,
            backgroundColor: saved ? 'var(--sl-green-dim)' : 'var(--sl-green)',
            color: saved ? 'var(--sl-green)' : '#fff',
            transition: 'all 0.15s',
          }}
        >
          {saved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

function ICSBtn({ event }) {
  function handleICS(e) { e.stopPropagation(); downloadICS(event); }
  return (
    <button onClick={handleICS} title="Ajouter au calendrier" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 28, height: 28, borderRadius: 8, cursor: 'pointer',
      color: 'var(--sl-t3)', border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent',
      flexShrink: 0,
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </button>
  );
}

function FollowClubPill({ event }) {
  const { isLoggedIn, isFollowingClub, followClub, unfollowClub } = useAuth();
  if (!isLoggedIn || !event.clubId) return null;
  const following = isFollowingClub(event.clubId);
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={e => {
        e.stopPropagation();
        following ? unfollowClub(event.clubId) : followClub(event.clubId, { teams: 'all', notif: { match: true, news: true } });
      }}
      title={following ? `Ne plus suivre ${event.clubName ?? 'ce club'}` : `Suivre ${event.clubName ?? 'ce club'}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 20, border: 'none', cursor: 'pointer',
        fontSize: 10, fontWeight: 700,
        backgroundColor: following ? 'rgba(34,217,106,0.15)' : 'var(--sl-surface)',
        color: following ? 'var(--sl-green)' : 'var(--sl-t3)',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {following
        ? <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      }
      {following ? 'Suivi' : 'Suivre'}
    </motion.button>
  );
}

const EventCard = forwardRef(function EventCard({ event, isSelected, onSelect, onEdit, onDelete, onUpdateEvent, isFavorite, onToggleFavorite, isAttending, onToggleAttend }, ref) {
  const { allSports: SPORTS } = useSports();
  const { currentUser, isAdmin } = useAuth();
  const attendeeCount = useAttendeeCount(event.id);
  const [showPoster, setShowPoster] = useState(false);
  const group = SPORTS[event.sport];
  const sportColor = group?.color ?? '#22d96a';
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const isUserEvent = event.source === 'user';
  // Edit/delete only for the creator or an admin; fallback allows pre-creatorId events to remain editable
  const canEditThis = isUserEvent && (!event.creatorId || event.creatorId === currentUser?.id || isAdmin);
  const isPast = dateObj < new Date();
  const hasStandings = !!event.standings;
  const showPoints = event.standings?.home?.points !== null && event.standings?.home?.points !== undefined;
  const fav = isFavorite?.(event.id) ?? false;
  const status = getEffectiveStatus(event);

  return (
    <>
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(); } }}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={event.title}
      className="event-card-focusable"
      style={{
        backgroundColor: 'var(--sl-card)',
        borderRadius: 14, padding: '12px 12px 12px 0', marginBottom: 8,
        cursor: 'pointer',
        border: `1.5px solid ${isSelected ? sportColor : 'var(--sl-border)'}`,
        boxShadow: isSelected ? `0 0 0 1px ${sportColor}25, 0 4px 16px ${sportColor}15` : 'none',
        display: 'flex', alignItems: 'stretch', gap: 0, overflow: 'hidden',
        outline: 'none',
      }}
    >
      {/* Sport color accent bar */}
      <div style={{ width: 3, minHeight: 40, flexShrink: 0, backgroundColor: sportColor, borderRadius: '0 3px 3px 0', marginRight: 10, alignSelf: 'stretch' }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, color: '#fff', backgroundColor: sportColor, flexShrink: 0 }}>
            <SportIcon sport={event.sport} size={10} color="white" />
            {event.sport}
          </span>
          <EventTypeBadge event={event} />
          <StatusBadge event={event} />
          {isUserEvent && <span style={{ fontSize: 10, color: '#4da6ff', fontWeight: 600, flexShrink: 0 }}>✦ Club</span>}
          {event.clubId && !isUserEvent && <FollowClubPill event={event} />}
          {canEditThis && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, flexShrink: 0 }}>
              <button onClick={(e) => { e.stopPropagation(); onEdit(event); }} aria-label="Modifier l'événement" style={{ padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer', color: '#4da6ff', backgroundColor: 'transparent' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(event.id); }} aria-label="Supprimer l'événement" style={{ padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer', color: '#ef4444', backgroundColor: 'transparent' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, color: status === 'cancelled' ? 'var(--sl-t3)' : 'var(--sl-t1)', marginBottom: 2, fontFamily: 'Inter, sans-serif', textDecoration: status === 'cancelled' ? 'line-through' : 'none' }}>
          {event.title}
        </div>

        {/* Championship / Cup subtitle */}
        {event.eventType === 'championship' && (event.teamName || event.level) && (
          <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', opacity: 0.85, marginBottom: 4 }}>
            {[event.teamName, event.level].filter(Boolean).join(' — ')}
          </div>
        )}
        {event.eventType === 'cup' && event.cupType && (
          <div style={{ fontSize: 11, fontWeight: 600, color: '#f97316', opacity: 0.85, marginBottom: 4 }}>
            {event.cupType}
          </div>
        )}

        {/* Score display */}
        {event.score != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', fontVariantNumeric: 'tabular-nums' }}>{event.score.home}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t3)' }}>—</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', fontVariantNumeric: 'tabular-nums' }}>{event.score.away}</span>
          </div>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--sl-t2)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>{dateStr} · {timeStr}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--sl-t2)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.venue || event.city}</span>
          </div>
          {attendeeCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'var(--sl-green)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {attendeeCount} J'y serai
            </div>
          )}
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              {event.description && (
                <p style={{ fontSize: 12, marginTop: 10, lineHeight: 1.6, borderTop: '1px solid var(--sl-border)', paddingTop: 10, color: 'var(--sl-t2)' }}>
                  {event.description}
                </p>
              )}

              {/* Action buttons */}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <AttendBtn event={event} isAttending={isAttending} onToggle={onToggleAttend} />
                <NavBtn event={event} />
                <ShareBtn event={event} />
                <ICSBtn event={event} />
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPoster(true); }}
                  aria-label="Créer une affiche"
                  title="Créer une affiche"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', color: 'var(--sl-t3)', border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent', flexShrink: 0 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </button>
              </div>

              {canEditThis && isPast && onUpdateEvent && (
                <QuickScoreEdit event={event} onUpdateEvent={onUpdateEvent} />
              )}

              {hasStandings && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sl-border)', overflowX: 'auto' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, color: 'var(--sl-t3)' }}>Classement</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, marginBottom: 2, color: 'var(--sl-t3)' }}>
                    <span style={{ width: 20, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>Équipe</span>
                    <span style={{ width: 20, textAlign: 'center' }}>J</span>
                    <span style={{ width: 20, textAlign: 'center', color: '#22d96a' }}>V</span>
                    <span style={{ width: 20, textAlign: 'center' }}>N</span>
                    <span style={{ width: 20, textAlign: 'center', color: '#ef4444' }}>D</span>
                    {showPoints && <span style={{ width: 24, textAlign: 'center', fontWeight: 700, color: 'var(--sl-t2)' }}>Pts</span>}
                  </div>
                  <StandingsRow {...event.standings.home} />
                  <StandingsRow {...event.standings.away} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Favorite button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(event.id); }}
          aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={fav}
          style={{ padding: '6px 10px 6px 4px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', flexShrink: 0, alignSelf: 'flex-start', color: fav ? '#ef4444' : 'var(--sl-t3)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      )}
    </motion.div>

    {showPoster && <PosterStudio event={event} onClose={() => setShowPoster(false)} />}
  </>
  );
});

export default EventCard;
