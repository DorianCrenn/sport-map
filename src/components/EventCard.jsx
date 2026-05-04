import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { SPORT_GROUPS } from '../data/events.js';

const EventCard = forwardRef(function EventCard({ event, isSelected, onSelect }, ref) {
  const group = SPORT_GROUPS[event.sportGroup];
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
      whileHover={{ scale: 1.01 }}
      onClick={onSelect}
      className="rounded-xl p-3 mb-2 cursor-pointer border-2 transition-all bg-white"
      style={{
        borderColor: isSelected ? group?.color : 'transparent',
        boxShadow: isSelected
          ? `0 0 0 1px ${group?.color}30, 0 4px 12px ${group?.color}20`
          : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-1 rounded-full self-stretch flex-shrink-0"
          style={{ backgroundColor: group?.color, minHeight: '40px' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded text-white flex-shrink-0"
              style={{ backgroundColor: group?.color }}>
              {group?.emoji} {event.sport}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">{event.level}</span>
          </div>
          <div className="font-semibold text-gray-800 text-sm leading-tight truncate">{event.title}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
            <span>📅 {dateStr} · {timeStr}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5 truncate">📍 {event.venue}, {event.city}</div>
          {event.description && (
            <div className="text-xs text-gray-400 mt-1 italic truncate">{event.description}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default EventCard;
