import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function uid() { return `m_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }

const BLANK = { id: '', date: '', time: '15:00', opponent: '', isHome: true, competition: '', teamId: '', teamName: '', venue: '', scoreHome: '', scoreAway: '', publishedOnMap: true };

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

  const teamLabel = match.teamName || match.category || '';

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
            {teamLabel && <span className="text-[9px] text-gray-400 font-medium truncate max-w-[80px]">{teamLabel}</span>}
            {match._fromMap && <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: '#EFF6FF', color: '#3b82f6' }}>carte</span>}
            {match.time && <span className="text-[9px] text-gray-400">· {match.time}</span>}
            {match.competition && <span className="text-[9px] text-gray-400 truncate">· {match.competition}</span>}
          </div>
          <div className="text-sm font-semibold text-gray-700 truncate">{homeTeam} <span className="text-gray-400 font-normal">vs</span> {awayTeam}</div>
          {match.venue && (
            <div className="flex items-center gap-1 mt-0.5">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span className="text-[9px] text-gray-400 truncate">{match.venue}</span>
            </div>
          )}
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

          {isEditing && !match._fromMap && (
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

function MatchForm({ initial, allTeams, onSave, onCancel }) {
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

      {/* Lieu de la rencontre */}
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1">Lieu <span className="font-normal text-gray-400">(optionnel)</span></label>
        <input type="text" value={f.venue} onChange={e => set('venue', e.target.value)}
          placeholder="ex. Stade municipal, Gymnase Jean Macé…"
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" />
      </div>

      {/* Domicile / Extérieur + Équipe */}
      <div className="grid gap-2" style={{ gridTemplateColumns: allTeams.length > 0 ? '1fr 1fr' : '1fr' }}>
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
        {allTeams.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Équipe</label>
            <select
              value={f.teamId}
              onChange={e => {
                const team = allTeams.find(t => t.id === e.target.value);
                set('teamId', e.target.value);
                set('teamName', team?.name ?? '');
              }}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none"
            >
              <option value="">— Équipe —</option>
              {allTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
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

      {/* Publier sur la carte */}
      {f.isHome && (
        <button
          type="button"
          onClick={() => set('publishedOnMap', !f.publishedOnMap)}
          className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl border transition-colors"
          style={f.publishedOnMap
            ? { backgroundColor: '#f0fdf4', borderColor: '#86efac' }
            : { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
        >
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: f.publishedOnMap ? '#16a34a' : '#94a3b8' }}>
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
              <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
            </svg>
            <span className="text-xs font-semibold" style={{ color: f.publishedOnMap ? '#16a34a' : '#64748b' }}>
              Publier sur la carte
            </span>
          </div>
          <div className="w-9 h-5 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0"
            style={{ backgroundColor: f.publishedOnMap ? '#22c55e' : '#d1d5db' }}>
            <div className="w-4 h-4 bg-white rounded-full shadow transition-transform"
              style={{ transform: f.publishedOnMap ? 'translateX(16px)' : 'translateX(0)' }} />
          </div>
        </button>
      )}

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

function eventToMatch(event, club) {
  const isHome = event.city === club?.city;
  const titleParts = event.title?.split(' vs ') ?? [];
  const opponent = isHome
    ? (event.standings?.away?.team ?? titleParts.at(-1)?.trim() ?? '')
    : (event.standings?.home?.team ?? titleParts.at(0)?.trim() ?? '');
  return {
    id: `ev_${event.id}`,
    date: event.date?.slice(0, 10) ?? '',
    time: event.date?.slice(11, 16) ?? '',
    opponent,
    isHome,
    competition: event.level ?? '',
    teamId: '',
    teamName: event.teamName ?? '',
    venue: event.venue ?? '',
    scoreHome: '',
    scoreAway: '',
    _fromMap: true,
  };
}

export default function MatchesBlock({ data, onUpdate, isEditing, club, filterTeamId, allEvents }) {
  const allTeams = (club?.categories ?? []).flatMap(c => c.teams ?? []);
  const filterTeam = filterTeamId ? allTeams.find(t => t.id === filterTeamId) : null;

  const manualMatches = data?.matches ?? [];

  const mapMatches = useMemo(() => {
    if (!allEvents?.length || !club) return [];
    return allEvents
      .filter(e => String(e.clubId) === String(club.id))
      .map(e => eventToMatch(e, club));
  }, [allEvents, club]);

  // Manual matches take priority — skip map events on same date+teamName
  const manualKeys = new Set(manualMatches.map(m => `${m.date}_${m.teamName}`));
  const merged = [
    ...manualMatches,
    ...mapMatches.filter(m => !manualKeys.has(`${m.date}_${m.teamName}`)),
  ];

  const matches = filterTeamId
    ? merged.filter(m =>
        m.teamId === filterTeamId ||
        (m._fromMap && m.teamName === filterTeam?.name)
      )
    : merged;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formInit, setFormInit] = useState(BLANK);

  function openAdd() {
    const preTeam = filterTeamId ? allTeams.find(t => t.id === filterTeamId) : null;
    setFormInit({ ...BLANK, id: uid(), teamId: preTeam?.id ?? '', teamName: preTeam?.name ?? '' });
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
      onUpdate({ matches: allMatches.map(m => m.id === editingId ? cleaned : m) });
    } else {
      onUpdate({ matches: [...allMatches, cleaned] });
    }
    setShowForm(false);
  }

  function remove(id) {
    onUpdate({ matches: allMatches.filter(m => m.id !== id) });
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
            allTeams={allTeams}
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
