import { SPORTS } from '../../../data/events.js';
import SportIcon from '../../SportIcon.jsx';

export default function UpcomingEventsBlock({ data, allEvents, isEditing, onUpdate }) {
  const now = new Date();
  const events = (allEvents ?? [])
    .filter(e => new Date(e.date) >= now && (!data.sport || e.sport === data.sport))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, data.maxItems ?? 5);

  return (
    <div>
      {/* Contrôles éditeur */}
      {isEditing && (
        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Sport</label>
            <select
              value={data.sport || ''}
              onChange={e => onUpdate({ sport: e.target.value || null })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
            >
              <option value="">Tous</option>
              {Object.values(SPORTS).map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Nombre</label>
            <select
              value={data.maxItems ?? 5}
              onChange={e => onUpdate({ maxItems: Number(e.target.value) })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
            >
              {[3, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-4 text-center">
          Aucun événement à venir{data.sport ? ` en ${data.sport}` : ''}.
        </p>
      ) : (
        <div className="space-y-2">
          {events.map(event => {
            const sp = SPORTS[event.sport];
            const d = new Date(event.date);
            return (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${sp?.color}18` }}
                >
                  <SportIcon sport={event.sport} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 font-oswald truncate">{event.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}
                    {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span
                  className="text-[10px] font-semibold text-white px-2 py-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sp?.color }}
                >
                  {event.city}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
