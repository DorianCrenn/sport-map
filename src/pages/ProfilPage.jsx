import { motion } from 'framer-motion';
import { SPORTS } from '../data/events.js';
import SportIcon from '../components/SportIcon.jsx';

export default function ProfilPage({ favorites, userEvents }) {
  const favCount = favorites.size;
  const eventCount = userEvents.length;

  const stats = [
    {
      label: 'Favoris',
      value: favCount,
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
    },
    {
      label: 'Ajoutés',
      value: eventCount,
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      ),
    },
    {
      label: 'Sports',
      value: Object.keys(SPORTS).length,
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
    },
  ];

  const settings = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
      label: 'Notifications', sub: 'Rappels avant les matchs', soon: true,
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      label: 'Zone géographique', sub: 'Finistère (29)', soon: false,
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      ),
      label: 'Langue', sub: 'Français', soon: false,
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      label: 'Compte & confidentialité', sub: '', soon: true,
    },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      <div className="bg-slate-800 px-6 pt-8 pb-10 text-white text-center flex-shrink-0">
        <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center mx-auto mb-3 border-4 border-slate-500">
          <SportIcon sport="Running" size={40} color="white" />
        </div>
        <h2 className="text-xl font-bold">Mon profil</h2>
        <p className="text-slate-400 text-sm mt-0.5">Sportif du Finistère</p>
      </div>

      <div className="px-4 -mt-5 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-3 gap-4">
          {stats.map(({ label, value, icon }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="flex justify-center mb-1">{icon}</div>
              <div className="text-xl font-bold text-gray-800">{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3 pb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Sports disponibles</h3>
          <div className="space-y-2">
            {Object.values(SPORTS).map((sport) => (
              <div key={sport.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <SportIcon sport={sport.id} size={18} color={sport.color} />
                  <span className="text-sm text-gray-700">{sport.label}</span>
                </div>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sport.color }} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="font-semibold text-gray-700 text-sm px-4 pt-4 pb-2">Préférences</h3>
          {settings.map(({ icon, label, sub, soon }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3 border-t border-gray-50">
              <span className="text-gray-400">{icon}</span>
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
