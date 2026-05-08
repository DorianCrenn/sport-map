import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import SportIcon from '../components/SportIcon.jsx';
import SportLinkLogo from '../components/SportLinkLogo.jsx';

export default function ProfilPage({ favorites, userEvents, onNavigate, onShowAuth }) {
  const { currentUser, logout, isAdmin, isClubAdmin, updateProfile } = useAuth();
  const { allSports } = useSports();
  const [editingSports, setEditingSports] = useState(false);
  const [selectedSports, setSelectedSports] = useState(new Set());
  const favCount = favorites?.size ?? 0;
  const eventCount = userEvents?.length ?? 0;
  const favSports = currentUser?.favoriteSports ?? [];

  if (!currentUser) {
    return (
      <div className="h-full flex flex-col bg-[#F1F5F9] overflow-y-auto">
        {/* Hero */}
        <div
          className="flex-shrink-0 px-5 py-4 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0F1E3A 0%, #1a3460 100%)' }}
        >
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
          <div className="flex items-center gap-3 relative">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold font-poppins leading-tight">Mon profil</h2>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Connectez-vous pour accéder à votre espace</p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-3 space-y-3 pb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#F0FDF4' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 className="font-bold text-base font-poppins mb-2" style={{ color: '#0F1E3A' }}>Rejoignez SportLink</h3>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              Suivez vos clubs favoris, sauvegardez des événements et gérez votre page club.
            </p>
            <button
              onClick={onShowAuth}
              className="w-full py-3.5 rounded-2xl font-bold font-poppins text-sm text-white transition-all"
              style={{ backgroundColor: '#22C55E', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}
            >
              Se connecter / S'inscrire
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-center mb-3">
              <SportLinkLogo size={110} variant="full" />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed text-center">
              Application communautaire pour trouver les clubs et événements sportifs du Finistère.
            </p>
            <p className="text-xs text-gray-300 mt-2 text-center">Version 1.0.0 · Finistère (29)</p>
          </div>
        </div>
      </div>
    );
  }

  const roleBadge = isAdmin
    ? { label: currentUser.role === 'superadmin' ? 'Super Admin' : 'Administrateur', color: '#3b82f6', bg: 'rgba(59,130,246,0.18)' }
    : isClubAdmin
      ? { label: 'Responsable club', color: '#f59e0b', bg: 'rgba(245,158,11,0.18)' }
      : { label: 'Membre', color: '#22C55E', bg: 'rgba(34,197,94,0.18)' };

  return (
    <div className="h-full flex flex-col bg-[#F1F5F9] overflow-y-auto">
      {/* Hero */}
      <div
        className="flex-shrink-0 px-6 pt-6 pb-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0F1E3A 0%, #1a3460 100%)' }}
      >
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="flex items-center gap-4 relative">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              style={{ boxShadow: '0 0 0 2.5px rgba(255,255,255,0.75)' }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xl font-oswald"
              style={{ backgroundColor: '#22C55E', color: 'white', boxShadow: '0 0 0 2.5px rgba(255,255,255,0.75)' }}
            >
              {currentUser.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold font-poppins leading-tight">{currentUser.name}</h2>
            <p className="text-xs mb-2" style={{ color: '#64748b' }}>{currentUser.email}</p>
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: roleBadge.bg, color: roleBadge.color }}
            >
              {roleBadge.label}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 space-y-3 pb-8">
        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Favoris', value: favCount, color: '#ef4444', bg: '#fef2f2' },
            { label: 'Ajoutés', value: eventCount, color: '#3B82F6', bg: '#EFF6FF' },
            { label: 'Sports', value: favSports.length || Object.keys(allSports).length, color: '#22C55E', bg: '#F0FDF4' },
          ].map(({ label, value, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                <span className="text-base font-bold font-poppins" style={{ color }}>{value}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">{label}</span>
            </motion.div>
          ))}
        </div>

        {/* Admin shortcut */}
        {isAdmin && (
          <button
            onClick={() => onNavigate('admin')}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3 text-left transition-colors hover:bg-gray-50"
            style={{ borderColor: '#dbeafe' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#eff6ff' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold font-poppins" style={{ color: '#0F1E3A' }}>Tableau de bord</div>
              <div className="text-xs text-gray-400">Demandes, clubs, utilisateurs</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}

        {/* Club admin shortcut */}
        {isClubAdmin && (
          <button
            onClick={() => onNavigate('clubs')}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3 text-left transition-colors hover:bg-gray-50"
            style={{ borderColor: '#fde68a' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fffbeb' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold font-poppins" style={{ color: '#0F1E3A' }}>Mon club</div>
              <div className="text-xs text-gray-400">Gérer ma page et mes événements</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}

        {/* Favoris shortcut */}
        {favCount > 0 && (
          <button
            onClick={() => onNavigate('favoris')}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 text-left transition-colors hover:bg-gray-50"
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

        {/* Sports suivis */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm font-poppins" style={{ color: '#0F1E3A' }}>Sports suivis</h3>
            {!editingSports ? (
              <button
                onClick={() => { setSelectedSports(new Set(favSports)); setEditingSports(true); }}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
              >
                Modifier
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={() => setEditingSports(false)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-400"
                >
                  Annuler
                </button>
                <button
                  onClick={() => { updateProfile({ favoriteSports: [...selectedSports] }); setEditingSports(false); }}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                  style={{ backgroundColor: '#22C55E' }}
                >
                  Enregistrer
                </button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!editingSports ? (
              <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {favSports.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {favSports.map(sportId => {
                      const sport = allSports[sportId];
                      return sport ? (
                        <div key={sportId} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                          style={{ backgroundColor: `${sport.color}15` }}>
                          <SportIcon sport={sport.id} size={13} color={sport.color} />
                          <span className="text-xs font-semibold" style={{ color: sport.color }}>{sport.label}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Aucun sport sélectionné — cliquez sur Modifier.</p>
                )}
              </motion.div>
            ) : (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-2">
                {Object.values(allSports).filter(s => !s.isArchived).map(sport => {
                  const on = selectedSports.has(sport.id);
                  return (
                    <button
                      key={sport.id}
                      onClick={() => setSelectedSports(prev => {
                        const next = new Set(prev);
                        on ? next.delete(sport.id) : next.add(sport.id);
                        return next;
                      })}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-colors"
                      style={{
                        backgroundColor: on ? `${sport.color}12` : '#f8fafc',
                        borderColor: on ? sport.color : 'transparent',
                      }}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: on ? `${sport.color}25` : '#f1f5f9' }}>
                        <SportIcon sport={sport.id} size={15} color={on ? sport.color : '#94a3b8'} />
                      </div>
                      <span className="text-xs font-semibold leading-tight"
                        style={{ color: on ? sport.color : '#64748b' }}>
                        {sport.label}
                      </span>
                      {on && (
                        <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: sport.color }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:bg-red-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fef2f2' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <span className="text-sm font-semibold font-poppins text-red-500">Se déconnecter</span>
        </button>

        <p className="text-xs text-gray-300 text-center pt-1">SportLink v1.0.0 · Finistère (29)</p>
      </div>
    </div>
  );
}
