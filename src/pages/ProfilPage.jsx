import { motion } from 'framer-motion';
import { SPORTS } from '../data/events.js';
import SportIcon from '../components/SportIcon.jsx';
import SportLinkLogo from '../components/SportLinkLogo.jsx';

export default function ProfilPage({ favorites, userEvents, onNavigate }) {
  const favCount = favorites.size;
  const eventCount = userEvents.length;

  const stats = [
    { label: 'Favoris', value: favCount, color: '#ef4444', bg: '#fef2f2' },
    { label: 'Ajoutés', value: eventCount, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Sports', value: Object.keys(SPORTS).length, color: '#22C55E', bg: '#F0FDF4' },
  ];

  const settings = [
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
      label: 'Notifications', sub: 'Rappels avant les matchs', soon: true,
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
      label: 'Zone géographique', sub: 'Finistère (29)', soon: false,
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
      label: 'Langue', sub: 'Français', soon: false,
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
      label: 'Compte & confidentialité', sub: '', soon: true,
    },
  ];

  return (
    <div className="h-full flex flex-col bg-[#F1F5F9] overflow-y-auto">

      {/* Hero */}
      <div className="flex-shrink-0 px-6 pt-8 pb-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0F1E3A 0%, #1a3460 100%)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5"
          style={{ background: '#22C55E', transform: 'translate(30%,-30%)' }} />
        <div className="text-center relative">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2"
            style={{ backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.3)' }}>
            <SportIcon sport="Running" size={38} color="#22C55E" />
          </div>
          <h2 className="text-xl font-bold font-poppins">Mon profil</h2>
          <p className="text-sm mt-0.5" style={{ color: '#94a3b8' }}>Sportif du Finistère</p>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-5 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-3 gap-3">
          {stats.map(({ label, value, color, bg }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                <span className="text-base font-bold font-poppins" style={{ color }}>{value}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3 pb-6">
        {/* Favoris shortcut */}
        {favCount > 0 && (
          <button
            onClick={() => onNavigate('favoris')}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fef2f2' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold font-poppins" style={{ color: '#0F1E3A' }}>Mes favoris</div>
              <div className="text-xs text-gray-400">{favCount} événement{favCount > 1 ? 's' : ''} sauvegardé{favCount > 1 ? 's' : ''}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}

        {/* Sports */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm mb-3 font-poppins" style={{ color: '#0F1E3A' }}>Sports disponibles</h3>
          <div className="space-y-2.5">
            {Object.values(SPORTS).map((sport) => (
              <div key={sport.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${sport.color}15` }}>
                    <SportIcon sport={sport.id} size={16} color={sport.color} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{sport.label}</span>
                </div>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sport.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="font-semibold text-sm px-4 pt-4 pb-2 font-poppins" style={{ color: '#0F1E3A' }}>Préférences</h3>
          {settings.map(({ icon, label, sub, soon }, i) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3 border-t border-gray-50">
              <span style={{ color: '#94a3b8' }}>{icon}</span>
              <div className="flex-1">
                <div className="text-sm text-gray-700 font-medium">{label}</div>
                {sub && <div className="text-xs text-gray-400">{sub}</div>}
              </div>
              {soon
                ? <span className="text-[10px] bg-amber-100 text-amber-600 font-semibold px-2 py-0.5 rounded-full">Bientôt</span>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              }
            </div>
          ))}
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <SportLinkLogo size={24} />
            <span className="font-bold text-sm font-poppins" style={{ color: '#0F1E3A' }}>SportLink</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Application communautaire pour trouver les clubs et événements sportifs du Finistère. Les données sont enrichies par les clubs locaux.
          </p>
          <p className="text-xs text-gray-400 mt-2">Version 1.0.0 · Finistère (29)</p>
        </div>
      </div>
    </div>
  );
}
