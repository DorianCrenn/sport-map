import { useState } from 'react';
import { motion } from 'framer-motion';
import { SPORTS } from '../data/events.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import SportIcon from '../components/SportIcon.jsx';

export default function OnboardingPage({ onDone }) {
  const { currentUser, updateProfile } = useAuth();
  const [selected, setSelected] = useState(new Set());

  function toggle(sportId) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(sportId) ? next.delete(sportId) : next.add(sportId);
      return next;
    });
  }

  function handleDone() {
    updateProfile({ favoriteSports: [...selected], onboardingDone: true });
    onDone();
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

      <div className="flex flex-col flex-1 overflow-y-auto px-5 pt-12 pb-8 min-h-0">
        {/* Header */}
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
            Quels sports vous intéressent ?
          </motion.p>
        </div>

        {/* Sports grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-8">
          {Object.values(SPORTS).map((sport, i) => {
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

        {/* CTA */}
        <div className="mt-auto space-y-3">
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            onClick={handleDone}
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
      </div>
    </motion.div>
  );
}
