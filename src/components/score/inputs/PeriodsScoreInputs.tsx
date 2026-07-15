import { useState } from 'react';

const numStyle: React.CSSProperties = {
  width: 52, textAlign: 'center', fontWeight: 700, fontSize: 18,
  padding: '7px 0', borderRadius: 'var(--sl-radius-lg)',
  backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)',
  color: 'var(--sl-t1)', outline: 'none',
};
const bigStyle: React.CSSProperties = {
  width: 72, textAlign: 'center', fontWeight: 800, fontSize: 28,
  padding: '10px 0', borderRadius: 'var(--sl-radius-xl)',
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
  periods: number;
  periodLabel?: string;
  overtimeEnabled?: boolean;
}

interface Period { period: number; home: number; away: number }

interface PeriodsScoreInputsProps {
  config: ScoreConfig;
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
}

export default function PeriodsScoreInputs({ config, value, onChange }: PeriodsScoreInputsProps) {
  const [showPeriods, setShowPeriods] = useState(!!(value?.periods?.length));
  const [showOT,      setShowOT]      = useState(!!(value?.ot_home !== undefined));

  function setMain(key: string, v: string) {
    const n = v === '' ? undefined : parseInt(v, 10);
    onChange({ ...value, [key]: isNaN(n as number) ? undefined : n });
  }

  function setPeriod(idx: number, side: string, v: string) {
    const n = v === '' ? 0 : parseInt(v, 10);
    const periods: Period[] = [...(value?.periods ?? Array.from({ length: config.periods }, (_, i) => ({ period: i + 1, home: 0, away: 0 })))];
    periods[idx] = { ...periods[idx], [side]: isNaN(n) ? 0 : n };
    onChange({ ...value, periods });
  }

  const periods: Period[] = value?.periods ?? [];
  const isDraw = value?.home !== undefined && value?.away !== undefined && value.home === value.away;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div>
          <label style={lbl}>{config.homeLabel}</label>
          <input type="number" inputMode="numeric" min="0" max="999" value={value?.home ?? ''} onChange={e => setMain('home', e.target.value)} style={bigStyle} />
        </div>
        <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--sl-t3)', marginTop: 18 }}>—</span>
        <div>
          <label style={lbl}>{config.awayLabel}</label>
          <input type="number" inputMode="numeric" min="0" max="999" value={value?.away ?? ''} onChange={e => setMain('away', e.target.value)} style={bigStyle} />
        </div>
      </div>

      <button onClick={() => setShowPeriods(v => !v)} style={{ alignSelf: 'center', padding: '5px 14px', borderRadius: 'var(--sl-radius-4xl)', fontSize: 11, fontWeight: 600, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', cursor: 'pointer' }}>
        {showPeriods ? '▲ Masquer les QT' : '▼ Détail par quart-temps'}
      </button>

      {showPeriods && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: config.periods }, (_, i) => {
            const p = periods[i] ?? { period: i + 1, home: 0, away: 0 };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', width: 30, textAlign: 'center' }}>{config.periodLabel ?? 'QT'}{i + 1}</span>
                <input type="number" inputMode="numeric" min="0" max="99" value={p.home} onChange={e => setPeriod(i, 'home', e.target.value)} style={numStyle} />
                <span style={{ color: 'var(--sl-t3)', fontWeight: 700 }}>—</span>
                <input type="number" inputMode="numeric" min="0" max="99" value={p.away} onChange={e => setPeriod(i, 'away', e.target.value)} style={numStyle} />
              </div>
            );
          })}
        </div>
      )}

      {config.overtimeEnabled && isDraw && (
        <>
          {!showOT ? (
            <button onClick={() => setShowOT(true)} style={{ alignSelf: 'center', padding: '5px 14px', borderRadius: 'var(--sl-radius-4xl)', fontSize: 11, fontWeight: 600, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', cursor: 'pointer' }}>+ Prolongation (OT)</button>
          ) : (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center', marginBottom: 6 }}>OT</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <input type="number" inputMode="numeric" min="0" max="99" value={value?.ot_home ?? ''} onChange={e => setMain('ot_home', e.target.value)} style={numStyle} />
                <span style={{ color: 'var(--sl-t3)', fontWeight: 700 }}>—</span>
                <input type="number" inputMode="numeric" min="0" max="99" value={value?.ot_away ?? ''} onChange={e => setMain('ot_away', e.target.value)} style={numStyle} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
