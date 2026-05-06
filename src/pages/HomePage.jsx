import { motion } from 'framer-motion';
import SportLinkLogo from '../components/SportLinkLogo.jsx';

// ── Floating background sport icons ──────────────────────────────────────────
const BG_ICONS = [
  { x: '-4%',  y: '8%',   size: 110, rotate: -15, opacity: 0.055, icon: 'football' },
  { x: '18%',  y: '2%',   size: 80,  rotate: 20,  opacity: 0.04,  icon: 'running'  },
  { x: '5%',   y: '52%',  size: 95,  rotate: 10,  opacity: 0.05,  icon: 'cycling'  },
  { x: '75%',  y: '5%',   size: 70,  rotate: -8,  opacity: 0.045, icon: 'handball' },
  { x: '60%',  y: '60%',  size: 100, rotate: 25,  opacity: 0.04,  icon: 'trail'    },
  { x: '82%',  y: '42%',  size: 75,  rotate: -20, opacity: 0.05,  icon: 'basket'   },
];

const SPORT_PATHS = {
  football: (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M12 7l4 2.5v5l-4 2.5-4-2.5v-5z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
      <path d="M12 7V3M16 9.5l3.5-2M16 14.5l3.5 2M12 17v4M8 14.5l-3.5 2M8 9.5l-3.5-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </>
  ),
  running: (
    <>
      <circle cx="15" cy="4" r="2" fill="currentColor"/>
      <path d="M14 6.5l-2 5.5M12 12l2.5 5M12 12l-3 5.5M13 9l3-2.5M13 9l-2.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M3 9h5M3 12h4M3 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </>
  ),
  cycling: (
    <>
      <circle cx="6" cy="15" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="18" cy="15" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M6 15l5-8h3l2 4h2M11 7l2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="14" cy="5" r="1.5" fill="currentColor"/>
    </>
  ),
  handball: (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M8 8l8 8M8 16l8-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    </>
  ),
  trail: (
    <>
      <path d="M2 20h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 20L9 7l5 8 3-5 5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </>
  ),
  basket: (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M12 3C12 3 8 7 8 12s4 9 4 9" stroke="currentColor" strokeWidth="1.3" fill="none"/>
      <path d="M12 3c0 0 4 4 4 9s-4 9-4 9" stroke="currentColor" strokeWidth="1.3" fill="none"/>
      <path d="M3 12h18" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    </>
  ),
};

// ── Phone mockup ──────────────────────────────────────────────────────────────
function PhoneMockup() {
  const markers = [
    { x: 80,  y: 85,  color: '#22C55E' },
    { x: 125, y: 65,  color: '#f97316' },
    { x: 52,  y: 120, color: '#3B82F6' },
    { x: 148, y: 108, color: '#22C55E' },
    { x: 100, y: 145, color: '#8b5cf6' },
  ];
  const clusters = [
    { x: 55,  y: 58,  count: 4 },
    { x: 160, y: 135, count: 7 },
    { x: 32,  y: 152, count: 3 },
  ];

  return (
    <div style={{
      width: 185, flexShrink: 0,
      borderRadius: 32,
      border: '4px solid #0F1E3A',
      backgroundColor: 'white',
      overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(15,30,58,0.32), 0 8px 20px rgba(15,30,58,0.14)',
    }}>
      {/* Status bar */}
      <div style={{ backgroundColor: '#0F1E3A', padding: '9px 12px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'white', fontSize: 8, fontWeight: 700, fontFamily: 'Poppins,sans-serif' }}>9:41</span>
        <div style={{ width: 32, height: 6, backgroundColor: '#1e3a5f', borderRadius: 3 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ display: 'flex', gap: '1.5px', alignItems: 'flex-end' }}>
            {[3,5,7,9].map((h,i) => <div key={i} style={{ width: 2.5, height: h, backgroundColor: 'white', borderRadius: 1 }} />)}
          </div>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="white" stroke="none"><rect x="1" y="6" width="15" height="12" rx="2"/><path d="M23 13V11a2 2 0 0 0-2-2h-1"/></svg>
        </div>
      </div>

      {/* App header */}
      <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#0F1E3A', fontFamily: 'Poppins,sans-serif' }}>Carte</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/></svg>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 5, padding: '6px 10px', borderBottom: '1px solid #f8fafc' }}>
        <span style={{ fontSize: 8, backgroundColor: '#22C55E', color: 'white', borderRadius: 20, padding: '2px 9px', fontWeight: 700 }}>Tous</span>
        <span style={{ fontSize: 8, backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: 20, padding: '2px 9px', fontWeight: 600 }}>Football</span>
        <span style={{ fontSize: 8, backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: 20, padding: '2px 9px', fontWeight: 600 }}>Trail</span>
      </div>

      {/* Map */}
      <div style={{ position: 'relative', height: 230, overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox="0 0 185 230" style={{ position: 'absolute', inset: 0 }}>
          <rect width="185" height="230" fill="#e8f0f8"/>
          <path d="M0 145 Q35 122 75 138 Q110 152 148 130 Q168 120 185 128 L185 230 L0 230Z" fill="#b8d4e8" opacity="0.75"/>
          <path d="M0 168 Q50 152 95 162 Q130 170 185 155 L185 230 L0 230Z" fill="#a0bfd8" opacity="0.55"/>
          <path d="M25 0 Q70 45 95 95 Q118 145 155 192" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path d="M0 72 Q60 82 120 72 Q155 65 185 78" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M38 0 L48 230" stroke="white" strokeWidth="2.5" fill="none" opacity="0.5"/>
          <path d="M0 108 Q85 102 185 114" stroke="white" strokeWidth="2.5" fill="none" opacity="0.5"/>
          <ellipse cx="120" cy="48" rx="28" ry="17" fill="#c8e6c9" opacity="0.75"/>
          <ellipse cx="28" cy="188" rx="22" ry="12" fill="#c8e6c9" opacity="0.65"/>
          {clusters.map((c, i) => (
            <g key={i}>
              <circle cx={c.x} cy={c.y} r="13" fill="white" stroke="#cbd5e1" strokeWidth="1.5"/>
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#0F1E3A" fontFamily="Poppins,sans-serif">{c.count}</text>
            </g>
          ))}
          {markers.map((m, i) => (
            <g key={i}>
              <ellipse cx={m.x} cy={m.y + 15} rx="5" ry="2.5" fill="rgba(0,0,0,0.15)"/>
              <path d={`M${m.x} ${m.y-15} C${m.x-11} ${m.y-15} ${m.x-11} ${m.y+3} ${m.x} ${m.y+15} C${m.x+11} ${m.y+3} ${m.x+11} ${m.y-15} ${m.x} ${m.y-15}Z`} fill={m.color}/>
              <circle cx={m.x} cy={m.y-4} r="5.5" fill="white" opacity="0.9"/>
            </g>
          ))}
        </svg>
        <div style={{ position:'absolute', bottom:12, right:12, backgroundColor:'#0F1E3A', borderRadius:14, padding:'6px 12px', display:'flex', alignItems:'center', gap:4, boxShadow:'0 4px 14px rgba(15,30,58,0.4)' }}>
          <span style={{ color:'white', fontSize:10, fontWeight:700, fontFamily:'Poppins,sans-serif' }}>+ Ajouter</span>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ display:'flex', borderTop:'1px solid #f1f5f9', padding:'7px 0 6px' }}>
        {['Accueil','Carte','Actus','Clubs','Profil'].map(t => (
          <div key={t} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <div style={{ width:14, height:14, borderRadius:4, backgroundColor: t==='Carte' ? '#22C55E' : '#e2e8f0' }}/>
            <span style={{ fontSize:6, color: t==='Carte' ? '#22C55E' : '#94a3b8', fontWeight: t==='Carte' ? 700 : 500 }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Features & Benefits ───────────────────────────────────────────────────────
const FEATURES = [
  { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label:'TROUVER', suffix:' un club', desc:'Cherche parmi des dizaines de clubs près de chez toi.' },
  { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label:'PARTICIPER', suffix:' à des événements', desc:'Ne manque aucun événement sportif local.' },
  { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, label:'VIVRE', suffix:' ta passion', desc:'Rejoins une communauté de passionnés.' },
];

const BENEFITS = [
  { title:'Sécurisé & fiable',    desc:'Données protégées, vie privée respectée.',   color:'#22C55E', icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { title:'Communauté locale',    desc:'Connecte-toi avec les clubs de ta région.',  color:'#3B82F6', icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { title:'Simple & rapide',      desc:'Tout le sport près de toi en quelques clics.', color:'#F59E0B', icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { title:'100% passion',         desc:'Conçu par des passionnés pour des passionnés.', color:'#F59E0B', icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
];

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage({ onNavigate }) {
  return (
    <div className="h-full flex flex-col overflow-y-auto bg-white relative">

      {/* ── Floating background sport icons ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {BG_ICONS.map(({ x, y, size, rotate, opacity, icon }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity }}
            transition={{ delay: 0.3 + i * 0.1, duration: 1 }}
            style={{ position:'absolute', left:x, top:y, transform:`rotate(${rotate}deg)` }}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" style={{ color:'#0F1E3A' }}>
              {SPORT_PATHS[icon]}
            </svg>
          </motion.div>
        ))}
      </div>

      {/* ── Content (above background) ── */}
      <div className="relative flex flex-col" style={{ zIndex: 1 }}>

        {/* Title centered */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center pt-5 pb-1"
        >
          <SportLinkLogo size={56} />
          <div className="mt-2 text-4xl font-extrabold tracking-tight font-poppins" style={{ color: '#0F1E3A' }}>
            SPORT<span style={{ color: '#22C55E' }}>LINK</span>
          </div>
        </motion.div>

        {/* Hero: text left + phone right */}
        <div className="flex items-start gap-2 px-4 pt-3 pb-2">

          {/* Left text */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3 border"
              style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span className="text-[10px] font-semibold font-poppins" style={{ color: '#16a34a' }}>La plateforme sportive locale</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="font-extrabold leading-tight mb-2 font-poppins"
              style={{ color: '#0F1E3A', fontSize: 28 }}
            >
              Le sport<br />près de <span style={{ color: '#22C55E' }}>toi</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}
              className="text-xs leading-relaxed mb-4"
              style={{ color: '#64748b' }}
            >
              SportLink te permet de trouver des clubs, des événements et des actualités sportives autour de toi.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="space-y-2.5 mb-5"
            >
              {FEATURES.map(({ icon, label, suffix, desc }) => (
                <div key={label} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#F0FDF4' }}>
                    {icon}
                  </div>
                  <div>
                    <div className="text-xs font-poppins leading-tight">
                      <span className="font-bold" style={{ color:'#0F1E3A' }}>{label}</span>
                      <span className="font-medium" style={{ color:'#0F1E3A' }}>{suffix}</span>
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color:'#94a3b8' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
              className="flex flex-col gap-2"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('map')}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white font-poppins"
                style={{ backgroundColor: '#22C55E' }}
              >
                Découvrir la carte
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('clubs')}
                className="flex items-center justify-center py-3.5 rounded-2xl font-semibold text-sm font-poppins border-2"
                style={{ borderColor: '#e2e8f0', color: '#0F1E3A' }}
              >
                Explorer les clubs
              </motion.button>
            </motion.div>
          </div>

          {/* Right: phone */}
          <motion.div
            initial={{ opacity: 0, x: 24, y: 12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.14, type: 'spring', stiffness: 180, damping: 22 }}
            style={{ paddingTop: 4 }}
          >
            <PhoneMockup />
          </motion.div>
        </div>

        {/* Benefits */}
        <div className="px-4 pb-6 pt-3" style={{ backgroundColor: '#F8FAFC' }}>
          <div className="grid grid-cols-2 gap-3">
            {BENEFITS.map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36 + i * 0.07 }}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
              >
                <div className="mb-2">{icon}</div>
                <div className="text-xs font-bold font-poppins mb-1" style={{ color: '#0F1E3A' }}>{title}</div>
                <div className="text-[10px] leading-relaxed" style={{ color: '#94a3b8' }}>{desc}</div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
