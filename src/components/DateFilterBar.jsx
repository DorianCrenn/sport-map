import { useRef } from 'react';
import { motion } from 'framer-motion';

const PREDEFINED = [
  { key: 'today',   label: "Aujourd'hui" },
  { key: 'weekend', label: 'Ce week-end' },
  { key: 'week',    label: 'Cette semaine' },
];

function formatDate(iso) {
  return new Date(iso + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function DateFilterBar({ active, onChange }) {
  const dateInputRef = useRef(null);
  const isSpecific = active && !PREDEFINED.find((o) => o.key === active);

  return (
    <div className="flex gap-2 px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0 overflow-x-auto items-center">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(null)}
        className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 cursor-pointer transition-colors"
        style={
          active === null
            ? { backgroundColor: '#1e293b', color: 'white' }
            : { backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }
        }
      >
        Tout
      </motion.button>

      {PREDEFINED.map(({ key, label }) => (
        <motion.button
          key={key}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(active === key ? null : key)}
          className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 cursor-pointer transition-colors"
          style={
            active === key
              ? { backgroundColor: '#1e293b', color: 'white' }
              : { backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }
          }
        >
          {label}
        </motion.button>
      ))}

      {/* Custom date picker — hidden input triggered by showPicker() */}
      <input
        ref={dateInputRef}
        type="date"
        value={isSpecific ? active : ''}
        onChange={(e) => onChange(e.target.value || null)}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
      />
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => dateInputRef.current?.showPicker()}
        className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 cursor-pointer flex items-center gap-1.5 transition-colors"
        style={
          isSpecific
            ? { backgroundColor: '#1e293b', color: 'white' }
            : { backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }
        }
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        {isSpecific ? formatDate(active) : 'Choisir'}
      </motion.button>
    </div>
  );
}
