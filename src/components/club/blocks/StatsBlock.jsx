import { useClubStats } from '../../../hooks/useClubStats.js';

const FORM_COLORS = { W: '#22c55e', D: '#f59e0b', L: '#ef4444' };
const FORM_LABELS = { W: 'V', D: 'N', L: 'D' };

function FormPill({ result }) {
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold"
      style={{ backgroundColor: FORM_COLORS[result], fontSize: 9 }}>
      {FORM_LABELS[result]}
    </div>
  );
}

export default function StatsBlock({ data, clubId }) {
  const { stats, form5, topMotm, loading } = useClubStats(clubId);

  if (loading) return <div className="text-xs text-gray-400 py-4 text-center">Chargement…</div>;
  if (!stats.length) return (
    <p className="text-sm text-gray-400 italic py-3 text-center">
      Aucun résultat enregistré pour l'instant.
    </p>
  );

  // Grouper par team_name
  const teams = [...new Set(stats.map(s => s.team_name))].filter(Boolean);

  return (
    <div className="space-y-6">
      {teams.map(team => {
        const rows = stats.filter(s => s.team_name === team);
        const totals = rows.reduce((acc, r) => ({
          played:        (acc.played ?? 0)        + (r.played ?? 0),
          wins:          (acc.wins ?? 0)          + (r.wins ?? 0),
          draws:         (acc.draws ?? 0)         + (r.draws ?? 0),
          losses:        (acc.losses ?? 0)        + (r.losses ?? 0),
          goals_for:     (acc.goals_for ?? 0)     + (r.goals_for ?? 0),
          goals_against: (acc.goals_against ?? 0) + (r.goals_against ?? 0),
        }), {});
        const gd = (totals.goals_for ?? 0) - (totals.goals_against ?? 0);
        const teamForm = form5[team] ?? [];

        return (
          <div key={team}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#0F1E3A' }}>
              {team}
            </p>

            {/* Stats table */}
            <div className="rounded-2xl overflow-hidden border border-gray-100">
              <div className="grid grid-cols-7 px-4 py-2 bg-gray-50">
                {['J', 'V', 'N', 'D', 'Bp', 'Bc', '+/-'].map(h => (
                  <div key={h} className="text-center text-[10px] font-bold uppercase text-gray-400">{h}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 px-4 py-3 border-t border-gray-100">
                {[
                  totals.played ?? 0,
                  totals.wins ?? 0,
                  totals.draws ?? 0,
                  totals.losses ?? 0,
                  totals.goals_for ?? 0,
                  totals.goals_against ?? 0,
                  gd,
                ].map((v, i) => (
                  <div key={i} className="text-center font-bold text-sm"
                    style={{ color: i === 6 ? (gd > 0 ? '#22c55e' : gd < 0 ? '#ef4444' : '#64748b') : '#0F1E3A' }}>
                    {i === 6 && gd > 0 ? `+${v}` : v}
                  </div>
                ))}
              </div>
            </div>

            {/* Forme */}
            {teamForm.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Forme</span>
                <div className="flex gap-1">
                  {teamForm.map((r, i) => <FormPill key={i} result={r} />)}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Top joueur du match */}
      {topMotm.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#0F1E3A' }}>
            Top joueur du match
          </p>
          <div className="space-y-2">
            {topMotm.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50">
                <span className="w-5 text-center font-bold text-xs text-gray-400">#{i + 1}</span>
                <span className="flex-1 text-sm font-semibold" style={{ color: '#0F1E3A' }}>{p.name}</span>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50">
                  <span className="text-sm">🏆</span>
                  <span className="text-xs font-bold text-amber-600">{p.count}×</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
