import { motion } from 'framer-motion';
import { SPORT_GROUPS } from '../data/events.js';

export default function ProfilPage({ favorites, userEvents }) {
  const favCount = favorites.size;
  const eventCount = userEvents.length;

  const sportStats = [...favorites].reduce((acc, id) => acc, {});

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      {/* Avatar + nom */}
      <div className="bg-slate-800 px-6 pt-8 pb-10 text-white text-center flex-shrink-0">
        <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center text-4xl mx-auto mb-3 border-4 border-slate-500">
          🏃
        </div>
        <h2 className="text-xl font-bold">Mon profil</h2>
        <p className="text-slate-400 text-sm mt-0.5">Sportif du Finistère</p>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-5 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-3 gap-4">
          {[
            { label: 'Favoris', value: favCount, emoji: '❤️' },
            { label: 'Ajoutés', value: eventCount, emoji: '➕' },
            { label: 'Sports', value: Object.keys(SPORT_GROUPS).length, emoji: '🏅' },
          ].map(({ label, value, emoji }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="text-2xl">{emoji}</div>
              <div className="text-xl font-bold text-gray-800 mt-0.5">{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="px-4 space-y-3 pb-6">
        {/* Sports suivis */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Sports disponibles</h3>
          <div className="space-y-2">
            {Object.values(SPORT_GROUPS).map((group) => (
              <div key={group.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{group.emoji}</span>
                  <span className="text-sm text-gray-700">{group.label}</span>
                </div>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Paramètres */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="font-semibold text-gray-700 text-sm px-4 pt-4 pb-2">Préférences</h3>
          {[
            { icon: '🔔', label: 'Notifications', sub: 'Rappels avant les matchs', soon: true },
            { icon: '📍', label: 'Zone géographique', sub: 'Finistère (29)', soon: false },
            { icon: '🌐', label: 'Langue', sub: 'Français', soon: false },
            { icon: '🔒', label: 'Compte & confidentialité', sub: '', soon: true },
          ].map(({ icon, label, sub, soon }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3 border-t border-gray-50">
              <span className="text-lg">{icon}</span>
              <div className="flex-1">
                <div className="text-sm text-gray-700">{label}</div>
                {sub && <div className="text-xs text-gray-400">{sub}</div>}
              </div>
              {soon
                ? <span className="text-[10px] bg-amber-100 text-amber-600 font-medium px-2 py-0.5 rounded-full">Bientôt</span>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              }
            </div>
          ))}
        </div>

        {/* À propos */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm mb-2">À propos</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Sports Bretagne est une application communautaire pour trouver les matchs et événements sportifs du Finistère. Les données sont enrichies par les clubs locaux.
          </p>
          <p className="text-xs text-gray-400 mt-2">Version 1.0.0 · Finistère (29)</p>
        </div>
      </div>
    </div>
  );
}
