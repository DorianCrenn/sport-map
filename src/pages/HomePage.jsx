import { motion } from 'framer-motion';
import SportLinkLogo from '../components/SportLinkLogo.jsx';

const BENEFITS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    color: '#3B82F6',
    bg: '#EFF6FF',
    title: 'Trouver un club',
    desc: 'Accédez à tous les clubs sportifs du Finistère, leurs horaires et contacts.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    color: '#22C55E',
    bg: '#F0FDF4',
    title: 'Participer à des événements',
    desc: 'Matchs, trails, tournois — découvrez l\'agenda sportif près de chez vous.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    color: '#8B5CF6',
    bg: '#F5F3FF',
    title: 'Rejoindre une communauté',
    desc: 'Connectez-vous avec des sportifs locaux et suivez vos équipes favorites.',
  },
];

const STATS = [
  { value: '18', label: 'Clubs' },
  { value: '40+', label: 'Événements' },
  { value: '7', label: 'Sports' },
  { value: '29', label: 'Finistère' },
];

export default function HomePage({ onNavigate }) {
  return (
    <div className="h-full flex flex-col overflow-y-auto bg-[#F1F5F9]">

      {/* ── Hero ── */}
      <div
        className="flex-shrink-0 px-6 pt-12 pb-10 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0F1E3A 0%, #1a3460 100%)' }}
      >
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5"
          style={{ background: '#22C55E', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5"
          style={{ background: '#3B82F6', transform: 'translate(-30%, 30%)' }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Logo */}
          <div className="mb-6">
            <SportLinkLogo size={72} variant="icon" />
            <div className="text-xs mt-2 font-medium" style={{ color: '#22C55E' }}>Le sport près de toi</div>
          </div>

          <h1 className="text-3xl font-extrabold leading-tight mb-3 font-poppins">
            Votre sport,<br/>
            <span style={{ color: '#22C55E' }}>votre territoire.</span>
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-8 max-w-xs">
            Clubs locaux, événements sportifs et communauté — tout le sport du Finistère en un seul endroit.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('map')}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(90deg, #22C55E, #16a34a)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                <line x1="9" y1="3" x2="9" y2="18"/>
                <line x1="15" y1="6" x2="15" y2="21"/>
              </svg>
              Découvrir la carte
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('clubs')}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm border"
              style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'white', background: 'rgba(255,255,255,0.08)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Explorer les clubs
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* ── Stats strip ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-4">
        <div className="grid grid-cols-4 gap-2">
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="text-center"
            >
              <div className="text-xl font-bold font-poppins" style={{ color: '#0F1E3A' }}>{value}</div>
              <div className="text-[10px] text-gray-400 font-medium">{label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Benefits ── */}
      <div className="flex-shrink-0 px-4 pt-6 pb-2">
        <h2 className="text-base font-bold mb-4 font-poppins" style={{ color: '#0F1E3A' }}>
          Pourquoi SportLink ?
        </h2>
        <div className="space-y-3">
          {BENEFITS.map(({ icon, color, bg, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.08 }}
              className="bg-white rounded-2xl p-4 flex items-start gap-4 shadow-sm border border-gray-100"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg, color }}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm mb-0.5 font-poppins" style={{ color: '#0F1E3A' }}>{title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Actu teaser ── */}
      <div className="px-4 pt-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold font-poppins" style={{ color: '#0F1E3A' }}>Dernières actus</h2>
          <button
            onClick={() => onNavigate('news')}
            className="text-xs font-semibold flex items-center gap-1"
            style={{ color: '#22C55E' }}
          >
            Tout voir
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#16a34a' }}>Football</span>
            <span className="text-[10px] text-gray-400">Il y a 2h</span>
          </div>
          <p className="text-sm font-semibold leading-snug" style={{ color: '#0F1E3A' }}>
            Division Honneur : l'US Brest en route vers le titre
          </p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
            Avec 54 points après 28 journées, les Brestois semblent bien partis pour décrocher le titre de champion de Division Honneur Bretagne.
          </p>
        </div>
      </div>
    </div>
  );
}
