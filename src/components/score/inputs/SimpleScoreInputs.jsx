import { useState } from 'react';

const numStyle = {
  width: 72, textAlign: 'center', fontWeight: 800, fontSize: 28,
  padding: '10px 0', borderRadius: 12, inputMode: 'numeric',
  backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)',
  color: 'var(--sl-t1)', outline: 'none',
};
const optStyle = {
  width: 52, textAlign: 'center', fontWeight: 700, fontSize: 18,
  padding: '7px 0', borderRadius: 10,
  backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)',
  color: 'var(--sl-t1)', outline: 'none',
};
const lbl = { fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', display: 'block', marginBottom: 3 };

/**
 * Saisie simple : 2 grands inputs home/away + prolongation/TAB conditionnels.
 * Sports : football, handball, futsal, default.
 */
export default function SimpleScoreInputs({ config, value, onChange }) {
  const [showExtra, setShowExtra] = useState(
    !!(value?.et_home !== undefined || value?.pen_home !== undefined)
  );

  const isDraw = value?.home !== undefined && value?.away !== undefined
    && String(value.home) === String(value.away);
  const isDrawAfterET = isDraw
    && value?.et_home !== undefined && value?.et_away !== undefined
    && String(value.home + (value.et_home || 0)) === String(value.away + (value.et_away || 0));

  function set(key, v) {
    const n = v === '' ? undefined : parseInt(v, 10);
    onChange({ ...value, [key]: isNaN(n) ? undefined : n });
  }

  const optionals = config.fields?.optional ?? [];
  const hasExtraTime = optionals.some(f => f.group === 'extra_time');
  const hasPenalties = optionals.some(f => f.group === 'penalties');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Score principal */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div>
          <label style={lbl}>{config.homeLabel}</label>
          <input
            type="number" inputMode="numeric" min="0" max="99"
            value={value?.home ?? ''}
            onChange={e => set('home', e.target.value)}
            style={numStyle}
          />
        </div>
        <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--sl-t3)', marginTop: 18 }}>—</span>
        <div>
          <label style={lbl}>{config.awayLabel}</label>
          <input
            type="number" inputMode="numeric" min="0" max="99"
            value={value?.away ?? ''}
            onChange={e => set('away', e.target.value)}
            style={numStyle}
          />
        </div>
      </div>

      {/* Bouton prolongation (si nul + sport le supporte) */}
      {hasExtraTime && isDraw && !showExtra && (
        <button
          onClick={() => setShowExtra(true)}
          style={{ alignSelf: 'center', padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', cursor: 'pointer' }}
        >
          + Prolongation
        </button>
      )}

      {/* Prolongation */}
      {showExtra && hasExtraTime && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center', marginBottom: 8 }}>
            Prolongation
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <input type="number" inputMode="numeric" min="0" max="20"
              value={value?.et_home ?? ''}
              onChange={e => set('et_home', e.target.value)}
              placeholder="0" style={optStyle}
            />
            <span style={{ color: 'var(--sl-t3)', fontWeight: 700 }}>—</span>
            <input type="number" inputMode="numeric" min="0" max="20"
              value={value?.et_away ?? ''}
              onChange={e => set('et_away', e.target.value)}
              placeholder="0" style={optStyle}
            />
          </div>
        </div>
      )}

      {/* T.A.B. */}
      {showExtra && hasPenalties && isDrawAfterET && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center', marginBottom: 8 }}>
            Tirs au but
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <input type="number" inputMode="numeric" min="0" max="20"
              value={value?.pen_home ?? ''}
              onChange={e => set('pen_home', e.target.value)}
              placeholder="0" style={optStyle}
            />
            <span style={{ color: 'var(--sl-t3)', fontWeight: 700 }}>—</span>
            <input type="number" inputMode="numeric" min="0" max="20"
              value={value?.pen_away ?? ''}
              onChange={e => set('pen_away', e.target.value)}
              placeholder="0" style={optStyle}
            />
          </div>
        </div>
      )}
    </div>
  );
}
