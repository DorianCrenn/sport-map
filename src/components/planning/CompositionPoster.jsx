import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { useEventConvocations } from '../../hooks/useEventConvocations.js';

// Statuts affichés sur l'affiche
const STATUS_FILTER = {
  all:      { label: 'Tous les convoqués',    include: ['accepted', 'pending'] },
  accepted: { label: 'Confirmés uniquement',  include: ['accepted'] },
};

function PlayerCard({ player, status }) {
  const isConfirmed = status === 'accepted';
  // Normalise les deux structures : hook réel (player.player.name) et démo (player.player_name)
  const name     = player.player?.name    ?? player.player_name ?? '?';
  const photoUrl = player.player?.photo_url ?? player.photo_url  ?? null;
  const number   = player.player?.number  ?? player.number      ?? null;
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="flex flex-col items-center gap-1" style={{ opacity: isConfirmed ? 1 : 0.65 }}>
      {/* Photo ou initiales */}
      <div
        className="relative rounded-xl overflow-hidden flex items-center justify-center"
        style={{
          width: 64, height: 64,
          background: isConfirmed ? 'rgba(34,217,106,0.15)' : 'rgba(245,158,11,0.12)',
          border: `2px ${isConfirmed ? 'solid' : 'dashed'} ${isConfirmed ? '#22d96a' : '#f59e0b'}`,
        }}
      >
        {photoUrl
          ? <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
          : <span className="text-lg font-black" style={{ color: isConfirmed ? '#22d96a' : '#f59e0b' }}>{initials}</span>
        }
        {/* Badge status */}
        <div
          className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black"
          style={{ background: isConfirmed ? '#22d96a' : '#f59e0b', color: '#000' }}
        >
          {isConfirmed ? '✓' : '⏳'}
        </div>
      </div>
      <span className="text-[9px] font-bold text-center leading-tight" style={{ color: isConfirmed ? '#e2e8f0' : '#94a3b8', maxWidth: 64, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {name}
      </span>
      {number && (
        <span className="text-[8px] font-black" style={{ color: isConfirmed ? '#22d96a' : '#f59e0b' }}>
          #{number}
        </span>
      )}
    </div>
  );
}

export default function CompositionPoster({ event, club, onClose }) {
  const { convocations, loading } = useEventConvocations(event?.id);
  const [showFilter, setShowFilter] = useState('all');
  const [exporting,  setExporting]  = useState(false);
  const posterRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const displayedPlayers = convocations.filter(c =>
    STATUS_FILTER[showFilter].include.includes(c.status)
  );

  const confirmed = displayedPlayers.filter(p => p.status === 'accepted');
  const pending   = displayedPlayers.filter(p => p.status === 'pending');
  const ordered   = [...confirmed, ...pending];

  const matchDate  = event?.date ? new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  const matchTime  = event?.date ? new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  const clubPrimary = club?.primary_color ?? '#1d4ed8';

  const handleExport = useCallback(async () => {
    if (!posterRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(posterRef.current, { pixelRatio: 3, cacheBust: true });
      const link    = document.createElement('a');
      link.download = `groupe-${(event?.adversaire ?? 'match').toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href     = dataUrl;
      link.click();
    } catch (err) {
      console.error('[CompositionPoster] export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [event?.adversaire]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col bg-black/70 overscroll-contain"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Barre d'outils */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm flex-shrink-0">
          <button onClick={onClose} className="text-white/70 text-sm font-semibold hover:text-white transition-colors">
            ✕ Fermer
          </button>
          <h2 className="text-white font-bold text-sm">Affiche du groupe</h2>
          <button
            onClick={handleExport}
            disabled={exporting || ordered.length === 0}
            className="text-xs font-bold px-3 py-1.5 rounded-lg text-black transition-opacity disabled:opacity-40"
            style={{ background: '#22d96a' }}
          >
            {exporting ? '…' : '⬇ Exporter'}
          </button>
        </div>

        {/* Filtre toggle */}
        <div className="flex justify-center gap-2 py-2 bg-black/60 flex-shrink-0">
          {Object.entries(STATUS_FILTER).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setShowFilter(key)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all"
              style={showFilter === key
                ? { background: '#22d96a', color: '#000' }
                : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }
              }
            >
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Zone scrollable */}
        <div className="flex-1 overflow-y-auto flex items-start justify-center p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-white/50 text-sm">Chargement des convocations…</span>
            </div>
          ) : (
            /* Poster exportable */
            <div
              ref={posterRef}
              style={{
                width: 360,
                minHeight: 480,
                background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
                borderRadius: 20,
                overflow: 'hidden',
                fontFamily: "'Inter', sans-serif",
                flexShrink: 0,
              }}
            >
              {/* Header club + match */}
              <div style={{ background: `linear-gradient(135deg, ${clubPrimary}dd, ${clubPrimary}88)`, padding: '20px 16px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  {club?.logo_url
                    ? <img src={club.logo_url} alt={club.name} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 8 }} />
                    : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{(club?.name ?? 'FC')[0]}</span>
                      </div>
                  }
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Notre groupe</div>
                    <div style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{confirmed.length} confirmé{confirmed.length > 1 ? 's' : ''}{pending.length > 0 ? ` · ${pending.length} en attente` : ''}</div>
                  </div>
                </div>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 900, lineHeight: 1.2 }}>
                  {event?.adversaire ? `vs ${event.adversaire}` : event?.title ?? 'Match'}
                </div>
                {matchDate && (
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 4 }}>
                    {matchDate}{matchTime ? ` · ${matchTime}` : ''}
                  </div>
                )}
                {event?.location && (
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 }}>📍 {event.location}</div>
                )}
              </div>

              {/* Légende */}
              <div style={{ display: 'flex', gap: 12, padding: '10px 16px 0', fontSize: 9, fontWeight: 700 }}>
                <span style={{ color: '#22d96a' }}>✓ Confirmé</span>
                <span style={{ color: '#f59e0b' }}>⏳ En attente</span>
              </div>

              {/* Grille joueurs */}
              {ordered.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '12px 16px 20px' }}>
                  {ordered.map((p, i) => (
                    <PlayerCard key={p.id ?? i} player={p} status={p.status} />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '32px 16px' }}>
                  Aucun joueur à afficher
                </div>
              )}

              {/* Footer watermark */}
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 8, paddingBottom: 12, letterSpacing: '0.1em' }}>
                {club?.name ?? 'SportLink'} · sportlink.app
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
