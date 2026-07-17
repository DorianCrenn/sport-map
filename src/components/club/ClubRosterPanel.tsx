import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useClubPlayers } from '../../hooks/useClubPlayers.js';
import QuickAddTeamModal from './QuickAddTeamModal.jsx';
import { useCanDo } from '../../hooks/useCanDo.js';
import { supabase } from '../../lib/supabase.js';
import { useToast } from '../../contexts/ToastContext.jsx';

const POSITIONS = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'];
const EMPTY_FORM = { name: '', number: '', position: 'Milieu', photo_url: '', email: '', team_id: '' };

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

interface Team { id: string; name: string }

interface ClubRosterPanelProps {
  clubId: string | number;
  teams?: Team[];
  club?: Record<string, any> | null;
  onUpdateClub?: (patch: Record<string, any>) => Promise<void>;
}

export default function ClubRosterPanel({ clubId, teams = [], club, onUpdateClub }: ClubRosterPanelProps) {
  const { players, loading, claims, addPlayer, removePlayer, approveClaim, rejectClaim } = useClubPlayers(String(clubId)) as any;
  const { can } = useCanDo() as any;
  const { toast } = useToast();
  // RBAC réel : seuls coach/manager/owner (pas communicant) gèrent l'effectif.
  // useCanDo est permissif si la matrice n'est pas chargée (démo, cold start).
  const canManage = can('teams', 'create');
  const [inviting, setInviting] = useState(false);

  const invitable = (players as any[]).filter(p => p.email && !p.user_id);
  async function handleInviteAll() {
    if (!invitable.length || inviting) return;
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-club-players', { body: { clubId: String(clubId) } });
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      const total = (data as any)?.total ?? 0;
      const failed = (data as any)?.failures?.length ?? Math.max(0, total - sent);
      if (sent > 0 && failed === 0) {
        toast({ message: `${sent} invitation${sent > 1 ? 's' : ''} envoyée${sent > 1 ? 's' : ''} par email ✉️`, type: 'success' });
      } else if (sent > 0 && failed > 0) {
        toast({ message: `${sent}/${total} invitations envoyées — ${failed} en échec.`, type: 'info' });
      } else if (total > 0) {
        toast({ message: `Envoi échoué — domaine d'expédition à vérifier.`, type: 'error' });
      } else {
        toast({ message: 'Aucune invitation à envoyer.', type: 'info' });
      }
    } catch (err: any) {
      toast({ message: err?.message || 'Envoi impossible — réessayez.', type: 'error' });
    } finally {
      setInviting(false);
    }
  }
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [adding, setAdding]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [filterTeam, setFilter] = useState('all');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [bulkOpen, setBulkOpen]   = useState(false);
  const [bulkText, setBulkText]   = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  // Ajout en masse : une ligne par joueur. Formats acceptés (séparateur , ; ou tab) :
  //   "Prénom Nom" · "Prénom Nom, 10" · "Prénom Nom, 10, email@club.fr" (ordre libre).
  async function handleBulkAdd() {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setBulkSaving(true);
    for (const line of lines) {
      const parts = line.split(/[,;\t]/).map(p => p.trim()).filter(Boolean);
      const name = parts[0];
      if (!name) continue;
      let number: number | null = null;
      let email: string | null = null;
      for (const p of parts.slice(1)) {
        if (!email && p.includes('@')) email = p;
        else if (number === null && /^\d{1,2}$/.test(p)) number = parseInt(p, 10);
      }
      await addPlayer({ name, number, position: null, photo_url: null, email, team_id: form.team_id || (filterTeam !== 'all' ? filterTeam : null) });
    }
    setBulkSaving(false);
    setBulkText('');
    setBulkOpen(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await addPlayer({
      name:      form.name.trim(),
      number:    form.number ? parseInt(form.number) : null,
      position:  form.position || null,
      photo_url: form.photo_url.trim() || null,
      email:     form.email.trim() || null,
      team_id:   form.team_id || null,
    });
    setSaving(false);
    setForm({ ...EMPTY_FORM });
    setAdding(false);
  }

  const filtered: any[] = filterTeam === 'all' ? players : players.filter((p: any) => p.team_id === filterTeam);

  return (
    <div className="space-y-5" style={{ position: 'relative' }}>
      <AnimatePresence>
        {showAddTeam && club && onUpdateClub && (
          <QuickAddTeamModal
            club={club}
            onSave={async (patch: Record<string, any>) => { await onUpdateClub(patch); setShowAddTeam(false); }}
            onClose={() => setShowAddTeam(false)}
          />
        )}
      </AnimatePresence>

      {claims.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-3">
            {claims.length} demande{claims.length > 1 ? 's' : ''} de rattachement
          </p>
          <div className="space-y-2">
            {(claims as any[]).map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#0F1E3A' }}>
                    {c.type === 'guardian' ? `Parent (${c.relation ?? '?'}) →` : '→'} {c.club_players?.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {c.type === 'player' ? 'Se réclame joueur' : 'Tuteur légal'}
                    {c.birth_year ? ` · né(e) en ${c.birth_year}` : ''}
                  </p>
                </div>
                <button onClick={() => rejectClaim(c.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><XIcon /></button>
                <button onClick={() => approveClaim(c.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"><CheckIcon /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {canManage && invitable.length > 0 && (
        <button onClick={handleInviteAll} disabled={inviting} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-colors" style={{ backgroundColor: 'var(--sl-green)' }}>
          ✉️ {inviting ? 'Envoi…' : `Inviter ${invitable.length} joueur${invitable.length > 1 ? 's' : ''} par email`}
        </button>
      )}

      <div className="flex gap-1.5 flex-wrap items-center">
        {teams.length > 0 && (
          <>
            <button onClick={() => setFilter('all')} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors" style={filterTeam === 'all' ? { backgroundColor: '#0F1E3A', color: 'white' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}>Tous</button>
            {teams.map(t => (
              <button key={t.id} onClick={() => setFilter(t.id)} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors" style={filterTeam === t.id ? { backgroundColor: '#0F1E3A', color: 'white' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}>{t.name}</button>
            ))}
          </>
        )}
        {onUpdateClub && club && (
          <button onClick={() => setShowAddTeam(true)} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1" style={{ backgroundColor: 'rgba(34,217,106,0.12)', color: 'var(--sl-green)' }}>
            + Créer une équipe
          </button>
        )}
      </div>

      {loading
        ? <p className="text-sm text-gray-400 text-center py-4">Chargement…</p>
        : (
          <div className="space-y-1.5">
            {filtered.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                <span className="w-8 text-center text-xs font-bold text-gray-400">{p.number ?? '—'}</span>
                <span className="flex-1 text-sm font-semibold" style={{ color: '#0F1E3A' }}>{p.name}</span>
                <span className="text-xs text-gray-400">{p.position ?? ''}</span>
                {p.user_id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-semibold">lié</span>}
                <button onClick={() => removePlayer(p.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:text-red-600 transition-all"><XIcon /></button>
              </div>
            ))}
            {!filtered.length && <p className="text-sm text-gray-400 text-center py-3 italic">Aucun joueur pour cette équipe.</p>}
          </div>
        )
      }

      {adding ? (
        <form onSubmit={handleAdd} className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Nouveau joueur</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <input required value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Prénom Nom *" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white" />
            </div>
            <input type="number" value={form.number} onChange={e => setField('number', e.target.value)} placeholder="N° maillot" min={1} max={99} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white" />
            <select value={form.position} onChange={e => setField('position', e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white">
              <option value="">Poste…</option>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {teams.length > 0 && (
              <select value={form.team_id} onChange={e => setField('team_id', e.target.value)} className="col-span-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="">Équipe (optionnel)</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            <input value={form.email} onChange={e => setField('email', e.target.value)} type="email" placeholder="Email (pour invitation)" className="col-span-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setAdding(false); setForm({ ...EMPTY_FORM }); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 bg-white">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: '#0F1E3A' }}>{saving ? 'Ajout…' : 'Ajouter'}</button>
          </div>
        </form>
      ) : bulkOpen ? (
        <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Coller une liste de joueurs</p>
          <p className="text-[11px] text-gray-500 leading-snug">Une ligne par joueur. Ex : <code>Alice Martin, 10, alice@club.fr</code> — le n° et l'email sont optionnels.</p>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={6} placeholder={"Alice Martin, 10\nBob Durand, 7, bob@club.fr\nChloé Petit"} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white font-mono" />
          <div className="flex gap-2">
            <button type="button" onClick={() => { setBulkOpen(false); setBulkText(''); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 bg-white">Annuler</button>
            <button type="button" onClick={handleBulkAdd} disabled={bulkSaving || !bulkText.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: '#0F1E3A' }}>{bulkSaving ? 'Ajout…' : 'Ajouter la liste'}</button>
          </div>
        </div>
      ) : canManage ? (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 py-3 justify-center rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors font-semibold">
            + Ajouter un joueur
          </button>
          <button onClick={() => setBulkOpen(true)} className="flex items-center gap-2 py-3 justify-center rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors font-semibold">
            📋 Coller une liste
          </button>
        </div>
      ) : null}
    </div>
  );
}
