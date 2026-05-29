import { useState } from 'react';

const numStyle = {
  width: 52, textAlign: 'center', fontWeight: 700, fontSize: 18,
  padding: '7px 0', borderRadius: 10,
  backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)',
  color: 'var(--sl-t1)', outline: 'none',
};
const bigStyle = {
  width: 72, textAlign: 'center', fontWeight: 800, fontSize: 28,
  padding: '10px 0', borderRadius: 12,
  backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)',
  color: 'var(--sl-t1)', outline: 'none',
};
const lbl = { fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center', display: 'block', marginBottom: 3 };

/**
 * Saisie par périodes : score principal + détail optionnel quart-temps.
 * Sports : basketball.
 */
export default function PeriodsScoreInputs({ config, value, onChange }) {
  const [showPeriods, setShowPeriods] = useState(
    !!(value?.periods?.length)
  );
  const [showOT, setShowOT] = useState(!!(value?.ot_home !== undefined));

  function setMain(key, v) {
    const n = v === '' ? undefined : parseInt(v, 10);
    onChange({ ...value, [key]: isNaN(n) ? undefined : n });
  }

  function setPeriod(idx, side, v) {
    const n = v === '' ? 0 : parseInt(v, 10);
    const periods = [...(value?.periods ?? Array.from({ length: config.periods }, (_, i) => ({ period: i + 1, home: 0, away: 0 })))];
    periods[idx] = { ...periods[idx], [side]: isNaN(n) ? 0 : n };
    onChange({ ...value, periods });
  }

  const periods = value?.periods ?? [];
  const isDraw = value?.home !== undefined && value?.away !== undefined && value.home === value.away;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Score total */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div>
          <label style={lbl}>{config.homeLabel}</label>
          <input type="number" inputMode="numeric" min="0" max="999"
            value={value?.home ?? ''} onChange={e => setMain('home', e.target.value)} style={bigStyle} />
        </div>
        <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--sl-t3)', marginTop: 18 }}>—</span>
        <div>
          <label style={lbl}>{config.awayLabel}</label>
          <input type="number" inputMode="numeric" min="0" max="999"
            value={value?.away ?? ''} onChange={e => setMain('away', e.target.value)} style={bigStyle} />
        </div>
      </div>

      {/* Toggle détail quart-temps */}
      <button
        onClick={() => setShowPeriods(v => !v)}
        style={{ alignSelf: 'center', padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', cursor: 'pointer' }}
      >
        {showPeriods ? '▲ Masquer les QT' : '▼ Détail par quart-temps'}
      </button>

      {showPeriods && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: config.periods }, (_, i) => {
            const p = periods[i] ?? { period: i + 1, home: 0, away: 0 };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', width: 30, textAlign: 'center' }}>{config.periodLabel}{i + 1}</span>
                <input type="number" inputMode="numeric" min="0" max="99"
                  value={p.home} onChange={e => setPeriod(i, 'home', e.target.value)} style={numStyle} />
                <span style={{ color: 'var(--sl-t3)', fontWeight: 700 }}>—</span>
                <input type="number" inputMode="numeric" min="0" max="99"
                  value={p.away} onChange={e => setPeriod(i, 'away', e.target.value)} style={numStyle} />
              </div>
            );
          })}
        </div>
      )}

      {/* Overtime */}
      {config.overtimeEnabled && isDraw && (
        <>
          {!showOT ? (
            <button onClick={() => setShowOT(true)} style={{ alignSelf: 'center', padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', cursor: 'pointer' }}>
              + Prolongation (OT)
            </button>
          ) : (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center', marginBottom: 6 }}>OT</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <input type="number" inputMode="numeric" min="0" max="99"
                  value={value?.ot_home ?? ''} onChange={e => setMain('ot_home', e.target.value)} style={numStyle} />
                <span style={{ color: 'var(--sl-t3)', fontWeight: 700 }}>—</span>
                <input type="number" inputMode="numeric" min="0" max="99"
                  value={value?.ot_away ?? ''} onChange={e => setMain('ot_away', e.target.value)} style={numStyle} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
