import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useShare } from '../hooks/useShare.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { downloadICS } from '../utils/exportICS.js';
import FollowModal from '../components/FollowModal.jsx';
import SportIcon from '../components/SportIcon.jsx';

// ── Icons ─────────────────────────────────────────────────────────────────────
const CalSvg = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const PinSvg = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const HeartSvg = ({ filled, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

// ── Share button ──────────────────────────────────────────────────────────────
function ShareBtn({ event }) {
  const { share } = useShare();
  const [copied, setCopied] = useState(false);
  async function handle() {
    const dateObj = new Date(event.date);
    const r = await share({ title: event.title, text: `${event.title}\n📅 ${dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n📍 ${event.venue || event.city || ''}`, url: window.location.href });
    if (r.success && r.method === 'clipboard') { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }
  return (
    <button onClick={handle} title={copied ? 'Copié !' : 'Partager'}
      style={{ padding: 6, borderRadius: 8, cursor: 'pointer', color: copied ? 'var(--sl-green)' : 'var(--sl-t3)', backgroundColor: 'transparent', border: 'none' }}>
      {copied
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      }
    </button>
  );
}

// ── Event type meta ───────────────────────────────────────────────────────────
const EV_TYPE_META = {
  championship: { label: 'Championnat', color: '#3b82f6' },
  cup:          { label: 'Coupe',       color: '#f97316' },
  friendly:     { label: 'Amical',      color: '#22d96a' },
};

// ── Favorite event card ───────────────────────────────────────────────────────
function FavoriteCard({ event, onToggleFavorite, isAttending, onToggleAttend }) {
  const { allSports: SPORTS } = useSports();
  const sportColor = SPORTS[event.sport]?.color ?? '#22d96a';
  const dateObj = new Date(event.date);
  const isPast   = dateObj < new Date();
  const timeStr  = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateShort = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const attending = isAttending?.(event.id) ?? false;
  const typeMeta  = EV_TYPE_META[event.eventType];

  function handleNav() {
    const addr = encodeURIComponent([event.venue, event.city].filter(Boolean).join(', '));
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    window.open(isIOS ? `maps://maps.apple.com/?q=${addr}` : `https://maps.google.com/?q=${addr}`, '_blank');
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isPast ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.18 }}
      style={{
        borderRadius: 14, marginBottom: 8,
        backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
        display: 'flex', overflow: 'hidden',
      }}
    >
      {/* Left sport color bar */}
      <div style={{ width: 3, flexShrink: 0, backgroundColor: sportColor }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: '11px 12px' }}>

        {/* Badges + remove heart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, color: '#fff', backgroundColor: sportColor, flexShrink: 0 }}>{event.sport}</span>
          {typeMeta && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, color: typeMeta.color, backgroundColor: `${typeMeta.color}18`, flexShrink: 0 }}>
              {event.eventType === 'championship' && event.level ? event.level : typeMeta.label}
            </span>
          )}
          {isPast && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, color: '#64748b', backgroundColor: 'rgba(100,116,139,0.1)', flexShrink: 0 }}>Terminé</span>}
          <button onClick={() => onToggleFavorite(event.id)} title="Retirer des favoris"
            style={{ marginLeft: 'auto', padding: 5, borderRadius: 8, border: 'none', cursor: 'pointer', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <HeartSvg filled size={13} />
          </button>
        </div>

        {/* Title */}
        <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, color: 'var(--sl-t1)', marginBottom: 3 }}>{event.title}</div>

        {/* Championship team/level subtitle */}
        {event.eventType === 'championship' && (event.teamName || event.level) && (
          <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', marginBottom: 4 }}>
            {[event.teamName, event.level].filter(Boolean).join(' — ')}
          </div>
        )}
        {event.eventType === 'cup' && event.cupType && (
          <div style={{ fontSize: 11, fontWeight: 600, color: '#f97316', marginBottom: 4 }}>{event.cupType}</div>
        )}

        {/* Score */}
        {event.score != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--sl-t1)', fontVariantNumeric: 'tabular-nums' }}>{event.score.home}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--sl-t3)' }}>—</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--sl-t1)', fontVariantNumeric: 'tabular-nums' }}>{event.score.away}</span>
          </div>
        )}

        {/* Date + venue */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11, color: 'var(--sl-t2)', marginBottom: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><CalSvg />{dateShort} · {timeStr}</span>
          {(event.venue || event.city) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
              <PinSvg /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.venue || event.city}</span>
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onToggleAttend?.(event.id)}
            style={{
              flex: 1, padding: '7px 4px', borderRadius: 10, cursor: 'pointer',
              fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              backgroundColor: attending ? 'var(--sl-green-dim)' : 'var(--sl-surface)',
              color: attending ? 'var(--sl-green)' : 'var(--sl-t2)',
              border: `1px solid ${attending ? 'var(--sl-green)' : 'var(--sl-border-s)'}`,
              transition: 'all 0.15s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={attending ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {attending ? "J'y serai ✓" : "J'y serai"}
          </button>
          <button
            onClick={handleNav}
            style={{
              flex: 1, padding: '7px 4px', borderRadius: 10, cursor: 'pointer',
              fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
              border: '1px solid var(--sl-border-s)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            M'y rendre
          </button>
          <ShareBtn event={event} />
          <button onClick={() => downloadICS(event)} title="Ajouter au calendrier"
            style={{ width: 34, borderRadius: 10, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', color: 'var(--sl-t3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalSvg size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Date group ────────────────────────────────────────────────────────────────
function DateGroup({ label, events, onToggleFavorite, accent, isAttending, onToggleAttend }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ height: 1, flex: 1, backgroundColor: 'var(--sl-divider)' }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 999, color: accent || 'var(--sl-t2)', backgroundColor: accent ? `${accent}14` : 'var(--sl-surface)' }}>
          {label}
        </span>
        <div style={{ height: 1, flex: 1, backgroundColor: 'var(--sl-divider)' }} />
      </div>
      {events.map(e => <FavoriteCard key={e.id} event={e} onToggleFavorite={onToggleFavorite} isAttending={isAttending} onToggleAttend={onToggleAttend} />)}
    </div>
  );
}

function groupByDate(events) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(todayStart.getDate() + 1);
  const dayAfterTomorrow = new Date(todayStart); dayAfterTomorrow.setDate(todayStart.getDate() + 2);
  const nextWeekEnd = new Date(todayStart); nextWeekEnd.setDate(todayStart.getDate() + 7);
  const groups = { today: [], tomorrow: [], thisWeek: [], later: [], past: [] };
  for (const ev of events) {
    const d = new Date(ev.date);
    if (d < todayStart) groups.past.push(ev);
    else if (d < tomorrowStart) groups.today.push(ev);
    else if (d < dayAfterTomorrow) groups.tomorrow.push(ev);
    else if (d < nextWeekEnd) groups.thisWeek.push(ev);
    else groups.later.push(ev);
  }
  return groups;
}

// ── Notification banner ───────────────────────────────────────────────────────
function NotifBanner({ favoriteEvents }) {
  const [status, setStatus] = useState('Notification' in window ? Notification.permission : 'unavailable');
  if (favoriteEvents.length === 0 || status === 'granted' || status === 'unavailable') return null;
  async function handleRequest() {
    const perm = await Notification.requestPermission();
    setStatus(perm);
    if (perm === 'granted' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const now = Date.now();
      for (const event of favoriteEvents) {
        const delay = new Date(event.date).getTime() - now - 60 * 60 * 1000;
        if (delay > 0) navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_NOTIFICATION', title: `📅 ${event.title}`, body: `Dans 1h · ${event.venue || event.city}`, delay, tag: `event-${event.id}` });
      }
      new Notification('🔔 Rappels activés !', { body: `Tu seras notifié 1h avant tes ${favoriteEvents.length} événement${favoriteEvents.length > 1 ? 's' : ''} favoris.`, icon: '/Logo-sportlink-sans-fond.png' });
    }
  }
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      style={{ margin: '10px 14px 0', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--sl-green)', background: 'linear-gradient(135deg, var(--sl-green-dim), rgba(34,197,94,0.05))' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'var(--sl-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sl-green)' }}>Activer les rappels</div>
        <div style={{ fontSize: 11, color: 'var(--sl-t2)', marginTop: 1 }}>Notification 1h avant chaque événement.</div>
      </div>
      <button onClick={handleRequest} style={{ fontSize: 12, fontWeight: 700, color: '#fff', padding: '7px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-green)', flexShrink: 0 }}>Activer</button>
    </motion.div>
  );
}

// ── ICS export all ────────────────────────────────────────────────────────────
function exportAllICS(events) {
  function pad(n) { return String(n).padStart(2, '0'); }
  function toICS(d) { return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`; }
  function esc(s) { return String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  const now = new Date();
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SportLink//Finistère//FR', 'CALSCALE:GREGORIAN'];
  for (const ev of events) {
    const start = new Date(ev.date);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const loc = [ev.venue, ev.city].filter(Boolean).join(', ');
    lines.push('BEGIN:VEVENT', `UID:${ev.id}@sportlink.fr`, `DTSTAMP:${toICS(now)}`, `DTSTART:${toICS(start)}`, `DTEND:${toICS(end)}`, `SUMMARY:${esc(ev.title)}`);
    if (loc) lines.push(`LOCATION:${esc(loc)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'SportLink_Favoris.ics'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Tab 1: Matchs favoris ─────────────────────────────────────────────────────
function MatchsTab({ favoriteEvents, upcomingFavorites, onToggleFavorite, isAttending, onToggleAttend }) {
  const groups = useMemo(() => groupByDate(favoriteEvents), [favoriteEvents]);
  const [showPast, setShowPast] = useState(false);
  const hasUpcoming = groups.today.length + groups.tomorrow.length + groups.thisWeek.length + groups.later.length > 0;
  const hasAny = hasUpcoming || groups.past.length > 0;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px 24px' }}>
      <NotifBanner favoriteEvents={upcomingFavorites} />
      {upcomingFavorites.length > 0 && (
        <div style={{ padding: '10px 0 2px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => exportAllICS(upcomingFavorites)}
            title="Exporter tous les favoris dans votre calendrier"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, padding: '6px 11px', borderRadius: 9, cursor: 'pointer', color: 'var(--sl-t2)', border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Exporter .ics
          </button>
        </div>
      )}
      <AnimatePresence mode="popLayout">
        {!hasAny ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', marginTop: 72 }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 14 }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--sl-t2)' }}>Aucun favori pour l'instant</p>
            <p style={{ fontSize: 13, marginTop: 6, color: 'var(--sl-t3)' }}>Appuie sur le cœur d'un événement pour l'ajouter ici</p>
          </motion.div>
        ) : (
          <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {groups.today.length > 0    && <DateGroup label="Aujourd'hui"   events={groups.today}    onToggleFavorite={onToggleFavorite} accent="var(--sl-green)" isAttending={isAttending} onToggleAttend={onToggleAttend} />}
            {groups.tomorrow.length > 0  && <DateGroup label="Demain"        events={groups.tomorrow} onToggleFavorite={onToggleFavorite} accent="#3b82f6" isAttending={isAttending} onToggleAttend={onToggleAttend} />}
            {groups.thisWeek.length > 0  && <DateGroup label="Cette semaine" events={groups.thisWeek} onToggleFavorite={onToggleFavorite} accent="#f97316" isAttending={isAttending} onToggleAttend={onToggleAttend} />}
            {groups.later.length > 0     && <DateGroup label="Plus tard"     events={groups.later}    onToggleFavorite={onToggleFavorite} isAttending={isAttending} onToggleAttend={onToggleAttend} />}
            {groups.past.length > 0 && (
              <>
                <button
                  onClick={() => setShowPast(p => !p)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, marginBottom: showPast ? 0 : 8, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <div style={{ height: 1, flex: 1, backgroundColor: 'var(--sl-divider)' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 999, color: 'var(--sl-t3)', backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {showPast ? 'Masquer les passés' : `Passés (${groups.past.length})`}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'transform 0.2s', transform: showPast ? 'rotate(180deg)' : 'none' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </span>
                  <div style={{ height: 1, flex: 1, backgroundColor: 'var(--sl-divider)' }} />
                </button>
                <AnimatePresence>
                  {showPast && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <DateGroup label="Passés" events={groups.past} onToggleFavorite={onToggleFavorite} isAttending={isAttending} onToggleAttend={onToggleAttend} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tab 2: Clubs suivis ───────────────────────────────────────────────────────
function ClubsTab({ allEvents, allClubs, follows, onFollowClub, onUnfollowClub, onUpdateFollow }) {
  const { allSports: SPORTS } = useSports();
  const [editingClubId, setEditingClubId] = useState(null);
  const [expandedClubId, setExpandedClubId] = useState(null);

  const followedWithData = useMemo(() => {
    return follows.map(follow => {
      const club = allClubs.find(c => String(c.id) === String(follow.clubId));
      if (!club) return null;
      const clubEvents = allEvents
        .filter(e => {
          const matchesClub = String(e.clubId) === String(club.id);
          if (!matchesClub) return false;
          if (follow.teams === 'all') return true;
          return follow.teams.includes(e.teamName);
        })
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
      return { follow, club, upcomingEvents: clubEvents };
    }).filter(Boolean);
  }, [follows, allClubs, allEvents]);

  if (follows.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--sl-t2)', marginBottom: 6 }}>Aucun club suivi</p>
        <p style={{ fontSize: 13, color: 'var(--sl-t3)', textAlign: 'center' }}>Visite la page d'un club et appuie sur "Suivre" pour le retrouver ici</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 24px' }}>
      {followedWithData.map(({ follow, club, upcomingEvents }) => {
        const sportColor = SPORTS[club.sport]?.color ?? '#22d96a';
        const isExpanded = expandedClubId === club.id;
        const teamsLabel = follow.teams === 'all' ? 'Tout le club' : `${follow.teams.length} équipe${follow.teams.length > 1 ? 's' : ''}`;

        return (
          <div key={club.id} style={{ marginBottom: 10 }}>
            <div
              style={{
                borderRadius: 14, overflow: 'hidden',
                backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
              }}
            >
              {/* Club header row */}
              <div
                onClick={() => setExpandedClubId(isExpanded ? null : club.id)}
                style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, backgroundColor: `${sportColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {club.logo
                    ? <img src={club.logo} alt={club.name} loading="lazy" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                    : <SportIcon sport={club.sport} size={20} color={sportColor} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 6, color: sportColor, backgroundColor: `${sportColor}18` }}>{club.sport}</span>
                    <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{teamsLabel}</span>
                    {upcomingEvents.length > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.12)' }}>
                        {upcomingEvents.length} à venir
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setEditingClubId(club.id); }}
                    title="Modifier le suivi"
                    style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t3)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); onUnfollowClub(club.id); }}
                    title="Ne plus suivre"
                    style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round" style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {/* Upcoming events */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden', borderTop: '1px solid var(--sl-border)' }}
                  >
                    <div style={{ padding: '10px 14px 12px' }}>
                      {upcomingEvents.length === 0 ? (
                        <p style={{ fontSize: 12, color: 'var(--sl-t3)', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>Aucun événement à venir</p>
                      ) : (
                        upcomingEvents.map(ev => {
                          const d = new Date(ev.date);
                          return (
                            <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--sl-border)' }}>
                              <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: sportColor }}>{d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                                <div style={{ fontSize: 9, color: 'var(--sl-t3)' }}>{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                                <div style={{ fontSize: 10, color: 'var(--sl-t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.venue || ev.city}</div>
                              </div>
                              <button onClick={() => downloadICS(ev)} title="Ajouter au calendrier"
                                style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--sl-t3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <CalSvg size={12} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Edit follow modal */}
            {editingClubId === club.id && (
              <FollowModal
                club={club}
                allEvents={allEvents}
                currentFollow={follow}
                onSave={options => { onUpdateFollow(club.id, options); setEditingClubId(null); }}
                onClose={() => setEditingClubId(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab 3: Calendrier ─────────────────────────────────────────────────────────
const WEEK_DAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function buildGrid(date) {
  const year = date.getFullYear();
  const m = date.getMonth();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  let firstDow = new Date(year, m, 1).getDay();
  firstDow = firstDow === 0 ? 6 : firstDow - 1; // Mon-first
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function CalendarTab({ allEvents, favorites }) {
  const { allSports: SPORTS } = useSports();
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null);

  const calEvents = useMemo(() =>
    allEvents
      .filter(e => favorites.has(String(e.id)))
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth();
      }),
    [allEvents, favorites, viewMonth]
  );

  // Map day → events for quick lookup
  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const ev of calEvents) {
      const day = new Date(ev.date).getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(ev);
    }
    return map;
  }, [calEvents]);

  const cells = useMemo(() => buildGrid(viewMonth), [viewMonth]);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === viewMonth.getFullYear() && today.getMonth() === viewMonth.getMonth();

  function prevMonth() {
    setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDay(null);
  }
  function nextMonth() {
    setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDay(null);
  }

  const dayEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={prevMonth} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--sl-t1)' }}>{MONTHS_FR[viewMonth.getMonth()]}</div>
          <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{viewMonth.getFullYear()} · {calEvents.length} favori{calEvents.length !== 1 ? 's' : ''}</div>
        </div>
        <button onClick={nextMonth} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--sl-border)' }}>
          {WEEK_DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', letterSpacing: '0.05em' }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} style={{ minHeight: 48, borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--sl-border)', borderBottom: idx < cells.length - 7 ? '1px solid var(--sl-border)' : 'none' }} />;
            const isToday = isCurrentMonth && day === today.getDate();
            const evs = eventsByDay.get(day) ?? [];
            const isSelected = selectedDay === day;
            const colors = evs.slice(0, 3).map(e => SPORTS[e.sport]?.color ?? '#22d96a');

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                style={{
                  minHeight: 48, padding: '6px 4px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  cursor: evs.length > 0 || isToday ? 'pointer' : 'default',
                  backgroundColor: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
                  border: 'none',
                  borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--sl-border)',
                  borderBottom: Math.floor(idx / 7) < Math.floor(cells.length / 7) - 1 ? '1px solid var(--sl-border)' : 'none',
                  transition: 'background-color 0.12s',
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: isToday || evs.length > 0 ? 700 : 400,
                  backgroundColor: isToday ? '#3b82f6' : 'transparent',
                  color: isToday ? '#fff' : evs.length > 0 ? 'var(--sl-t1)' : 'var(--sl-t3)',
                }}>
                  {day}
                </div>
                {colors.length > 0 && (
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    {colors.map((c, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: c }} />)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 10 }}>
              {selectedDay} {MONTHS_FR[viewMonth.getMonth()]}
            </div>
            {dayEvents.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--sl-t3)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>Aucun favori ce jour</p>
            ) : (
              dayEvents.map(ev => {
                const sportColor = SPORTS[ev.sport]?.color ?? '#22d96a';
                const d = new Date(ev.date);
                return (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 8, borderRadius: 12, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
                    <div style={{ width: 3, height: 36, borderRadius: 2, backgroundColor: sportColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 5, color: sportColor, backgroundColor: `${sportColor}18` }}>{ev.sport}</span>
                      </div>
                    </div>
                    <button onClick={() => downloadICS(ev)} title="Ajouter au calendrier"
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--sl-t3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CalSvg size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {calEvents.length === 0 && (
        <div style={{ textAlign: 'center', paddingTop: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--sl-t3)', fontStyle: 'italic' }}>Aucun favori ce mois-ci</p>
        </div>
      )}
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'matchs',    label: 'Matchs',    icon: '❤️' },
  { id: 'clubs',     label: 'Clubs',     icon: '🏆' },
  { id: 'calendrier', label: 'Agenda',  icon: '📅' },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FavorisPage({ allEvents, favorites, onToggleFavorite, allClubs = [], isAttending, onToggleAttend }) {
  const { follows, followedClubs, unfollowClub, updateFollow, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('matchs');

  const favoriteEvents = useMemo(
    () => allEvents.filter(e => favorites.has(String(e.id))).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [allEvents, favorites]
  );
  const upcomingFavorites = useMemo(
    () => favoriteEvents.filter(e => new Date(e.date) >= new Date()),
    [favoriteEvents]
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
            Favoris
          </span>
          <span style={{ fontSize: 13, color: 'var(--sl-t3)', fontWeight: 500 }}>
            {favoriteEvents.length > 0 && `${favoriteEvents.length} match${favoriteEvents.length > 1 ? 's' : ''}`}
            {follows.length > 0 && ` · ${follows.length} club${follows.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '8px 6px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'var(--sl-t1)' : 'var(--sl-surface)',
                  color: isActive ? 'var(--sl-bg)' : 'var(--sl-t3)',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ marginRight: 4 }}>{tab.icon}</span>{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          {activeTab === 'matchs' && (
            <MatchsTab
              favoriteEvents={favoriteEvents}
              upcomingFavorites={upcomingFavorites}
              onToggleFavorite={onToggleFavorite}
              isAttending={isAttending}
              onToggleAttend={onToggleAttend}
            />
          )}
          {activeTab === 'clubs' && (
            <ClubsTab
              allEvents={allEvents}
              allClubs={allClubs}
              follows={follows}
              onFollowClub={() => {}}
              onUnfollowClub={unfollowClub}
              onUpdateFollow={updateFollow}
            />
          )}
          {activeTab === 'calendrier' && (
            <CalendarTab allEvents={allEvents} favorites={favorites} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
