const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_COLORS = {
  Lundi: '#6366f1', Mardi: '#8b5cf6', Mercredi: '#ec4899',
  Jeudi: '#f97316', Vendredi: '#eab308', Samedi: '#22c55e', Dimanche: '#ef4444',
};

function uid() { return `s_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function TrainingBlock({ data, isEditing, onUpdate }) {
  const sessions = data.sessions ?? [];

  function addSession() {
    onUpdate({
      sessions: [...sessions, { id: uid(), day: 'Lundi', time: '18h00', duration: 90, location: '', level: 'Tous niveaux' }],
    });
  }

  function updateSession(id, patch) {
    onUpdate({ sessions: sessions.map(s => s.id === id ? { ...s, ...patch } : s) });
  }

  function deleteSession(id) {
    onUpdate({ sessions: sessions.filter(s => s.id !== id) });
  }

  const sorted = [...sessions].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));

  if (isEditing) {
    return (
      <div className="space-y-2">
        {sessions.map(s => (
          <div key={s.id} className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
            <select
              value={s.day}
              onChange={e => updateSession(s.id, { day: e.target.value })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none font-semibold"
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
            <input
              type="text"
              value={s.location}
              onChange={e => updateSession(s.id, { location: e.target.value })}
              placeholder="Lieu…"
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none flex-1 min-w-[80px]"
            />
            <input
              type="text"
              value={s.level}
              onChange={e => updateSession(s.id, { level: e.target.value })}
              placeholder="Niveau…"
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none flex-1 min-w-[80px]"
            />
            <button
              onClick={() => deleteSession(s.id)}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <XIcon />
            </button>
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

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic py-3 text-center">
        Aucun créneau d'entraînement renseigné.
      </p>
    );
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
              {s.location && (
                <div className="text-xs text-gray-500 mt-0.5 truncate">{s.location}</div>
              )}
            </div>
            {s.level && (
              <span className="text-[10px] text-gray-600 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0 font-medium">
                {s.level}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
