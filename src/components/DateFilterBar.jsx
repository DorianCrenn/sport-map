import { motion } from 'framer-motion';

const DATE_OPTIONS = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'weekend', label: 'Ce week-end' },
  { key: 'week', label: 'Cette semaine' },
];

export default function DateFilterBar({ active, onChange }) {
  return (
    <div className="flex gap-2 px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0 overflow-x-auto">
      <span className="text-xs text-gray-400 self-center mr-1 flex-shrink-0">📅 Date :</span>
      {DATE_OPTIONS.map(({ key, label }) => (
        <motion.button
          key={key}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(active === key ? null : key)}
          className="px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer"
          style={
            active === key
              ? { backgroundColor: '#1e293b', color: 'white' }
              : { backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }
          }
        >
          {label}
        </motion.button>
      ))}
    </div>
  );
}
