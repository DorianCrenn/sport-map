import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import EventCard from './EventCard.jsx';

const PAGE_SIZE = 30;

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 16, padding: '12px 14px', marginBottom: 8, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'var(--sl-border)', flexShrink: 0, animation: 'sl-pulse 1.4s ease-in-out infinite' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ width: '70%', height: 12, borderRadius: 6, backgroundColor: 'var(--sl-border)', animation: 'sl-pulse 1.4s ease-in-out infinite' }} />
          <div style={{ width: '45%', height: 10, borderRadius: 6, backgroundColor: 'var(--sl-border)', animation: 'sl-pulse 1.4s ease-in-out infinite 0.1s' }} />
          <div style={{ width: '55%', height: 10, borderRadius: 6, backgroundColor: 'var(--sl-border)', animation: 'sl-pulse 1.4s ease-in-out infinite 0.2s' }} />
        </div>
      </div>
    </div>
  );
}

export default function EventSidebar({
  events,
  selectedEventId,
  onEventSelect,
  onGeolocate,
  geoLoading,
  canAddEvent,
  pendingScores = 0,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onUpdateEvent,
  isFavorite,
  onToggleFavorite,
  isAttending,
  onToggleAttend,
  loading,
}) {
  const cardRefs  = useRef({});
  const sentinelRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset pagination when event list changes
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [events]);

  // IntersectionObserver: load more when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount(n => n + PAGE_SIZE); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [events]);

  useEffect(() => {
    if (selectedEventId !== null && cardRefs.current[selectedEventId]) {
      cardRefs.current[selectedEventId].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedEventId]);

  return (
    <div style={{
      width: 380, display: 'flex', flexDirection: 'column', flexShrink: 0,
      backgroundColor: 'var(--sl-sidebar-bg)',
      borderLeft: '1px solid var(--sl-border)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px',
        flexShrink: 0,
        backgroundColor: 'var(--sl-card)',
        borderBottom: '1px solid var(--sl-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--sl-t1)', letterSpacing: '-0.01em' }}>
              {events.length} événement{events.length !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Cliquez pour localiser
            </div>
          </div>
          <button
            onClick={onGeolocate}
            disabled={geoLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600,
              padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              backgroundColor: 'var(--sl-blue-dim)', color: 'var(--sl-blue)',
              opacity: geoLoading ? 0.5 : 1,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>
            </svg>
            {geoLoading ? 'Recherche…' : 'Autour de moi'}
          </button>
        </div>

        {canAddEvent && (
          <button
            onClick={onAddEvent}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '9px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
              backgroundColor: 'var(--sl-green)', color: '#fff',
              fontSize: 13, fontWeight: 700,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Ajouter un événement
          </button>
        )}

        {pendingScores > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 10, marginTop: 6,
            backgroundColor: 'rgba(245,158,11,0.10)',
            border: '1px solid rgba(245,158,11,0.25)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#f59e0b', lineHeight: 1.35 }}>
              {pendingScores} match{pendingScores > 1 ? 's' : ''} passé{pendingScores > 1 ? 's' : ''} sans score
            </span>
          </div>
        )}
      </div>

      {/* Event list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {loading ? (
          <>{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--sl-t2)' }}>Aucun événement trouvé</p>
            <p style={{ fontSize: 12, marginTop: 4, color: 'var(--sl-t3)' }}>Essayez d'autres filtres</p>
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {events.slice(0, visibleCount).map((event) => (
                <EventCard
                  key={event.id}
                  ref={(el) => { cardRefs.current[event.id] = el; }}
                  event={event}
                  isSelected={event.id === selectedEventId}
                  onSelect={() => onEventSelect(event.id)}
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
                  onUpdateEvent={onUpdateEvent}
                  isFavorite={isFavorite}
                  onToggleFavorite={onToggleFavorite}
                  isAttending={isAttending}
                  onToggleAttend={onToggleAttend}
                />
              ))}
            </AnimatePresence>
            {visibleCount < events.length && (
              <div ref={sentinelRef} style={{ padding: '12px 0', textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>
                  {events.length - visibleCount} événement{events.length - visibleCount > 1 ? 's' : ''} de plus…
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
