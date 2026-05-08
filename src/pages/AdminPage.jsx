import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useClubRequests } from '../hooks/useClubRequests.js';
import { useClubs } from '../hooks/useClubs.js';
import { useSports } from '../hooks/useSports.js';
import { SPORTS } from '../data/events.js';

const PRESET_COLORS = [
  '#16a34a','#f97316','#eab308','#dc2626','#2563eb',
  '#06b6d4','#7c3aed','#ec4899','#14b8a6','#f59e0b',
  '#6366f1','#84cc16',
];
const PRESET_EMOJIS = ['⚽','🏀','🏉','🤾','🏃','🚵','🚴','🏊','🎾','🏐','🥊','🏋️','🤸','⛷️','🏄','🎿','🤺','🏇'];

function SportForm({ initial, saveLabel = 'Ajouter', onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? { label: '', color: '#16a34a', emoji: '🏅' });
  const [error, setError] = useState('');

  function set(k) { return v => setForm(p => ({ ...p, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.label.trim()) { setError('Nom requis'); return; }
    onSave(form);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-green-100 p-4 shadow-sm"
    >
      <h3 className="font-bold text-sm font-poppins mb-4" style={{ color: '#0F1E3A' }}>
        {saveLabel === 'Ajouter' ? 'Nouveau sport' : 'Modifier le sport'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Nom du sport *</label>
          <input
            value={form.label}
            onChange={e => { set('label')(e.target.value); setError(''); }}
            placeholder="Ex: Natation"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Couleur</label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => set('color')(c)}
                className="w-7 h-7 rounded-lg transition-transform hover:scale-110 flex-shrink-0"
                style={{ backgroundColor: c, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
              />
            ))}
            <input type="color" value={form.color} onChange={e => set('color')(e.target.value)}
              className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
              title="Couleur personnalisée"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Emoji</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {PRESET_EMOJIS.map(em => (
              <button key={em} type="button" onClick={() => set('emoji')(em)}
                className="w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors"
                style={{ backgroundColor: form.emoji === em ? `${form.color}20` : '#f1f5f9', outline: form.emoji === em ? `2px solid ${form.color}` : 'none' }}
              >
                {em}
              </button>
            ))}
          </div>
          <input
            value={form.emoji} onChange={e => set('emoji')(e.target.value)}
            placeholder="Autre emoji…"
            className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            maxLength={4}
          />
        </div>

        {form.label && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: `${form.color}12` }}>
            <span className="text-xl">{form.emoji}</span>
            <span className="text-sm font-bold font-poppins" style={{ color: form.color }}>{form.label}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full text-white ml-auto" style={{ backgroundColor: form.color }}>Aperçu</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500">
            Annuler
          </button>
          <button type="submit"
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ backgroundColor: '#22C55E' }}>
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
  const { users, updateUser, isAdmin, currentUser } = useAuth();
  const { requests, pendingRequests, reviewRequest } = useClubRequests();
  const { addClub } = useClubs();
  const { allSports, customSports, deletedDefaults, addSport, updateSport, deleteSport, restoreSport, toggleArchive } = useSports();
  const [tab, setTab] = useState('overview');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [showSportForm, setShowSportForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F1F5F9]">
        <p className="text-gray-400 text-sm">Accès non autorisé</p>
      </div>
    );
  }

  function approveRequest(req) {
    const club = addClub({
      name: req.clubName,
      sport: req.sport,
      city: req.city,
      members: 0,
      level: '',
      contact: '',
      description: req.description,
      isUserCreated: true,
      ownerId: req.userId,
    });
    updateUser(req.userId, { role: 'club_admin', clubId: club.id });
    reviewRequest(req.id, 'approved', reviewNote);
    setReviewingId(null);
    setReviewNote('');
  }

  function rejectRequest(reqId) {
    reviewRequest(reqId, 'rejected', reviewNote);
    setReviewingId(null);
    setReviewNote('');
  }

  function toggleRole(user) {
    if (user.role === 'user') updateUser(user.id, { role: 'admin' });
    else if (user.role === 'admin' && user.id !== currentUser.id) updateUser(user.id, { role: 'user' });
  }

  const TABS = [
    { id: 'overview', label: 'Aperçu' },
    { id: 'requests', label: pendingRequests.length > 0 ? `Demandes (${pendingRequests.length})` : 'Demandes' },
    { id: 'users', label: 'Utilisateurs' },
    { id: 'sports', label: 'Sports' },
  ];

  const approved = requests.filter(r => r.status === 'approved').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="h-full flex flex-col bg-[#F1F5F9]">
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-0 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0F1E3A' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold font-poppins" style={{ color: '#0F1E3A' }}>Administration</h1>
        </div>
        <div className="flex overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-sm font-semibold font-poppins whitespace-nowrap border-b-2 transition-colors flex-shrink-0"
              style={tab === t.id
                ? { color: '#22C55E', borderColor: '#22C55E' }
                : { color: '#94a3b8', borderColor: 'transparent' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Utilisateurs', value: users.length, color: '#3b82f6', bg: '#eff6ff',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                },
                {
                  label: 'En attente', value: pendingRequests.length, color: '#f59e0b', bg: '#fffbeb',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                },
                {
                  label: 'Clubs approuvés', value: approved, color: '#22c55e', bg: '#f0fdf4',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
                },
                {
                  label: 'Rejetés', value: rejected, color: '#ef4444', bg: '#fef2f2',
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
                },
              ].map(({ label, value, color, bg, icon }) => (
                <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ backgroundColor: bg, color }}>
                    {icon}
                  </div>
                  <div className="text-2xl font-bold font-poppins mb-0.5" style={{ color: '#0F1E3A' }}>{value}</div>
                  <div className="text-xs text-gray-400 font-medium leading-tight">{label}</div>
                </div>
              ))}
            </div>

            {pendingRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 border"
                style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span className="text-sm font-bold font-poppins" style={{ color: '#92400e' }}>
                    {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente
                  </span>
                </div>
                <p className="text-xs" style={{ color: '#b45309' }}>Des clubs attendent votre validation.</p>
              </motion.div>
            )}

            {requests.length === 0 && (
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">📭</div>
                <p className="text-sm font-medium text-gray-500">Aucune demande de club pour l'instant</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── REQUESTS ── */}
        {tab === 'requests' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {requests.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm text-gray-400">Aucune demande</p>
              </div>
            )}
            {requests.map(req => {
              const sport = SPORTS[req.sport];
              const isPending = req.status === 'pending';
              const isApproved = req.status === 'approved';
              const isReviewing = reviewingId === req.id;

              return (
                <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm truncate">{req.clubName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Par <span className="font-medium text-gray-500">{req.userName}</span> · {req.city}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                        style={isPending
                          ? { backgroundColor: '#fffbeb', color: '#f59e0b' }
                          : isApproved
                            ? { backgroundColor: '#f0fdf4', color: '#16a34a' }
                            : { backgroundColor: '#fef2f2', color: '#dc2626' }}>
                        {isPending ? 'En attente' : isApproved ? 'Approuvé' : 'Rejeté'}
                      </span>
                    </div>

                    {sport && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: sport.color }}>
                        {sport.emoji} {sport.label}
                      </span>
                    )}

                    {req.description && (
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">{req.description}</p>
                    )}

                    <div className="text-[10px] text-gray-300 mt-2.5">
                      {new Date(req.requestedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>

                    {req.reviewNote && (
                      <div className="mt-2 text-xs text-gray-400 italic border-t border-gray-50 pt-2">
                        Note : {req.reviewNote}
                      </div>
                    )}
                  </div>

                  {isPending && (
                    isReviewing ? (
                      <div className="border-t border-gray-100 p-3 space-y-2.5">
                        <textarea
                          value={reviewNote}
                          onChange={e => setReviewNote(e.target.value)}
                          placeholder="Note optionnelle pour le demandeur…"
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-green-400 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setReviewingId(null); setReviewNote(''); }}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-500 font-semibold">
                            Annuler
                          </button>
                          <button
                            onClick={() => rejectRequest(req.id)}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                            style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                            Rejeter
                          </button>
                          <button
                            onClick={() => approveRequest(req)}
                            className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold"
                            style={{ backgroundColor: '#22C55E' }}>
                            Approuver
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-gray-100">
                        <button
                          onClick={() => setReviewingId(req.id)}
                          className="w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                          style={{ color: '#64748b' }}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <p className="text-xs text-gray-400 mb-3 font-medium">{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
            {users.map(user => {
              const color = roleColor(user.role);
              const label = roleLabel(user.role);
              const isSelf = user.id === currentUser.id;
              const canToggle = (user.role === 'user' || user.role === 'admin') && !isSelf;

              return (
                <div key={user.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 font-oswald"
                    style={{ backgroundColor: color }}>
                    {user.name?.slice(0, 2).toUpperCase() ?? '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm truncate flex items-center gap-1.5">
                      {user.name}
                      {isSelf && <span className="text-[9px] text-gray-400 font-normal">(vous)</span>}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{user.email}</div>
                  </div>
                  {canToggle ? (
                    <button
                      onClick={() => toggleRole(user)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 border transition-colors hover:opacity-80"
                      style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}
                      title="Cliquer pour changer le rôle">
                      {label}
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `${color}15`, color }}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 font-medium">
                {Object.keys(allSports).length} sport{Object.keys(allSports).length > 1 ? 's' : ''}
                {customSports.length > 0 && <span className="text-green-500 ml-1">· {customSports.length} personnalisé{customSports.length > 1 ? 's' : ''}</span>}
              </p>
              {!showSportForm && !editingId && (
                <button
                  onClick={() => setShowSportForm(true)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-white"
                  style={{ backgroundColor: '#22C55E' }}
                >
                  <span className="text-sm leading-none">＋</span> Nouveau sport
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
            <div className="space-y-2">
              {Object.values(allSports).map(sport => {
                const isEditing = editingId === sport.id;
                const isArchived = !!sport.isArchived;

                return (
                  <div key={sport.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-opacity"
                    style={{ opacity: isArchived ? 0.55 : 1 }}>
                    <div className="p-3.5 flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: `${sport.color}18` }}
                      >
                        {sport.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm">{sport.label}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sport.color }} />
                          <span className="text-[10px] text-gray-400">{sport.color}</span>
                          {sport.isCustom
                            ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>Personnalisé</span>
                            : sport.isOverride
                              ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>Modifié</span>
                              : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#f8fafc', color: '#94a3b8' }}>Par défaut</span>
                          }
                          {isArchived && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#fff7ed', color: '#f97316' }}>Archivé</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Edit */}
                        <button
                          onClick={() => setEditingId(isEditing ? null : sport.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: isEditing ? '#eff6ff' : '#f8fafc',
                            color: isEditing ? '#3b82f6' : '#64748b',
                          }}
                          title="Modifier"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>

                        {/* Archive / Unarchive */}
                        <button
                          onClick={() => toggleArchive(sport.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: isArchived ? '#fff7ed' : '#f8fafc',
                            color: isArchived ? '#f97316' : '#64748b',
                          }}
                          title={isArchived ? 'Désarchiver' : 'Archiver'}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/>
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteSport(sport.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:opacity-80"
                          style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
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
                          className="border-t border-gray-100 overflow-hidden"
                        >
                          <div className="p-3">
                            <SportForm
                              initial={{ label: sport.label, color: sport.color, emoji: sport.emoji }}
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

            {/* Sports supprimés — section restauration */}
            {deletedDefaults.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Sports supprimés</p>
                <div className="space-y-2">
                  {deletedDefaults.map(sport => (
                    <div key={sport.id} className="bg-white rounded-2xl p-3 shadow-sm border border-dashed border-gray-200 flex items-center gap-3 opacity-50">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: `${sport.color}18` }}>
                        {sport.emoji}
                      </div>
                      <div className="flex-1 min-w-0 text-sm text-gray-400">{sport.label}</div>
                      <button
                        onClick={() => restoreSport(sport.id)}
                        className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl"
                        style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
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
