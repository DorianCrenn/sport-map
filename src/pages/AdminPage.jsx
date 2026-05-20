import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useClubRequests } from '../hooks/useClubRequests.js';
import { useClubs } from '../hooks/useClubs.js';
import { useSports } from '../hooks/useSports.js';
import { supabase } from '../lib/supabase.js';
import SportIcon from '../components/SportIcon.jsx';
import { SPORT_ICON_OPTIONS, SPORT_ICONS } from '../components/sportIcons.js';

const PRESET_COLORS = [
  '#16a34a','#f97316','#eab308','#dc2626','#2563eb',
  '#06b6d4','#7c3aed','#ec4899','#14b8a6','#f59e0b',
  '#6366f1','#84cc16',
];

const STAT_BG = {
  blue:   { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  amber:  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  green:  { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  red:    { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
};

function SportForm({ initial, saveLabel = 'Ajouter', onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? { label: '', color: '#16a34a', iconId: 'Football' });
  const [error, setError] = useState('');

  function set(k) { return v => setForm(p => ({ ...p, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.label.trim()) { setError('Nom requis'); return; }
    onSave(form);
  }

  const selectedIcon = SPORT_ICONS[form.iconId];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ borderRadius: 16, border: '1px solid var(--sl-border)', padding: 12, backgroundColor: 'var(--sl-card)' }}
    >
      <h3 style={{ fontWeight: 700, fontSize: 12, marginBottom: 12, color: 'var(--sl-t1)', fontFamily: 'Inter, sans-serif' }}>
        {saveLabel === 'Ajouter' ? 'Nouveau sport' : 'Modifier le sport'}
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Nom */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 6, display: 'block' }}>Nom du sport *</label>
          <input
            value={form.label}
            onChange={e => { set('label')(e.target.value); setError(''); }}
            placeholder="Ex: Natation"
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--sl-border)', fontSize: 13, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', fontFamily: 'Inter, sans-serif' }}
          />
          {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>}
        </div>

        {/* Couleur */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 6, display: 'block' }}>Couleur</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => set('color')(c)}
                style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: c, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }}
              />
            ))}
            <input type="color" value={form.color} onChange={e => set('color')(e.target.value)}
              style={{ width: 28, height: 28, borderRadius: 8, cursor: 'pointer', border: 'none', padding: 0 }}
              title="Couleur personnalisée"
            />
          </div>
        </div>

        {/* Icône */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 6, display: 'block' }}>Icône</label>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, maxHeight: 208, overflowY: 'auto', paddingBottom: 4, overscrollBehavior: 'contain' }}>
              {SPORT_ICON_OPTIONS.map(opt => {
                const isSelected = form.iconId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => set('iconId')(opt.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '8px 4px', borderRadius: 12, cursor: 'pointer',
                      backgroundColor: isSelected ? `${form.color}18` : 'var(--sl-surface)',
                      border: `2px solid ${isSelected ? form.color : 'transparent'}`,
                      transition: 'all 0.12s',
                    }}
                    title={opt.label}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" style={{ color: isSelected ? form.color : 'var(--sl-t3)' }}>
                      <g dangerouslySetInnerHTML={{ __html: SPORT_ICONS[opt.id] }} />
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

        {/* Aperçu */}
        {form.label && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, backgroundColor: `${form.color}12` }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: `${form.color}25` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ color: form.color }}>
                <g dangerouslySetInnerHTML={{ __html: selectedIcon ?? SPORT_ICONS.Football }} />
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

function roleColor(role) {
  return { superadmin: '#7c3aed', admin: '#3b82f6', club_admin: '#f59e0b', user: '#64748b' }[role] ?? '#64748b';
}
function roleLabel(role) {
  return { superadmin: 'Super Admin', admin: 'Admin', club_admin: 'Club', user: 'Membre' }[role] ?? role;
}

export default function AdminPage() {
  const { isAdmin, currentUser } = useAuth();
  const { requests, pendingRequests, reviewRequest } = useClubRequests();
  const { addClub } = useClubs();
  const { allSports, customSports, deletedDefaults, addSport, updateSport, deleteSport, restoreSport, toggleArchive } = useSports();
  const [tab, setTab] = useState('overview');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [showSportForm, setShowSportForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('profiles').select('*').order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setAdminUsers(data); });
  }, [isAdmin]);

  async function updateUserRole(userId, patch) {
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

  async function approveRequest(req) {
    try {
      const club = await addClub({ name: req.clubName, sport: req.sport, city: req.city, description: req.description });
      await updateUserRole(req.userId, { role: 'club_admin', club_id: club.id });
      reviewRequest(req.id, 'approved', reviewNote);
      setReviewingId(null);
      setReviewNote('');
    } catch (err) {
      console.error('[AdminPage] approveRequest failed:', err.message);
      alert(`Erreur lors de l'approbation : ${err.message}\n\nVérifiez les politiques RLS Supabase (profiles).`);
    }
  }

  function rejectRequest(reqId) {
    reviewRequest(reqId, 'rejected', reviewNote);
    setReviewingId(null);
    setReviewNote('');
  }

  function toggleRole(user) {
    if (user.role === 'user') updateUserRole(user.id, { role: 'admin' });
    else if (user.role === 'admin' && user.id !== currentUser.id) updateUserRole(user.id, { role: 'user' });
  }

  const TABS = [
    { id: 'overview', label: 'Aperçu' },
    { id: 'requests', label: pendingRequests.length > 0 ? `Demandes (${pendingRequests.length})` : 'Demandes' },
    { id: 'users', label: 'Utilisateurs' },
    { id: 'sports', label: 'Sports' },
  ];

  const approved = requests.filter(r => r.status === 'approved').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;

  const STAT_CARDS = [
    { label: 'Utilisateurs', value: adminUsers.length, ...STAT_BG.blue, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: 'En attente',    value: pendingRequests.length, ...STAT_BG.amber, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: 'Clubs approuvés', value: approved, ...STAT_BG.green, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label: 'Rejetés', value: rejected, ...STAT_BG.red, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
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
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>Administration</h1>
        </div>
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 16px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                borderBottom: `2px solid ${tab === t.id ? 'var(--sl-green)' : 'transparent'}`,
                color: tab === t.id ? 'var(--sl-green)' : 'var(--sl-t3)',
                backgroundColor: 'transparent', border: 'none',
                borderBottom: `2px solid ${tab === t.id ? 'var(--sl-green)' : 'transparent'}`,
                cursor: 'pointer', flexShrink: 0, transition: 'color 0.15s',
              }}
            >
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
              {STAT_CARDS.map(({ label, value, color, bg, icon }) => (
                <div key={label} style={{ backgroundColor: 'var(--sl-card)', borderRadius: 16, padding: 16, border: '1px solid var(--sl-border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, backgroundColor: bg, color }}>
                    {icon}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 2, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--sl-t3)', fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>

            {pendingRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 16, border: '1px solid rgba(245,158,11,0.35)', backgroundColor: 'rgba(245,158,11,0.08)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                    {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: 0 }}>Des clubs attendent votre validation.</p>
              </motion.div>
            )}

            {requests.length === 0 && (
              <div style={{ backgroundColor: 'var(--sl-card)', borderRadius: 16, padding: '24px 16px', textAlign: 'center', border: '1px solid var(--sl-border)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--sl-t3)', margin: 0 }}>Aucune demande de club pour l'instant</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── REQUESTS ── */}
        {tab === 'requests' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 64 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p style={{ fontSize: 13, color: 'var(--sl-t3)' }}>Aucune demande</p>
              </div>
            )}
            {requests.map(req => {
              const sport = allSports[req.sport];
              const isPending = req.status === 'pending';
              const isApproved = req.status === 'approved';
              const isReviewing = reviewingId === req.id;

              return (
                <div key={req.id} style={{ backgroundColor: 'var(--sl-card)', borderRadius: 16, border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--sl-t1)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.clubName}</div>
                        <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>
                          Par <span style={{ fontWeight: 500, color: 'var(--sl-t2)' }}>{req.userName}</span> · {req.city}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0,
                        backgroundColor: isPending ? 'rgba(245,158,11,0.12)' : isApproved ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: isPending ? '#f59e0b' : isApproved ? '#16a34a' : '#dc2626',
                      }}>
                        {isPending ? 'En attente' : isApproved ? 'Approuvé' : 'Rejeté'}
                      </span>
                    </div>

                    {sport && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: 'white', backgroundColor: sport.color }}>
                        <SportIcon sport={sport.id} size={11} color="white" /> {sport.label}
                      </span>
                    )}

                    {req.description && (
                      <p style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 8, lineHeight: 1.6, margin: '8px 0 0' }}>{req.description}</p>
                    )}

                    <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 10 }}>
                      {new Date(req.requestedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>

                    {req.reviewNote && (
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--sl-t3)', fontStyle: 'italic', borderTop: '1px solid var(--sl-border)', paddingTop: 8 }}>
                        Note : {req.reviewNote}
                      </div>
                    )}
                  </div>

                  {isPending && (
                    isReviewing ? (
                      <div style={{ borderTop: '1px solid var(--sl-border)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <textarea
                          value={reviewNote}
                          onChange={e => setReviewNote(e.target.value)}
                          placeholder="Note optionnelle pour le demandeur…"
                          rows={2}
                          style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--sl-border)', fontSize: 12, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', resize: 'none', fontFamily: 'Inter, sans-serif' }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => { setReviewingId(null); setReviewNote(''); }}
                            style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: '1px solid var(--sl-border)', fontSize: 11, color: 'var(--sl-t2)', fontWeight: 600, backgroundColor: 'var(--sl-surface)', cursor: 'pointer' }}>
                            Annuler
                          </button>
                          <button
                            onClick={() => rejectRequest(req.id)}
                            style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444', cursor: 'pointer' }}>
                            Rejeter
                          </button>
                          <button
                            onClick={() => approveRequest(req)}
                            style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', fontSize: 11, fontWeight: 700, color: 'white', backgroundColor: '#22C55E', cursor: 'pointer' }}>
                            Approuver
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ borderTop: '1px solid var(--sl-border)' }}>
                        <button
                          onClick={() => setReviewingId(req.id)}
                          style={{ width: '100%', padding: '10px 0', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--sl-t2)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          Examiner la demande
                        </button>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--sl-t3)', fontWeight: 500, marginBottom: 4 }}>{adminUsers.length} utilisateur{adminUsers.length > 1 ? 's' : ''}</p>
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
                    <button
                      onClick={() => toggleRole(user)}
                      style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, flexShrink: 0, border: `1px solid ${color}40`, backgroundColor: `${color}15`, color, cursor: 'pointer' }}
                      title="Cliquer pour changer le rôle">
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
                <button
                  onClick={() => setShowSportForm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 12, color: 'white', backgroundColor: '#22C55E', border: 'none', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span> Nouveau sport
                </button>
              )}
            </div>

            <AnimatePresence>
              {showSportForm && (
                <SportForm
                  key="sport-form"
                  onSave={(data) => { addSport(data); setShowSportForm(false); }}
                  onCancel={() => setShowSportForm(false)}
                />
              )}
            </AnimatePresence>

            {/* Liste des sports */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.values(allSports).map(sport => {
                const isEditing = editingId === sport.id;
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
                              : <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t3)' }}>Par défaut</span>
                          }
                          {isArchived && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, backgroundColor: 'rgba(249,115,22,0.12)', color: '#f97316' }}>Archivé</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => setEditingId(isEditing ? null : sport.id)}
                          style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', backgroundColor: isEditing ? 'rgba(59,130,246,0.12)' : 'var(--sl-surface)', color: isEditing ? '#3b82f6' : 'var(--sl-t3)' }}
                          title="Modifier"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>

                        <button
                          onClick={() => toggleArchive(sport.id)}
                          style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', backgroundColor: isArchived ? 'rgba(249,115,22,0.12)' : 'var(--sl-surface)', color: isArchived ? '#f97316' : 'var(--sl-t3)' }}
                          title={isArchived ? 'Désarchiver' : 'Archiver'}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/>
                          </svg>
                        </button>

                        <button
                          onClick={() => deleteSport(sport.id)}
                          style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                          title="Supprimer"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    <AnimatePresence>
                      {isEditing && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          style={{ borderTop: '1px solid var(--sl-border)', overflow: 'hidden' }}
                        >
                          <div style={{ padding: 12 }}>
                            <SportForm
                              initial={{ label: sport.label, color: sport.color, iconId: sport.iconId ?? sport.id }}
                              saveLabel="Enregistrer"
                              onSave={(data) => { updateSport(sport.id, data); setEditingId(null); }}
                              onCancel={() => setEditingId(null)}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Sports supprimés */}
            {deletedDefaults.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Sports supprimés</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {deletedDefaults.map(sport => (
                    <div key={sport.id} style={{ backgroundColor: 'var(--sl-card)', borderRadius: 16, padding: 12, border: '1px dashed var(--sl-border)', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: `${sport.color}18` }}>
                        <SportIcon sport={sport.id} size={20} color={sport.color} />
                      </div>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--sl-t3)' }}>{sport.label}</div>
                      <button
                        onClick={() => restoreSport(sport.id)}
                        style={{ fontSize: 10, fontWeight: 700, padding: '6px 10px', borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: 'rgba(34,197,94,0.12)', color: '#16a34a' }}
                      >
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
