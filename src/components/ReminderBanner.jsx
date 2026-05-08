import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function scheduleNotifications(events) {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
  const now = Date.now();
  for (const event of events) {
    const eventTime = new Date(event.date).getTime();
    const oneHourBefore = eventTime - 60 * 60 * 1000;
    const delay = oneHourBefore - now;
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      title: `📅 ${event.title}`,
      body: `Dans 1h · ${event.venue || event.city}`,
      delay: Math.max(0, delay),
      tag: `event-${event.id}`,
    });
  }
}

export default function ReminderBanner({ today, tomorrow, onNavigateToFavoris }) {
  const [dismissed, setDismissed] = useState(false);
  const [notifStatus, setNotifStatus] = useState(
    'Notification' in window ? Notification.permission : 'unavailable'
  );

  const total = today.length + tomorrow.length;
  if (total === 0 || dismissed) return null;

  const label = today.length > 0
    ? `${today.length} événement${today.length > 1 ? 's' : ''} favori${today.length > 1 ? 's' : ''} aujourd'hui`
    : `${tomorrow.length} événement${tomorrow.length > 1 ? 's' : ''} favori${tomorrow.length > 1 ? 's' : ''} demain`;

  const firstEvent = today[0] || tomorrow[0];
  const firstTime = new Date(firstEvent.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  async function handleEnableNotif() {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifStatus(perm);
    if (perm === 'granted') {
      scheduleNotifications([...today, ...tomorrow]);
      new Notification('🔔 SportLink — Rappels activés', {
        body: label,
        icon: '/Logo-sportlink-sans-fond.png',
      });
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="mx-3 mt-2 rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F1E3A, #1a3460)', boxShadow: '0 4px 20px rgba(15,30,58,0.25)' }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Bell icon */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(34,197,94,0.2)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="font-bold font-poppins text-white text-xs truncate">{label}</div>
            <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Prochain : {firstEvent.title} · {firstTime}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {notifStatus === 'default' && (
              <button onClick={handleEnableNotif}
                className="text-xs font-bold font-poppins text-white px-2.5 py-1.5 rounded-xl cursor-pointer"
                style={{ backgroundColor: '#22C55E' }}>
                🔔
              </button>
            )}
            <button onClick={() => onNavigateToFavoris?.()}
              className="text-xs font-semibold font-poppins px-2.5 py-1.5 rounded-xl cursor-pointer"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white' }}>
              Voir
            </button>
            <button onClick={() => setDismissed(true)}
              className="p-1.5 rounded-xl cursor-pointer"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
