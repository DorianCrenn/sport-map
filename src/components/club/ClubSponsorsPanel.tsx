import { useState } from 'react';
import { useClubSponsorsAdmin } from '../../hooks/useClubSponsorsAdmin.js';
import FileUpload from '../ui/FileUpload.jsx';

const TIER_ORDER = ['gold', 'silver', 'bronze', 'partner'];
const TIER_META: Record<string, { label: string; color: string }> = {
  gold:    { label: 'Or',         color: '#f59e0b' },
  silver:  { label: 'Argent',     color: '#94a3b8' },
  bronze:  { label: 'Bronze',     color: '#cd7c54' },
  partner: { label: 'Partenaire', color: '#4da6ff' },
};

const BLANK = {
  sponsor_name: '', tier: 'partner',
  logo_url: '', logo_white_url: '',
  website_url: '', bg_color: '#111827',
  tagline: '', cta_label: '', cta_url: '',
  valid_from: '', valid_until: '',
  show_in_poster: true,
};

const inp: React.CSSProperties = {
  padding: '7px 10px', borderRadius: 'var(--sl-radius-md)', fontSize: 12,
  border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)',
  color: 'var(--sl-t1)', outline: 'none', width: '100%', boxSizing: 'border-box',
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  color: 'var(--sl-t3)', marginBottom: 3,
};

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button onClick={onToggle} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 'var(--sl-radius-4xl)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', border: 'none', backgroundColor: on ? 'rgba(34,197,94,0.15)' : 'var(--sl-surface)', color: on ? '#16a34a' : 'var(--sl-t3)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: on ? '#16a34a' : 'var(--sl-border-s)' }} />
      {label}
    </button>
  );
}

function ValidityBadge({ validFrom, validUntil }: { validFrom?: string; validUntil?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  if (validUntil && validUntil < today) return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 'var(--sl-radius-lg)', backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Expiré</span>;
  if (validFrom && validFrom > today) return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 'var(--sl-radius-lg)', backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>À venir</span>;
  if (validUntil) {
    const days = Math.round((new Date(validUntil).getTime() - Date.now()) / 86400000);
    if (days <= 30) return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 'var(--sl-radius-lg)', backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>Expire dans {days}j</span>;
  }
  return null;
}

interface ClubSponsorsPanelProps {
  clubId: string | number;
  onClose: () => void;
}

export default function ClubSponsorsPanel({ clubId, onClose }: ClubSponsorsPanelProps) {
  const { sponsors, loading, addSponsor, updateSponsor, removeSponsor } = useClubSponsorsAdmin(String(clubId)) as any;
  const [form, setForm]           = useState({ ...BLANK });
  const [showForm, setShowForm]   = useState(false);
  const [adding, setAdding]       = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function setF(k: string, v: any) { setForm(prev => ({ ...prev, [k]: v })); }

  async function handleAdd() {
    if (!form.sponsor_name.trim()) return;
    setAdding(true);
    const ok = await addSponsor(form);
    if (ok) { setForm({ ...BLANK }); setShowForm(false); }
    setAdding(false);
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, backgroundColor: 'var(--sl-bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onClose} style={{ fontSize: 20, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sl-t1)', padding: '0 4px' }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--sl-t1)', flex: 1 }}>Partenaires</span>
        <button onClick={() => setShowForm(v => !v)} style={{ padding: '6px 14px', borderRadius: 'var(--sl-radius-4xl)', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', backgroundColor: showForm ? 'var(--sl-surface)' : '#6366f1', color: showForm ? 'var(--sl-t2)' : '#fff' }}>
          {showForm ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {showForm && (
          <div style={{ borderRadius: 'var(--sl-radius-2xl)', border: '1.5px solid #6366f1', backgroundColor: 'var(--sl-card)', padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Nouveau partenaire</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Nom *</label>
                <input value={form.sponsor_name} onChange={e => setF('sponsor_name', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }} placeholder="Nom du partenaire" style={inp} autoFocus />
              </div>
              <div>
                <label style={lbl}>Niveau</label>
                <select value={form.tier} onChange={e => setF('tier', e.target.value)} style={inp}>
                  {TIER_ORDER.map(t => <option key={t} value={t}>{TIER_META[t].label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Couleur fond feed</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="color" value={form.bg_color} onChange={e => setF('bg_color', e.target.value)} style={{ width: 36, height: 32, padding: 2, borderRadius: 'var(--sl-radius-sm)', border: '1px solid var(--sl-border-s)', cursor: 'pointer' }} />
                  <input value={form.bg_color} onChange={e => setF('bg_color', e.target.value)} placeholder="#111827" style={{ ...inp, flex: 1 }} />
                </div>
              </div>
            </div>
            <div>
              <label style={lbl}>Logo principal (couleur)</label>
              <FileUpload clubId={String(clubId)} value={form.logo_url} onChange={(v: string) => setF('logo_url', v)} label="Uploader le logo" hint="PNG, JPG, SVG, WebP — max 2 Mo" />
            </div>
            <div>
              <label style={lbl}>Logo blanc / monochrome <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10 }}>(optionnel — pour les affiches sombres)</span></label>
              <FileUpload clubId={String(clubId)} value={form.logo_white_url} onChange={(v: string) => setF('logo_white_url', v)} label="Uploader logo blanc" hint="Version monochrome blanche du logo" dark />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Site web</label>
                <input value={form.website_url} onChange={e => setF('website_url', e.target.value)} placeholder="https://…" style={inp} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Accroche (feed)</label>
                <input value={form.tagline} onChange={e => setF('tagline', e.target.value)} placeholder="Le partenaire de votre saison !" style={inp} />
              </div>
              <div>
                <label style={lbl}>Bouton (feed)</label>
                <input value={form.cta_label} onChange={e => setF('cta_label', e.target.value)} placeholder="Découvrir" style={inp} />
              </div>
              <div>
                <label style={lbl}>URL bouton</label>
                <input value={form.cta_url} onChange={e => setF('cta_url', e.target.value)} placeholder="https://…" style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>Période de validité <span style={{ fontWeight: 400, textTransform: 'none' }}>(optionnel — masquage automatique)</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ ...lbl, fontSize: 9 }}>Du</label>
                  <input type="date" value={form.valid_from} onChange={e => setF('valid_from', e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={{ ...lbl, fontSize: 9 }}>Au</label>
                  <input type="date" value={form.valid_until} onChange={e => setF('valid_until', e.target.value)} style={inp} />
                </div>
              </div>
            </div>
            <button onClick={handleAdd} disabled={!form.sponsor_name.trim() || adding} style={{ padding: '9px 0', borderRadius: 'var(--sl-radius-lg)', border: 'none', fontWeight: 700, fontSize: 13, cursor: form.sponsor_name.trim() && !adding ? 'pointer' : 'not-allowed', backgroundColor: form.sponsor_name.trim() ? '#6366f1' : 'var(--sl-border)', color: form.sponsor_name.trim() ? '#fff' : 'var(--sl-t3)', opacity: adding ? 0.7 : 1, transition: 'all 0.15s' }}>
              {adding ? 'Ajout…' : 'Ajouter le partenaire'}
            </button>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2].map(i => <div key={i} style={{ height: 80, borderRadius: 'var(--sl-radius-xl)', backgroundColor: 'var(--sl-surface)', opacity: 1 - i * 0.2 }} />)}
          </div>
        )}

        {!loading && sponsors.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--sl-t3)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🤝</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--sl-t2)' }}>Aucun partenaire</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Ajoutez vos sponsors pour les afficher sur votre page et les injecter dans le feed de vos abonnés.</div>
          </div>
        )}

        {!loading && (sponsors as any[]).map(s => {
          const meta = TIER_META[s.tier] ?? TIER_META.partner;
          return (
            <div key={s.id} style={{ borderRadius: 'var(--sl-radius-xl)', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--sl-radius-md)', flexShrink: 0, overflow: 'hidden', backgroundColor: meta.color + '22', border: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.logo_url
                    ? <img src={s.logo_url} alt={s.sponsor_name} loading="lazy" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    : <span style={{ fontSize: 14, fontWeight: 700, color: meta.color }}>{(s.sponsor_name ?? '?')[0].toUpperCase()}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sponsor_name}</span>
                    <ValidityBadge validFrom={s.valid_from} validUntil={s.valid_until} />
                  </div>
                  <div style={{ fontSize: 11, color: meta.color, fontWeight: 600, marginTop: 1 }}>
                    {meta.label}
                    {s.valid_until && <span style={{ color: 'var(--sl-t3)', fontWeight: 400 }}> · jusqu'au {s.valid_until}</span>}
                  </div>
                </div>
                {confirmId === s.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--sl-t2)' }}>Supprimer ?</span>
                    <button onClick={() => { removeSponsor(s.id); setConfirmId(null); }} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 'var(--sl-radius-md)', border: 'none', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Oui</button>
                    <button onClick={() => setConfirmId(null)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 'var(--sl-radius-md)', border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t2)', cursor: 'pointer' }}>Non</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmId(s.id)} style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t3)' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--sl-t3)'; }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Toggle on={s.page_visible}           onToggle={() => updateSponsor(s.id, { page_visible:    !s.page_visible })} label="📰 Page club" />
                <Toggle on={s.active}                 onToggle={() => updateSponsor(s.id, { active:          !s.active })} label="📣 Feed abonnés" />
                <Toggle on={s.show_in_poster ?? true} onToggle={() => updateSponsor(s.id, { show_in_poster:  !(s.show_in_poster ?? true) })} label="🎨 Affiches" />
              </div>
              {s.logo_white_url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 'var(--sl-radius-md)', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--sl-border)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 'var(--sl-radius-xs)', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={s.logo_white_url} alt="" loading="lazy" style={{ maxWidth: 20, maxHeight: 20, objectFit: 'contain' }} onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Logo blanc configuré ✓</span>
                </div>
              )}
            </div>
          );
        })}

        {!loading && sponsors.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--sl-t3)', textAlign: 'center', padding: '8px 0 4px', lineHeight: 1.5 }}>
            <strong>📰 Page club</strong> — logo sur votre fiche publique&nbsp;·&nbsp;<strong>📣 Feed</strong> — carte dans l'actualité&nbsp;·&nbsp;<strong>🎨 Affiches</strong> — bandeau Poster Studio
          </div>
        )}
      </div>
    </div>
  );
}
