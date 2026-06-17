import { motion, AnimatePresence } from 'framer-motion';

const SPORT_ICON = {
  Football:   '⚽',
  Basketball: '🏀',
  Rugby:      '🏉',
  Tennis:     '🎾',
  Handball:   '🤾',
  Volleyball: '🏐',
  Hockey:     '🏑',
};

function ClubBadge({ logo, name, size = 24 }) {
  const initials = (name ?? '?').split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?';
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        overflow: 'hidden', backgroundColor: 'var(--sl-surface)',
        border: '1.5px solid rgba(239,68,68,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {logo
        ? <img src={logo} alt={name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: 8, fontWeight: 900, color: 'var(--sl-t2)', lineHeight: 1 }}>{initials}</span>
      }
    </div>
  );
}

function LiveMatchPill({ match }) {
  const { event, matchScore, clubLogo } = match;
  const icon  = SPORT_ICON[event?.sport] ?? '🏆';
  const home  = matchScore?.score_home ?? 0;
  const away  = matchScore?.score_away ?? 0;
  const teamA = event?.team_name  || 'Domicile';
  const teamB = event?.adversaire || 'Visiteur';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl
                 border border-red-500/30 bg-red-500/5"
      style={{ minWidth: 210 }}
    >
      {clubLogo
        ? <ClubBadge logo={clubLogo} name={teamA} />
        : <span className="text-[15px]">{icon}</span>
      }
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-[var(--sl-t3)] truncate">
          {event?.team_name || event?.title || 'En direct'}
        </p>
        <p className="text-[13px] font-black text-[var(--sl-t1)] tabular-nums">
          {teamA.split(' ')[0]}
          <span className="mx-2 text-red-400">{home} – {away}</span>
          {teamB.split(' ')[0]}
        </p>
      </div>
    </motion.div>
  );
}

export default function LiveMultiplexSection({ liveMatches = [] }) {
  if (!liveMatches.length) return null;

  const isMultiplex = liveMatches.length > 1;

  return (
    <div className="px-4 pt-3" data-demo="live-multiplex">
      {/* Badge LIVE */}
      <div className="flex items-center gap-2 mb-2">
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          className="text-[10px] font-black tracking-wider px-2 py-0.5
                     rounded-full bg-red-500/15 text-red-400"
        >
          🔴 EN DIRECT
        </motion.span>
        {isMultiplex && (
          <span className="text-[10px] font-bold text-[var(--sl-t3)]">
            Multiplex · {liveMatches.length} matchs
          </span>
        )}
      </div>

      {/* Ligne de pills horizontale (scroll si trop large) */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <AnimatePresence>
          {liveMatches.map(m => (
            <LiveMatchPill key={m.event.id} match={m} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
