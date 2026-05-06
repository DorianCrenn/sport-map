import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function uid() { return `m_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }

const AGE_CATS = [
  'U7', 'U7F', 'U9', 'U9F', 'U11', 'U11F', 'U13', 'U13F',
  'U15', 'U15F', 'U17', 'U17F', 'U19', 'U19F',
  'Seniors', 'Seniors F', 'Vétérans', 'Vétérans F', 'Loisir', 'Loisir F',
];

const BLANK = { id: '', date: '', time: '15:00', opponent: '', isHome: true, competition: '', category: 'Seniors', scoreHome: '', scoreAway: '' };

function isUpcoming(match) {
  if (!match.date) return true;
  return new Date(match.date + 'T23:59:59') >= new Date();
}

function getResult(match) {
  const h = match.scoreHome, a = match.scoreAway;
  if (h === '' || h === null || h === undefined || a === '' || a === null || a === undefined) return null;
  const hn = Number(h), an = Number(a);
  if (hn === an) return 'N';
  if (match.isHome) return hn > an ? 'V' : 'D';
  return an > hn ? 'V' : 'D';
}

const RESULT_COLORS = { V: '#22C55E', D: '#ef4444', N: '#f59e0b' };

function MatchCard({ match, club, isEditing, onEdit, onRemove }) {
  const upcoming = isUpcoming(match);
  const result   = getResult(match);
  const hasScore = match.scoreHome !== '' && match.scoreAway !== '' && match.scoreHome !== null && match.scoreAway !== null;

  const day   = match.date ? new Date(match.date + 'T00:00:00').getDate() : '—';
  const month = match.date ? new Date(match.date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' }) : '';

  const homeTeam = match.isHome ? (club?.name ?? 'Nous') : (match.opponent || '?');
  const awayTeam = match.isHome ? (match.opponent || '?') : (club?.name ?? 'Nous');
  const displayScore = match.isHome
    ? `${match.scoreHome} – ${match.scoreAway}`
    : `${match.scoreAway} – ${match.scoreHome}`;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5">

        {/* Date column */}
        <div className="w-9 text-center flex-shrink-0">
          <div className="text-[9px] font-bold text-gray-400 uppercase leading-none">{month}</div>
          <div className="text-lg font-bold leading-tight font-poppins" style={{ color: '#0F1E3A' }}>{day}</div>
        </div>

        <div className="w-px h-9 bg-gray-100 flex-shrink-0" />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={match.isHome
                ? { backgroundColor: '#EFF6FF', color: '#1d4ed8' }
                : { backgroundColor: '#F8FAFC', color: '#64748b' }}>
              {match.isHome ? 'DOM' : 'EXT'}
            </span>
            <span className="text-[9px] text-gray-400 font-medium">{match.category}</span>
            {match.time && <span className="text-[9px] text-gray-400">· {match.time}</span>}
            {match.competition && <span className="text-[9px] text-gray-400 truncate">· {match.competition}</span>}
          </div>
          <div className="text-sm font-semibold text-gray-700 truncate">{homeTeam} <span className="text-gray-400 font-normal">vs</span> {awayTeam}</div>
        </div>

        {/* Score / result / upcoming */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasScore ? (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold font-poppins" style={{ color: '#0F1E3A' }}>{displayScore}</span>
              {result && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: RESULT_COLORS[result] }}>
                  {result}
                </span>
              )}
            </div>
          ) : upcoming ? (
            <span className="text-[10px] text-gray-400 font-medium">À venir</span>
          ) : (
            <span className="text-[10px] text-gray-300">–</span>
          )}

          {isEditing && (
            <div className="flex items-center gap-0.5 ml-1">
              <button onClick={onEdit}
                className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                </svg>
              </button>
              <button onClick={onRemove}
                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial);
  function set(k, v) { setF(p => ({ ...p, [k]: v })); }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-3"
    >
      {/* Date + Heure */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Date</label>
          <input type="date" value={f.date} onChange={e => set('date', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Heure</label>
          <input type="time" value={f.time} onChange={e => set('time', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
      </div>

      {/* Adversaire */}
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1">Adversaire *</label>
        <input type="text" value={f.opponent} onChange={e => set('opponent', e.target.value)}
          placeholder="ex. HBC Concarneau"
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" />
      </div>

      {/* Domicile / Extérieur + Catégorie */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Lieu</label>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
            <button onClick={() => set('isHome', true)}
              className="flex-1 py-2 text-xs font-semibold transition-colors"
              style={f.isHome ? { backgroundColor: '#0F1E3A', color: 'white' } : { color: '#64748b' }}>
              Domicile
            </button>
            <button onClick={() => set('isHome', false)}
              className="flex-1 py-2 text-xs font-semibold transition-colors"
              style={!f.isHome ? { backgroundColor: '#0F1E3A', color: 'white' } : { color: '#64748b' }}>
              Extérieur
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Catégorie</label>
          <select value={f.category} onChange={e => set('category', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none">
            {AGE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Compétition */}
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1">Compétition <span className="font-normal text-gray-400">(optionnel)</span></label>
        <input type="text" value={f.competition} onChange={e => set('competition', e.target.value)}
          placeholder="ex. Division Honneur — J12"
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" />
      </div>

      {/* Score */}
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1">Score <span className="font-normal text-gray-400">(optionnel)</span></label>
        <div className="flex items-center gap-2">
          <input type="number" min="0" value={f.scoreHome} onChange={e => set('scoreHome', e.target.value)}
            placeholder="–"
            className="w-14 text-center text-sm font-bold border border-gray-200 rounded-xl px-2 py-2 bg-white focus:outline-none" />
          <span className="text-gray-400 font-bold text-lg">–</span>
          <input type="number" min="0" value={f.scoreAway} onChange={e => set('scoreAway', e.target.value)}
            placeholder="–"
            className="w-14 text-center text-sm font-bold border border-gray-200 rounded-xl px-2 py-2 bg-white focus:outline-none" />
          <span className="text-[10px] text-gray-400 ml-1">
            {f.isHome ? '(Nous — Adversaire)' : '(Adversaire — Nous)'}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-100 bg-white transition-colors">
          Annuler
        </button>
        <button onClick={() => { if (f.opponent.trim()) onSave(f); }}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
          style={{ backgroundColor: '#22C55E' }}>
          {initial.id ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </motion.div>
  );
}

export default function MatchesBlock({ data, onUpdate, isEditing, club }) {
  const matches = data?.matches ?? [];
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formInit, setFormInit] = useState(BLANK);

  function openAdd() {
    setFormInit({ ...BLANK, id: uid() });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(match) {
    setFormInit({ ...match });
    setEditingId(match.id);
    setShowForm(true);
  }

  function handleSave(f) {
    const cleaned = { ...f, scoreHome: f.scoreHome === '' ? null : Number(f.scoreHome), scoreAway: f.scoreAway === '' ? null : Number(f.scoreAway) };
    if (editingId) {
      onUpdate({ matches: matches.map(m => m.id === editingId ? cleaned : m) });
    } else {
      onUpdate({ matches: [...matches, cleaned] });
    }
    setShowForm(false);
  }

  function remove(id) {
    onUpdate({ matches: matches.filter(m => m.id !== id) });
  }

  const upcoming = matches.filter(isUpcoming).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const results  = matches.filter(m => !isUpcoming(m)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="space-y-4">

      {/* Form (top when adding/editing) */}
      <AnimatePresence>
        {showForm && isEditing && (
          <MatchForm
            key={editingId ?? 'new'}
            initial={formInit}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {/* À venir */}
      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">À venir</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#EFF6FF', color: '#1d4ed8' }}>{upcoming.length}</span>
          </div>
          <div className="space-y-2">
            {upcoming.map(m => (
              <MatchCard key={m.id} match={m} club={club} isEditing={isEditing}
                onEdit={() => openEdit(m)} onRemove={() => remove(m.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Résultats */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Résultats</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#F0FDF4', color: '#16a34a' }}>{results.length}</span>
          </div>
          <div className="space-y-2">
            {results.map(m => (
              <MatchCard key={m.id} match={m} club={club} isEditing={isEditing}
                onEdit={() => openEdit(m)} onRemove={() => remove(m.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {matches.length === 0 && !showForm && (
        <p className="text-xs text-gray-400 italic text-center py-6 border-2 border-dashed border-gray-200 rounded-2xl">
          {isEditing ? 'Cliquez sur "Ajouter un match" pour commencer' : 'Aucun match programmé'}
        </p>
      )}

      {/* Add button */}
      {isEditing && !showForm && (
        <button onClick={openAdd}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs font-medium text-gray-400 hover:border-green-300 hover:text-green-500 hover:bg-green-50 transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajouter un match
        </button>
      )}
    </div>
  );
}
