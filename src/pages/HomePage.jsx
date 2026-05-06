import { motion } from 'framer-motion';
import SportLinkLogo from '../components/SportLinkLogo.jsx';

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    label: 'TROUVER',
    labelSuffix: ' un club',
    desc: 'Cherche parmi des dizaines de clubs près de chez toi.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    label: 'PARTICIPER',
    labelSuffix: ' à des événements',
    desc: 'Ne manque aucun événement sportif local.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    label: 'VIVRE',
    labelSuffix: ' ta passion',
    desc: 'Rejoins une communauté de passionnés.',
  },
];

const BENEFITS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Sécurisé & fiable',
    desc: 'Vos données sont protégées et votre vie privée respectée.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Communauté locale',
    desc: 'Connecte-toi avec les clubs et sportifs de ta région.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Simple & rapide',
    desc: 'Tout le sport près de toi en quelques clics.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: '100% passion',
    desc: 'Conçu par des passionnés pour des passionnés.',
  },
];

export default function HomePage({ onNavigate }) {
  return (
    <div className="h-full flex flex-col overflow-y-auto bg-white">

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 pt-5 pb-2">
        <SportLinkLogo size={36} />
        <span className="text-xl font-extrabold font-poppins tracking-tight" style={{ color: '#0F1E3A' }}>
          SPORT<span style={{ color: '#22C55E' }}>LINK</span>
        </span>
      </div>

      {/* ── Hero ── */}
      <div className="flex-shrink-0 px-5 pt-4 pb-6 relative overflow-hidden">

        {/* Green blob decoration */}
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
        <div className="absolute right-4 bottom-0 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)' }} />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4 border"
          style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="text-xs font-semibold font-poppins" style={{ color: '#16a34a' }}>La plateforme sportive locale</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="text-4xl font-extrabold leading-tight mb-3 font-poppins"
          style={{ color: '#0F1E3A' }}
        >
          Le sport<br />
          près de <span style={{ color: '#22C55E' }}>toi</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4 }}
          className="text-sm leading-relaxed mb-6"
          style={{ color: '#64748b' }}
        >
          SportLink te permet de trouver des clubs, des événements et des actualités sportives autour de toi.
        </motion.p>

        {/* Features list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-3 mb-7"
        >
          {FEATURES.map(({ icon, label, labelSuffix, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#F0FDF4' }}>
                {icon}
              </div>
              <div>
                <div className="text-sm font-poppins">
                  <span className="font-bold" style={{ color: '#0F1E3A' }}>{label}</span>
                  <span className="font-medium" style={{ color: '#0F1E3A' }}>{labelSuffix}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{desc}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          className="flex flex-col gap-3"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('map')}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm text-white font-poppins"
            style={{ backgroundColor: '#22C55E' }}
          >
            Découvrir la carte
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('clubs')}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm font-poppins border-2"
            style={{ borderColor: '#e2e8f0', color: '#0F1E3A' }}
          >
            Explorer les clubs
          </motion.button>
        </motion.div>
      </div>

      {/* ── Benefits grid ── */}
      <div className="flex-shrink-0 px-4 pb-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="grid grid-cols-2 gap-3 pt-5">
          {BENEFITS.map(({ icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.07 }}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="mb-2">{icon}</div>
              <div className="text-sm font-bold font-poppins mb-1" style={{ color: '#0F1E3A' }}>{title}</div>
              <div className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{desc}</div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
