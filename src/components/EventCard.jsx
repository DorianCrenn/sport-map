import { forwardRef, memo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useShare } from '../hooks/useShare.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useAttendeeCount } from '../contexts/AttendeeCountContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { useFavoritesContext } from '../contexts/FavoritesContext.jsx';
import { useClubPlayers } from '../hooks/useClubPlayers.js';
import EventReactions from './EventReactions.jsx';
import EventComments from './EventComments.jsx';
import EventPhotoGallery from './EventPhotoGallery.jsx';
import { useAttendanceContext } from '../contexts/AttendanceContext.jsx';
import { downloadICS } from '../utils/exportICS.js';
import { generateEventDescription, openWhatsAppShare, openFacebookShare, openInstagramShare } from '../lib/eventShare.js';
import SportIcon from './SportIcon.jsx';
import PosterStudio from './PosterStudio.jsx';
import PosterShareBtn from './PosterShareBtn.jsx';

const EVENT_TYPE_META = {
  championship: { label: 'Championnat', color: '#3b82f6' },
  cup:          { label: 'Coupe',        color: '#f97316' },
  friendly:     { label: 'Amical',       color: '#22d96a' },
  tournament:   { label: 'Tournoi',      color: '#8b5cf6' },
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

  const eventUrl = `${window.location.origin}/event-page.html?id=${event.id}`;
  const description = generateEventDescription(event, { includeUrl: true, url: eventUrl });

  async function handleShare(e) {
    e.stopPropagation();
    const result = await share({ title: event.title, text: description, url: eventUrl });
    if (result.success && result.method === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleWA(e) {
    e.stopPropagation();
    openWhatsAppShare(description);
  }

  function handleFB(e) {
    e.stopPropagation();
    openFacebookShare(eventUrl);
  }

  const iconBtnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36, borderRadius: 9, cursor: 'pointer', flexShrink: 0,
    border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent',
    color: 'var(--sl-t2)',
  };

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button onClick={handleShare} title={copied ? 'Copié !' : 'Partager'} style={{
        display: 'flex', alignItems: 'center', gap: 5, fontSize: 11,
        padding: '9px 10px', borderRadius: 9, cursor: 'pointer', minHeight: 36,
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
      {/* WhatsApp */}
      <button onClick={handleWA} title="Partager sur WhatsApp" style={iconBtnStyle}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </button>
      {/* Facebook */}
      <button onClick={handleFB} title="Partager sur Facebook" style={iconBtnStyle}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </button>
      {/* Instagram */}
      <button
        onClick={(e) => { e.stopPropagation(); openInstagramShare(description, eventUrl); }}
        title="Partager sur Instagram"
        style={iconBtnStyle}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
        </svg>
      </button>
    </div>
  );
}

function AttendBtn({ event }) {
  const { isAttending, toggle } = useAttendanceContext();
  const attending = isAttending(event.id);
  const { toast } = useToast();
  function handleClick(e) {
    e.stopPropagation();
    toggle(event.id);
    toast({ message: attending ? 'Inscription retirée' : "Tu y seras !" });
  }
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, fontSize: 11,
        padding: '9px 10px', borderRadius: 9, cursor: 'pointer', minHeight: 36,
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
      padding: '9px 10px', borderRadius: 9, cursor: 'pointer', minHeight: 36,
      color: 'var(--sl-t2)', border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent',
    }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
      </svg>
      M'y rendre
    </button>
  );
}

function QuickScoreEdit({ event, onUpdateEvent, onPosterResult }) {
  const [home, setHome]   = useState(String(event.score?.home ?? ''));
  const [away, setAway]   = useState(String(event.score?.away ?? ''));
  const [motm, setMotm]   = useState(event.man_of_match ?? '');
  const [saved, setSaved] = useState(false);
  const [motmOpen, setMotmOpen] = useState(false);
  const { players } = useClubPlayers(event.clubId);

  useEffect(() => {
    setHome(String(event.score?.home ?? ''));
    setAway(String(event.score?.away ?? ''));
    setMotm(event.man_of_match ?? '');
  }, [event.score?.home, event.score?.away, event.man_of_match]);

  function handleSave(e) {
    e.stopPropagation();
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    onUpdateEvent(event.id, { score: { home: h, away: a }, man_of_match: motm.trim() || null });
    setSaved(true);
    setTimeout(() => setSaved(false), 5000);
  }

  const filteredPlayers = players.filter(p =>
    !motm || p.name.toLowerCase().includes(motm.toLowerCase())
  );

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sl-border)' }} onClick={e => e.stopPropagation()}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
        {event.score != null ? 'Modifier le score' : 'Saisir le score'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <input
          type="number" min="0" max="99" value={home}
          onChange={e => setHome(e.target.value)}
          aria-label="Score domicile"
          style={{ width: 50, textAlign: 'center', fontWeight: 800, fontSize: 18, padding: '5px 0', borderRadius: 8, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)', color: 'var(--sl-t1)' }}
        />
        <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--sl-t3)' }}>—</span>
        <input
          type="number" min="0" max="99" value={away}
          onChange={e => setAway(e.target.value)}
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

      {/* Joueur du match */}
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
          Joueur du match <span style={{ fontWeight: 400 }}>(optionnel)</span>
        </div>
        <input
          type="text" value={motm}
          onChange={e => { setMotm(e.target.value); setMotmOpen(true); }}
          onFocus={() => setMotmOpen(true)}
          onBlur={() => setTimeout(() => setMotmOpen(false), 150)}
          placeholder={players.length ? 'Sélectionner dans le roster…' : 'ex. Kevin Dupont'}
          autoComplete="off"
          style={{ width: '100%', padding: '7px 12px', borderRadius: 8, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13, boxSizing: 'border-box' }}
        />
        {motmOpen && players.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
            backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
            borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            maxHeight: 180, overflowY: 'auto', marginTop: 4,
          }}>
            {filteredPlayers.slice(0, 8).map(p => (
              <button key={p.id} type="button"
                onMouseDown={() => { setMotm(p.name); setMotmOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', fontSize: 12, textAlign: 'left', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--sl-text)' }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--sl-surface)'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{ width: 24, textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)' }}>#{p.number ?? '—'}</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                {p.position && <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{p.position}</span>}
              </button>
            ))}
            {!filteredPlayers.length && (
              <p style={{ padding: '8px 12px', fontSize: 11, color: 'var(--sl-t3)', fontStyle: 'italic' }}>Aucun joueur correspondant</p>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {saved && onPosterResult && (
          <motion.button
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            onClick={(e) => { e.stopPropagation(); onPosterResult({ home: parseInt(home, 10), away: parseInt(away, 10) }); }}
            style={{
              width: '100%', marginTop: 8, padding: '9px 0', borderRadius: 9, border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white', fontSize: 12, fontWeight: 800,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            Créer l'affiche résultat
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function ICSBtn({ event }) {
  function handleICS(e) { e.stopPropagation(); downloadICS(event); }
  return (
    <button onClick={handleICS} title="Ajouter au calendrier" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
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

// ── Tournament card content ────────────────────────────────────────────────────

const TOURNAMENT_COLOR = '#8b5cf6';

function TournamentCardContent({ event, isSelected, canEditThis, onEdit, onDelete, onDuplicate, onUpdateEvent, setShowPoster, isPast, attendeeCount, status }) {
  const cats = event.tournamentCategories
    ? event.tournamentCategories.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
        {/* Sport pill */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, color: '#fff', backgroundColor: TOURNAMENT_COLOR, flexShrink: 0 }}>
          <SportIcon sport={event.sport} size={10} color="white" />
          {event.sport}
        </span>
        {/* TOURNOI badge */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, color: TOURNAMENT_COLOR, backgroundColor: `${TOURNAMENT_COLOR}18`, border: `1px solid ${TOURNAMENT_COLOR}30`, flexShrink: 0, letterSpacing: '0.04em' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M17 4V2H7v2H2v4c0 2.76 1.86 5.08 4.4 5.8L7 14h10l.6-0.2C20.14 13.08 22 10.76 22 8V4h-5zM4 8V6h3v3.8A4.01 4.01 0 0 1 4 8zm16 0a4.01 4.01 0 0 1-3 3.8V6h3v2z"/>
            <path d="M12 15a3 3 0 0 0-3 3v1h6v-1a3 3 0 0 0-3-3zM7 20h10v2H7z"/>
          </svg>
          TOURNOI
        </span>
        {event.tournamentType && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5, color: `${TOURNAMENT_COLOR}CC`, backgroundColor: `${TOURNAMENT_COLOR}10`, flexShrink: 0 }}>
            {event.tournamentType}
          </span>
        )}
        <StatusBadge event={event} />
        {event.source === 'user' && <span style={{ fontSize: 10, color: '#4da6ff', fontWeight: 600, flexShrink: 0 }}>✦ Club</span>}
        {canEditThis && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, flexShrink: 0 }}>
            {onDuplicate && (
              <button onClick={(e) => { e.stopPropagation(); onDuplicate(event); }} title="Dupliquer" style={{ padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer', color: '#a78bfa', backgroundColor: 'transparent' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onEdit(event); }} style={{ padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer', color: '#4da6ff', backgroundColor: 'transparent' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(event.id); }} style={{ padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer', color: '#ef4444', backgroundColor: 'transparent' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* Tournament name */}
      <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.25, color: status === 'cancelled' ? 'var(--sl-t3)' : 'var(--sl-t1)', marginBottom: 4, textDecoration: status === 'cancelled' ? 'line-through' : 'none', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {event.tournamentName || event.title}
      </div>

      {/* Teams count + format */}
      {(event.numTeams || event.tournamentFormat) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
          {event.numTeams && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: TOURNAMENT_COLOR, backgroundColor: `${TOURNAMENT_COLOR}12`, padding: '2px 8px', borderRadius: 20 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {event.numTeams} équipes
            </div>
          )}
          {event.tournamentFormat && (
            <span style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 500 }}>{event.tournamentFormat}</span>
          )}
        </div>
      )}

      {/* Date + venue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--sl-t2)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>{new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · {new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--sl-t2)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.venue || event.city}</span>
        </div>
        {attendeeCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: TOURNAMENT_COLOR }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {attendeeCount} participant{attendeeCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Expanded section */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            {/* Description */}
            {event.description && (
              <p style={{ fontSize: 12, marginTop: 10, lineHeight: 1.6, borderTop: '1px solid var(--sl-border)', paddingTop: 10, color: 'var(--sl-t2)' }}>
                {event.description}
              </p>
            )}

            {/* Categories */}
            {cats.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {cats.map((c, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, color: TOURNAMENT_COLOR, backgroundColor: `${TOURNAMENT_COLOR}12`, border: `1px solid ${TOURNAMENT_COLOR}25` }}>{c}</span>
                ))}
              </div>
            )}

            {/* Prize */}
            {event.prize && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, backgroundColor: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <span style={{ fontSize: 13 }}>🏆</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#C9A84C' }}>{event.prize}</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <AttendBtn event={event} />
              <NavBtn event={event} />
              <ShareBtn event={event} />
              <ICSBtn event={event} />
              <button
                onClick={(e) => { e.stopPropagation(); setShowPoster(true); }}
                title="Créer une affiche"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, cursor: 'pointer', color: 'var(--sl-t3)', border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent', flexShrink: 0 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </button>
              <PosterShareBtn event={event} />
            </div>

            <EventReactions eventId={String(event.id)} />
            <EventComments eventId={String(event.id)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main EventCard ─────────────────────────────────────────────────────────────

const EventCard = forwardRef(function EventCard({ event, club, isSelected, onSelect, onEdit, onDelete, onDuplicate, onUpdateEvent }, ref) {
  const { allSports: SPORTS } = useSports();
  const { currentUser, isAdmin } = useAuth();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const attendeeCount = useAttendeeCount(event.id);
  const [showPoster, setShowPoster] = useState(false);
  const [posterInitBg, setPosterInitBg] = useState(null);
  const [resultScore, setResultScore] = useState(null);
  const group = SPORTS[event.sport];
  const sportColor = group?.color ?? '#22d96a';
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const isUserEvent = event.source === 'user';
  const canEditThis = isUserEvent && (!event.creatorId || event.creatorId === currentUser?.id || isAdmin);
  const isPast = dateObj < new Date();
  const hasStandings = !!event.standings;
  const showPoints = event.standings?.home?.points !== null && event.standings?.home?.points !== undefined;
  const fav = isFavorite(event.id);
  const status = getEffectiveStatus(event);
  const isTournament = event.eventType === 'tournament';
  const accentColor = isTournament ? TOURNAMENT_COLOR : sportColor;

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
      aria-label={event.tournamentName || event.title}
      className="event-card-focusable"
      style={{
        backgroundColor: 'var(--sl-card)',
        borderRadius: 14, padding: '12px 12px 12px 0', marginBottom: 8,
        cursor: 'pointer',
        border: `1.5px solid ${isSelected ? accentColor : isTournament ? `${TOURNAMENT_COLOR}30` : 'var(--sl-border)'}`,
        boxShadow: isSelected ? `0 0 0 1px ${accentColor}25, 0 4px 16px ${accentColor}15` : 'none',
        display: 'flex', alignItems: 'stretch', gap: 0, overflow: 'hidden',
        outline: 'none',
      }}
    >
      {/* Accent bar — purple for tournaments */}
      <div style={{ width: 3, minHeight: 40, flexShrink: 0, backgroundColor: accentColor, borderRadius: '0 3px 3px 0', marginRight: 10, alignSelf: 'stretch' }} />

      {isTournament ? (
        <TournamentCardContent
          event={event}
          isSelected={isSelected}
          canEditThis={canEditThis}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onUpdateEvent={onUpdateEvent}
          setShowPoster={setShowPoster}
          isPast={isPast}
          attendeeCount={attendeeCount}
          status={status}
        />
      ) : (
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
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, flexShrink: 0, alignItems: 'center' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPoster(true); }}
                  aria-label="Créer l'affiche"
                  title="Créer l'affiche"
                  style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 7, border: 'none', cursor: 'pointer', backgroundColor: `${accentColor}15`, color: accentColor, fontSize: 10, fontWeight: 700, flexShrink: 0 }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Affiche
                </button>
                {onDuplicate && (
                  <button onClick={(e) => { e.stopPropagation(); onDuplicate(event); }} aria-label="Dupliquer l'événement" title="Dupliquer" style={{ padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer', color: '#a78bfa', backgroundColor: 'transparent' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                )}
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
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, color: status === 'cancelled' ? 'var(--sl-t3)' : 'var(--sl-t1)', marginBottom: 2, fontFamily: 'Inter, sans-serif', textDecoration: status === 'cancelled' ? 'line-through' : 'none', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {event.title}
          </div>

          {/* Championship / Cup subtitle */}
          {event.eventType === 'championship' && (event.teamName || event.level) && (
            <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', opacity: 0.85, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {[event.teamName, event.level].filter(Boolean).join(' — ')}
            </div>
          )}
          {event.eventType === 'cup' && event.cupType && (
            <div style={{ fontSize: 11, fontWeight: 600, color: '#f97316', opacity: 0.85, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
              >
                {event.description && (
                  <p style={{ fontSize: 12, marginTop: 10, lineHeight: 1.6, borderTop: '1px solid var(--sl-border)', paddingTop: 10, color: 'var(--sl-t2)' }}>
                    {event.description}
                  </p>
                )}

                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <AttendBtn event={event} />
                  <NavBtn event={event} />
                  <ShareBtn event={event} />
                  <ICSBtn event={event} />
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowPoster(true); }}
                    aria-label="Créer une affiche"
                    title="Créer une affiche"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 9, cursor: 'pointer', color: accentColor, border: `1px solid ${accentColor}30`, backgroundColor: `${accentColor}10`, fontSize: 11, fontWeight: 700, flexShrink: 0 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    Créer l'affiche
                  </button>
                  <PosterShareBtn event={event} />
                </div>

                {canEditThis && isPast && onUpdateEvent && (
                  <QuickScoreEdit event={event} onUpdateEvent={onUpdateEvent} onPosterResult={score => setResultScore(score)} />
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

                <EventPhotoGallery
                  eventId={event.id}
                  clubId={event.clubId}
                  currentUserId={currentUser?.id}
                  canUpload={canEditThis && isPast}
                  onUseAsBg={url => { setPosterInitBg(url); setShowPoster(true); }}
                />
                <EventReactions eventId={String(event.id)} />
                <EventComments eventId={String(event.id)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Favorite button — min 44px tap target */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          const adding = !fav;
          toggleFavorite(event.id);
          toast({ message: adding ? 'Ajouté aux favoris' : 'Retiré des favoris' });
        }}
        aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        aria-pressed={fav}
        style={{ minWidth: 44, minHeight: 44, padding: '0 10px 0 4px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', flexShrink: 0, alignSelf: 'flex-start', color: fav ? '#ef4444' : 'var(--sl-t3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
    </motion.div>

    {(showPoster || resultScore) && (
      <PosterStudio
        event={event}
        club={club}
        onClose={() => { setShowPoster(false); setResultScore(null); setPosterInitBg(null); }}
        resultMode={resultScore}
        quickMode={!!resultScore}
        initialBgSrc={posterInitBg}
      />
    )}
  </>
  );
});

export default memo(EventCard);
