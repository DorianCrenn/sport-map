import { motion } from 'framer-motion';
import SportLinkLogo from '../components/SportLinkLogo.jsx';

// ── Floating background icons ─────────────────────────────────────────────────
const BG_ICONS = [
  { x: '-3%', y: '12%',  size: 100, rotate: -18, opacity: 0.045, sport: 'football' },
  { x: '20%', y: '3%',   size: 72,  rotate: 22,  opacity: 0.035, sport: 'running'  },
  { x: '4%',  y: '58%',  size: 88,  rotate: 12,  opacity: 0.04,  sport: 'cycling'  },
  { x: '72%', y: '8%',   size: 65,  rotate: -10, opacity: 0.035, sport: 'handball' },
  { x: '58%', y: '65%',  size: 90,  rotate: 28,  opacity: 0.035, sport: 'trail'    },
];

const SPORT_PATHS = {
  football: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M12 7l4 2.5v5l-4 2.5-4-2.5v-5z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/><path d="M12 7V3M16 9.5l3.5-2M16 14.5l3.5 2M12 17v4M8 14.5l-3.5 2M8 9.5l-3.5-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/></>,
  running:  <><circle cx="15" cy="4" r="2" fill="currentColor"/><path d="M14 6.5l-2 5.5M12 12l2.5 5M12 12l-3 5.5M13 9l3-2.5M13 9l-2.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/><path d="M3 9h5M3 12h4M3 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/></>,
  cycling:  <><circle cx="6" cy="15" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="18" cy="15" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M6 15l5-8h3l2 4h2M11 7l2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="14" cy="5" r="1.5" fill="currentColor"/></>,
  handball: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M8 8l8 8M8 16l8-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.3" fill="none"/></>,
  trail:    <><path d="M2 20h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M4 20L9 7l5 8 3-5 5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
};

// ── Phone mockup ──────────────────────────────────────────────────────────────
function PhoneMockup() {
  const markers = [
    { x: 100, y: 108, color: '#22C55E', r: 13 },
    { x: 155, y: 82,  color: '#f97316', r: 13 },
    { x: 65,  y: 148, color: '#8b5cf6', r: 13 },
    { x: 185, y: 140, color: '#22C55E', r: 13 },
    { x: 130, y: 178, color: '#3B82F6', r: 11 },
  ];
  const clusters = [
    { x: 68,  y: 75,  n: 7 },
    { x: 198, y: 108, n: 4 },
    { x: 50,  y: 185, n: 3 },
    { x: 170, y: 195, n: 7 },
  ];

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Green blob behind phone */}
      <div style={{
        position: 'absolute', right: '-18%', top: '10%',
        width: '90%', height: '80%',
        background: 'radial-gradient(ellipse, rgba(34,197,94,0.13) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        width: '100%', position: 'relative', zIndex: 1,
        borderRadius: 38,
        border: '3.5px solid #111827',
        backgroundColor: '#111827',
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.15)',
      }}>
        {/* Status bar */}
        <div style={{ backgroundColor: '#111827', padding: '10px 14px 0', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'white', fontSize: 8.5, fontWeight: 700, fontFamily: 'Poppins,sans-serif' }}>9:41</span>
          {/* Dynamic Island */}
          <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 72, height: 20, backgroundColor: '#000', borderRadius: 12 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ display: 'flex', gap: '1.5px', alignItems: 'flex-end' }}>
              {[3,5,7,9].map((h,i) => <div key={i} style={{ width: 2.5, height: h, backgroundColor: 'white', borderRadius: 1 }} />)}
            </div>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white" stroke="none"><rect x="1" y="6" width="15" height="12" rx="2"/><path d="M23 13V11a2 2 0 0 0-2-2h-1"/></svg>
          </div>
        </div>

        {/* White app area */}
        <div style={{ backgroundColor: 'white' }}>
          {/* App header */}
          <div style={{ padding: '10px 14px 7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0F1E3A', fontFamily: 'Poppins,sans-serif' }}>Carte</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="5" x2="21" y2="5"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="19" x2="21" y2="19"/></svg>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 5, padding: '0 12px 8px', overflowX: 'hidden' }}>
            {['Tous','Football','Handball','Basketball'].map((t, i) => (
              <span key={t} style={{
                fontSize: 8.5, borderRadius: 20, padding: '3px 9px', fontWeight: 700, whiteSpace: 'nowrap',
                backgroundColor: i === 0 ? '#22C55E' : '#f1f5f9',
                color: i === 0 ? 'white' : '#64748b',
              }}>{t}</span>
            ))}
          </div>

          {/* Map */}
          <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1 / 1.05' }}>
            <svg width="100%" height="100%" viewBox="0 0 240 252" preserveAspectRatio="xMidYMid slice">
              {/* Map bg */}
              <rect width="240" height="252" fill="#e8efe8"/>
              {/* Terrain zones */}
              <path d="M0 0 Q60 20 120 10 Q180 0 240 15 L240 80 Q200 70 160 75 Q100 80 60 70 Q30 65 0 75Z" fill="#d4e8c2" opacity="0.7"/>
              <ellipse cx="170" cy="55" rx="40" ry="22" fill="#c8e0b0" opacity="0.8"/>
              <ellipse cx="40"  cy="40" rx="30" ry="18" fill="#d0e8b8" opacity="0.6"/>
              {/* Water */}
              <path d="M0 175 Q40 158 85 168 Q130 178 175 158 Q205 148 240 156 L240 252 L0 252Z" fill="#a8cfe8" opacity="0.85"/>
              <path d="M0 198 Q55 182 110 192 Q155 200 240 182 L240 252 L0 252Z" fill="#90b8d8" opacity="0.6"/>
              {/* Roads */}
              <path d="M30 0 Q75 55 110 110 Q140 160 170 210" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round"/>
              <path d="M0 88 Q65 98 130 88 Q180 80 240 95" stroke="white" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
              <path d="M50 0 L60 252" stroke="white" strokeWidth="3" fill="none" opacity="0.55"/>
              <path d="M0 130 Q100 122 240 135" stroke="white" strokeWidth="3" fill="none" opacity="0.5"/>
              <path d="M120 0 Q140 40 135 90" stroke="white" strokeWidth="2.5" fill="none" opacity="0.45"/>
              {/* Road outline subtle */}
              <path d="M30 0 Q75 55 110 110 Q140 160 170 210" stroke="#e0e0d0" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.3"/>
              {/* Clusters */}
              {clusters.map((c,i) => (
                <g key={i}>
                  <circle cx={c.x} cy={c.y} r="14" fill="white" stroke="#d1d5db" strokeWidth="1.5"/>
                  <text x={c.x} y={c.y+4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0F1E3A" fontFamily="Poppins,sans-serif">{c.n}</text>
                </g>
              ))}
              {/* User location */}
              <circle cx="118" cy="112" r="10" fill="#3B82F6" opacity="0.2"/>
              <circle cx="118" cy="112" r="6" fill="#3B82F6"/>
              <circle cx="118" cy="112" r="3" fill="white"/>
              {/* Sport markers */}
              {markers.map((m,i) => (
                <g key={i}>
                  <ellipse cx={m.x} cy={m.y+m.r+3} rx={m.r*0.45} ry="3" fill="rgba(0,0,0,0.2)"/>
                  <path d={`M${m.x} ${m.y-m.r-2} C${m.x-m.r-2} ${m.y-m.r-2} ${m.x-m.r-2} ${m.y+m.r} ${m.x} ${m.y+m.r+8} C${m.x+m.r+2} ${m.y+m.r} ${m.x+m.r+2} ${m.y-m.r-2} ${m.x} ${m.y-m.r-2}Z`} fill={m.color}/>
                  <circle cx={m.x} cy={m.y} r={m.r*0.55} fill="white" opacity="0.9"/>
                </g>
              ))}
            </svg>
            {/* Add button */}
            <div style={{ position:'absolute', bottom:10, right:10, backgroundColor:'#111827', borderRadius:14, padding:'6px 13px', display:'flex', alignItems:'center', gap:5, boxShadow:'0 4px 16px rgba(0,0,0,0.35)' }}>
              <span style={{ color:'white', fontSize:11, fontWeight:700, fontFamily:'Poppins,sans-serif' }}>+ Ajouter</span>
            </div>
          </div>

          {/* Bottom nav */}
          <div style={{ display:'flex', borderTop:'1px solid #f1f5f9', padding:'8px 0 7px', backgroundColor:'white' }}>
            {[
              { label:'Accueil', icon:<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>, active: false },
              { label:'Carte',   icon:<><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></>, active: true },
              { label:'Actus',   icon:<><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z"/><path d="M18 14h-8"/></>, active: false },
              { label:'Clubs',   icon:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>, active: false },
              { label:'Profil',  icon:<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>, active: false },
            ].map(({ label, icon, active }) => (
              <div key={label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#22C55E' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                <span style={{ fontSize:7, color: active ? '#22C55E' : '#94a3b8', fontWeight: active ? 700 : 500, fontFamily:'Poppins,sans-serif' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage({ onNavigate }) {
  return (
    <div className="h-full flex flex-col overflow-y-auto bg-white relative">

      {/* Floating background icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {BG_ICONS.map(({ x, y, size, rotate, opacity, sport }, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity }} transition={{ delay: 0.4 + i * 0.1, duration: 1.2 }}
            style={{ position:'absolute', left:x, top:y, transform:`rotate(${rotate}deg)` }}>
            <svg width={size} height={size} viewBox="0 0 24 24" style={{ color:'#0F1E3A' }}>{SPORT_PATHS[sport]}</svg>
          </motion.div>
        ))}
      </div>

      {/* Hero */}
      <div className="relative flex items-start px-4 pt-6 pb-4 mx-auto w-full" style={{ zIndex: 1, maxWidth: 480 }}>

        {/* LEFT — 46% */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          style={{ width: '58%', paddingRight: 10, paddingTop: 4 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4 border"
            style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="font-semibold font-poppins" style={{ fontSize: 11, color: '#16a34a' }}>La plateforme sportive locale</span>
          </div>

          {/* Headline */}
          <h1 className="font-extrabold leading-none mb-3 font-poppins" style={{ color: '#0F1E3A', fontSize: 38, lineHeight: 1.08 }}>
            Le sport<br />
            près de <span style={{ color: '#22C55E' }}>toi</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-5 leading-relaxed font-poppins" style={{ fontSize: 12, color: '#64748b' }}>
            SportLink te permet de trouver des clubs, des événements et des actualités sportives autour de toi.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {[
              {
                bg:'#F0FDF4', color:'#22C55E',
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                label:'TROUVER', suffix:' un club', desc:'Cherche parmi des centaines de clubs près de chez toi.',
              },
              {
                bg:'#EFF6FF', color:'#3B82F6',
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                label:'PARTICIPER', suffix:' à des événements', desc:'Ne manque aucun événement sportif local.',
              },
              {
                bg:'#FDF4FF', color:'#a855f7',
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
                label:'VIVRE', suffix:' ta passion', desc:'Rejoins une communauté de passionnés.',
              },
            ].map(({ bg, color, icon, label, suffix, desc }) => (
              <div key={label} className="flex items-start gap-2">
                <div className="rounded-lg flex items-center justify-center flex-shrink-0" style={{ width:28, height:28, backgroundColor:bg }}>
                  {icon}
                </div>
                <div>
                  <div className="font-poppins" style={{ fontSize:12, lineHeight:'1.3' }}>
                    <span className="font-bold" style={{ color:'#0F1E3A' }}>{label}</span>
                    <span className="font-medium" style={{ color:'#0F1E3A' }}>{suffix}</span>
                  </div>
                  <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Buttons — côte à côte */}
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate('map')}
              className="flex items-center gap-1.5 font-bold font-poppins text-white"
              style={{ backgroundColor:'#22C55E', borderRadius:12, padding:'9px 14px', fontSize:11 }}
            >
              Découvrir la carte
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate('clubs')}
              className="flex items-center font-semibold font-poppins border-2"
              style={{ borderColor:'#e2e8f0', color:'#0F1E3A', borderRadius:12, padding:'9px 14px', fontSize:11 }}
            >
              Explorer les clubs
            </motion.button>
          </div>
        </motion.div>

        {/* RIGHT — 54% phone */}
        <motion.div
          initial={{ opacity: 0, x: 20, y: 12 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: 0.12, type: 'spring', stiffness: 160, damping: 20 }}
          style={{ width: '42%', maxWidth: 160, flexShrink: 0 }}
        >
          <PhoneMockup />
        </motion.div>
      </div>

      {/* Benefits */}
      <div className="flex-shrink-0 px-4 pb-6 pt-2" style={{ backgroundColor:'#F8FAFC', zIndex:1, position:'relative' }}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { title:'Sécurisé & fiable',  desc:'Données protégées, vie privée respectée.',      color:'#22C55E', icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
            { title:'Communauté locale',  desc:'Connecte-toi avec les clubs de ta région.',    color:'#3B82F6', icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            { title:'Simple & rapide',    desc:'Tout le sport près de toi en quelques clics.',  color:'#F59E0B', icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
            { title:'100% passion',       desc:'Conçu par des passionnés pour des passionnés.', color:'#F59E0B', icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
          ].map(({ icon, title, desc }, i) => (
            <motion.div key={title}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.4 + i*0.07 }}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="mb-2">{icon}</div>
              <div className="font-bold font-poppins mb-1" style={{ fontSize:12, color:'#0F1E3A' }}>{title}</div>
              <div style={{ fontSize:10, color:'#94a3b8', lineHeight:1.5 }}>{desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
