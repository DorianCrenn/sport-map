import { useState } from 'react';

const uid = () => `s_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

const TIER_ORDER = ['gold', 'silver', 'bronze', 'partner'];

const TIER_META = {
  gold:    { label: 'Or',        color: '#f59e0b', logoH: 60, cols: 'repeat(auto-fill, minmax(120px, 1fr))' },
  silver:  { label: 'Argent',    color: '#94a3b8', logoH: 44, cols: 'repeat(auto-fill, minmax(90px, 1fr))'  },
  bronze:  { label: 'Bronze',    color: '#cd7c54', logoH: 32, cols: 'repeat(auto-fill, minmax(72px, 1fr))'  },
  partner: { label: 'Partenaire',color: '#4da6ff', logoH: 32, cols: 'repeat(auto-fill, minmax(72px, 1fr))'  },
};

const inputStyle = {
  padding: '6px 9px',
  borderRadius: 8,
  fontSize: 12,
  border: '1px solid var(--sl-border-s)',
  backgroundColor: 'var(--sl-surface)',
  color: 'var(--sl-t1)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

function SponsorLogo({ sponsor, height }) {
  const [err, setErr] = useState(false);
  const meta = TIER_META[sponsor.tier] ?? TIER_META.partner;
  const wrapper = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height,
    minWidth: 60,
    padding: '6px 10px',
    borderRadius: 12,
    backgroundColor: sponsor.logo && !err ? '#fff' : meta.color + '22',
    border: '1px solid var(--sl-border)',
    boxShadow: sponsor.tier === 'gold' ? '0 2px 10px rgba(0,0,0,0.10)' : 'none',
    overflow: 'hidden',
    cursor: sponsor.url ? 'pointer' : 'default',
    flexShrink: 0,
  };

  const inner = sponsor.logo && !err ? (
    <img
      src={sponsor.logo}
      alt={sponsor.name}
      onError={() => setErr(true)}
      style={{ maxHeight: height - 12, maxWidth: '100%', objectFit: 'contain', display: 'block' }}
    />
  ) : (
    <span style={{
      fontSize: Math.max(10, height / 4),
      fontWeight: 700,
      color: meta.color,
      textAlign: 'center',
      lineHeight: 1.2,
      wordBreak: 'break-word',
    }}>
      {sponsor.name}
    </span>
  );

  if (sponsor.url) {
    return (
      <a href={sponsor.url} target="_blank" rel="noopener noreferrer" style={{ ...wrapper, textDecoration: 'none' }} title={sponsor.name}>
        {inner}
      </a>
    );
  }
  return <div style={wrapper} title={sponsor.name}>{inner}</div>;
}

function TierSection({ tier, sponsors, isMultiTier }) {
  const meta = TIER_META[tier] ?? TIER_META.partner;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {isMultiTier && (
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: meta.color,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: meta.color }} />
          {meta.label}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: meta.cols, gap: tier === 'gold' ? 12 : 8, alignItems: 'center' }}>
        {sponsors.map(s => (
          <SponsorLogo key={s.id} sponsor={s} height={meta.logoH} />
        ))}
      </div>
    </div>
  );
}

export function SponsorsBlockView({ block }) {
  const sponsors = block.data?.sponsors ?? [];
  if (sponsors.length === 0) return null;

  const grouped = {};
  for (const tier of TIER_ORDER) {
    const list = sponsors.filter(s => s.tier === tier);
    if (list.length) grouped[tier] = list;
  }
  const tiers = Object.keys(grouped);
  const isMultiTier = tiers.length > 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--sl-t3)',
      }}>
        Partenaires &amp; Sponsors
      </div>
      {tiers.map(tier => (
        <TierSection key={tier} tier={tier} sponsors={grouped[tier]} isMultiTier={isMultiTier} />
      ))}
    </div>
  );
}

const BLANK = { name: '', logo: '', url: '', tier: 'gold' };

export function SponsorsBlockEditor({ block, onChange }) {
  const sponsors = block.data?.sponsors ?? [];
  const [form, setForm] = useState(BLANK);

  function setF(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function add() {
    if (!form.name.trim()) return;
    onChange({ sponsors: [...sponsors, { ...form, id: uid() }] });
    setForm(BLANK);
  }

  function remove(id) {
    onChange({ sponsors: sponsors.filter(s => s.id !== id) });
  }

  function update(id, key, val) {
    onChange({ sponsors: sponsors.map(s => s.id === id ? { ...s, [key]: val } : s) });
  }

  const labelSt = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--sl-t3)',
    marginBottom: 4,
    display: 'block',
  };

  const closeBtnSt = {
    flexShrink: 0,
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--sl-t3)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Partenaires &amp; Sponsors
      </div>

      {sponsors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sponsors.map(s => {
            const meta = TIER_META[s.tier] ?? TIER_META.partner;
            return (
              <div key={s.id} style={{
                borderRadius: 10,
                border: '1px solid var(--sl-border)',
                backgroundColor: 'var(--sl-card)',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-block',
                    width: 8, height: 8,
                    borderRadius: '50%',
                    backgroundColor: meta.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name || <span style={{ color: 'var(--sl-t3)', fontStyle: 'italic' }}>Sans nom</span>}
                  </span>
                  <button
                    onClick={() => remove(s.id)}
                    aria-label={`Supprimer ${s.name}`}
                    style={closeBtnSt}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--sl-t3)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div>
                    <label style={labelSt}>Nom</label>
                    <input
                      value={s.name}
                      onChange={e => update(s.id, 'name', e.target.value)}
                      placeholder="Nom du sponsor"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelSt}>Tier</label>
                    <select
                      value={s.tier}
                      onChange={e => update(s.id, 'tier', e.target.value)}
                      style={{ ...inputStyle }}
                    >
                      {TIER_ORDER.map(t => (
                        <option key={t} value={t}>{TIER_META[t].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelSt}>URL logo</label>
                    <input
                      value={s.logo}
                      onChange={e => update(s.id, 'logo', e.target.value)}
                      placeholder="https://…/logo.png"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelSt}>URL lien</label>
                    <input
                      value={s.url}
                      onChange={e => update(s.id, 'url', e.target.value)}
                      placeholder="https://…"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        borderRadius: 10,
        border: '1.5px dashed var(--sl-border-s)',
        backgroundColor: 'var(--sl-surface)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)' }}>
          Nouveau sponsor
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div>
            <label style={labelSt}>Nom *</label>
            <input
              value={form.name}
              onChange={e => setF('name', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
              placeholder="Nom du sponsor"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelSt}>Tier</label>
            <select
              value={form.tier}
              onChange={e => setF('tier', e.target.value)}
              style={{ ...inputStyle }}
            >
              {TIER_ORDER.map(t => (
                <option key={t} value={t}>{TIER_META[t].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelSt}>URL logo</label>
            <input
              value={form.logo}
              onChange={e => setF('logo', e.target.value)}
              placeholder="https://…/logo.png"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelSt}>URL lien</label>
            <input
              value={form.url}
              onChange={e => setF('url', e.target.value)}
              placeholder="https://…"
              style={inputStyle}
            />
          </div>
        </div>
        <button
          onClick={add}
          disabled={!form.name.trim()}
          style={{
            marginTop: 2,
            padding: '8px 0',
            borderRadius: 8,
            border: 'none',
            cursor: form.name.trim() ? 'pointer' : 'not-allowed',
            backgroundColor: form.name.trim() ? 'var(--sl-green)' : 'var(--sl-border)',
            color: form.name.trim() ? '#fff' : 'var(--sl-t3)',
            fontSize: 12,
            fontWeight: 700,
            opacity: form.name.trim() ? 1 : 0.5,
            transition: 'all 0.15s',
          }}
        >
          + Ajouter un sponsor
        </button>
      </div>
    </div>
  );
}
