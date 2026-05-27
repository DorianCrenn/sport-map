import { useState } from 'react';
import { useClubPlayers } from '../../../hooks/useClubPlayers.js';
import ClaimPlayerModal from '../../ClaimPlayerModal.jsx';

const POSITION_COLORS = {
  'Gardien':   '#f59e0b',
  'Défenseur': '#3b82f6',
  'Milieu':    '#22c55e',
  'Attaquant': '#ef4444',
};

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

function PlayerCard({ player, currentUser, onClaim }) {
  const posColor = POSITION_COLORS[player.position] ?? '#64748b';
  const isLinked = !!player.user_id;
  const isMine   = currentUser && player.user_id === currentUser.id;

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 transition-colors">
      {/* Numéro */}
      <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm font-poppins"
        style={{ backgroundColor: `${posColor}18`, color: posColor }}>
        {player.number ?? '—'}
      </div>

      {/* Photo ou avatar */}
      {player.photo_url
        ? <img src={player.photo_url} alt={player.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        : (
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-400">
            {player.name.slice(0, 1).toUpperCase()}
          </div>
        )
      }

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm font-poppins truncate" style={{ color: '#0F1E3A' }}>
          {player.name}
          {isMine && <span className="ml-1.5 text-[10px] text-green-500 font-bold">• toi</span>}
        </div>
        {player.position && (
          <div className="text-xs font-medium mt-0.5" style={{ color: posColor }}>{player.position}</div>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isLinked && (
          <span className="text-green-500" title="Compte lié"><UserIcon /></span>
        )}
        {!isLinked && currentUser && onClaim && (
          <button
            onClick={() => onClaim(player)}
            className="text-[10px] px-2.5 py-1 rounded-full font-semibold border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            C'est moi / mon enfant
          </button>
        )}
      </div>
    </div>
  );
}

export default function RosterBlock({ data, clubId, currentUser }) {
  const teamId = data?.teamId ?? null;
  const { players, loading } = useClubPlayers(clubId, teamId);
  const [claimTarget, setClaimTarget] = useState(null);

  if (loading) return <div className="text-xs text-gray-400 py-4 text-center">Chargement…</div>;
  if (!players.length) return (
    <p className="text-sm text-gray-400 italic py-3 text-center">Aucun joueur dans cet effectif.</p>
  );

  // Grouper par position
  const ORDER = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'];
  const byPosition = players.reduce((acc, p) => {
    const key = ORDER.includes(p.position) ? p.position : 'Autre';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
  const sortedPositions = [...ORDER.filter(k => byPosition[k]), ...(byPosition['Autre'] ? ['Autre'] : [])];

  return (
    <div className="space-y-4">
      {sortedPositions.map(pos => (
        <div key={pos}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: POSITION_COLORS[pos] ?? '#64748b' }}>
            {pos} ({byPosition[pos].length})
          </p>
          <div className="space-y-1.5">
            {byPosition[pos].map(p => (
              <PlayerCard
                key={p.id}
                player={p}
                currentUser={currentUser}
                onClaim={setClaimTarget}
              />
            ))}
          </div>
        </div>
      ))}

      {claimTarget && (
        <ClaimPlayerModal
          player={claimTarget}
          clubId={clubId}
          currentUser={currentUser}
          onClose={() => setClaimTarget(null)}
        />
      )}
    </div>
  );
}
