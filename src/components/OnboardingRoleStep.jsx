import { motion } from 'framer-motion';

const ROLES = [
  {
    id: 'president',
    label: 'Président / Responsable',
    sublabel: 'Je dirige un club',
    emoji: '🏛️',
    color: '#f59e0b',
  },
  {
    id: 'coach',
    label: 'Coach / Éducateur',
    sublabel: "J'entraîne une équipe",
    emoji: '🎽',
    color: '#3b82f6',
  },
  {
    id: 'communicant',
    label: 'Communication',
    sublabel: 'Je gère les réseaux / annonces',
    emoji: '📸',
    color: '#a855f7',
  },
  {
    id: 'parent',
    label: 'Parent',
    sublabel: "Je suis parent d'un joueur",
    emoji: '👨‍👩‍👦',
    color: '#22d96a',
  },
  {
    id: 'joueur',
    label: 'Joueur / Joueuse',
    sublabel: 'Je pratique un sport',
    emoji: '⚽',
    color: '#ef4444',
  },
  {
    id: 'supporter',
    label: 'Supporter',
    sublabel: 'Je suis des clubs et des matchs',
    emoji: '📣',
    color: '#f97316',
  },
];

export default function OnboardingRoleStep({ value, onChange, onNext }) {
  return (
    <>
      {/* Header */}
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <span className="text-3xl">🙋</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="text-2xl font-bold text-white font-poppins mb-2"
        >
          Quel est votre rôle ?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-sm font-medium"
          style={{ color: '#64748b' }}
        >
          Pour personnaliser votre expérience SportLink
        </motion.p>
      </div>

      {/* Rôles */}
      <div className="grid grid-cols-2 gap-2.5 mb-8">
        {ROLES.map((role, i) => {
          const on = value === role.id;
          return (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(role.id)}
              className="flex flex-col items-start gap-1.5 px-3.5 py-3 rounded-2xl border-2 transition-colors text-left"
              style={{
                backgroundColor: on ? `${role.color}18` : 'rgba(255,255,255,0.05)',
                borderColor: on ? role.color : 'rgba(255,255,255,0.09)',
              }}
            >
              <span style={{ fontSize: 22 }}>{role.emoji}</span>
              <span className="text-xs font-bold leading-tight" style={{ color: on ? 'white' : '#94a3b8' }}>
                {role.label}
              </span>
              <span style={{ fontSize: 10, color: on ? 'rgba(255,255,255,0.6)' : '#475569', lineHeight: 1.3 }}>
                {role.sublabel}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-auto space-y-3">
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          onClick={onNext}
          className="w-full py-4 rounded-2xl font-bold font-poppins text-sm text-white transition-all"
          style={{
            backgroundColor: '#22C55E',
            boxShadow: value ? '0 4px 20px rgba(34,197,94,0.35)' : 'none',
          }}
        >
          {value ? 'Continuer →' : 'Passer cette étape'}
        </motion.button>
        {!value && (
          <p className="text-center text-xs" style={{ color: '#334155' }}>
            Vous pourrez modifier votre rôle depuis votre profil
          </p>
        )}
      </div>
    </>
  );
}
