import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminGrants, GRANT_PRESETS } from '../hooks/useAdminGrants.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { supabase } from '../lib/supabase.js';

const PLAN_COLOR: Record<string, string> = { starter: '#3b82f6', pro: '#8b5cf6', elite: '#f59e0b' };
const TYPE_LABEL: Record<string, string> = { manual: 'Manuel', partner: 'Partenaire', trial_extension: 'Essai', lifetime: 'À vie', promo: 'Promo' };

interface GrantCardProps {
  grant: Record<string, any>;
  onRevoke: (id: string, reason: string) => Promise<void>;
}

function GrantCard({ grant, onRevoke }: GrantCardProps) {
  const [revoking, setRevoking] = useState(false);
  const [confirm, setConfirm]   = useState(false);
  const isActive  = !grant.revoked_at && (!grant.ends_at || new Date(grant.ends_at) > new Date());
  const isExpired = !grant.revoked_at && grant.ends_at && new Date(grant.ends_at) <= new Date();
  const color = PLAN_COLOR[grant.plan] ?? '#64748b';
  const clubName = grant.clubs?.name ?? grant.club_id;

  async function handleRevoke() {
    setRevoking(true);
    try { await onRevoke(grant.id, 'Révoqué manuellement par admin'); }
    finally { setRevoking(false); setConfirm(false); }
  }

  return (
    <div style={{ backgroundColor: 'var(--sl-card)', borderRadius: 16, border: `1px solid ${isActive ? color + '40' : 'var(--sl-border)'}`, padding: 14, opacity: isActive ? 1 : 0.65 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Logo club */}
        <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {grant.clubs?.logo_url
            ? <img src={grant.clubs.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
            : <span style={{ fontSize: 14, fontWeight: 800, color }}>{clubName[0]?.toUpperCase()}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--sl-t1)' }}>{clubName}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: `${color}18`, color }}>
              {grant.plan.toUpperCase()}
            </span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t3)' }}>
              {TYPE_LABEL[grant.grant_type] ?? grant.grant_type}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              backgroundColor: isActive ? 'rgba(34,197,94,0.12)' : isExpired ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
              color: isActive ? '#22c55e' : isExpired ? '#f59e0b' : '#ef4444',
            }}>
              {isActive ? 'Actif' : isExpired ? 'Expiré' : 'Révoqué'}
            </span>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--sl-t2)', fontStyle: 'italic' }}>{grant.reason}</p>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--sl-t3)', flexWrap: 'wrap' }}>
            <span>🗓️ {new Date(grant.starts_at).toLocaleDateString('fr-FR')}</span>
            <span>→ {grant.ends_at ? new Date(grant.ends_at).toLocaleDateString('fr-FR') : '∞ À vie'}</span>
            <span>Par : {grant.admin_email ?? grant.granted_by?.slice(0, 8)}</span>
          </div>
          {grant.revoked_at && (
            <p style={{ margin: '6px 0 0', fontSize: 10, color: '#ef4444' }}>
              Révoqué le {new Date(grant.revoked_at).toLocaleDateString('fr-FR')} — {grant.revoke_reason}
            </p>
          )}
        </div>
        {isActive && !confirm && (
          <button onClick={() => setConfirm(true)} data-testid={`grant-revoke-${grant.id}`}
            style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', fontSize: 11, fontWeight: 600, color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', cursor: 'pointer', flexShrink: 0 }}>
            Révoquer
          </button>
        )}
        {confirm && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={handleRevoke} disabled={revoking} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 700, color: '#fff', backgroundColor: '#ef4444', cursor: 'pointer' }}>
              {revoking ? '…' : 'Confirmer'}
            </button>
            <button onClick={() => setConfirm(false)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--sl-border)', fontSize: 11, backgroundColor: 'var(--sl-surface)', cursor: 'pointer', color: 'var(--sl-t2)' }}>
              Non
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface AdminLicensesPageProps {
  onBack: () => void;
}

export default function AdminLicensesPage({ onBack }: AdminLicensesPageProps) {
  const { grants, loading, createGrant, revokeGrant } = useAdminGrants() as any;
  const { toast } = useToast() as any;

  const [showForm,    setShowForm]    = useState(false);
  const [filterState, setFilterState] = useState('active');
  const [clubs,       setClubs]       = useState<any[]>([]);
  const [clubSearch,  setClubSearch]  = useState('');

  const [formClubId,    setFormClubId]    = useState('');
  const [formPlan,      setFormPlan]      = useState('pro');
  const [formPreset,    setFormPreset]    = useState<string | null>(null);
  const [formReason,    setFormReason]    = useState('');
  const [formType,      setFormType]      = useState('manual');
  const [formMonths,    setFormMonths]    = useState(3);
  const [formLifetime,  setFormLifetime]  = useState(false);
  const [submitting,    setSubmitting]    = useState(false);

  useEffect(() => {
    supabase.from('clubs').select('id, name, logo_url, sport').eq('status', 'verified').limit(500)
      .then(({ data }: { data: any[] | null }) => { if (data) setClubs(data); });
  }, []);

  const filteredClubs = clubSearch.trim().length >= 2
    ? clubs.filter(c => c.name.toLowerCase().includes(clubSearch.toLowerCase())).slice(0, 8)
    : [];

  const filteredGrants = (grants as any[]).filter(g => {
    const now = new Date();
    const active  = !g.revoked_at && (!g.ends_at || new Date(g.ends_at) > now);
    const expired = !g.revoked_at && g.ends_at && new Date(g.ends_at) <= now;
    if (filterState === 'active')  return active;
    if (filterState === 'expired') return expired;
    if (filterState === 'revoked') return !!g.revoked_at;
    return true;
  });

  function applyPreset(preset: any) {
    setFormPreset(preset.label);
    setFormPlan(preset.plan);
    setFormType(preset.type);
    setFormMonths(preset.months ?? 3);
    setFormLifetime(preset.months === null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formClubId) return toast({ message: 'Sélectionner un club', type: 'error' });
    if (!formReason.trim()) return toast({ message: 'Raison obligatoire', type: 'error' });
    setSubmitting(true);
    try {
      await createGrant({
        club_id:    formClubId,
        plan:       formPlan,
        reason:     formReason,
        grant_type: formType,
        months:     formLifetime ? null : formMonths,
      });
      toast({ message: 'Grant créé avec succès' });
      setShowForm(false);
      setFormClubId(''); setFormReason(''); setFormPreset(null); setClubSearch('');
    } catch (e: any) {
      toast({ message: e.message, type: 'error' });
    } finally { setSubmitting(false); }
  }

  const activeCount  = (grants as any[]).filter(g => !g.revoked_at && (!g.ends_at || new Date(g.ends_at) > new Date())).length;
  const expiredCount = (grants as any[]).filter(g => !g.revoked_at && g.ends_at && new Date(g.ends_at) <= new Date()).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--sl-border)' }}>
        <button onClick={onBack} aria-label="Retour à l'administration" style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)' }}>Licences & Grants</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--sl-t3)' }}>{activeCount} actifs · {expiredCount} expirés</p>
        </div>
        <button onClick={() => setShowForm(p => !p)}
          style={{ padding: '8px 16px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 700, color: '#fff', backgroundColor: '#8b5cf6', cursor: 'pointer' }}>
          + Accorder
        </button>
      </div>

      {/* Formulaire création */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', flexShrink: 0, borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)' }}>
            <form onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Nouveau grant / licence</p>

              {/* Presets rapides */}
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600 }}>Préréglages :</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(GRANT_PRESETS as any[]).map(p => (
                    <button key={p.label} type="button" onClick={() => applyPreset(p)}
                      style={{
                        padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        backgroundColor: formPreset === p.label ? '#8b5cf6' : 'var(--sl-card)',
                        color: formPreset === p.label ? '#fff' : 'var(--sl-t2)',
                        border: `1px solid ${formPreset === p.label ? '#8b5cf6' : 'var(--sl-border)'}`,
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Club */}
              <div>
                <label htmlFor="grant-club-search" style={{ display: 'block', margin: '0 0 6px', fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600 }}>Club * :</label>
                <input id="grant-club-search" value={clubSearch} onChange={e => { setClubSearch(e.target.value); if (!e.target.value) setFormClubId(''); }}
                  placeholder="Rechercher un club vérifié…" aria-label="Rechercher un club vérifié"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--sl-border)', fontSize: 12, backgroundColor: 'var(--sl-card)', color: 'var(--sl-t1)', outline: 'none' }} />
                {filteredClubs.length > 0 && (
                  <div style={{ marginTop: 4, backgroundColor: 'var(--sl-card)', borderRadius: 12, border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
                    {filteredClubs.map(c => (
                      <button key={c.id} type="button" onClick={() => { setFormClubId(c.id); setClubSearch(c.name); }}
                        style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', backgroundColor: formClubId === c.id ? 'rgba(139,92,246,0.12)' : 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--sl-t1)' }}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Plan + Durée */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600 }}>Plan accordé :</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['starter','pro','elite'].map(p => (
                      <button key={p} type="button" onClick={() => setFormPlan(p)}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 10, border: `2px solid ${formPlan === p ? PLAN_COLOR[p] : 'var(--sl-border)'}`, cursor: 'pointer', fontSize: 12, fontWeight: 700, backgroundColor: formPlan === p ? `${PLAN_COLOR[p]}18` : 'var(--sl-card)', color: formPlan === p ? PLAN_COLOR[p] : 'var(--sl-t3)' }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="grant-months" style={{ display: 'block', margin: '0 0 6px', fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600 }}>Durée :</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button type="button" onClick={() => setFormLifetime(p => !p)} aria-pressed={formLifetime}
                      style={{ padding: '7px 12px', borderRadius: 10, border: `2px solid ${formLifetime ? '#f59e0b' : 'var(--sl-border)'}`, cursor: 'pointer', fontSize: 12, fontWeight: 700, backgroundColor: formLifetime ? 'rgba(245,158,11,0.12)' : 'var(--sl-card)', color: formLifetime ? '#f59e0b' : 'var(--sl-t3)' }}>
                      À vie
                    </button>
                    {!formLifetime && (
                      <input id="grant-months" type="number" min="1" max="120" value={formMonths} onChange={e => setFormMonths(Number(e.target.value))} aria-label="Durée en mois"
                        style={{ width: 60, padding: '7px 8px', borderRadius: 10, border: '1px solid var(--sl-border)', fontSize: 12, textAlign: 'center', backgroundColor: 'var(--sl-card)', color: 'var(--sl-t1)', outline: 'none' }} />
                    )}
                    {!formLifetime && <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>mois</span>}
                  </div>
                </div>
              </div>

              {/* Raison */}
              <div>
                <label htmlFor="grant-reason" style={{ display: 'block', margin: '0 0 6px', fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600 }}>Motif * :</label>
                <input id="grant-reason" value={formReason} onChange={e => setFormReason(e.target.value)}
                  placeholder="Ex: Partenariat Ligue Bretagne, club test, club démo…"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--sl-border)', fontSize: 12, backgroundColor: 'var(--sl-card)', color: 'var(--sl-t1)', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => {
                  setShowForm(false);
                  setFormClubId(''); setFormReason(''); setFormPreset(null);
                  setClubSearch(''); setFormPlan('pro'); setFormType('manual');
                  setFormMonths(3); setFormLifetime(false);
                }}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: '1px solid var(--sl-border)', fontSize: 13, fontWeight: 600, color: 'var(--sl-t2)', backgroundColor: 'var(--sl-card)', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" disabled={submitting || !formClubId} data-testid="grant-submit-btn"
                  style={{ flex: 2, padding: '10px 0', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 700, color: '#fff', backgroundColor: formClubId ? '#8b5cf6' : '#94a3b8', cursor: formClubId ? 'pointer' : 'not-allowed' }}>
                  {submitting ? 'Création…' : 'Accorder le grant'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtres */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid var(--sl-border)' }}>
        {[
          { id: 'active',  label: `Actifs (${activeCount})` },
          { id: 'expired', label: `Expirés (${expiredCount})` },
          { id: 'revoked', label: 'Révoqués' },
          { id: 'all',     label: 'Tous' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilterState(f.id)}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: filterState === f.id ? '#8b5cf6' : 'var(--sl-surface)', color: filterState === f.id ? '#fff' : 'var(--sl-t2)' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <div style={{ textAlign: 'center', padding: 32, color: 'var(--sl-t3)', fontSize: 13 }}>Chargement…</div>}
        {!loading && filteredGrants.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🎁</div>
            <p style={{ fontSize: 13, color: 'var(--sl-t3)' }}>Aucun grant dans cette catégorie</p>
          </div>
        )}
        {filteredGrants.map((g: any) => (
          <GrantCard key={g.id} grant={g} onRevoke={revokeGrant} />
        ))}
      </div>
    </div>
  );
}
