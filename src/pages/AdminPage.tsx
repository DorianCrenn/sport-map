import { useState, useEffect, type JSX, type FormEvent, type MouseEvent, type ChangeEvent, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useClubs } from '../hooks/useClubs.js';
import { useSports } from '../hooks/useSports.js';
import { supabase } from '../lib/supabase.js';
import SportIcon from '../components/SportIcon.jsx';
import { SPORT_ICON_OPTIONS, SPORT_ICONS } from '../components/sportIcons.js';
import { IconStadium, IconMapPin, IconUsers, IconCheckCircle, IconX } from '../components/icons.js';

const PRESET_COLORS: string[] = [
  '#16a34a','#f97316','#eab308','#dc2626','#2563eb',
  '#06b6d4','#7c3aed','#ec4899','#14b8a6','#f59e0b',
  '#6366f1','#84cc16',
];

interface ColorStyle {
  bg: string;
  color: string;
}

const STAT_BG: Record<string, ColorStyle> = {
  blue:   { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  amber:  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  green:  { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  red:    { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
};

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  all:                  'Tous',
  pending_verification: 'En attente',
  verified:             'Vérifiés',
  rejected:             'Rejetés',
  suspended:            'Suspendus',
  draft:                'Brouillons',
};

const STATUS_COLORS: Record<string, ColorStyle> = {
  pending_verification: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  verified:             { bg: 'rgba(34,197,94,0.12)',   color: '#16a34a' },
  rejected:             { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  suspended:            { bg: 'rgba(249,115,22,0.12)',  color: '#ea580c' },
  draft:                { bg: 'rgba(100,116,139,0.12)', color: '#64748b' },
};

function statusBadge(status: string): JSX.Element {
  const c: ColorStyle = STATUS_COLORS[status] ?? { bg: 'var(--sl-surface)', color: 'var(--sl-t3)' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, backgroundColor: c.bg, color: c.color }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function completeness(club: Record<string, any>): number {
  const fields = ['name','sport','city','description','logo_url','email','phone','manager_name','venue','address'];
  const filled = fields.filter(f => club[f] && String(club[f]).trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
}

// ── Sport form ────────────────────────────────────────────────────────────────

interface SportFormData {
  label: string;
  color: string;
  iconId: string;
}

interface SportFormProps {
  initial?: SportFormData;
  saveLabel?: string;
  onSave: (data: SportFormData) => void;
  onCancel: () => void;
}

function SportForm({ initial, saveLabel = 'Ajouter', onSave, onCancel }: SportFormProps) {
  const [form, setForm] = useState<SportFormData>(initial ?? { label: '', color: '#16a34a', iconId: 'Football' });
  const [error, setError] = useState<string>('');
  function set(k: keyof SportFormData) { return (v: string) => setForm(p => ({ ...p, [k]: v })); }
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.label.trim()) { setError('Nom requis'); return; }
    onSave(form);
  }
  const selectedIcon = (SPORT_ICONS as any)[form.iconId];
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ borderRadius: 16, border: '1px solid var(--sl-border)', padding: 12, backgroundColor: 'var(--sl-card)' }}>
      <h3 style={{ fontWeight: 700, fontSize: 12, marginBottom: 12, color: 'var(--sl-t1)', fontFamily: 'Inter, sans-serif' }}>
        {saveLabel === 'Ajouter' ? 'Nouveau sport' : 'Modifier le sport'}
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 6, display: 'block' }}>Nom du sport *</label>
          <input value={form.label} onChange={e => { set('label')(e.target.value); setError(''); }}
            placeholder="Ex: Natation"
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--sl-border)', fontSize: 13, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
          {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>}
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 6, display: 'block' }}>Couleur</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => set('color')(c)}
                style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: c, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
            ))}
            <input type="color" value={form.color} onChange={e => set('color')(e.target.value)}
              style={{ width: 28, height: 28, borderRadius: 8, cursor: 'pointer', border: 'none', padding: 0 }} title="Couleur personnalisée" />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 6, display: 'block' }}>Icône</label>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, maxHeight: 208, overflowY: 'auto', paddingBottom: 4, overscrollBehavior: 'contain' }}>
              {(SPORT_ICON_OPTIONS as any[]).map(opt => {
                const isSelected = form.iconId === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => set('iconId')(opt.id)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', borderRadius: 12, cursor: 'pointer', backgroundColor: isSelected ? `${form.color}18` : 'var(--sl-surface)', border: `2px solid ${isSelected ? form.color : 'transparent'}`, transition: 'all 0.12s' }}
                    title={opt.label}>
                    <svg width="26" height="26" viewBox="0 0 24 24" style={{ color: isSelected ? form.color : 'var(--sl-t3)' }}>
                      <g dangerouslySetInnerHTML={{ __html: (SPORT_ICONS as any)[opt.id] }} />
                    </svg>
                    <span style={{ fontSize: 10, textAlign: 'center', width: '100%', padding: '0 2px', color: isSelected ? form.color : 'var(--sl-t3)', fontWeight: isSelected ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ pointerEvents: 'none', position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, borderRadius: '0 0 12px 12px', background: 'linear-gradient(to bottom, transparent, var(--sl-card))' }} />
          </div>
        </div>
        {form.label && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, backgroundColor: `${form.color}12` }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: `${form.color}25` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ color: form.color }}>
                <g dangerouslySetInnerHTML={{ __html: selectedIcon ?? (SPORT_ICONS as any).Football }} />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: form.color, flex: 1 }}>{form.label}</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, color: 'white', backgroundColor: form.color }}>Aperçu</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, paddingTop: 2 }}>
          <button type="button" onClick={onCancel}
            style={{ flex: 1, padding: '8px 0', borderRadius: 12, border: '1px solid var(--sl-border)', fontSize: 12, fontWeight: 600, color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer' }}>
            Annuler
          </button>
          <button type="submit"
            style={{ flex: 1, padding: '8px 0', borderRadius: 12, border: 'none', fontSize: 12, fontWeight: 700, color: 'white', backgroundColor: '#22C55E', cursor: 'pointer' }}>
            {saveLabel}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function roleColor(role: string): string {
  return ({ superadmin: '#7c3aed', admin: '#3b82f6', club_admin: '#f59e0b', user: '#64748b' } as Record<string, string>)[role] ?? '#64748b';
}
function roleLabel(role: string): string {
  return ({ superadmin: 'Super Admin', admin: 'Admin', club_admin: 'Club', user: 'Membre' } as Record<string, string>)[role] ?? role;
}

// ── Admin page ────────────────────────────────────────────────────────────────

interface AdminPageProps {
  onNavigate?: (target: string) => void;
}

interface ClubStats {
  pending: number;
  verified: number;
  rejected: number;
}

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const { isAdmin, currentUser } = useAuth() as any;
  const { verifyClub, rejectClub, requestClubInfo, suspendClub } = useClubs() as any;
  const { allSports, customSports, deletedDefaults, addSport, updateSport, deleteSport, restoreSport, toggleArchive } = useSports() as any;

  const [tab, setTab] = useState<string>('overview');

  // ── Clubs tab state ───────────────────────────────────────────────────────
  const [clubStatusFilter, setClubStatusFilter] = useState<string>('pending_verification');
  const [clubSearch, setClubSearch] = useState<string>('');
  const [adminClubs, setAdminClubs] = useState<Record<string, any>[]>([]);
  const [clubsLoading, setClubsLoading] = useState<boolean>(false);
  const [reviewingClubId, setReviewingClubId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const [clubStats, setClubStats] = useState<ClubStats>({ pending: 0, verified: 0, rejected: 0 });
  const [userCount, setUserCount] = useState<number | null>(null);

  // ── Users tab state ───────────────────────────────────────────────────────
  const [adminUsers, setAdminUsers] = useState<Record<string, any>[]>([]);

  // ── Sports tab state ──────────────────────────────────────────────────────
  const [showSportForm, setShowSportForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Session (pour invoquer les edge functions) ────────────────────────────
  const [session, setSession] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: any }) => setSession(data.session));
  }, []);

  // ── Fetch stats ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('status', 'pending_verification'),
      supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('status', 'verified'),
      supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]).then(([pending, verified, rejected, users]: any[]) => {
      setClubStats({
        pending:  pending.count  ?? 0,
        verified: verified.count ?? 0,
        rejected: rejected.count ?? 0,
      });
      setUserCount(users.count ?? 0);
    });
  }, [isAdmin, adminClubs]);

  // ── Fetch clubs for admin tab ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin || tab !== 'clubs') return;
    setClubsLoading(true);
    let query = supabase.from('clubs').select('*').order('created_at', { ascending: false });
    if (clubStatusFilter !== 'all') query = query.eq('status', clubStatusFilter);
    query.limit(200).then(({ data, error }: { data: any; error: any }) => {
      if (error) console.error('[AdminPage] clubs fetch:', error.message);
      setAdminClubs(data ?? []);
      setClubsLoading(false);
    });
  }, [isAdmin, tab, clubStatusFilter]);

  // ── Fetch users ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin || tab !== 'users') return;
    supabase.from('profiles').select('*').order('created_at', { ascending: true }).limit(500)
      .then(({ data }: { data: any }) => { if (data) setAdminUsers(data); });
  }, [isAdmin, tab]);

  async function updateUserRole(userId: string, patch: Record<string, any>): Promise<void> {
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
    if (error) throw new Error(error.message);
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, ...patch } : u));
  }

  if (!isAdmin) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--sl-bg)' }}>
        <p style={{ color: 'var(--sl-t3)', fontSize: 13 }}>Accès non autorisé</p>
      </div>
    );
  }

  // ── Club actions ──────────────────────────────────────────────────────────

  async function handleClubAction(clubRow: Record<string, any>, action: string): Promise<void> {
    setActionLoading(true);
    try {
      if (action === 'verify')    await verifyClub(clubRow.id, adminNote);
      if (action === 'reject')    await rejectClub(clubRow.id, adminNote);
      if (action === 'info')      await requestClubInfo(clubRow.id, adminNote);
      if (action === 'suspend')   await suspendClub(clubRow.id, adminNote);

      // Mettre à jour la liste locale
      const newStatus = ({ verify: 'verified', reject: 'rejected', info: 'pending_verification', suspend: 'suspended' } as Record<string, string>)[action];
      setAdminClubs(prev => prev.map(c => c.id === clubRow.id ? { ...c, status: newStatus } : c));

      // Notification par email (fire-and-forget)
      if (session) {
        const eventTypeMap: Record<string, string> = { verify: 'verified', reject: 'rejected', info: 'info_requested', suspend: 'suspended' };
        supabase.functions.invoke('notify-club-status', {
          body: { club_id: clubRow.id, event_type: eventTypeMap[action], note: adminNote },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }).catch((err: any) => console.warn('[AdminPage] notify-club-status failed:', err.message));
      }

      setReviewingClubId(null);
      setAdminNote('');
    } catch (err: any) {
      console.error('[AdminPage] club action failed:', err.message);
      alert(`Erreur : ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  function toggleRole(user: Record<string, any>): void {
    if (user.role === 'user') updateUserRole(user.id, { role: 'admin' });
    else if (user.role === 'admin' && user.id !== currentUser.id) updateUserRole(user.id, { role: 'user' });
  }

  const filteredClubs = adminClubs.filter(c =>
    !clubSearch || c.name?.toLowerCase().includes(clubSearch.toLowerCase()) || c.city?.toLowerCase().includes(clubSearch.toLowerCase())
  );

  const TABS = [
    { id: 'overview', label: 'Aperçu' },
    { id: 'clubs',    label: clubStats.pending > 0 ? `Clubs (${clubStats.pending})` : 'Clubs' },
    { id: 'users',    label: 'Utilisateurs' },
    { id: 'sports',   label: 'Sports' },
  ];

  const STAT_CARDS = [
    { label: 'Utilisateurs', value: userCount ?? '…', ...STAT_BG.blue,
      onClick: () => setTab('users'),
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: 'En attente',      value: clubStats.pending,  ...STAT_BG.amber,
      onClick: () => { setTab('clubs'); setClubStatusFilter('pending_verification'); },
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: 'Clubs vérifiés',  value: clubStats.verified, ...STAT_BG.green,
      onClick: () => { setTab('clubs'); setClubStatusFilter('verified'); },
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label: 'Refusés',         value: clubStats.rejected, ...STAT_BG.red,
      onClick: () => { setTab('clubs'); setClubStatusFilter('rejected'); },
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, backgroundColor: 'var(--sl-card)', borderBottom: '1px solid var(--sl-border)', padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'var(--sl-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.01em', fontFamily: "'Barlow Condensed', sans-serif" }}>Administration</h1>
        </div>
        <div role="tablist" aria-label="Sections administration" style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' as CSSProperties['scrollbarWidth'] }}>
          {TABS.map(t => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '10px 16px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
                color: tab === t.id ? 'var(--sl-green)' : 'var(--sl-t3)',
                backgroundColor: 'transparent', border: 'none',
                borderBottom: `2px solid ${tab === t.id ? 'var(--sl-green)' : 'transparent'}`,
                flexShrink: 0, transition: 'color 0.15s',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, overscrollBehavior: 'contain' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {STAT_CARDS.map(({ label, value, color, bg, icon, onClick }) => (
                <button key={label} onClick={onClick}
                  style={{ backgroundColor: 'var(--sl-card)', borderRadius: 16, padding: 16, border: '1px solid var(--sl-border)', textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = color; }}
                  onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--sl-border)'; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, backgroundColor: bg, color }}>
                    {icon}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 2, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--sl-t3)', fontWeight: 500 }}>{label}</div>
                </button>
              ))}
            </div>

            {clubStats.pending > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 16, border: '1px solid rgba(245,158,11,0.35)', backgroundColor: 'rgba(245,158,11,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                    {clubStats.pending} club{clubStats.pending > 1 ? 's' : ''} en attente de vérification
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: 0 }}>Consultez l'onglet "Clubs" pour traiter les demandes.</p>
              </motion.div>
            )}

            {/* ── Cards navigation espaces dédiés ── */}
            <div style={{ marginTop: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                Espaces dédiés
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Feedback */}
                <button
                  onClick={() => onNavigate?.('feedback')}
                  style={{
                    width: '100%', textAlign: 'left',
                    backgroundColor: 'var(--sl-card)', borderRadius: 16, padding: 16,
                    border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = '#6366f1'; }}
                  onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'; }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)' }}>Feedback communautaire</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--sl-t3)' }}>Bugs, idées, questions — gestion des statuts</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>

                {/* Analytics */}
                <button
                  onClick={() => onNavigate?.('analytics')}
                  style={{
                    width: '100%', textAlign: 'left',
                    backgroundColor: 'var(--sl-card)', borderRadius: 16, padding: 16,
                    border: '1px solid rgba(16,185,129,0.25)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = '#10b981'; }}
                  onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'; }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)' }}>Analytics</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--sl-t3)' }}>KPIs, graphiques, fonctionnalités utilisées</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Espaces RBAC ── */}
            <div style={{ marginTop: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                Gestion des accès & abonnements
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { key: 'permissions', label: 'Matrice des permissions', desc: 'Rôles × Ressources × Actions', color: '#8b5cf6', icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )},
                  { key: 'plans', label: 'Matrice des abonnements', desc: 'Feature gates & quotas dynamiques', color: '#f59e0b', icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  )},
                  { key: 'licenses', label: 'Licences & Grants', desc: 'Essais gratuits, partenaires, à vie', color: '#22c55e', icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                    </svg>
                  )},
                  { key: 'audit-log', label: 'Journal d\'audit', desc: 'Historique complet des modifications', color: '#64748b', icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                    </svg>
                  )},
                ].map(item => (
                  <button key={item.key}
                    onClick={() => onNavigate?.(item.key)}
                    style={{
                      width: '100%', textAlign: 'left',
                      backgroundColor: 'var(--sl-card)', borderRadius: 16, padding: 16,
                      border: `1px solid ${item.color}25`, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 14,
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = item.color; }}
                    onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = `${item.color}25`; }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      backgroundColor: `${item.color}14`, color: item.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)' }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--sl-t3)' }}>{item.desc}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── CLUBS ── */}
        {tab === 'clubs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Barre de recherche */}
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input value={clubSearch} onChange={(e: ChangeEvent<HTMLInputElement>) => setClubSearch(e.target.value)}
                placeholder="Rechercher un club…" aria-label="Rechercher un club"
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 12, fontSize: 13, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', color: 'var(--sl-t1)', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
            </div>

            {/* Filtres statut */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['all','pending_verification','verified','rejected','suspended'].map(s => {
                const isActive = clubStatusFilter === s;
                const c: ColorStyle = STATUS_COLORS[s] ?? { bg: 'var(--sl-surface)', color: 'var(--sl-t2)' };
                return (
                  <button key={s} onClick={() => setClubStatusFilter(s)}
                    style={{
                      padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      backgroundColor: isActive ? c.color : 'var(--sl-surface)',
                      color: isActive ? '#fff' : 'var(--sl-t2)',
                      border: `1px solid ${isActive ? c.color : 'var(--sl-border)'}`,
                      transition: 'all 0.12s',
                    }}>
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>

            {/* Liste */}
            {clubsLoading && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--sl-t3)', fontSize: 13 }}>Chargement…</div>
            )}

            {!clubsLoading && filteredClubs.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 48 }}>
                <IconStadium size={36} color="var(--sl-t3)" style={{ marginBottom: 10 }} />
                <p style={{ fontSize: 13, color: 'var(--sl-t3)' }}>Aucun club dans cette catégorie</p>
              </div>
            )}

            {filteredClubs.map(club => {
              const sport     = allSports[club.sport];
              const isReviewing = reviewingClubId === club.id;
              const pct       = completeness(club);
              const initials  = (club.name ?? '?').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase().slice(0, 3);

              return (
                <div key={club.id} style={{ backgroundColor: 'var(--sl-card)', borderRadius: 16, border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
                  <div style={{ padding: 14 }}>
                    {/* Ligne principale */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {/* Logo */}
                      <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, backgroundColor: sport ? `${sport.color}18` : 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {club.logo_url
                          ? <img src={club.logo_url} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                          : <span style={{ fontSize: 12, fontWeight: 800, color: sport?.color ?? 'var(--sl-t3)' }}>{initials}</span>}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {club.name}
                          </span>
                          {statusBadge(club.status)}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {sport && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, color: '#fff', backgroundColor: sport.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <SportIcon sport={sport.id} size={9} color="#fff" /> {sport.label}
                            </span>
                          )}
                          {club.city && <span style={{ fontSize: 11, color: 'var(--sl-t3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><IconMapPin size={11} /> {club.city}</span>}
                          {club.manager_name && <span style={{ fontSize: 11, color: 'var(--sl-t3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><IconUsers size={11} /> {club.manager_name}</span>}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>
                            {new Date(club.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          {/* Score de complétude */}
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: 'var(--sl-border)', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, backgroundColor: pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444', transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444', flexShrink: 0 }}>{pct}%</span>
                          </div>
                        </div>

                        {club.verification_note && (
                          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--sl-t3)', fontStyle: 'italic' }}>
                            Note : {club.verification_note}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Panel d'actions */}
                  {isReviewing ? (
                    <div style={{ borderTop: '1px solid var(--sl-border)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <textarea value={adminNote} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAdminNote(e.target.value)}
                        id="admin-note" aria-label="Note pour le club (optionnelle, visible par le club)"
                        placeholder="Note optionnelle (visible par le club)…"
                        rows={2}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--sl-border)', fontSize: 12, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', resize: 'none', fontFamily: 'Inter, sans-serif' }} />
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => { setReviewingClubId(null); setAdminNote(''); }}
                          style={{ flex: 1, padding: '9px 8px', borderRadius: 12, border: '1px solid var(--sl-border)', fontSize: 11, color: 'var(--sl-t2)', fontWeight: 600, backgroundColor: 'var(--sl-surface)', cursor: 'pointer', minWidth: 60 }}>
                          Annuler
                        </button>
                        <button onClick={() => handleClubAction(club, 'info')} disabled={actionLoading} data-testid="club-action-info"
                          style={{ flex: 1, padding: '9px 8px', borderRadius: 12, border: 'none', fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b', cursor: 'pointer', minWidth: 60 }}>
                          ℹ️ Infos
                        </button>
                        <button onClick={() => handleClubAction(club, 'suspend')} disabled={actionLoading} data-testid="club-action-suspend"
                          style={{ flex: 1, padding: '9px 8px', borderRadius: 12, border: 'none', fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(249,115,22,0.12)', color: '#ea580c', cursor: 'pointer', minWidth: 60 }}>
                          ⏸ Suspendre
                        </button>
                        <button onClick={() => handleClubAction(club, 'reject')} disabled={actionLoading} data-testid="club-action-reject"
                          style={{ flex: 1, padding: '9px 8px', borderRadius: 12, border: 'none', fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444', cursor: 'pointer', minWidth: 60 }}>
                          <IconX size={11} /> Refuser
                        </button>
                        <button onClick={() => handleClubAction(club, 'verify')} disabled={actionLoading} data-testid="club-action-verify"
                          style={{ flex: 2, padding: '9px 8px', borderRadius: 12, border: 'none', fontSize: 11, fontWeight: 700, color: 'white', backgroundColor: '#22C55E', cursor: 'pointer', minWidth: 80, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          {actionLoading ? '…' : <><IconCheckCircle size={11} color="white" /> Vérifier</>}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid var(--sl-border)' }}>
                      <button onClick={() => setReviewingClubId(club.id)} data-testid={`club-review-${club.id}`}
                        style={{ width: '100%', padding: '10px 0', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--sl-t2)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        Examiner
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--sl-t3)', fontWeight: 500, marginBottom: 4 }}>
              {adminUsers.length} utilisateur{adminUsers.length > 1 ? 's' : ''}
            </p>
            {adminUsers.map(user => {
              const color = roleColor(user.role);
              const label = roleLabel(user.role);
              const isSelf = user.id === currentUser?.id;
              const canToggle = (user.role === 'user' || user.role === 'admin') && !isSelf;
              return (
                <div key={user.id} style={{ backgroundColor: 'var(--sl-card)', borderRadius: 16, padding: 16, border: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'white', flexShrink: 0, backgroundColor: color }}>
                    {user.name?.slice(0, 2).toUpperCase() ?? '??'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--sl-t1)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name} {isSelf && <span style={{ fontSize: 9, color: 'var(--sl-t3)', fontWeight: 400 }}>(vous)</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--sl-t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}
                    </div>
                  </div>
                  {canToggle ? (
                    <button onClick={() => toggleRole(user)}
                      aria-label={`Rôle actuel : ${label}. Cliquer pour changer`}
                      style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, flexShrink: 0, border: `1px solid ${color}40`, backgroundColor: `${color}15`, color, cursor: 'pointer' }}>
                      {label}
                    </button>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, flexShrink: 0, backgroundColor: `${color}15`, color }}>
                      {label}
                    </span>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── SPORTS ── */}
        {tab === 'sports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 11, color: 'var(--sl-t3)', fontWeight: 500, margin: 0 }}>
                {Object.keys(allSports).length} sport{Object.keys(allSports).length > 1 ? 's' : ''}
                {customSports.length > 0 && <span style={{ color: '#22C55E', marginLeft: 4 }}>· {customSports.length} personnalisé{customSports.length > 1 ? 's' : ''}</span>}
              </p>
              {!showSportForm && !editingId && (
                <button onClick={() => setShowSportForm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 12, color: 'white', backgroundColor: '#22C55E', border: 'none', cursor: 'pointer' }}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span> Nouveau sport
                </button>
              )}
            </div>
            <AnimatePresence>
              {showSportForm && (
                <SportForm key="sport-form"
                  onSave={(data: SportFormData) => { addSport(data); setShowSportForm(false); }}
                  onCancel={() => setShowSportForm(false)} />
              )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.values(allSports).map((sport: any) => {
                const isEditing  = editingId === sport.id;
                const isArchived = !!sport.isArchived;
                return (
                  <div key={sport.id} style={{ backgroundColor: 'var(--sl-card)', borderRadius: 16, border: '1px solid var(--sl-border)', overflow: 'hidden', opacity: isArchived ? 0.55 : 1, transition: 'opacity 0.2s' }}>
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: `${sport.color}18` }}>
                        <SportIcon sport={sport.id} size={22} color={sport.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--sl-t1)', fontSize: 13 }}>{sport.label}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, backgroundColor: sport.color }} />
                          <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{sport.color}</span>
                          {sport.isCustom
                            ? <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, backgroundColor: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>Personnalisé</span>
                            : sport.isOverride
                              ? <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>Modifié</span>
                              : <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t3)' }}>Par défaut</span>}
                          {isArchived && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, backgroundColor: 'rgba(249,115,22,0.12)', color: '#f97316' }}>Archivé</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => setEditingId(isEditing ? null : sport.id)}
                          aria-label={isEditing ? 'Fermer la modification' : 'Modifier le sport'}
                          style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', backgroundColor: isEditing ? 'rgba(59,130,246,0.12)' : 'var(--sl-surface)', color: isEditing ? '#3b82f6' : 'var(--sl-t3)' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button onClick={() => toggleArchive(sport.id)}
                          aria-label={isArchived ? 'Désarchiver le sport' : 'Archiver le sport'}
                          style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', backgroundColor: isArchived ? 'rgba(249,115,22,0.12)' : 'var(--sl-surface)', color: isArchived ? '#f97316' : 'var(--sl-t3)' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/>
                          </svg>
                        </button>
                        {deletingId === sport.id ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <button onClick={() => { deleteSport(sport.id); setDeletingId(null); }}
                              style={{ padding: '4px 8px', borderRadius: 8, border: 'none', fontSize: 10, fontWeight: 700, color: '#fff', backgroundColor: '#ef4444', cursor: 'pointer' }}>
                              OK
                            </button>
                            <button onClick={() => setDeletingId(null)}
                              style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid var(--sl-border)', fontSize: 10, backgroundColor: 'var(--sl-surface)', cursor: 'pointer', color: 'var(--sl-t2)' }}>
                              Non
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingId(sport.id)}
                            aria-label="Supprimer le sport"
                            style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {isEditing && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          style={{ borderTop: '1px solid var(--sl-border)', overflow: 'hidden' }}>
                          <div style={{ padding: 12 }}>
                            <SportForm initial={{ label: sport.label, color: sport.color, iconId: sport.iconId ?? sport.id }}
                              saveLabel="Enregistrer"
                              onSave={(data: SportFormData) => { updateSport(sport.id, data); setEditingId(null); }}
                              onCancel={() => setEditingId(null)} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            {deletedDefaults.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Sports supprimés</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {deletedDefaults.map((sport: any) => (
                    <div key={sport.id} style={{ backgroundColor: 'var(--sl-card)', borderRadius: 16, padding: 12, border: '1px dashed var(--sl-border)', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: `${sport.color}18` }}>
                        <SportIcon sport={sport.id} size={20} color={sport.color} />
                      </div>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--sl-t3)' }}>{sport.label}</div>
                      <button onClick={() => restoreSport(sport.id)}
                        style={{ fontSize: 10, fontWeight: 700, padding: '6px 10px', borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
                        Restaurer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}
