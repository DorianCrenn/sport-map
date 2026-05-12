import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useShare } from '../hooks/useShare.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { downloadICS } from '../utils/exportICS.js';
import SportIcon from './SportIcon.jsx';
import PosterStudio from './PosterStudio.jsx';

const EVENT_TYPE_META = {
  championship: { label: 'Championnat', color: '#3b82f6' },
  cup:          { label: 'Coupe',        color: '#f97316' },
  friendly:     { label: 'Amical',       color: '#22d96a' },
};

const STATUS_META = {
  upcoming:  { label: 'À venir',     color: '#4da6ff', bg: 'rgba(77,166,255,0.12)' },
  live:      { label: '● En direct', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  done:      { label: 'Terminé',     color: '#64748b', bg: 'rgba(100,116,139,0.10)' },
  postponed: { label: 'Reporté',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  cancelled: { label: 'Annulé',      color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
};

function getEffectiveStatus(event) {
  if (event.status && event.status !== 'upcoming') return event.status;
  return new Date(event.date) < new Date() ? 'done' : 'upcoming';
}

function QuickScoreEdit({ event, onUpdateEvent }) {
  const [home, setHome] = useState(String(event.score?.home ?? ''));
  const [away, setAway] = useState(String(event.score?.away ?? ''));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHome(String(event.score?.home ?? ''));
    setAway(String(event.score?.away ?? ''));
  }, [event.score?.home, event.score?.away]);

  function handleSave() {
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    onUpdateEvent(event.id, { score: { home: h, away: a } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ borderTop: '1px solid var(--sl-border)', paddingTop: 14, marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        {event.score != null ? 'Modifier le score' : 'Saisir le score'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="number" min="0" max="99" value={home}
          onChange={e => setHome(e.target.value)}
          aria-label="Score domicile"
          style={{ width: 60, textAlign: 'center', fontWeight: 800, fontSize: 22, padding: '8px 0', borderRadius: 12, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)', color: 'var(--sl-t1)' }}
        />
        <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--sl-t3)' }}>—</span>
        <input
          type="number" min="0" max="99" value={away}
          onChange={e => setAway(e.target.value)}
          aria-label="Score extérieur"
          style={{ width: 60, textAlign: 'center', fontWeight: 800, fontSize: 22, padding: '8px 0', borderRadius: 12, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)', color: 'var(--sl-t1)' }}
        />
        <button
          onClick={handleSave}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 12,
            border: saved ? '1px solid var(--sl-green)' : 'none',
            cursor: 'pointer', fontSize: 14, fontWeight: 700,
            backgroundColor: saved ? 'var(--sl-green-dim)' : 'var(--sl-green)',
            color: saved ? 'var(--sl-green)' : '#fff', transition: 'all 0.15s',
          }}
        >
          {saved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

export default function MobileEventSheet({
  event, onClose, onEdit, onDelete, onUpdateEvent,
  isFavorite, onToggleFavorite,
  isAttending, onToggleAttend,
}) {
  const { allSports: SPORTS } = useSports();
  const { share } = useShare();
  const { currentUser, isAdmin } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPoster, setShowPoster] = useState(false);

  const group = SPORTS[event.sport];
  const sportColor = group?.color ?? '#22d96a';
  const fav = isFavorite?.(event.id) ?? false;
  const attending = isAttending?.(event.id) ?? false;
  const isPast = new Date(event.date) < new Date();
  const canEditThis = event.source === 'user' && (!event.creatorId || event.creatorId === currentUser?.id || isAdmin);
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const typeMeta = EVENT_TYPE_META[event.eventType];
  const typeDisplay = event.eventType === 'championship'
    ? (event.level || typeMeta?.label)
    : event.eventType === 'cup' && event.cupType
      ? event.cupType.replace(/^Coupe (?:de |du |d'|des )?/i, '') || event.cupType
      : typeMeta?.label;
  const status = getEffectiveStatus(event);
  const statusMeta = STATUS_META[status];

  async function handleShare() {
    const lines = [event.title, `📅 ${dateStr} à ${timeStr}`];
    const venue = event.venue || event.city;
    if (venue) lines.push(`📍 ${venue}`);
    const result = await share({ title: event.title, text: lines.join('\n'), url: window.location.href });
    if (result.success && result.method === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleNav() {
    const addr = encodeURIComponent([event.venue, event.city].filter(Boolean).join(', '));
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    window.open(isIOS ? `maps://maps.apple.com/?q=${addr}` : `https://maps.google.com/?q=${addr}`, '_blank');
  }

  function handleDragEnd(_, info) {
    const { offset, velocity } = info;
    if (!isExpanded) {
      // Collapsed: swipe up → expand, swipe down → close
      if (offset.y < -80 || velocity.y < -500) setIsExpanded(true);
      else if (offset.y > 80 || velocity.y > 400) onClose();
    }
    // In expanded state we don't drag (scroll takes over)
  }

  return (
    <>
    <motion.div
      drag={isExpanded ? false : 'y'}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.2, bottom: 0.4 }}
      onDragEnd={handleDragEnd}
      initial={{ y: '100%' }}
      animate={{ y: 0, height: isExpanded ? '88dvh' : '52dvh' }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 40 }}
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        borderRadius: '22px 22px 0 0',
        backgroundColor: 'var(--sl-card)',
        zIndex: 1100,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        border: '1px solid var(--sl-border)', borderBottom: 'none',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        touchAction: isExpanded ? 'auto' : 'none',
      }}
    >
      {/* Drag handle + collapse button */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px 6px', position: 'relative' }}>
        <div style={{ width: 36, height: 3, borderRadius: 999, backgroundColor: 'var(--sl-border-s)' }} />
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: 8,
              backgroundColor: 'var(--sl-surface)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--sl-t3)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        )}
      </div>

      {/* Sport color bar */}
      <div style={{ height: 3, backgroundColor: sportColor, flexShrink: 0 }} />

      {/* Scrollable content */}
      <div style={{
        flex: 1, overflowY: isExpanded ? 'auto' : 'hidden',
        padding: '16px 16px 32px',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, color: '#fff', backgroundColor: sportColor }}>
              <SportIcon sport={event.sport} size={14} color="white" />
              {event.sport}
            </span>
            {status !== 'upcoming' && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, color: statusMeta.color, backgroundColor: statusMeta.bg }}>
                {statusMeta.label}
              </span>
            )}
            {typeMeta && (
              <span style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 6,
                color: typeMeta.color, backgroundColor: `${typeMeta.color}20`,
                fontWeight: event.eventType === 'championship' ? 800 : 700,
                letterSpacing: event.eventType === 'championship' && event.level ? '0.05em' : 0,
              }}>
                {typeDisplay}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {onToggleFavorite && (
              <button onClick={() => onToggleFavorite(event.id)} style={{ padding: 8, borderRadius: 10, border: 'none', cursor: 'pointer', backgroundColor: fav ? 'rgba(239,68,68,0.12)' : 'transparent', color: fav ? '#ef4444' : 'var(--sl-t3)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
            )}
            <button onClick={onClose} style={{ padding: 8, borderRadius: 10, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--sl-t1)', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>
          {event.title}
        </h2>

        {/* Championship / Cup subtitle */}
        {event.eventType === 'championship' && (event.teamName || event.level) && (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', marginBottom: 10, opacity: 0.9 }}>
            {[event.teamName, event.level].filter(Boolean).join(' — ')}
          </div>
        )}
        {event.eventType === 'cup' && event.cupType && (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f97316', marginBottom: 10, opacity: 0.9 }}>
            {event.cupType}
          </div>
        )}

        {/* Score display */}
        {event.score != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--sl-t1)', fontVariantNumeric: 'tabular-nums' }}>{event.score.home}</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--sl-t3)' }}>—</span>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--sl-t1)', fontVariantNumeric: 'tabular-nums' }}>{event.score.away}</span>
          </div>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <MetaRow icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}>
            <div style={{ fontWeight: 600, color: 'var(--sl-t1)', fontSize: 13 }}>{dateStr}</div>
            <div style={{ fontSize: 12, color: 'var(--sl-t3)' }}>à {timeStr}</div>
          </MetaRow>
          {(event.venue || event.city) && (
            <MetaRow icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}>
              <div style={{ fontSize: 13, color: 'var(--sl-t1)', fontWeight: 500 }}>{event.venue || event.city}</div>
              {event.venue && event.city && <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{event.city}</div>}
            </MetaRow>
          )}
        </div>

        {/* Social actions — always visible */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggleAttend?.(event.id)}
            style={{
              padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              backgroundColor: attending ? 'var(--sl-green-dim)' : 'var(--sl-surface)',
              color: attending ? 'var(--sl-green)' : 'var(--sl-t2)',
              border: `1px solid ${attending ? 'var(--sl-green)' : 'transparent'}`,
              transition: 'all 0.15s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={attending ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {attending ? "J'y serai ✓" : "J'y serai"}
          </motion.button>
          <button onClick={handleNav} style={{ padding: '12px 0', borderRadius: 12, border: '1px solid var(--sl-border-s)', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            M'y rendre
          </button>
        </div>

        {/* Hint to expand if collapsed */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            style={{
              width: '100%', padding: '9px 0', borderRadius: 10,
              backgroundColor: 'var(--sl-surface)',
              border: '1px solid var(--sl-border)',
              color: 'var(--sl-t3)', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
            Voir les détails, partager, calendrier
          </button>
        )}

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, marginTop: 4 }}>
                <button onClick={handleShare} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: '1px solid var(--sl-border-s)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: copied ? 'var(--sl-green-dim)' : 'transparent', color: copied ? 'var(--sl-green)' : 'var(--sl-t2)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  {copied ? 'Copié !' : 'Partager'}
                </button>
                <button onClick={() => downloadICS(event)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: '1px solid var(--sl-border-s)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'transparent', color: 'var(--sl-t2)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Calendrier
                </button>
                <button onClick={() => setShowPoster(true)} aria-label="Créer une affiche" style={{ width: 44, padding: '10px 0', borderRadius: 12, border: '1px solid var(--sl-border-s)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', color: 'var(--sl-t2)', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </button>
              </div>

              {event.description && (
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--sl-t2)', borderTop: '1px solid var(--sl-border)', paddingTop: 14, marginBottom: 14 }}>
                  {event.description}
                </p>
              )}

              {event.standings && (
                <div style={{ borderTop: '1px solid var(--sl-border)', paddingTop: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, color: 'var(--sl-t3)' }}>Classement</div>
                  {[event.standings.home, event.standings.away].map((team) => {
                    const p = (team.wins ?? 0) + (team.draws ?? 0) + (team.losses ?? 0);
                    return (
                      <div key={team.team} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--sl-border)' }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)' }}>{team.rank}</span>
                        <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sl-t1)' }}>{team.team}</span>
                        <span style={{ width: 24, textAlign: 'center', color: 'var(--sl-t3)', fontSize: 12 }}>{p || '-'}</span>
                        <span style={{ width: 20, textAlign: 'center', color: '#22d96a', fontWeight: 600, fontSize: 12 }}>{team.wins ?? '-'}</span>
                        <span style={{ width: 20, textAlign: 'center', color: 'var(--sl-t3)', fontSize: 12 }}>{team.draws ?? '-'}</span>
                        <span style={{ width: 20, textAlign: 'center', color: '#ef4444', fontSize: 12 }}>{team.losses ?? '-'}</span>
                        {team.points != null && <span style={{ width: 24, textAlign: 'center', fontWeight: 700, fontSize: 12, color: 'var(--sl-t1)' }}>{team.points}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {canEditThis && isPast && onUpdateEvent && (
                <QuickScoreEdit event={event} onUpdateEvent={onUpdateEvent} />
              )}

              {canEditThis && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => onEdit(event)} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#4da6ff', backgroundColor: 'rgba(77,166,255,0.10)' }}>Modifier</button>
                  <button onClick={() => onDelete(event.id)} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.10)' }}>Supprimer</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>

    {showPoster && <PosterStudio event={event} onClose={() => setShowPoster(false)} />}
  </>
  );
}

function MetaRow({ icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)', marginTop: 2 }}>
        {icon}
      </div>
      <div>{children}</div>
    </div>
  );
}
