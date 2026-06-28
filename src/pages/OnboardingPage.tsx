import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { supabase } from '../lib/supabase.js';
import SportIcon from '../components/SportIcon.jsx';
import CityAutocomplete from '../components/CityAutocomplete.jsx';
import OnboardingRoleStep from '../components/OnboardingRoleStep.jsx';
import OnboardingFirstSteps from '../components/OnboardingFirstSteps.jsx';

const SPORT_EMOJIS: Record<string, string> = {
  Football: '⚽', Rugby: '🏉', Basketball: '🏀', Handball: '🤾',
  Volleyball: '🏐', Tennis: '🎾', Trail: '🏃', Natation: '🏊',
  Cyclisme: '🚴', Athlétisme: '🏃', Judo: '🥋', Badminton: '🏸',
  Hockey: '🏑', Baseball: '⚾', Golf: '⛳',
};

interface AppearanceStepProps { onNext: () => void; }
function AppearanceStep({ onNext }: AppearanceStepProps) {
  const { theme, setTheme } = useTheme();
  const [simple, setSimple] = useState(() =>
    document.documentElement.getAttribute('data-simple-mode') === 'true'
  );

  function toggleSimple() {
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
    <div className="flex flex-col flex-1">
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(['dark', 'light'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all"
            style={{
              backgroundColor: theme === t ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
              borderColor: theme === t ? '#22c55e' : 'rgba(255,255,255,0.1)',
            }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: theme === t ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)' }}>
              {t === 'dark' ? '🌙' : '☀️'}
            </div>
            <div className="text-center">
              <div className="text-sm font-bold" style={{ color: theme === t ? 'white' : '#64748b' }}>
                {t === 'dark' ? 'Mode sombre' : 'Mode clair'}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                {t === 'dark' ? 'Confortable la nuit' : 'Lumineux et lisible'}
              </div>
            </div>
            {theme === t && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#22c55e' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={toggleSimple}
        className="flex items-center gap-4 p-4 rounded-2xl border-2 mb-auto transition-all w-full"
        style={{
          backgroundColor: simple ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
          borderColor: simple ? '#22c55e' : 'rgba(255,255,255,0.1)',
          cursor: 'pointer',
        }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: simple ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)' }}>
          🔤
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-bold text-white">Vue simplifiée</div>
          <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>Texte plus grand, boutons plus gros</div>
        </div>
        <div className="w-11 h-6 rounded-full relative flex-shrink-0 transition-colors"
          style={{ backgroundColor: simple ? '#22c55e' : 'rgba(255,255,255,0.15)' }}>
          <div className="absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all"
            style={{ left: simple ? '22px' : '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
          />
        </div>
      </button>

      <div className="mt-6 space-y-3">
        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl font-bold font-poppins text-sm text-white"
          style={{ backgroundColor: '#22C55E', boxShadow: '0 4px 20px rgba(34,197,94,0.35)' }}
        >
          Suivant →
        </button>
        <button
          onClick={onNext}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'center', cursor: 'pointer', color: '#334155', fontSize: 12 }}
        >
          Passer cette étape
        </button>
      </div>
    </div>
  );
}

interface ClubSuggestionsStepProps {
  sports: string[];
  selectedCity: Record<string, any> | null;
  onFinish: () => void;
  onBack: () => void;
}
function ClubSuggestionsStep({ sports, selectedCity: initialCity, onFinish, onBack }: ClubSuggestionsStepProps) {
  const { followClub } = useAuth() as any;
  const [clubs, setClubs] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [resolvedCity, setResolvedCity] = useState<string | null>(initialCity?.nom ?? null);
  const [detectingGps, setDetectingGps] = useState(false);

  async function detectGps() {
    if (!navigator.geolocation) return;
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://geo.api.gouv.fr/communes?lat=${coords.latitude}&lon=${coords.longitude}&fields=nom&limit=1`
          );
          const data = await res.json();
          if (data[0]?.nom) setResolvedCity(data[0].nom);
        } catch { /* silently ignore */ }
        setDetectingGps(false);
      },
      () => setDetectingGps(false)
    );
  }

  useEffect(() => {
    let query = supabase
      .from('clubs')
      .select('id, name, sport, city, logo_url');

    if (sports.length > 0) {
      query = query.in('sport', sports);
    }

    query
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }: { data: Record<string, any>[] | null }) => {
        let all = data ?? [];

        if (resolvedCity) {
          const cityLow = resolvedCity.toLowerCase();
          all = [...all].sort((a, b) => {
            const aLocal = a.city?.toLowerCase().includes(cityLow) ? 0 : 1;
            const bLocal = b.city?.toLowerCase().includes(cityLow) ? 0 : 1;
            return aLocal - bLocal;
          });
        }

        setClubs(all.slice(0, 8));
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedCity]);

  async function handleFollow(clubId: string) {
    if (busy === clubId) return;
    setBusy(clubId);
    try {
      if (followed.has(clubId)) {
        setFollowed(prev => { const n = new Set(prev); n.delete(clubId); return n; });
      } else {
        await followClub(clubId, { teams: 'all', notif: { match: true, news: true } });
        setFollowed(prev => new Set(prev).add(clubId));
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        onClick={onBack}
        style={{
          alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 24,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour
      </button>

      <div className="mb-6 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <span className="text-3xl">🏟️</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="text-2xl font-bold text-white font-poppins mb-2"
        >
          Trouvez votre club
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-sm font-medium"
          style={{ color: '#64748b' }}
        >
          Suivez un club pour voir ses matchs et annonces.
        </motion.p>
      </div>

      {!resolvedCity && !loading && (
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={detectGps}
          disabled={detectingGps}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)',
            backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
            fontSize: 13, fontWeight: 600, cursor: detectingGps ? 'wait' : 'pointer',
            marginBottom: 16, opacity: detectingGps ? 0.6 : 1,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {detectingGps ? 'Localisation en cours…' : 'Détecter ma position'}
        </motion.button>
      )}

      {resolvedCity && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 999,
            backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#22C55E' }}>{resolvedCity}</span>
          </div>
          <button
            onClick={() => setResolvedCity(null)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 11 }}
          >
            Effacer
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl animate-pulse"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">🔍</span>
            <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
              Aucun club disponible pour ces sports.<br />
              Vous pourrez en rejoindre depuis l'onglet Clubs.
            </p>
          </div>
        ) : (() => {
          const cityLow = resolvedCity?.toLowerCase();
          const nearby = cityLow
            ? clubs.filter(c => c.city?.toLowerCase().includes(cityLow))
            : [];
          const others = cityLow
            ? clubs.filter(c => !c.city?.toLowerCase().includes(cityLow))
            : clubs;

          let globalIdx = 0;

          function renderClub(club: Record<string, any>) {
            const i = globalIdx++;
            const isFollowed = followed.has(club.id);
            const isBusy = busy === club.id;
            const emoji = SPORT_EMOJIS[club.sport] ?? '🏅';
            return (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 + i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-2xl border transition-colors"
                style={{
                  backgroundColor: isFollowed ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.05)',
                  borderColor: isFollowed ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.09)',
                }}
              >
                {club.logo_url ? (
                  <img src={club.logo_url} alt={club.name}
                    className="w-11 h-11 rounded-xl object-contain flex-shrink-0"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: 4 }} />
                ) : (
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', fontSize: 20 }}>
                    {emoji}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate leading-tight">{club.name}</p>
                  <p className="text-xs truncate" style={{ color: '#64748b' }}>
                    {emoji} {club.sport}{club.city ? ` · ${club.city}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleFollow(club.id)}
                  disabled={isBusy}
                  aria-label={isFollowed ? `Ne plus suivre ${club.name}` : `Suivre ${club.name}`}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    backgroundColor: isFollowed ? '#22C55E' : 'rgba(255,255,255,0.1)',
                    color: isFollowed ? 'white' : 'rgba(255,255,255,0.7)',
                    opacity: isBusy ? 0.6 : 1,
                  }}
                >
                  {isFollowed ? (
                    <>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Suivi
                    </>
                  ) : (isBusy ? '…' : '+ Suivre')}
                </button>
              </motion.div>
            );
          }

          return (
            <div className="space-y-2.5">
              {nearby.length > 0 && (
                <>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#22C55E', marginBottom: 8 }}>
                    📍 Près de {resolvedCity}
                  </p>
                  {nearby.map(renderClub)}
                </>
              )}

              {others.length > 0 && (
                <>
                  {nearby.length > 0 && (
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginTop: 16, marginBottom: 8 }}>
                      Autres clubs
                    </p>
                  )}
                  {others.map(renderClub)}
                </>
              )}
            </div>
          );
        })()}
      </div>

      <div className="mt-6 space-y-3">
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          onClick={onFinish}
          className="w-full py-4 rounded-2xl font-bold font-poppins text-sm text-white transition-all"
          style={{
            backgroundColor: '#22C55E',
            boxShadow: followed.size > 0 ? '0 4px 20px rgba(34,197,94,0.35)' : 'none',
          }}
        >
          {followed.size > 0
            ? `Commencer sur SportLink →`
            : 'Passer cette étape'}
        </motion.button>
        {followed.size === 0 && (
          <p className="text-center text-xs" style={{ color: '#334155' }}>
            Tu pourras suivre des clubs depuis l'annuaire
          </p>
        )}
      </div>
    </>
  );
}

interface OnboardingPageProps { onDone: (sports: string[]) => void; }

export default function OnboardingPage({ onDone }: OnboardingPageProps) {
  const { currentUser, updateProfile } = useAuth() as any;
  const { allSports: SPORTS } = useSports() as any;
  const [step, setStep] = useState(1);
  const [jobRole, setJobRole] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cityInput, setCityInput] = useState('');
  const [selectedCity, setSelectedCity] = useState<Record<string, any> | null>(null);
  const [showFirstSteps, setShowFirstSteps] = useState(false);

  function toggle(sportId: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(sportId) ? next.delete(sportId) : next.add(sportId);
      return next;
    });
  }

  function handleFinish() {
    if (currentUser?.id) {
      localStorage.setItem(`sl_onboarded_${currentUser.id}`, '1');
      if (selectedCity) {
        localStorage.setItem(`sl_city_${currentUser.id}`, JSON.stringify(selectedCity));
      }
    }
    const profilePatch: Record<string, any> = { favoriteSports: [...selected], onboardingDone: true, jobRole: jobRole ?? undefined };
    if (selectedCity) profilePatch.homeCity = selectedCity;
    updateProfile(profilePatch);
    setShowFirstSteps(true);
  }

  function handleFirstStepsDone(tab: string | null) {
    onDone([...selected]);
    if (tab) setTimeout(() => window.dispatchEvent(new CustomEvent('sl-navigate', { detail: tab })), 50);
  }

  const firstName = currentUser?.name?.split(' ')[0] ?? '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0F1E3A 0%, #1a3460 100%)' }}
    >
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 20, flexShrink: 0 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} style={{
            width: step === s ? 18 : 6, height: 6, borderRadius: 3,
            backgroundColor: step === s ? '#22C55E' : s < step ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.2)',
            transition: 'all 0.25s',
          }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1 overflow-y-auto px-5 pt-8 min-h-0"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <OnboardingRoleStep
              value={jobRole}
              onChange={setJobRole}
              onNext={() => {
                const clubRoles = ['president', 'coach', 'communicant'];
                if (jobRole && clubRoles.includes(jobRole)) {
                  setStep(4);
                } else {
                  setStep(2);
                }
              }}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1 overflow-y-auto px-5 pt-8 min-h-0"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="mb-8 text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
              >
                <span className="text-3xl">🏆</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="text-2xl font-bold text-white font-poppins mb-2"
              >
                {firstName ? `Bienvenue, ${firstName} !` : 'Bienvenue !'}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-sm font-medium"
                style={{ color: '#64748b' }}
              >
                Quels sports t'intéressent ?
              </motion.p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-8">
              {Object.values(SPORTS).map((sport: any, i: number) => {
                const on = selected.has(sport.id);
                return (
                  <motion.button
                    key={sport.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggle(sport.id)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-colors text-left"
                    style={{
                      backgroundColor: on ? `${sport.color}18` : 'rgba(255,255,255,0.05)',
                      borderColor: on ? sport.color : 'rgba(255,255,255,0.09)',
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ backgroundColor: on ? `${sport.color}30` : 'rgba(255,255,255,0.07)' }}
                    >
                      <SportIcon sport={sport.id} size={19} color={on ? sport.color : '#475569'} />
                    </div>
                    <span
                      className="text-sm font-semibold font-poppins flex-1 leading-tight"
                      style={{ color: on ? 'white' : '#64748b' }}
                    >
                      {sport.label}
                    </span>
                    {on && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: sport.color }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-auto space-y-3">
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                onClick={() => setStep(3)}
                className="w-full py-4 rounded-2xl font-bold font-poppins text-sm text-white transition-all"
                style={{
                  backgroundColor: '#22C55E',
                  boxShadow: selected.size > 0 ? '0 4px 20px rgba(34,197,94,0.35)' : 'none',
                }}
              >
                {selected.size > 0
                  ? `Continuer avec ${selected.size} sport${selected.size > 1 ? 's' : ''}`
                  : 'Passer cette étape'}
              </motion.button>
              {selected.size === 0 && (
                <p className="text-center text-xs" style={{ color: '#334155' }}>
                  Vous pourrez modifier vos préférences depuis votre profil
                </p>
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1 overflow-y-auto px-5 pt-8 min-h-0"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              onClick={() => setStep(2)}
              style={{
                alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 32,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Retour
            </button>

            <div className="mb-8 text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
              >
                <span className="text-3xl">📍</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="text-2xl font-bold text-white font-poppins mb-2"
              >
                Dans quelle ville êtes-vous ?
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="text-sm font-medium"
                style={{ color: '#64748b' }}
              >
                Pour centrer la carte près de chez vous
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="mb-4"
            >
              <CityAutocomplete
                value={cityInput}
                onChange={setCityInput}
                onSelect={setSelectedCity}
                placeholder="ex. Paris, Lyon, Nantes…"
                inputClassName="w-full rounded-xl px-3 py-3 text-sm focus:outline-none transition-colors"
                inputStyle={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              />
            </motion.div>

            {selectedCity && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 12,
                  backgroundColor: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  marginBottom: 8,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#22C55E' }}>
                  {selectedCity.nom}
                </span>
              </motion.div>
            )}

            <div className="mt-auto space-y-3">
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                onClick={() => setStep(4)}
                className="w-full py-4 rounded-2xl font-bold font-poppins text-sm text-white transition-all"
                style={{
                  backgroundColor: '#22C55E',
                  boxShadow: selectedCity ? '0 4px 20px rgba(34,197,94,0.35)' : 'none',
                }}
              >
                Suivant →
              </motion.button>
              <button
                onClick={() => setStep(4)}
                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'center', cursor: 'pointer', color: '#334155', fontSize: 12 }}
              >
                Passer cette étape
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Étape 4 — Préférences d'affichage ────────────────────────────── */}
        {step === 4 && (
          <motion.div
            key="step-appearance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1 overflow-y-auto px-5 pt-8 min-h-0"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              onClick={() => setStep(3)}
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 32 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Retour
            </button>

            <div className="mb-8 text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
              >
                <span className="text-3xl">🎨</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="text-2xl font-bold text-white font-poppins mb-2"
              >
                Comment préférez-vous utiliser l'application ?
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="text-sm font-medium"
                style={{ color: '#64748b' }}
              >
                Vous pourrez changer ça à tout moment dans votre profil.
              </motion.p>
            </div>

            <AppearanceStep onNext={() => setStep(5)} />
          </motion.div>
        )}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1 px-5 pt-8 min-h-0"
            style={{ overflow: 'hidden', paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <ClubSuggestionsStep
              sports={[...selected]}
              selectedCity={selectedCity}
              onFinish={handleFinish}
              onBack={() => setStep(4)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFirstSteps && (
          <OnboardingFirstSteps
            jobRole={jobRole}
            onNavigate={(tab: string) => { setShowFirstSteps(false); handleFirstStepsDone(tab); }}
            onClose={() => { setShowFirstSteps(false); handleFirstStepsDone(null); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
