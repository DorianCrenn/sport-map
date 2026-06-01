import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useClubs } from '../hooks/useClubs.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { useFavoritesContext } from '../contexts/FavoritesContext.jsx';
import SportIcon from '../components/SportIcon.jsx';
import SportLinkLogo from '../components/SportLinkLogo.jsx';
import { BADGE_DEFS, BADGE_ORDER, getLevel } from '../hooks/useBadges.js';
import { usePlan } from '../hooks/usePlan.js';
import ClubLeaderboard from '../components/ClubLeaderboard.jsx';
import UserLeaderboard from '../components/UserLeaderboard.jsx';

const BadgeUnlockModal = lazy(() => import('../components/BadgeUnlockModal.jsx'));

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

export default function ProfilPage({ userEvents, earnedBadges = [], onNavigate, onShowAuth, onMyRides, rideNotifCount = 0 }) {
  const { currentUser, logout, isAdmin, isClubAdmin, updateProfile, unfollowClub, followedClubs } = useAuth();
  const { toast } = useToast();
  const { favorites } = useFavoritesContext();
  const { allSports } = useSports();
  const { userClubs } = useClubs();
  const { planId, plan: planInfo, isUpgradeable: canUpgrade } = usePlan();
  const allClubs = userClubs;
  const followedClubIds = followedClubs;
  const [editingSports, setEditingSports] = useState(false);
  const [selectedSports, setSelectedSports] = useState(new Set());
  const [previewBadges, setPreviewBadges] = useState(null);
  const [profileTab, setProfileTab] = useState('profil'); // 'profil' | 'params' | 'stats'
  const favCount = favorites?.size ?? 0;
  const eventCount = userEvents?.length ?? 0;
  const favSports = currentUser?.favoriteSports ?? [];

  const xpTotal = (currentUser?.xp ?? 0);
  const levelInfo = getLevel(xpTotal);

  if (!currentUser) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: 'var(--sl-bg)' }}>
        {/* Hero */}
        <div style={{
          flexShrink: 0, padding: '16px 20px',
          background: 'linear-gradient(160deg, #050807 0%, #0f1a10 100%)',
          color: 'white', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 224, height: 224,
            borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)',
            transform: 'translate(30%,-30%)',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Poppins, sans-serif', lineHeight: 1.3, margin: 0 }}>Mon profil</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>Connectez-vous pour accéder à votre espace</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 16px calc(90px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ borderRadius: 20, padding: '24px', textAlign: 'center', backgroundColor: 'var(--sl-card)', boxShadow: 'var(--sl-shadow)', border: '1px solid var(--sl-border)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', backgroundColor: 'var(--sl-green-dim)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 15, fontFamily: 'Poppins, sans-serif', marginBottom: 8, color: 'var(--sl-t1)' }}>Rejoignez SportLink</h3>
            <p style={{ fontSize: 12, marginBottom: 20, lineHeight: 1.5, color: 'var(--sl-t2)' }}>
              Suivez vos clubs favoris, sauvegardez des événements et gérez votre page club.
            </p>
            <button
              onClick={onShowAuth}
              style={{
                width: '100%', padding: '14px', borderRadius: 16, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: 14,
                color: '#fff', backgroundColor: 'var(--sl-green)', boxShadow: 'var(--sl-green-glow)',
              }}
            >
              Se connecter / S'inscrire
            </button>
          </div>

          <ThemeToggle />

          <div style={{ borderRadius: 20, padding: 16, backgroundColor: 'var(--sl-card)', boxShadow: 'var(--sl-shadow)', border: '1px solid var(--sl-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <SportLinkLogo size={110} variant="full" />
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.5, textAlign: 'center', color: 'var(--sl-t2)', margin: 0 }}>
              Application communautaire pour trouver les clubs et événements sportifs du Finistère.
            </p>
            <p style={{ fontSize: 12, marginTop: 8, textAlign: 'center', color: 'var(--sl-t3)' }}>Version 1.0.0 · Finistère (29)</p>
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#eef2ef', letterSpacing: '-0.02em', lineHeight: 1.2, fontFamily: 'Inter, sans-serif', margin: 0 }}>
              {currentUser.name}
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(238,242,239,0.5)', margin: '3px 0 8px' }}>{currentUser.email}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                backgroundColor: roleBadge.bg, color: roleBadge.color, flexShrink: 0,
              }}>
                {roleBadge.label}
              </span>

              {/* Plan badge */}
              {planId !== 'free' ? (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                  backgroundColor: `${planInfo.color}20`, color: planInfo.color, flexShrink: 0,
                }}>
                  {planInfo.badge} {planInfo.name}
                </span>
              ) : canUpgrade && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
                  border: '1px dashed rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.35)', flexShrink: 0,
                  cursor: 'pointer',
                }}>
                  Passer Pro
                </span>
              )}

              {/* Compact badge strip */}
              <button
                onClick={() => setPreviewBadges(BADGE_ORDER)}
                aria-label={`Voir mes badges — ${earnedBadges.length} sur ${BADGE_ORDER.length} débloqués`}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {BADGE_ORDER.map(id => {
                  const def = BADGE_DEFS[id];
                  const isEarned = earnedBadges.includes(id);
                  return (
                    <span
                      key={id}
                      title={def.name}
                      style={{
                        width: 24, height: 24, borderRadius: 8, fontSize: 12,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isEarned ? `${def.color}25` : 'rgba(255,255,255,0.06)',
                        border: `1.5px solid ${isEarned ? def.color + '70' : 'rgba(255,255,255,0.1)'}`,
                        opacity: isEarned ? 1 : 0.4,
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}
                    >
                      {isEarned ? def.icon : '🔒'}
                    </span>
                  );
                })}
                <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(238,242,239,0.4)', marginLeft: 2 }}>
                  {earnedBadges.length}/{BADGE_ORDER.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barre d'onglets ── */}
      <div style={{ flexShrink: 0, display: 'flex', borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-bg)' }}>
        {[
          { key: 'profil',  label: 'Profil'      },
          { key: 'params',  label: 'Paramètres'  },
          { key: 'stats',   label: 'Stats'        },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setProfileTab(tab.key)}
            style={{
              flex: 1, padding: '12px 4px', fontSize: 13, fontWeight: 700,
              background: 'none', border: 'none', cursor: 'pointer',
              color: profileTab === tab.key ? 'var(--sl-green)' : 'var(--sl-t3)',
              borderBottom: `2px solid ${profileTab === tab.key ? 'var(--sl-green)' : 'transparent'}`,
              transition: 'color 0.15s, border-color 0.15s',
            }}
            aria-selected={profileTab === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px calc(90px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ═══════════ ONGLET PROFIL ═══════════ */}
        {profileTab === 'profil' && <>

        {/* Stats */}
        <div style={{
          borderRadius: 16, padding: '14px 10px',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
          backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
        }}>
          {[
            { label: 'Sauvegardés', value: favCount,                                       color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
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

        </> /* /PROFIL */}

        {/* ═══════════ ONGLET STATS ═══════════ */}
        {profileTab === 'stats' && <>

        {/* XP / Level card */}
        <div style={{ borderRadius: 16, padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Niveau {levelInfo.level} — {levelInfo.name}</div>
                <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{xpTotal} XP{levelInfo.nextLevel ? ` · ${levelInfo.nextLevel.minXp - xpTotal} XP jusqu'au niv. ${levelInfo.level + 1}` : ' · Niveau max !'}</div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#8b5cf6', fontVariantNumeric: 'tabular-nums' }}>{xpTotal}</div>
          </div>
          <div style={{ height: 6, borderRadius: 3, backgroundColor: 'var(--sl-border)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' }}
            />
          </div>
          {levelInfo.nextLevel && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--sl-t3)' }}>{levelInfo.minXp} XP</span>
              <span style={{ fontSize: 9, color: 'var(--sl-t3)' }}>{levelInfo.nextLevel.minXp} XP</span>
            </div>
          )}
        </div>

        {/* Classement XP utilisateurs */}
        <UserLeaderboard />

        {/* Classement clubs actifs */}
        <ClubLeaderboard />

        </> /* /STATS */}

        {/* ═══════════ ONGLET PARAMÈTRES ═══════════ */}
        {profileTab === 'params' && <>

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

        {/* Mes covoiturages shortcut */}
        {onMyRides && (
          <button
            onClick={onMyRides}
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', boxShadow: 'var(--sl-shadow)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(34,217,106,0.12)', position: 'relative' }}>
              <span style={{ fontSize: 20 }}>🚗</span>
              {rideNotifCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  minWidth: 18, height: 18, borderRadius: 999, padding: '0 4px',
                  backgroundColor: '#ef4444', color: '#fff',
                  fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {rideNotifCount > 9 ? '9+' : rideNotifCount}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold font-poppins" style={{ color: 'var(--sl-t1)' }}>Mes covoiturages</div>
              <div className="text-xs" style={{ color: 'var(--sl-t2)' }}>Trajets, demandes et notifications</div>
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
                  onClick={() => { updateProfile({ favoriteSports: [...selectedSports] }); setEditingSports(false); toast({ message: 'Sports favoris mis à jour !' }); }}
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

        {/* Digest hebdo opt-in */}
        <motion.button
          onClick={() => updateProfile({ digestOptIn: !currentUser.digestOptIn })}
          className="flex items-center justify-between w-full rounded-2xl p-4 cursor-pointer"
          style={{ backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', boxShadow: 'var(--sl-shadow)' }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: currentUser.digestOptIn ? 'rgba(34,197,94,0.12)' : 'var(--sl-surface)' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                stroke={currentUser.digestOptIn ? '#22C55E' : 'var(--sl-t3)'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold font-poppins text-left" style={{ color: 'var(--sl-t1)' }}>
                Digest hebdo
              </div>
              <div className="text-xs text-left" style={{ color: 'var(--sl-t2)' }}>
                Reçois les matchs du week-end par email
              </div>
            </div>
          </div>
          <div className="relative flex-shrink-0 rounded-full transition-colors"
            style={{ width: 46, height: 26, backgroundColor: currentUser.digestOptIn ? '#22d96a' : 'var(--sl-border-s)' }}>
            <motion.div layout className="absolute top-1 rounded-full"
              style={{ width: 18, height: 18, backgroundColor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}
              animate={{ left: currentUser.digestOptIn ? 24 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          </div>
        </motion.button>

        {/* Logout */}
        <button
          onClick={() => { logout(); toast({ message: 'À bientôt !', type: 'info' }); }}
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

        </> /* /PARAMÈTRES */}

      </div>

      {/* Badge preview modal (temporary — dev only) */}
      <AnimatePresence>
        {previewBadges && (
          <Suspense fallback={null}>
            <BadgeUnlockModal
              badges={previewBadges}
              onDone={() => setPreviewBadges(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}
