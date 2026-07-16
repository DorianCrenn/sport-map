import { useState, lazy, Suspense } from 'react';
import StreakWidget from '../components/home/StreakWidget.jsx';
import { APP_VERSION, APP_NAME } from '../lib/appInfo.js';
import { IconCrown, IconShirt, IconMegaphone, IconUsers, IconBall, IconSiren, IconStadium, IconCar, IconClipboard, IconAlertTriangle, IconZap, IconLock } from '../components/icons.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useClubs } from '../hooks/useClubs.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { useFavoritesContext } from '../contexts/FavoritesContext.jsx';
import SportIcon from '../components/SportIcon.jsx';
import RgpdExportButton from '../components/RgpdExportButton.jsx';
import SportLinkLogo from '../components/SportLinkLogo.jsx';
import { BADGE_DEFS, BADGE_ORDER, getLevel } from '../hooks/useBadges.js';
import { Z } from '../constants/zIndex.js';
import { usePlan } from '../hooks/usePlan.js';
import { useAnalyticsConsent } from '../hooks/useAnalyticsConsent.js';
import ClubLeaderboard from '../components/ClubLeaderboard.jsx';
import UserLeaderboard from '../components/UserLeaderboard.jsx';
import type { SportLinkClub } from '../types/sportlink.js';
import { useMyPlayerStats } from '../hooks/usePlayerStats.js';

const BadgeUnlockModal = lazy(() => import('../components/BadgeUnlockModal.jsx'));

// ── Simple mode toggle ─────────────────────────────────────────────────────────
function SimpleModeToggle() {
  const [simple, setSimple] = useState(() => document.documentElement.hasAttribute('data-simple-mode'));

  function toggle() {
    const next = !simple;
    setSimple(next);
    if (next) {
      document.documentElement.setAttribute('data-simple-mode', 'true');
      localStorage.setItem('sl-simple-mode', 'true');
    } else {
      document.documentElement.removeAttribute('data-simple-mode');
      localStorage.removeItem('sl-simple-mode');
    }
  }

  return (
    <motion.button
      onClick={toggle}
      className="flex items-center justify-between w-full rounded-2xl p-4 cursor-pointer"
      style={{
        backgroundColor: 'var(--sl-card)',
        border: simple ? '1px solid rgba(34,217,106,0.35)' : '1px solid var(--sl-border)',
        boxShadow: 'var(--sl-shadow)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: simple ? 'rgba(34,217,106,0.12)' : 'rgba(255,255,255,0.05)' }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={simple ? 'var(--sl-green)' : 'var(--sl-t2)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--sl-t1)' }}>Vue simplifiée</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--sl-t2)' }}>
            {simple ? 'Texte grand, animations réduites' : 'Activer pour une meilleure lisibilité'}
          </div>
        </div>
      </div>
      {/* Toggle pill */}
      <div style={{
        width: 44, height: 24, borderRadius: 'var(--sl-radius-xl)', position: 'relative', flexShrink: 0,
        backgroundColor: simple ? 'var(--sl-green)' : 'rgba(255,255,255,0.12)',
        transition: 'background-color 0.2s',
      }}>
        <motion.div
          animate={{ x: simple ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}
        />
      </div>
    </motion.button>
  );
}

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

type IconComp = (p: { size?: number; color?: string; strokeWidth?: number }) => React.ReactElement;
interface RoleOption {
  id: string;
  label: string;
  Icon: IconComp;
}

const ROLE_OPTIONS: RoleOption[] = [
  { id: 'president',   label: 'Président / Responsable', Icon: IconCrown },
  { id: 'coach',       label: 'Coach / Éducateur',        Icon: IconShirt },
  { id: 'communicant', label: 'Communication',            Icon: IconMegaphone },
  { id: 'parent',      label: 'Parent',                   Icon: IconUsers },
  { id: 'joueur',      label: 'Joueur / Joueuse',         Icon: IconBall },
  { id: 'supporter',   label: 'Supporter',                Icon: IconSiren },
];

interface RoleSectionProps {
  jobRole: string;
  onSave: (role: string) => void;
}

function RoleSection({ jobRole, onSave }: RoleSectionProps) {
  const [editing, setEditing] = useState<boolean>(false);
  const current = ROLE_OPTIONS.find(r => r.id === jobRole);
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', boxShadow: 'var(--sl-shadow)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm font-poppins" style={{ color: 'var(--sl-t1)' }}>Mon rôle</h3>
        <button
          onClick={() => setEditing(e => !e)}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)' }}
        >
          {editing ? 'Fermer' : 'Modifier'}
        </button>
      </div>
      {!editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {current ? <current.Icon size={20} color="var(--sl-green)" /> : <IconUsers size={20} color="var(--sl-t3)" />}
          <span className="text-sm" style={{ color: 'var(--sl-t2)' }}>
            {current?.label ?? 'Non défini'}
          </span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {ROLE_OPTIONS.map(role => (
            <button
              key={role.id}
              onClick={() => { onSave(role.id); setEditing(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px', borderRadius: 'var(--sl-radius-xl)', cursor: 'pointer', textAlign: 'left',
                border: `2px solid ${jobRole === role.id ? 'var(--sl-green)' : 'var(--sl-border)'}`,
                backgroundColor: jobRole === role.id ? 'rgba(34,217,106,0.08)' : 'var(--sl-surface)',
                fontSize: 12, fontWeight: 600,
                color: jobRole === role.id ? 'var(--sl-green)' : 'var(--sl-t2)',
              }}
            >
              <role.Icon size={16} color={jobRole === role.id ? 'var(--sl-green)' : 'var(--sl-t3)'} />
              {role.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ProfilPageProps {
  userEvents?: Record<string, any>[];
  earnedBadges?: string[];
  onNavigate: (page: string) => void;
  onShowAuth?: () => void;
  onMyRides?: () => void;
  rideNotifCount?: number;
  onShowLegal?: (section: string) => void;
  onMyConvocations?: () => void;
  convocationsPendingCount?: number;
}

export default function ProfilPage({
  userEvents,
  earnedBadges = [],
  onNavigate,
  onShowAuth,
  onMyRides,
  rideNotifCount = 0,
  onShowLegal,
  onMyConvocations,
  convocationsPendingCount = 0,
}: ProfilPageProps) {
  const { currentUser, logout, isAdmin, isClubAdmin, updateProfile, unfollowClub, followedClubs, requestPasswordReset } = useAuth();
  const { toast } = useToast();
  const { favorites } = useFavoritesContext();
  const { allSports } = useSports() as any;
  const { userClubs } = useClubs();
  const { planId, plan: planInfo, isUpgradeable: canUpgrade } = usePlan();
  const allClubs: SportLinkClub[] = userClubs;
  const followedClubIds: string[] = followedClubs;
  const [editingSports, setEditingSports] = useState<boolean>(false);
  const [selectedSports, setSelectedSports] = useState<Set<string>>(new Set());
  const [previewBadges, setPreviewBadges] = useState<string[] | null>(null);
  const [profileTab, setProfileTab] = useState<string>('profil'); // 'profil' | 'params' | 'stats'
  const [deleteConfirm, setDeleteConfirm] = useState<string>(''); // champ de saisie confirmation suppression
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [pwResetSent, setPwResetSent] = useState<boolean>(false);
  const { consent: analyticsConsent, accept: acceptAnalytics, refuse: refuseAnalytics } = useAnalyticsConsent();
  const favCount: number = favorites?.size ?? 0;
  const eventCount: number = userEvents?.length ?? 0;
  const favSports: string[] = currentUser?.favoriteSports ?? [];

  const xpTotal: number = (currentUser?.xp ?? 0);
  const levelInfo = getLevel(xpTotal) as any;
  const { stats: playerStats } = useMyPlayerStats(currentUser?.id ?? null);

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
              width: 48, height: 48, borderRadius: 'var(--sl-radius-xl)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1.2, margin: 0, letterSpacing: '-0.01em' }}>Mon profil</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>Connectez-vous pour accéder à votre espace</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 16px calc(90px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ borderRadius: 'var(--sl-radius-4xl)', padding: '24px', textAlign: 'center', backgroundColor: 'var(--sl-card)', boxShadow: 'var(--sl-shadow)', border: '1px solid var(--sl-border)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--sl-radius-3xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', backgroundColor: 'var(--sl-green-dim)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 style={{ fontWeight: 900, fontSize: 22, fontFamily: "'Barlow Condensed', sans-serif", marginBottom: 8, color: 'var(--sl-t1)', letterSpacing: '-0.01em' }}>Rejoignez SportLink</h3>
            <p style={{ fontSize: 12, marginBottom: 20, lineHeight: 1.5, color: 'var(--sl-t2)' }}>
              Suivez vos clubs favoris, sauvegardez des événements et gérez votre page club.
            </p>
            <button
              onClick={onShowAuth}
              style={{
                width: '100%', padding: '14px', borderRadius: 'var(--sl-radius-3xl)', border: 'none', cursor: 'pointer',
                fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, letterSpacing: '0.03em',
                color: '#fff', backgroundColor: 'var(--sl-green)', boxShadow: 'var(--sl-green-glow)',
              }}
            >
              Se connecter / S'inscrire
            </button>
          </div>

          <ThemeToggle />
          <SimpleModeToggle />

          <div style={{ borderRadius: 'var(--sl-radius-4xl)', padding: 16, backgroundColor: 'var(--sl-card)', boxShadow: 'var(--sl-shadow)', border: '1px solid var(--sl-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <SportLinkLogo size={110} variant="full" />
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.5, textAlign: 'center', color: 'var(--sl-t2)', margin: 0 }}>
              Application communautaire pour trouver les clubs et événements sportifs près de chez vous.
            </p>
            <p style={{ fontSize: 12, marginTop: 8, textAlign: 'center', color: 'var(--sl-t3)' }}>Version {APP_VERSION}</p>
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
              style={{ width: 56, height: 56, borderRadius: 'var(--sl-radius-2xl)', objectFit: 'cover', flexShrink: 0, boxShadow: '0 0 0 2px rgba(34,217,106,0.5)' }}
            />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--sl-radius-2xl)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 20, fontFamily: 'var(--sl-font-ui)',
              backgroundColor: '#22d96a', color: '#fff',
              boxShadow: '0 0 0 2px rgba(34,217,106,0.4)',
            }}>
              {currentUser.name?.trim().split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#eef2ef', letterSpacing: '-0.02em', lineHeight: 1.2, fontFamily: 'var(--sl-font-ui)', margin: 0 }}>
                {currentUser.name}
              </h2>
              <motion.span
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.2 }}
                style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 'var(--sl-radius-full)', backgroundColor: `${levelInfo?.color ?? '#22d96a'}25`, color: levelInfo?.color ?? '#22d96a', border: `1px solid ${levelInfo?.color ?? '#22d96a'}50`, flexShrink: 0, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
              >
                {levelInfo?.icon ?? '⚡'} Niv.{levelInfo?.level ?? 1}
              </motion.span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(238,242,239,0.5)', margin: '3px 0 8px' }}>{currentUser.email}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--sl-radius-full)',
                backgroundColor: roleBadge.bg, color: roleBadge.color, flexShrink: 0,
              }}>
                {roleBadge.label}
              </span>

              {/* Plan badge */}
              {planId !== 'free' ? (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--sl-radius-full)',
                  backgroundColor: `${planInfo.color}20`, color: planInfo.color, flexShrink: 0,
                }}>
                  {planInfo.badge} {planInfo.name}
                </span>
              ) : canUpgrade && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 'var(--sl-radius-full)',
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
                {BADGE_ORDER.map((id: string, bi: number) => {
                  const def = BADGE_DEFS[id];
                  const isEarned = earnedBadges.includes(id);
                  return (
                    <motion.span
                      key={id}
                      title={def.name}
                      initial={isEarned ? { scale: 0, rotate: -12 } : { scale: 0.8, opacity: 0 }}
                      animate={isEarned ? { scale: 1, rotate: 0 } : { scale: 1, opacity: 0.38 }}
                      transition={isEarned
                        ? { type: 'spring', stiffness: 420, damping: 18, delay: bi * 0.04 }
                        : { delay: bi * 0.03, duration: 0.2 }
                      }
                      whileHover={isEarned ? { scale: 1.25, rotate: 5 } : {}}
                      style={{
                        width: 26, height: 26, borderRadius: 'var(--sl-radius-md)', fontSize: 13,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isEarned ? `${def.color}28` : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${isEarned ? def.color + '80' : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: isEarned ? `0 0 8px ${def.color}40` : 'none',
                        cursor: isEarned ? 'pointer' : 'default',
                        position: 'relative',
                      }}
                    >
                      {isEarned ? def.icon : <IconLock size={9} color="rgba(255,255,255,0.25)" />}
                    </motion.span>
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

      {/* ── Streak ── */}
      <StreakWidget />

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
          borderRadius: 'var(--sl-radius-3xl)', padding: '14px 10px',
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
              <div style={{ width: 44, height: 44, borderRadius: 'var(--sl-radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
                <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'var(--sl-font-ui)' }}>{value}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA si aucun événement créé */}
        {profileTab === 'profil' && eventCount === 0 && (
          <div style={{
            borderRadius: 'var(--sl-radius-3xl)', padding: '16px 16px',
            backgroundColor: 'var(--sl-card)', border: '1px dashed var(--sl-border)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center',
          }}>
            <IconStadium size={28} color="var(--sl-t3)" />
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', margin: 0 }}>Aucun événement ajouté</p>
            <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: 0, lineHeight: 1.4 }}>Créez votre premier événement sur la carte pour débloquer vos badges.</p>
            <button
              onClick={() => onNavigate?.('map')}
              style={{ marginTop: 6, padding: '9px 20px', borderRadius: 'var(--sl-radius-xl)', backgroundColor: 'var(--sl-green)', color: '#000', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
            >
              Voir la carte
            </button>
          </div>
        )}

        </> /* /PROFIL */}

        {/* ═══════════ ONGLET STATS ═══════════ */}
        {profileTab === 'stats' && <>

        {/* Stats joueur de football / sport */}
        {playerStats && (
          <div style={{ borderRadius: 'var(--sl-radius-3xl)', padding: 16, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 12, letterSpacing: '-0.01em' }}>
              ⚽ Statistiques de saison
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
              {[
                { label: 'Matchs joués', value: playerStats.matchesPlayed, icon: '🏟️' },
                { label: 'Buts',         value: playerStats.totalGoals,    icon: '⚽' },
                { label: 'Passes D.',    value: playerStats.totalAssists,  icon: '🅰️' },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 8px', borderRadius: 'var(--sl-radius-xl)', backgroundColor: 'var(--sl-surface)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 2 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--sl-t1)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)', marginTop: 2, letterSpacing: '0.04em' }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'Présences',   value: `${playerStats.matchesPlayed}/${playerStats.matchesTotal}`, icon: '✅' },
                { label: 'Carton J.',   value: playerStats.totalYellow, icon: '🟨' },
                { label: 'Carton R.',   value: playerStats.totalRed,    icon: '🟥' },
              ].map(s => (
                <div key={s.label} style={{ padding: '8px 6px', borderRadius: 'var(--sl-radius-lg)', backgroundColor: 'var(--sl-surface)', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, marginBottom: 1 }}>{s.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--sl-t1)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)', marginTop: 2, letterSpacing: '0.04em' }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* XP / Level card — version hype */}
        <div style={{
          borderRadius: 'var(--sl-radius-3xl)', padding: '16px',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(77,166,255,0.08) 100%)',
          border: '1px solid rgba(139,92,246,0.28)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Background deco */}
          <div aria-hidden="true" style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--sl-radius-xl)',
                background: 'linear-gradient(135deg, #8b5cf6, #4da6ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(139,92,246,0.4)',
              }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>⚡</span>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--sl-t1)', fontFamily: 'var(--sl-font-brand)', letterSpacing: '-0.01em' }}>
                  Niveau {levelInfo.level} · {levelInfo.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>
                  {levelInfo.nextLevel ? `Plus que ${levelInfo.nextLevel.minXp - xpTotal} XP pour le niveau suivant` : '🏆 Niveau maximum !'}
                </div>
              </div>
            </div>
            <div style={{
              padding: '4px 12px', borderRadius: 'var(--sl-radius-full)',
              background: 'linear-gradient(135deg, #8b5cf6, #4da6ff)',
              fontSize: 16, fontWeight: 900, color: '#fff',
              fontFamily: 'var(--sl-font-brand)',
              boxShadow: '0 0 12px rgba(139,92,246,0.4)',
            }}>
              {xpTotal} XP
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 'var(--sl-radius-xs)', backgroundColor: 'var(--sl-border)', overflow: 'hidden' }}>
            <div
              className="sl-xp-bar"
              style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
            />
          </div>
          {levelInfo.nextLevel && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--sl-t3)' }}>{levelInfo.minXp} XP</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#8b5cf6' }}>
                {levelInfo.nextLevel.minXp - xpTotal} XP manquant{(levelInfo.nextLevel.minXp - xpTotal) > 1 ? 's' : ''}
              </span>
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

        {/* Simple mode toggle */}
        <SimpleModeToggle />

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

        {/* Abonnement shortcut — club_admin uniquement */}
        {isClubAdmin && currentUser?.clubId && (
          <button
            type="button"
            onClick={() => { window.location.hash = `#subscription/${currentUser.clubId}`; }}
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--sl-card)', border: '1px solid rgba(139,92,246,0.25)', boxShadow: 'var(--sl-shadow)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(139,92,246,0.12)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold font-poppins" style={{ color: 'var(--sl-t1)' }}>Mon abonnement</div>
              <div className="text-xs" style={{ color: 'var(--sl-t2)' }}>
                {planId !== 'free' ? `Plan ${planInfo?.name ?? planId} actif` : 'Passer à un plan payant'}
              </div>
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
              <IconCar size={20} color="var(--sl-green)" />
              {rideNotifCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  minWidth: 18, height: 18, borderRadius: 'var(--sl-radius-full)', padding: '0 4px',
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

        {/* Mes convocations shortcut */}
        {onMyConvocations && (
          <button
            onClick={onMyConvocations}
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', boxShadow: 'var(--sl-shadow)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(99,102,241,0.12)', position: 'relative' }}>
              <IconClipboard size={20} color="#6366f1" />
              {convocationsPendingCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  minWidth: 18, height: 18, borderRadius: 'var(--sl-radius-full)', padding: '0 4px',
                  backgroundColor: '#f59e0b', color: '#fff',
                  fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {convocationsPendingCount > 9 ? '9+' : convocationsPendingCount}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold font-poppins" style={{ color: 'var(--sl-t1)' }}>Mes convocations</div>
              <div className="text-xs" style={{ color: 'var(--sl-t2)' }}>
                {convocationsPendingCount > 0 ? `${convocationsPendingCount} en attente` : 'Sélections et réponses'}
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}

        {/* Mon rôle */}
        {currentUser && <RoleSection jobRole={currentUser.jobRole} onSave={(role: string) => updateProfile({ jobRole: role })} />}

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
                    {favSports.map((sportId: string) => {
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
                  <p className="text-xs" style={{ color: 'var(--sl-t3)' }}>Aucun sport sélectionné — appuyez sur Modifier.</p>
                )}
              </motion.div>
            ) : (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-2">
                {Object.values(allSports).filter((s: any) => !s.isArchived).map((sport: any) => {
                  const on = selectedSports.has(sport.id);
                  return (
                    <button
                      key={sport.id}
                      onClick={() => setSelectedSports(prev => {
                        const next = new Set(prev);
                        if (on) { next.delete(sport.id); } else { next.add(sport.id); }
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
              {followedClubIds.map((clubId: string) => {
                const club = allClubs.find((c) => c.id === clubId);
                if (!club) return null;
                return (
                  <div key={clubId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 'var(--sl-radius-md)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: 'var(--sl-surface)', fontWeight: 700, fontSize: 11, color: 'var(--sl-t2)', fontFamily: 'var(--sl-font-ui)',
                    }}>
                      {club.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{club.city} · {club.sport}</div>
                    </div>
                    <button
                      onClick={() => unfollowClub(clubId)}
                      aria-label={`Ne plus suivre ${club.name}`}
                      style={{ padding: '4px 10px', borderRadius: 'var(--sl-radius-md)', border: '1px solid var(--sl-border-s)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', backgroundColor: 'transparent' }}
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
                Recevez les matchs du week-end par email
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

        {/* Changer le mot de passe */}
        {currentUser?.authProvider !== 'google' && (
          <button
            onClick={async () => {
              if (pwResetSent) return;
              try {
                await requestPasswordReset(currentUser.email);
                setPwResetSent(true);
                toast({ message: 'Email de réinitialisation envoyé !', type: 'success' });
                setTimeout(() => setPwResetSent(false), 30000);
              } catch {
                toast({ message: 'Erreur lors de l\'envoi. Réessayez.', type: 'error' });
              }
            }}
            className="w-full rounded-2xl p-4 flex items-center gap-3 transition-colors"
            style={{ backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', boxShadow: 'var(--sl-shadow)', opacity: pwResetSent ? 0.6 : 1 }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.12)' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold font-poppins" style={{ color: 'var(--sl-t1)' }}>
                {pwResetSent ? 'Email envoyé !' : 'Changer mon mot de passe'}
              </div>
              <div className="text-xs" style={{ color: 'var(--sl-t2)' }}>
                {pwResetSent ? 'Vérifiez votre boîte mail' : 'Recevoir un lien par email'}
              </div>
            </div>
          </button>
        )}

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

        {/* Confidentialité — toggle analytics */}
        {analyticsConsent !== null && (
          <div style={{ padding: '14px 16px', borderRadius: 'var(--sl-radius-3xl)', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', boxShadow: 'var(--sl-shadow)' }}>
            <p className="text-xs font-bold mb-3" style={{ color: 'var(--sl-t3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Confidentialité</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p className="text-sm font-semibold font-poppins" style={{ color: 'var(--sl-t1)', margin: 0 }}>Statistiques d'utilisation</p>
                <p className="text-xs" style={{ color: 'var(--sl-t2)', marginTop: 2 }}>Données anonymisées pour améliorer l'application</p>
              </div>
              <button
                onClick={() => analyticsConsent ? refuseAnalytics() : acceptAnalytics()}
                aria-pressed={!!analyticsConsent}
                aria-label={analyticsConsent ? 'Désactiver les statistiques d\'utilisation' : 'Activer les statistiques d\'utilisation'}
                style={{
                  width: 52, height: 36, borderRadius: 'var(--sl-radius-3xl)', border: 'none', cursor: 'pointer',
                  backgroundColor: analyticsConsent ? 'var(--sl-green)' : 'var(--sl-border)',
                  position: 'relative', flexShrink: 0, transition: 'background-color 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 7, left: analyticsConsent ? 23 : 7,
                  width: 22, height: 22, borderRadius: '50%', backgroundColor: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          </div>
        )}

        {/* Export données RGPD (art. 20) */}
        {currentUser && <RgpdExportButton userId={currentUser.id} userEmail={currentUser.email ?? ''} />}

        {/* Zone dangereuse — suppression de compte */}
        <div style={{ marginTop: 8, padding: '14px', borderRadius: 'var(--sl-radius-3xl)', border: '1px solid rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.04)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#ef4444', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Zone dangereuse</p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-xs font-semibold"
            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            Supprimer mon compte
          </button>
        </div>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', paddingTop: 4 }}>
          {[['mentions', 'Mentions légales'], ['privacy', 'Confidentialité'], ['cgu', 'CGU']].map(([section, label]) => (
            <button
              key={section}
              onClick={() => onShowLegal?.(section)}
              style={{ fontSize: 11, color: 'var(--sl-t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textDecorationColor: 'var(--sl-border)', textUnderlineOffset: 3 }}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-center pt-1" style={{ color: 'var(--sl-t3)' }}>{APP_NAME} v{APP_VERSION}</p>

        </> /* /PARAMÈTRES */}

      </div>

      {/* Modal suppression de compte */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: Z.profilDrawer, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            onClick={(e: React.MouseEvent) => e.target === e.currentTarget && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              style={{ width: '100%', maxWidth: 480, backgroundColor: 'var(--sl-card)', borderRadius: '22px 22px 0 0', border: '1px solid var(--sl-border)', borderBottom: 'none', padding: '24px 20px 32px' }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <IconAlertTriangle size={40} color="#ef4444" style={{ marginBottom: 8 }} />
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#ef4444', margin: '0 0 8px' }}>Supprimer mon compte</h2>
                <p style={{ fontSize: 13, color: 'var(--sl-t2)', lineHeight: 1.6, margin: 0 }}>
                  Cette action est <strong>irréversible</strong>. Toutes vos données seront supprimées : profil, favoris, événements, covoiturages.
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t3)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Tapez <strong style={{ color: '#ef4444' }}>SUPPRIMER</strong> pour confirmer
                </label>
                <input
                  value={deleteConfirm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeleteConfirm(e.target.value)}
                  placeholder="SUPPRIMER"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 'var(--sl-radius-xl)', fontSize: 14, border: `1.5px solid ${deleteConfirm === 'SUPPRIMER' ? '#ef4444' : 'var(--sl-border)'}`, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', fontFamily: 'var(--sl-font-ui)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                  style={{ flex: 1, padding: '13px', borderRadius: 'var(--sl-radius-2xl)', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  disabled={deleteConfirm !== 'SUPPRIMER' || deleteLoading}
                  onClick={async () => {
                    setDeleteLoading(true);
                    try {
                      // Suppression via Supabase Auth (l'utilisateur supprime son propre compte)
                      const { error } = await import('../lib/supabase.js')
                        .then(({ supabase }) => supabase.rpc('delete_own_account'));
                      if (error) throw error;
                      logout();
                      toast({ message: 'Compte supprimé. À bientôt.', type: 'info' });
                    } catch {
                      // Fallback : déconnexion et notification admin
                      toast({ message: 'Contactez le support pour supprimer votre compte.', type: 'error' });
                    } finally {
                      setDeleteLoading(false);
                      setShowDeleteModal(false);
                      setDeleteConfirm('');
                    }
                  }}
                  style={{
                    flex: 1, padding: '13px', borderRadius: 'var(--sl-radius-2xl)', border: 'none',
                    backgroundColor: deleteConfirm === 'SUPPRIMER' && !deleteLoading ? '#ef4444' : 'var(--sl-surface)',
                    color: deleteConfirm === 'SUPPRIMER' && !deleteLoading ? '#fff' : 'var(--sl-t3)',
                    fontSize: 14, fontWeight: 700, cursor: deleteConfirm === 'SUPPRIMER' ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                  }}
                >
                  {deleteLoading ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
