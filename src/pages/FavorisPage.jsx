import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
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

function FavoriteCard({ event, onToggleFavorite }) {
  const { allSports: SPORTS } = useSports();
  const group = SPORTS[event.sport];
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${group?.color}18` }}>
            <SportIcon sport={event.sport} size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold mb-0.5 font-inter" style={{ color: group?.color }}>{event.sport}</div>
            <div className="font-semibold text-gray-800 text-sm leading-tight font-oswald tracking-wide">{event.title}</div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 font-oswald">
              <CalendarSvg />
              <span>{dateStr} · {timeStr}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5 font-inter">
              <PinSvg />
              <span className="truncate">{event.venue || event.city}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onToggleFavorite(event.id)}
          className="p-2 rounded-xl transition-colors cursor-pointer flex-shrink-0"
          style={{ color: '#ef4444', backgroundColor: '#fef2f2' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
    </motion.div>
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
      style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', borderColor: '#BBF7D0' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#22C55E' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm font-poppins" style={{ color: '#15803d' }}>Activer les rappels</div>
        <div className="text-xs" style={{ color: '#16a34a' }}>Reçois une notification 1h avant chaque événement.</div>
      </div>
      <button onClick={handleRequest}
        className="text-xs font-bold text-white px-3 py-1.5 rounded-xl flex-shrink-0 cursor-pointer"
        style={{ backgroundColor: '#22C55E' }}>
        Activer
      </button>
    </motion.div>
  );
}

export default function FavorisPage({ allEvents, favorites, onToggleFavorite }) {
  const favoriteEvents = allEvents.filter((e) => favorites.has(e.id))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="px-4 pt-4 pb-1">
        <p className="text-sm text-gray-500">
          {favoriteEvents.length} événement{favoriteEvents.length !== 1 ? 's' : ''} sauvegardé{favoriteEvents.length !== 1 ? 's' : ''}
        </p>
      </div>
      <NotifBanner favoriteEvents={favoriteEvents} />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="popLayout">
          {favoriteEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-20"
            >
              <div className="flex justify-center mb-4">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Aucun favori pour l'instant</p>
              <p className="text-gray-400 text-sm mt-1">Appuyez sur le cœur d'un événement pour l'ajouter ici</p>
            </motion.div>
          ) : (
            favoriteEvents.map((event) => (
              <FavoriteCard key={event.id} event={event} onToggleFavorite={onToggleFavorite} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
