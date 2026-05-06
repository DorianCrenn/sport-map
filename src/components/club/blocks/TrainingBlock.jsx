import { useState } from 'react';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_COLORS = {
  Lundi: '#6366f1', Mardi: '#8b5cf6', Mercredi: '#ec4899',
  Jeudi: '#f97316', Vendredi: '#eab308', Samedi: '#22c55e', Dimanche: '#ef4444',
};
const AGE_CATEGORIES = ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U19', 'Seniors', 'Vétérans', 'Loisir', 'Tous'];
const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAY_TO_JS = { Lundi:1, Mardi:2, Mercredi:3, Jeudi:4, Vendredi:5, Samedi:6, Dimanche:0 };
const DAY_LABELS = ['Lu','Ma','Me','Je','Ve','Sa','Di'];

function uid() { return `s_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const RecurIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
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
          <div className="flex flex-wrap gap-2 items-center">
            <select value={s.day} onChange={e => updateSession(s.id, { day: e.target.value })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none font-semibold"
              style={{ color: DAY_COLORS[s.day] }}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="text" value={s.time} onChange={e => updateSession(s.id, { time: e.target.value })}
              placeholder="19h00" className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none w-16 text-center" />
            <div className="flex items-center gap-1">
              <input type="number" value={s.duration} onChange={e => updateSession(s.id, { duration: Number(e.target.value) })}
                min={15} step={15} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none w-14 text-center" />
              <span className="text-xs text-gray-400">min</span>
            </div>
            <button onClick={() => deleteSession(s.id)} className="ml-auto p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <XIcon />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input type="text" value={s.location ?? ''} onChange={e => updateSession(s.id, { location: e.target.value })}
              placeholder="Lieu…" className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none flex-1 min-w-[80px]" />
            <select value={s.category ?? 'Seniors'} onChange={e => updateSession(s.id, { category: e.target.value })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none">
              {AGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 font-medium cursor-pointer select-none">
              <input type="checkbox" checked={s.recurring ?? false} onChange={e => updateSession(s.id, { recurring: e.target.checked })} className="rounded" />
              Récurrent
            </label>
          </div>
        </div>
      ))}
      <button onClick={addSession}
        className="flex items-center gap-1.5 w-full py-2.5 justify-center rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:border-slate-400 hover:text-slate-600 transition-colors">
        + Ajouter un créneau
      </button>
    </div>
  );
}

// ── Monthly calendar ──────────────────────────────────────────────────────────
function MonthCalendar({ sessions }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  function getSessionsForDay(dayNum) {
    const date = new Date(year, month, dayNum);
    const jsDay = date.getDay();
    return sessions.filter(s => s.recurring && DAY_TO_JS[s.day] === jsDay);
  }

  // Build calendar grid (Monday-first)
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const selectedSessions = selectedDate ? getSessionsForDay(selectedDate) : [];

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="font-bold font-poppins text-sm" style={{ color: '#0F1E3A' }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className="text-center py-1"
            style={{ fontSize: 10, fontWeight: 700, color: i >= 5 ? '#ef4444' : '#94a3b8' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const daySessions = getSessionsForDay(d);
          const hasSessions = daySessions.length > 0;
          const selected = selectedDate === d;
          const tod = isToday(d);
          const isWeekend = i % 7 >= 5;

          return (
            <div key={i}
              onClick={() => hasSessions && setSelectedDate(selected ? null : d)}
              className="flex flex-col items-center py-1 rounded-xl transition-colors"
              style={{
                cursor: hasSessions ? 'pointer' : 'default',
                backgroundColor: selected ? '#0F1E3A' : 'transparent',
              }}>
              {/* Date number */}
              <div
                className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold font-poppins"
                style={{
                  backgroundColor: tod && !selected ? '#22C55E' : 'transparent',
                  color: selected ? 'white' : tod ? 'white' : isWeekend ? '#ef4444' : '#374151',
                  fontWeight: hasSessions ? 700 : 400,
                }}>
                {d}
              </div>

              {/* Session dots */}
              {hasSessions && (
                <div className="flex gap-0.5 mt-0.5">
                  {daySessions.slice(0, 3).map((s, si) => (
                    <div key={si} style={{
                      width: 4, height: 4, borderRadius: '50%',
                      backgroundColor: selected ? 'rgba(255,255,255,0.7)' : DAY_COLORS[s.day],
                    }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day sessions */}
      {selectedDate && (
        <div className="mt-4 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-2.5 flex items-center justify-between"
            style={{ backgroundColor: '#0F1E3A' }}>
            <span className="text-white text-sm font-semibold font-poppins">
              {selectedDate} {MONTH_NAMES[month]}
            </span>
            <span className="text-xs" style={{ color: '#94a3b8' }}>
              {selectedSessions.length} séance{selectedSessions.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {selectedSessions.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-2 h-full self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: DAY_COLORS[s.day], minHeight: 36, width: 3 }} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm font-poppins" style={{ color: '#0F1E3A' }}>
                    {s.time}
                    <span className="font-normal text-gray-400 text-xs ml-1.5">· {s.duration} min</span>
                  </div>
                  {s.location && <div className="text-xs text-gray-500 mt-0.5">{s.location}</div>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {s.category && s.category !== 'Tous' && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{s.category}</span>
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
      )}

      {/* Legend: days that have sessions this month */}
      {(() => {
        const activeDays = [...new Set(sessions.filter(s => s.recurring).map(s => s.day))];
        if (!activeDays.length) return null;
        return (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {activeDays.map(day => (
              <div key={day} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                style={{ backgroundColor: `${DAY_COLORS[day]}18`, color: DAY_COLORS[day] }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: DAY_COLORS[day] }} />
                {day}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────
function ListView({ sessions }) {
  const sorted = [...sessions].sort((a, b) => {
    const di = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
    return di !== 0 ? di : a.time.localeCompare(b.time);
  });

  if (!sorted.length) return (
    <p className="text-sm text-gray-400 italic py-3 text-center">Aucun créneau pour cette catégorie.</p>
  );

  // Group by day
  const byDay = DAYS.reduce((acc, day) => {
    const ds = sorted.filter(s => s.day === day);
    if (ds.length) acc[day] = ds;
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      {Object.entries(byDay).map(([day, ds]) => (
        <div key={day} className="flex gap-3 items-start">
          <div className="flex-shrink-0 w-12 rounded-xl text-white text-center py-2.5"
            style={{ backgroundColor: DAY_COLORS[day] }}>
            <div className="text-[10px] font-bold uppercase leading-none">{day.slice(0, 3)}</div>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            {ds.map(s => (
              <div key={s.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-wrap">
                <span className="font-bold text-sm text-gray-800">{s.time}</span>
                <span className="text-xs text-gray-400">· {s.duration} min</span>
                {s.location && <span className="text-xs text-gray-500 truncate">{s.location}</span>}
                <div className="ml-auto flex gap-1.5 flex-wrap justify-end">
                  {s.category && s.category !== 'Tous' && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{s.category}</span>
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

// ── Main block ────────────────────────────────────────────────────────────────
export default function TrainingBlock({ data, isEditing, onUpdate }) {
  const sessions = data.sessions ?? [];
  const [viewMode, setViewMode] = useState('calendar');
  const [activeCategory, setActiveCategory] = useState('Tous');

  if (isEditing) return <EditView sessions={sessions} onUpdate={onUpdate} />;

  if (!sessions.length) return (
    <p className="text-sm text-gray-400 italic py-3 text-center">Aucun créneau d'entraînement renseigné.</p>
  );

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
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors"
              style={activeCategory === cat
                ? { backgroundColor: '#0F1E3A', color: 'white' }
                : { backgroundColor: '#f1f5f9', color: '#64748b' }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-xl w-fit">
        {[{ id:'calendar', label:'Calendrier' }, { id:'list', label:'Liste' }].map(({ id, label }) => (
          <button key={id} onClick={() => setViewMode(id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={viewMode === id
              ? { backgroundColor:'white', color:'#0F1E3A', boxShadow:'0 1px 4px rgba(0,0,0,0.1)' }
              : { color:'#94a3b8' }}>
            {label}
          </button>
        ))}
      </div>

      {viewMode === 'calendar'
        ? <MonthCalendar sessions={filtered} />
        : <ListView sessions={filtered} />
      }
    </div>
  );
}
