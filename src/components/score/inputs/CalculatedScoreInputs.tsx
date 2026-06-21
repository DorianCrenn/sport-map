const numStyle: React.CSSProperties = {
  width: 52, textAlign: 'center', fontWeight: 700, fontSize: 20,
  padding: '8px 0', borderRadius: 10,
  backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)',
  color: 'var(--sl-t1)', outline: 'none',
};
const lbl: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
};

interface Action { key: string; label: string; points: number; max: number }

interface ScoreConfig {
  homeLabel: string;
  awayLabel: string;
  actions: Action[];
  scoreComputed?: (value: Record<string, any>, side: string) => number;
}

interface CalculatedScoreInputsProps {
  config: ScoreConfig;
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
}

export default function CalculatedScoreInputs({ config, value, onChange }: CalculatedScoreInputsProps) {
  function set(key: string, v: string) {
    const n = v === '' ? 0 : parseInt(v, 10);
    onChange({ ...value, [key]: isNaN(n) ? 0 : Math.max(0, n) });
  }

  const scoreHome = config.scoreComputed ? config.scoreComputed(value, 'home') : 0;
  const scoreAway = config.scoreComputed ? config.scoreComputed(value, 'away') : 0;

  const warnHome = (value?.conv_home || 0) > (value?.tries_home || 0);
  const warnAway = (value?.conv_away || 0) > (value?.tries_away || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Score calculé</span>
        <span style={{ fontWeight: 900, fontSize: 20, color: 'var(--sl-t1)' }}>{scoreHome} — {scoreAway}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px 12px', alignItems: 'center' }}>
        <div style={{ ...lbl, textAlign: 'center' }}>{config.homeLabel}</div>
        <div />
        <div style={{ ...lbl, textAlign: 'center' }}>{config.awayLabel}</div>

        {config.actions.map(action => (
          <>
            <div key={`${action.key}_home`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <input type="number" inputMode="numeric" min="0" max={action.max} value={value?.[`${action.key}_home`] ?? 0} onChange={e => set(`${action.key}_home`, e.target.value)} style={numStyle} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t2)' }}>{action.label}</span>
              <span style={{ display: 'block', fontSize: 9, color: 'var(--sl-t3)' }}>×{action.points} pts</span>
            </div>
            <div key={`${action.key}_away`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <input type="number" inputMode="numeric" min="0" max={action.max} value={value?.[`${action.key}_away`] ?? 0} onChange={e => set(`${action.key}_away`, e.target.value)} style={numStyle} />
            </div>
          </>
        ))}
      </div>

      {(warnHome || warnAway) && (
        <div style={{ padding: '8px 12px', borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 11, color: '#f59e0b' }}>
          ⚠️ {warnHome ? 'Dom. : transformations > essais.' : ''} {warnAway ? 'Ext. : transformations > essais.' : ''}
        </div>
      )}
    </div>
  );
}
