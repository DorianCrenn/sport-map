import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useShare } from '../hooks/useShare.js';
import SportIcon from '../components/SportIcon.jsx';

const CalendarSvg = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const PinSvg = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

function ShareButton({ event }) {
  const { share } = useShare();
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const result = await share({
      title: event.title,
      text: `${event.title} — ${new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`,
      url: window.location.href,
    });
    if (result.success && result.method === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleShare}
      title={copied ? 'Lien copié !' : 'Partager'}
      className="p-1.5 rounded-lg transition-colors cursor-pointer"
      style={{ color: copied ? 'var(--sl-green)' : 'var(--sl-t3)', backgroundColor: copied ? 'var(--sl-green-dim)' : 'transparent' }}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      )}
    </button>
  );
}

function FavoriteCard({ event, onToggleFavorite }) {
  const { allSports: SPORTS } = useSports();
  const group = SPORTS[event.sport];
  const dateObj = new Date(event.date);
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const isPast = dateObj < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isPast ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl p-4 mb-2.5"
      style={{
        backgroundColor: 'var(--sl-card)',
        boxShadow: 'var(--sl-shadow)',
        border: '1px solid var(--sl-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${group?.color}18` }}>
            <SportIcon sport={event.sport} size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold mb-0.5 font-inter" style={{ color: group?.color }}>{event.sport}</div>
            <div className="font-semibold text-sm leading-tight font-oswald tracking-wide" style={{ color: 'var(--sl-t1)' }}>{event.title}</div>
            <div className="flex items-center gap-1 text-xs mt-1 font-oswald" style={{ color: 'var(--sl-t2)' }}>
              <CalendarSvg />
              <span>{timeStr}</span>
            </div>
            <div className="flex items-center gap-1 text-xs mt-0.5 font-inter" style={{ color: 'var(--sl-t3)' }}>
              <PinSvg />
              <span className="truncate">{event.venue || event.city}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <ShareButton event={event} />
          <button
            onClick={() => onToggleFavorite(event.id)}
            className="p-2 rounded-xl transition-colors cursor-pointer"
            style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DateGroup({ label, events, onToggleFavorite, accent }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--sl-divider)' }} />
        <span
          className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ color: accent || 'var(--sl-t2)', backgroundColor: accent ? `${accent}14` : 'var(--sl-surface)' }}
        >
          {label}
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--sl-divider)' }} />
      </div>
      {events.map((event) => (
        <FavoriteCard key={event.id} event={event} onToggleFavorite={onToggleFavorite} />
      ))}
    </div>
  );
}

function NotifBanner({ favoriteEvents }) {
  const [status, setStatus] = useState(
    'Notification' in window ? Notification.permission : 'unavailable'
  );

  if (favoriteEvents.length === 0 || status === 'granted' || status === 'unavailable') return null;

  async function handleRequest() {
    const perm = await Notification.requestPermission();
    setStatus(perm);
    if (perm === 'granted' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const now = Date.now();
      for (const event of favoriteEvents) {
        const delay = new Date(event.date).getTime() - now - 60 * 60 * 1000;
        if (delay > 0) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_NOTIFICATION',
            title: `📅 ${event.title}`,
            body: `Dans 1h · ${event.venue || event.city}`,
            delay,
            tag: `event-${event.id}`,
          });
        }
      }
      new Notification('🔔 Rappels activés !', {
        body: `Tu seras notifié 1h avant tes ${favoriteEvents.length} événement${favoriteEvents.length > 1 ? 's' : ''} favoris.`,
        icon: '/Logo-sportlink-sans-fond.png',
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-3 mb-1 rounded-2xl p-3.5 flex items-center gap-3 border"
      style={{
        background: 'linear-gradient(135deg, var(--sl-green-dim), rgba(34,197,94,0.08))',
        borderColor: 'var(--sl-green)',
      }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--sl-green)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm font-poppins" style={{ color: 'var(--sl-green)' }}>Activer les rappels</div>
        <div className="text-xs" style={{ color: 'var(--sl-t2)' }}>Reçois une notification 1h avant chaque événement.</div>
      </div>
      <button onClick={handleRequest}
        className="text-xs font-bold text-white px-3 py-1.5 rounded-xl flex-shrink-0 cursor-pointer"
        style={{ backgroundColor: 'var(--sl-green)' }}>
        Activer
      </button>
    </motion.div>
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

export default function FavorisPage({ allEvents, favorites, onToggleFavorite }) {
  const favoriteEvents = useMemo(
    () => allEvents.filter((e) => favorites.has(e.id)).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [allEvents, favorites]
  );

  const upcomingFavorites = useMemo(
    () => favoriteEvents.filter((e) => new Date(e.date) >= new Date()),
    [favoriteEvents]
  );

  const groups = useMemo(() => groupByDate(favoriteEvents), [favoriteEvents]);

  const hasGroups = groups.today.length + groups.tomorrow.length + groups.thisWeek.length + groups.later.length + groups.past.length > 0;

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--sl-bg)' }}>
      <div className="px-4 pt-4 pb-1">
        <p className="text-sm" style={{ color: 'var(--sl-t2)' }}>
          {favoriteEvents.length} événement{favoriteEvents.length !== 1 ? 's' : ''} sauvegardé{favoriteEvents.length !== 1 ? 's' : ''}
          {upcomingFavorites.length > 0 && (
            <span className="ml-1.5 font-semibold" style={{ color: 'var(--sl-green)' }}>· {upcomingFavorites.length} à venir</span>
          )}
        </p>
      </div>
      <NotifBanner favoriteEvents={upcomingFavorites} />

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6">
        <AnimatePresence mode="popLayout">
          {!hasGroups ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-20"
            >
              <div className="flex justify-center mb-4">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <p className="font-medium" style={{ color: 'var(--sl-t2)' }}>Aucun favori pour l'instant</p>
              <p className="text-sm mt-1" style={{ color: 'var(--sl-t3)' }}>Appuyez sur le cœur d'un événement pour l'ajouter ici</p>
            </motion.div>
          ) : (
            <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {groups.today.length > 0 && (
                <DateGroup label="Aujourd'hui" events={groups.today} onToggleFavorite={onToggleFavorite} accent="#22C55E" />
              )}
              {groups.tomorrow.length > 0 && (
                <DateGroup label="Demain" events={groups.tomorrow} onToggleFavorite={onToggleFavorite} accent="#3b82f6" />
              )}
              {groups.thisWeek.length > 0 && (
                <DateGroup label="Cette semaine" events={groups.thisWeek} onToggleFavorite={onToggleFavorite} accent="#f97316" />
              )}
              {groups.later.length > 0 && (
                <DateGroup label="Plus tard" events={groups.later} onToggleFavorite={onToggleFavorite} />
              )}
              {groups.past.length > 0 && (
                <DateGroup label="Passés" events={groups.past} onToggleFavorite={onToggleFavorite} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
