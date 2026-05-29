/**
 * Saisie des sets pour une rencontre tennis.
 * Calcule automatiquement les sets gagnés et le gagnant.
 *
 * Props :
 *   setsPerMatch  — nombre max de sets (3 par défaut)
 *   value         — { sets: [{set,home,away,tiebreak?}], sets_won: {home,away} }
 *   onChange      — fn(value)
 */
export default function TennisSetsInput({ setsPerMatch = 3, value, onChange }) {
  const sets = value?.sets ?? [];
  const toWin = Math.ceil(setsPerMatch / 2); // 2 pour BO3

  function setScore(idx, side, v) {
    const n = v === '' ? 0 : Math.max(0, parseInt(v, 10) || 0);
    const next = [...sets];
    while (next.length <= idx) next.push({ set: next.length + 1, home: 0, away: 0 });
    next[idx] = { ...next[idx], set: idx + 1, [side]: n };
    onChange(computeFromSets(next));
  }

  function setTiebreak(idx, side, v) {
    const n = v === '' ? 0 : Math.max(0, parseInt(v, 10) || 0);
    const next = [...sets];
    next[idx] = {
      ...next[idx],
      tiebreak: { ...(next[idx]?.tiebreak ?? { home: 0, away: 0 }), [side]: n },
    };
    onChange(computeFromSets(next));
  }

  function computeFromSets(ss) {
    let homeWins = 0, awayWins = 0;
    for (const s of ss) {
      const h = s.home ?? 0, a = s.away ?? 0;
      if (h === 0 && a === 0) continue;
      const isTiebreakSet = h === 7 && a === 6;
      const isRevTiebreakSet = h === 6 && a === 7;
      const winner = isTiebreakSet ? 'home' : isRevTiebreakSet ? 'away'
        : h > a ? 'home' : a > h ? 'away' : null;
      if (winner === 'home') homeWins++;
      else if (winner === 'away') awayWins++;
    }
    const winner_side = homeWins >= toWin ? 'home' : awayWins >= toWin ? 'away' : null;
    return {
      sets: ss,
      sets_won: { home: homeWins, away: awayWins },
      winner_side,
    };
  }

  // N sets à afficher = max(sets déjà saisis, 1 set vide de plus jusqu'à setsPerMatch)
  const setsWonHome = value?.sets_won?.home ?? 0;
  const setsWonAway = value?.sets_won?.away ?? 0;
  const matchOver   = setsWonHome >= toWin || setsWonAway >= toWin;
  const displayCount = matchOver ? sets.length : Math.min(sets.length + 1, setsPerMatch);

  const numSt = {
    width: 46, textAlign: 'center', fontWeight: 700, fontSize: 18,
    padding: '7px 0', borderRadius: 8,
    backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)',
    color: 'var(--sl-t1)', outline: 'none',
  };
  const tbSt = { ...numSt, width: 36, fontSize: 14 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* En-têtes */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto 1fr', gap: 4, alignItems: 'center' }}>
        <span />
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Dom.</span>
        <span />
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Ext.</span>
      </div>

      {Array.from({ length: displayCount }, (_, i) => {
        const s = sets[i] ?? { set: i + 1, home: 0, away: 0 };
        const h = s.home ?? 0, a = s.away ?? 0;
        const isTiebreak = (h === 7 && a === 6) || (h === 6 && a === 7);
        const homeWon = h > a && !(h === 6 && a === 6);
        const awayWon = a > h && !(h === 6 && a === 6);

        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto 1fr', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: homeWon ? '#22c55e' : awayWon ? '#ef4444' : 'var(--sl-t3)', textAlign: 'center' }}>
              S{i + 1}
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <input type="number" inputMode="numeric" min="0" max="7"
                value={s.home ?? ''}
                onChange={e => setScore(i, 'home', e.target.value)}
                style={{ ...numSt, borderColor: homeWon ? '#22c55e' : 'var(--sl-border-s)' }}
              />
              {isTiebreak && (
                <input type="number" inputMode="numeric" min="0" max="20"
                  value={s.tiebreak?.home ?? ''}
                  onChange={e => setTiebreak(i, 'home', e.target.value)}
                  style={{ ...tbSt }}
                  placeholder="TB"
                />
              )}
            </div>

            <span style={{ fontWeight: 700, color: 'var(--sl-t3)', textAlign: 'center' }}>—</span>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <input type="number" inputMode="numeric" min="0" max="7"
                value={s.away ?? ''}
                onChange={e => setScore(i, 'away', e.target.value)}
                style={{ ...numSt, borderColor: awayWon ? '#22c55e' : 'var(--sl-border-s)' }}
              />
              {isTiebreak && (
                <input type="number" inputMode="numeric" min="0" max="20"
                  value={s.tiebreak?.away ?? ''}
                  onChange={e => setTiebreak(i, 'away', e.target.value)}
                  style={{ ...tbSt }}
                  placeholder="TB"
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Score sets gagnés */}
      {(setsWonHome > 0 || setsWonAway > 0) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>Sets gagnés :</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: setsWonHome > setsWonAway ? '#22c55e' : 'var(--sl-t1)' }}>
            {setsWonHome}
          </span>
          <span style={{ color: 'var(--sl-t3)' }}>—</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: setsWonAway > setsWonHome ? '#22c55e' : 'var(--sl-t1)' }}>
            {setsWonAway}
          </span>
        </div>
      )}
    </div>
  );
}
