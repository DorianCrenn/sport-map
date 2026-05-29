import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../../hooks/useSports.js';
import { useShare } from '../../hooks/useShare.js';
import { useAttendeeCount } from '../../contexts/AttendeeCountContext.jsx';
import { downloadICS } from '../../utils/exportICS.js';
import { groupByDate } from '../../lib/dateUtils.js';

// ── Tiny shared icons ─────────────────────────────────────────────────────────
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

const EV_TYPE_META = {
  championship: { label: 'Championnat', color: '#3b82f6' },
  cup:          { label: 'Coupe',       color: '#f97316' },
  friendly:     { label: 'Amical',      color: '#22d96a' },
};

// ── Share button ──────────────────────────────────────────────────────────────
function ShareBtn({ event }) {
  const { share } = useShare();
  const [copied, setCopied] = useState(false);
  async function handle() {
    const dateObj = new Date(event.date);
    const eventUrl = `${window.location.origin}${window.location.pathname}#event/${event.id}`;
    const r = await share({
      title: event.title,
      text: `${event.title}\n📅 ${dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n📍 ${event.venue || event.city || ''}`,
      url: eventUrl,
    });
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

// ── Favorite event card ───────────────────────────────────────────────────────
function FavoriteCard({ event, onToggleFavorite, isAttending, onToggleAttend }) {
  const { allSports: SPORTS } = useSports();
  const sportColor    = SPORTS[event.sport]?.color ?? '#22d96a';
  const attendeeCount = useAttendeeCount(event.id);
  const dateObj   = new Date(event.date);
  const isPast    = dateObj < new Date();
  const timeStr   = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
      style={{ borderRadius: 14, marginBottom: 8, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', display: 'flex', overflow: 'hidden' }}
    >
      <div style={{ width: 3, flexShrink: 0, backgroundColor: sportColor }} />
      <div style={{ flex: 1, minWidth: 0, padding: '11px 12px' }}>
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
        <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, color: 'var(--sl-t1)', marginBottom: 3 }}>{event.title}</div>
        {event.eventType === 'championship' && (event.teamName || event.level) && (
          <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', marginBottom: 4 }}>{[event.teamName, event.level].filter(Boolean).join(' — ')}</div>
        )}
        {event.eventType === 'cup' && event.cupType && (
          <div style={{ fontSize: 11, fontWeight: 600, color: '#f97316', marginBottom: 4 }}>{event.cupType}</div>
        )}
        {event.score != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--sl-t1)', fontVariantNumeric: 'tabular-nums' }}>{event.score.home}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--sl-t3)' }}>—</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--sl-t1)', fontVariantNumeric: 'tabular-nums' }}>{event.score.away}</span>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11, color: 'var(--sl-t2)', marginBottom: attendeeCount > 0 ? 6 : 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><CalSvg />{dateShort} · {timeStr}</span>
          {(event.venue || event.city) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
              <PinSvg /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.venue || event.city}</span>
            </span>
          )}
        </div>
        {attendeeCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'var(--sl-green)', marginBottom: 8 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {attendeeCount} personne{attendeeCount > 1 ? 's' : ''} J'y serai
          </div>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onToggleAttend?.(event.id)}
            style={{
              flex: 1, padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
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
            style={{ flex: 1, padding: '10px 4px', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', border: '1px solid var(--sl-border-s)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            M'y rendre
          </button>
          <ShareBtn event={event} />
          <button onClick={() => downloadICS(event)} title="Ajouter au calendrier"
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', color: 'var(--sl-t3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      new Notification('🔔 Rappels activés !', { body: `Tu seras notifié 1h avant tes ${favoriteEvents.length} événement${favoriteEvents.length > 1 ? 's' : ''} favoris.`, icon: '/icon-192.png' });
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
  function toICS(d) { return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`; }
  function esc(s) { return String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  const now = new Date();
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SportLink//Finistère//FR', 'CALSCALE:GREGORIAN'];
  for (const ev of events) {
    const start = new Date(ev.date);
    const end   = new Date(start.getTime() + 90 * 60 * 1000);
    const loc   = [ev.venue, ev.city].filter(Boolean).join(', ');
    lines.push('BEGIN:VEVENT', `UID:${ev.id}@sportlink.fr`, `DTSTAMP:${toICS(now)}`, `DTSTART:${toICS(start)}`, `DTEND:${toICS(end)}`, `SUMMARY:${esc(ev.title)}`);
    if (loc) lines.push(`LOCATION:${esc(loc)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'SportLink_Favoris.ics'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── MatchsTab ─────────────────────────────────────────────────────────────────
export default function MatchsTab({ favoriteEvents, upcomingFavorites, onToggleFavorite, isAttending, onToggleAttend }) {
  const groups = useMemo(() => groupByDate(favoriteEvents), [favoriteEvents]);
  const [showPast, setShowPast] = useState(false);
  const hasUpcoming = groups.today.length + groups.tomorrow.length + groups.thisWeek.length + groups.later.length > 0;
  const hasAny = hasUpcoming || groups.past.length > 0;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px calc(90px + env(safe-area-inset-bottom, 0px))' }}>
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
            {groups.today.length > 0   && <DateGroup label="Aujourd'hui"   events={groups.today}    onToggleFavorite={onToggleFavorite} accent="var(--sl-green)" isAttending={isAttending} onToggleAttend={onToggleAttend} />}
            {groups.tomorrow.length > 0 && <DateGroup label="Demain"        events={groups.tomorrow} onToggleFavorite={onToggleFavorite} accent="#3b82f6" isAttending={isAttending} onToggleAttend={onToggleAttend} />}
            {groups.thisWeek.length > 0 && <DateGroup label="Cette semaine" events={groups.thisWeek} onToggleFavorite={onToggleFavorite} accent="#f97316" isAttending={isAttending} onToggleAttend={onToggleAttend} />}
            {groups.later.length > 0   && <DateGroup label="Plus tard"     events={groups.later}    onToggleFavorite={onToggleFavorite} isAttending={isAttending} onToggleAttend={onToggleAttend} />}
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
