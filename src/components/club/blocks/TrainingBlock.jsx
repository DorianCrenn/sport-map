import { useState } from 'react';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_COLORS = {
  Lundi: '#6366f1', Mardi: '#8b5cf6', Mercredi: '#ec4899',
  Jeudi: '#f97316', Vendredi: '#eab308', Samedi: '#22c55e', Dimanche: '#ef4444',
};
const AGE_CATEGORIES = ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U19', 'Seniors', 'Vétérans', 'Loisir', 'Tous'];

function uid() { return `s_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const RecurIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);

// ── Edit mode ─────────────────────────────────────────────────────────────────
function EditView({ sessions, onUpdate }) {
  function addSession() {
    onUpdate({
      sessions: [...sessions, {
        id: uid(), day: 'Lundi', time: '18h00', duration: 90,
        location: '', category: 'Seniors', recurring: true,
      }],
    });
  }

  function updateSession(id, patch) {
    onUpdate({ sessions: sessions.map(s => s.id === id ? { ...s, ...patch } : s) });
  }

  function deleteSession(id) {
    onUpdate({ sessions: sessions.filter(s => s.id !== id) });
  }

  return (
    <div className="space-y-2">
      {sessions.map(s => (
        <div key={s.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
          {/* Row 1: jour + heure + durée */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={s.day}
              onChange={e => updateSession(s.id, { day: e.target.value })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none font-semibold cursor-pointer"
              style={{ color: DAY_COLORS[s.day] }}
            >
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input
              type="text"
              value={s.time}
              onChange={e => updateSession(s.id, { time: e.target.value })}
              placeholder="19h00"
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none w-16 text-center"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={s.duration}
                onChange={e => updateSession(s.id, { duration: Number(e.target.value) })}
                min={15} step={15}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none w-14 text-center"
              />
              <span className="text-xs text-gray-400">min</span>
            </div>
            <button
              onClick={() => deleteSession(s.id)}
              className="ml-auto p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <XIcon />
            </button>
          </div>
          {/* Row 2: lieu + catégorie + récurrent */}
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              value={s.location ?? ''}
              onChange={e => updateSession(s.id, { location: e.target.value })}
              placeholder="Lieu…"
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none flex-1 min-w-[80px]"
            />
            <select
              value={s.category ?? 'Seniors'}
              onChange={e => updateSession(s.id, { category: e.target.value })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none cursor-pointer"
              style={{ color: '#0F1E3A' }}
            >
              {AGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={s.recurring ?? false}
                onChange={e => updateSession(s.id, { recurring: e.target.checked })}
                className="rounded"
              />
              Récurrent
            </label>
          </div>
        </div>
      ))}
      <button
        onClick={addSession}
        className="flex items-center gap-1.5 w-full py-2.5 justify-center rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:border-slate-400 hover:text-slate-600 transition-colors"
      >
        + Ajouter un créneau
      </button>
    </div>
  );
}

// ── Calendar view ─────────────────────────────────────────────────────────────
function CalendarView({ sessions }) {
  const byDay = DAYS.reduce((acc, day) => {
    const ds = sessions.filter(s => s.day === day);
    if (ds.length) acc[day] = ds.sort((a, b) => a.time.localeCompare(b.time));
    return acc;
  }, {});

  if (Object.keys(byDay).length === 0) {
    return <p className="text-sm text-gray-400 italic py-3 text-center">Aucun créneau pour cette catégorie.</p>;
  }

  return (
    <div className="space-y-2">
      {Object.entries(byDay).map(([day, ds]) => (
        <div key={day} className="flex gap-3 items-start">
          {/* Day badge */}
          <div
            className="flex-shrink-0 w-12 rounded-xl text-white text-center py-2.5"
            style={{ backgroundColor: DAY_COLORS[day] }}
          >
            <div className="text-[10px] font-bold uppercase leading-none">{day.slice(0, 3)}</div>
          </div>
          {/* Sessions */}
          <div className="flex flex-col gap-1.5 flex-1">
            {ds.map(s => (
              <div key={s.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-wrap">
                <span className="font-bold text-sm text-gray-800">{s.time}</span>
                <span className="text-xs text-gray-400">· {s.duration} min</span>
                {s.location && (
                  <span className="text-xs text-gray-500 truncate">{s.location}</span>
                )}
                <div className="ml-auto flex gap-1.5 flex-wrap justify-end">
                  {s.category && s.category !== 'Tous' && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                      {s.category}
                    </span>
                  )}
                  {s.recurring && (
                    <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <RecurIcon /> Récurrent
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────
function ListView({ sessions }) {
  const sorted = [...sessions].sort((a, b) => {
    const di = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
    return di !== 0 ? di : a.time.localeCompare(b.time);
  });

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-400 italic py-3 text-center">Aucun créneau pour cette catégorie.</p>;
  }

  return (
    <div className="space-y-2">
      {sorted.map(s => {
        const color = DAY_COLORS[s.day] ?? '#64748b';
        return (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: color }}
            >
              {s.day.slice(0, 3)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800">
                {s.time}
                <span className="font-normal text-gray-400 text-xs ml-1">· {s.duration} min</span>
              </div>
              {s.location && <div className="text-xs text-gray-500 mt-0.5 truncate">{s.location}</div>}
            </div>
            <div className="flex flex-col items-end gap-1">
              {s.category && s.category !== 'Tous' && (
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
                  {s.category}
                </span>
              )}
              {s.recurring && (
                <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <RecurIcon /> Récurrent
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main block ────────────────────────────────────────────────────────────────
export default function TrainingBlock({ data, isEditing, onUpdate }) {
  const sessions = data.sessions ?? [];
  const [viewMode, setViewMode] = useState('calendar');
  const [activeCategory, setActiveCategory] = useState('Tous');

  if (isEditing) {
    return <EditView sessions={sessions} onUpdate={onUpdate} />;
  }

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic py-3 text-center">
        Aucun créneau d'entraînement renseigné.
      </p>
    );
  }

  // Categories that actually appear in sessions
  const usedCats = ['Tous', ...new Set(
    sessions.map(s => s.category).filter(c => c && c !== 'Tous')
  )];

  const filtered = activeCategory === 'Tous'
    ? sessions
    : sessions.filter(s => (s.category ?? 'Tous') === activeCategory);

  return (
    <div>
      {/* Category tabs */}
      {usedCats.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
          {usedCats.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors"
              style={activeCategory === cat
                ? { backgroundColor: '#0F1E3A', color: 'white' }
                : { backgroundColor: '#f1f5f9', color: '#64748b' }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { id: 'calendar', label: 'Calendrier' },
          { id: 'list',     label: 'Liste' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={viewMode === id
              ? { backgroundColor: 'white', color: '#0F1E3A', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
              : { color: '#94a3b8' }}
          >
            {label}
          </button>
        ))}
      </div>

      {viewMode === 'calendar'
        ? <CalendarView sessions={filtered} />
        : <ListView sessions={filtered} />
      }
    </div>
  );
}
