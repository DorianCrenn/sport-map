import { DEPARTMENTS } from '../data/events.js';

export default function Header({ activeDepartment, onDepartmentChange }) {
  return (
    <header className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between shadow-lg flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏟</span>
        <div>
          <h1 className="text-lg font-bold leading-none">Sports Bretagne</h1>
          <p className="text-slate-400 text-xs mt-0.5">Trouvez vos matchs et événements sportifs</p>
        </div>
      </div>

      <select
        value={activeDepartment}
        onChange={(e) => onDepartmentChange(e.target.value)}
        className="bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
      >
        {Object.values(DEPARTMENTS).map((dept) => (
          <option key={dept.id} value={dept.id} disabled={dept.disabled}>
            {dept.label}{dept.disabled ? ' (bientôt)' : ''}
          </option>
        ))}
      </select>
    </header>
  );
}
