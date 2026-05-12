import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useClubs } from '../hooks/useClubs.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import SportIcon from '../components/SportIcon.jsx';
import SportLinkLogo from '../components/SportLinkLogo.jsx';
import { STATIC_CLUBS } from '../data/clubs.js';

// ── Theme toggle switch ────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      className="flex items-center justify-between w-full rounded-2xl p-4 cursor-pointer"
      style={{
        backgroundColor: 'var(--sl-card)',
        border: '1px solid var(--sl-border)',
        boxShadow: 'var(--sl-shadow)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(251,191,36,0.15)' }}
        >
          {isDark ? (
            /* Moon icon */
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            /* Sun icon */
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </div>
        <div>
          <div className="text-sm font-semibold font-poppins text-left" style={{ color: 'var(--sl-t1)' }}>
            {isDark ? 'Mode sombre' : 'Mode clair'}
          </div>
          <div className="text-xs text-left" style={{ color: 'var(--sl-t2)' }}>
            {isDark ? 'Immersif · néon · premium' : 'Lumineux · élégant · Apple'}
          </div>
        </div>
      </div>

      {/* Animated pill switch */}
      <div
        className="relative flex-shrink-0 rounded-full transition-colors"
        style={{
          width: 46,
          height: 26,
          backgroundColor: isDark ? '#22d96a' : '#e2e8f0',
        }}
      >
        <motion.div
          layout
          className="absolute top-1 rounded-full"
          style={{
            width: 18,
            height: 18,
            backgroundColor: 'white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }}
          animate={{ left: isDark ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      </div>
    </motion.button>
  );
}

export default function ProfilPage({ favorites, userEvents, onNavigate, onShowAuth }) {
  const { currentUser, logout, isAdmin, isClubAdmin, updateProfile, unfollowClub } = useAuth();
  const { allSports } = useSports();
  const { userClubs } = useClubs();
  const allClubs = [...userClubs, ...STATIC_CLUBS];
  const followedClubIds = currentUser?.followedClubs ?? [];
  const [editingSports, setEditingSports] = useState(false);
  const [selectedSports, setSelectedSports] = useState(new Set());
  const favCount = favorites?.size ?? 0;
  const eventCount = userEvents?.length ?? 0;
  const favSports = currentUser?.favoriteSports ?? [];

  if (!currentUser) {
    return (
      <div className="h-full flex flex-col overflow-y-auto" style={{ backgroundColor: 'var(--sl-bg)' }}>
        {/* Hero */}
        <div
          className="flex-shrink-0 px-5 py-4 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #050807 0%, #0f1a10 100%)' }}
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
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Connectez-vous pour accéder à votre espace</p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-3 space-y-3 pb-8">
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'var(--sl-card)', boxShadow: 'var(--sl-shadow)', border: '1px solid var(--sl-border)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--sl-green-dim)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 className="font-bold text-base font-poppins mb-2" style={{ color: 'var(--sl-t1)' }}>Rejoignez SportLink</h3>
            <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--sl-t2)' }}>
              Suivez vos clubs favoris, sauvegardez des événements et gérez votre page club.
            </p>
            <button
              onClick={onShowAuth}
              className="w-full py-3.5 rounded-2xl font-bold font-poppins text-sm text-white transition-all"
              style={{ backgroundColor: 'var(--sl-green)', boxShadow: 'var(--sl-green-glow)' }}
            >
              Se connecter / S'inscrire
            </button>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />

          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--sl-card)', boxShadow: 'var(--sl-shadow)', border: '1px solid var(--sl-border)' }}>
            <div className="flex justify-center mb-3">
              <SportLinkLogo size={110} variant="full" />
            </div>
            <p className="text-xs leading-relaxed text-center" style={{ color: 'var(--sl-t2)' }}>
              Application communautaire pour trouver les clubs et événements sportifs du Finistère.
            </p>
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--sl-t3)' }}>Version 1.0.0 · Finistère (29)</p>
          </div>
        </div>
      </div>
    );
  }

  const roleBadge = isAdmin
    ? { label: currentUser.role === 'superadmin' ? 'Super Admin' : 'Administrateur', color: '#3b82f6', bg: 'rgba(59,130,246,0.18)' }
    : isClubAdmin
      ? { label: 'Responsable club', color: '#f59e0b', bg: 'rgba(245,158,11,0.18)' }
      : { label: 'Membre', color: 'var(--sl-green)', bg: 'var(--sl-green-dim)' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: 'var(--sl-bg)' }}>
      {/* Hero */}
      <div style={{
        flexShrink: 0, padding: '20px 20px 24px',
        background: 'linear-gradient(160deg, #050807 0%, #0f1a10 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 200, height: 200,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(34,217,106,0.12) 0%, transparent 70%)',
          transform: 'translate(30%,-30%)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', flexShrink: 0, boxShadow: '0 0 0 2px rgba(34,217,106,0.5)' }}
            />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 20, fontFamily: 'Inter, sans-serif',
              backgroundColor: '#22d96a', color: '#fff',
              boxShadow: '0 0 0 2px rgba(34,217,106,0.4)',
            }}>
              {currentUser.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#eef2ef', letterSpacing: '-0.02em', lineHeight: 1.2, fontFamily: 'Inter, sans-serif', margin: 0 }}>
              {currentUser.name}
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(238,242,239,0.5)', margin: '3px 0 8px' }}>{currentUser.email}</p>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
              backgroundColor: roleBadge.bg, color: roleBadge.color,
            }}>
              {roleBadge.label}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 14px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Stats */}
        <div style={{
          borderRadius: 16, padding: '14px 10px',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
          backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
        }}>
          {[
            { label: 'Favoris',  value: favCount,                                          color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
            { label: 'Ajoutés',  value: eventCount,                                        color: 'var(--sl-blue)', bg: 'var(--sl-blue-dim)' },
            { label: 'Sports',   value: favSports.length || Object.keys(allSports).length, color: 'var(--sl-green)', bg: 'var(--sl-green-dim)' },
          ].map(({ label, value, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
                <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'Inter, sans-serif' }}>{value}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            </motion.div>
          ))}
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Admin shortcut */}
        {isAdmin && (
          <button
            onClick={() => onNavigate('admin')}
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-blue-dim)', boxShadow: 'var(--sl-shadow)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--sl-blue-dim)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sl-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold font-poppins" style={{ color: 'var(--sl-t1)' }}>Tableau de bord</div>
              <div className="text-xs" style={{ color: 'var(--sl-t2)' }}>Demandes, clubs, utilisateurs</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}

        {/* Club admin shortcut */}
        {isClubAdmin && (
          <button
            onClick={() => onNavigate('clubs')}
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--sl-card)', border: '1px solid rgba(245,158,11,0.2)', boxShadow: 'var(--sl-shadow)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold font-poppins" style={{ color: 'var(--sl-t1)' }}>Mon club</div>
              <div className="text-xs" style={{ color: 'var(--sl-t2)' }}>Gérer ma page et mes événements</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}

        {/* Favoris shortcut */}
        {favCount > 0 && (
          <button
            onClick={() => onNavigate('favoris')}
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', boxShadow: 'var(--sl-shadow)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold font-poppins" style={{ color: 'var(--sl-t1)' }}>Mes favoris</div>
              <div className="text-xs" style={{ color: 'var(--sl-t2)' }}>{favCount} événement{favCount > 1 ? 's' : ''} sauvegardé{favCount > 1 ? 's' : ''}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}

        {/* Sports suivis */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--sl-card)', boxShadow: 'var(--sl-shadow)', border: '1px solid var(--sl-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm font-poppins" style={{ color: 'var(--sl-t1)' }}>Sports suivis</h3>
            {!editingSports ? (
              <button
                onClick={() => { setSelectedSports(new Set(favSports)); setEditingSports(true); }}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)' }}
              >
                Modifier
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={() => setEditingSports(false)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{ border: '1px solid var(--sl-border-s)', color: 'var(--sl-t3)' }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => { updateProfile({ favoriteSports: [...selectedSports] }); setEditingSports(false); }}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                  style={{ backgroundColor: 'var(--sl-green)' }}
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
                  <p className="text-xs" style={{ color: 'var(--sl-t3)' }}>Aucun sport sélectionné — cliquez sur Modifier.</p>
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
                        backgroundColor: on ? `${sport.color}12` : 'var(--sl-surface)',
                        borderColor: on ? sport.color : 'transparent',
                      }}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: on ? `${sport.color}25` : 'var(--sl-bg)' }}>
                        <SportIcon sport={sport.id} size={15} color={on ? sport.color : 'var(--sl-t3)'} />
                      </div>
                      <span className="text-xs font-semibold leading-tight"
                        style={{ color: on ? sport.color : 'var(--sl-t2)' }}>
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

        {/* Clubs suivis */}
        {followedClubIds.length > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--sl-card)', boxShadow: 'var(--sl-shadow)', border: '1px solid var(--sl-border)' }}>
            <h3 className="font-semibold text-sm font-poppins mb-3" style={{ color: 'var(--sl-t1)' }}>
              Clubs suivis
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {followedClubIds.map(clubId => {
                const club = allClubs.find(c => c.id === clubId);
                if (!club) return null;
                return (
                  <div key={clubId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: 'var(--sl-surface)', fontWeight: 700, fontSize: 11, color: 'var(--sl-t2)', fontFamily: 'Inter, sans-serif',
                    }}>
                      {club.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{club.city} · {club.sport}</div>
                    </div>
                    <button
                      onClick={() => unfollowClub(clubId)}
                      aria-label={`Ne plus suivre ${club.name}`}
                      style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--sl-border-s)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', backgroundColor: 'transparent' }}
                    >
                      Retirer
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full rounded-2xl p-4 flex items-center gap-3 transition-colors"
          style={{ backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', boxShadow: 'var(--sl-shadow)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <span className="text-sm font-semibold font-poppins text-red-500">Se déconnecter</span>
        </button>

        <p className="text-xs text-center pt-1" style={{ color: 'var(--sl-t3)' }}>SportLink v1.0.0 · Finistère (29)</p>
      </div>
    </div>
  );
}
