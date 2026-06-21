const numStyle: React.CSSProperties = {
  width: 52, textAlign: 'center', fontWeight: 700, fontSize: 20,
  padding: '8px 0', borderRadius: 10,
  backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)',
  color: 'var(--sl-t1)', outline: 'none',
};
const bigStyle: React.CSSProperties = {
  width: 64, textAlign: 'center', fontWeight: 800, fontSize: 26,
  padding: '10px 0', borderRadius: 12,
  backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)',
  color: 'var(--sl-t1)', outline: 'none',
};
const lbl: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)',
  textTransform: 'uppercase', letterSpacing: '0.07em',
  textAlign: 'center', display: 'block', marginBottom: 3,
};

interface ScoreConfig {
  homeLabel: string;
  awayLabel: string;
  setsToWin?: number;
  maxSets?: number;
  setPoints?: number;
  tiebreakPoints?: number;
}

interface SetDetail { set: number; home: number; away: number }

interface SetsScoreInputsProps {
  config: ScoreConfig;
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
}

export default function SetsScoreInputs({ config, value, onChange }: SetsScoreInputsProps) {
  function setMain(key: string, v: string) {
    const n = v === '' ? undefined : parseInt(v, 10);
    onChange({ ...value, [key]: isNaN(n as number) ? undefined : n });
  }

  function setSetScore(idx: number, side: string, v: string) {
    const n = v === '' ? 0 : parseInt(v, 10);
    const sets: SetDetail[] = [...(value?.sets ?? [])];
    while (sets.length <= idx) sets.push({ set: sets.length + 1, home: 0, away: 0 });
    sets[idx] = { ...sets[idx], [side]: isNaN(n) ? 0 : n };
    onChange({ ...value, sets });
  }

  const totalSets = (value?.sets_home ?? 0) + (value?.sets_away ?? 0);
  const showSetDetail = totalSets > 0;
  const sets: SetDetail[] = value?.sets ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div>
          <label style={lbl}>{config.homeLabel} (sets)</label>
          <input type="number" inputMode="numeric" min="0" max={config.setsToWin ?? 5} value={value?.sets_home ?? ''} onChange={e => setMain('sets_home', e.target.value)} style={bigStyle} />
        </div>
        <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--sl-t3)', marginTop: 18 }}>—</span>
        <div>
          <label style={lbl}>{config.awayLabel} (sets)</label>
          <input type="number" inputMode="numeric" min="0" max={config.setsToWin ?? 5} value={value?.sets_away ?? ''} onChange={e => setMain('sets_away', e.target.value)} style={bigStyle} />
        </div>
      </div>

      {showSetDetail && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>Détail par set</div>
          {Array.from({ length: totalSets }, (_, i) => {
            const s = sets[i] ?? { set: i + 1, home: 0, away: 0 };
            const isTiebreak = i === (config.maxSets ?? 5) - 1;
            const maxPts = isTiebreak ? (config.tiebreakPoints ?? 15) : (config.setPoints ?? 25);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', width: 36, textAlign: 'center' }}>
                  {isTiebreak ? 'TB' : `Set ${i + 1}`}
                </span>
                <input type="number" inputMode="numeric" min="0" max={maxPts + 10} value={s.home} onChange={e => setSetScore(i, 'home', e.target.value)} style={numStyle} />
                <span style={{ color: 'var(--sl-t3)', fontWeight: 700 }}>—</span>
                <input type="number" inputMode="numeric" min="0" max={maxPts + 10} value={s.away} onChange={e => setSetScore(i, 'away', e.target.value)} style={numStyle} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
