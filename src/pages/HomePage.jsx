import { motion } from 'framer-motion';
import SportLinkLogo from '../components/SportLinkLogo.jsx';

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
    <div style={{
      borderRadius: 40,
      border: '3.5px solid #111827',
      backgroundColor: '#111827',
      overflow: 'hidden',
      boxShadow: '0 40px 100px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.15)',
      width: '100%',
    }}>
      {/* Status bar */}
      <div style={{ backgroundColor: '#111827', padding: '10px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <span style={{ color: 'white', fontSize: 10, fontWeight: 700, fontFamily: 'Poppins,sans-serif' }}>9:41</span>
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 80, height: 22, backgroundColor: '#000', borderRadius: 14 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ display: 'flex', gap: '1.5px', alignItems: 'flex-end' }}>
            {[3,5,7,9].map((h,i) => <div key={i} style={{ width: 2.5, height: h, backgroundColor: 'white', borderRadius: 1 }} />)}
          </div>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none"><rect x="1" y="6" width="15" height="12" rx="2"/><path d="M23 13V11a2 2 0 0 0-2-2h-1"/></svg>
        </div>
      </div>

      <div style={{ backgroundColor: 'white' }}>
        {/* App header */}
        <div style={{ padding: '10px 14px 7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F1E3A', fontFamily: 'Poppins,sans-serif' }}>Carte</span>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="5" x2="21" y2="5"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="19" x2="21" y2="19"/></svg>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 5, padding: '0 12px 8px' }}>
          {['Tous','Football','Handball'].map((t, i) => (
            <span key={t} style={{
              fontSize: 9, borderRadius: 20, padding: '3px 10px', fontWeight: 700, whiteSpace: 'nowrap',
              backgroundColor: i === 0 ? '#22C55E' : '#f1f5f9',
              color: i === 0 ? 'white' : '#64748b',
            }}>{t}</span>
          ))}
        </div>

        {/* Map */}
        <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1 / 0.95' }}>
          <svg width="100%" height="100%" viewBox="0 0 240 228" preserveAspectRatio="xMidYMid slice">
            <rect width="240" height="228" fill="#e8efe8"/>
            <path d="M0 0 Q60 20 120 10 Q180 0 240 15 L240 80 Q200 70 160 75 Q100 80 60 70 Q30 65 0 75Z" fill="#d4e8c2" opacity="0.7"/>
            <ellipse cx="170" cy="55" rx="40" ry="22" fill="#c8e0b0" opacity="0.8"/>
            <ellipse cx="40"  cy="40" rx="30" ry="18" fill="#d0e8b8" opacity="0.6"/>
            <path d="M0 155 Q40 138 85 148 Q130 158 175 138 Q205 128 240 136 L240 228 L0 228Z" fill="#a8cfe8" opacity="0.85"/>
            <path d="M0 178 Q55 162 110 172 Q155 180 240 162 L240 228 L0 228Z" fill="#90b8d8" opacity="0.6"/>
            <path d="M30 0 Q75 55 110 110 Q140 160 170 210" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round"/>
            <path d="M0 88 Q65 98 130 88 Q180 80 240 95" stroke="white" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
            <path d="M50 0 L60 228" stroke="white" strokeWidth="3" fill="none" opacity="0.55"/>
            <path d="M0 130 Q100 122 240 135" stroke="white" strokeWidth="3" fill="none" opacity="0.5"/>
            {clusters.map((c,i) => (
              <g key={i}>
                <circle cx={c.x} cy={c.y} r="14" fill="white" stroke="#d1d5db" strokeWidth="1.5"/>
                <text x={c.x} y={c.y+4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0F1E3A" fontFamily="Poppins,sans-serif">{c.n}</text>
              </g>
            ))}
            <circle cx="118" cy="112" r="10" fill="#3B82F6" opacity="0.2"/>
            <circle cx="118" cy="112" r="6" fill="#3B82F6"/>
            <circle cx="118" cy="112" r="3" fill="white"/>
            {markers.map((m,i) => (
              <g key={i}>
                <ellipse cx={m.x} cy={m.y+m.r+3} rx={m.r*0.45} ry="3" fill="rgba(0,0,0,0.2)"/>
                <path d={`M${m.x} ${m.y-m.r-2} C${m.x-m.r-2} ${m.y-m.r-2} ${m.x-m.r-2} ${m.y+m.r} ${m.x} ${m.y+m.r+8} C${m.x+m.r+2} ${m.y+m.r} ${m.x+m.r+2} ${m.y-m.r-2} ${m.x} ${m.y-m.r-2}Z`} fill={m.color}/>
                <circle cx={m.x} cy={m.y} r={m.r*0.55} fill="white" opacity="0.9"/>
              </g>
            ))}
          </svg>
          <div style={{ position:'absolute', bottom:10, right:10, backgroundColor:'#111827', borderRadius:14, padding:'6px 14px', display:'flex', alignItems:'center', gap:5, boxShadow:'0 4px 16px rgba(0,0,0,0.35)' }}>
            <span style={{ color:'white', fontSize:12, fontWeight:700, fontFamily:'Poppins,sans-serif' }}>+ Ajouter</span>
          </div>
        </div>

        {/* Bottom nav */}
        <div style={{ display:'flex', borderTop:'1px solid #f1f5f9', padding:'9px 0 8px', backgroundColor:'white' }}>
          {[
            { label:'Accueil', icon:<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>, active: false },
            { label:'Carte',   icon:<><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></>, active: true },
            { label:'Actus',   icon:<><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z"/><path d="M18 14h-8"/></>, active: false },
            { label:'Clubs',   icon:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 4 4v2"/><circle cx="9" cy="7" r="4"/></>, active: false },
            { label:'Profil',  icon:<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>, active: false },
          ].map(({ label, icon, active }) => (
            <div key={label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#22C55E' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              <span style={{ fontSize:7.5, color: active ? '#22C55E' : '#94a3b8', fontWeight: active ? 700 : 500, fontFamily:'Poppins,sans-serif' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Shared content sections ───────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: '1', color: '#22C55E', bg: '#F0FDF4',
      title: 'Crée ton compte & choisis tes sports',
      desc: 'Inscris-toi en 30 secondes et sélectionne tes disciplines favorites. La carte et les clubs se filtrent automatiquement.',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
    {
      n: '2', color: '#3B82F6', bg: '#EFF6FF',
      title: 'Explore la carte interactive',
      desc: 'Visualise tous les événements — matchs, trails, tournois — sur une carte en temps réel. Active la géolocalisation pour voir ce qui se passe près de toi.',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    },
    {
      n: '3', color: '#a855f7', bg: '#FDF4FF',
      title: 'Rejoins un club, suis ses matchs',
      desc: 'Consulte les pages des clubs, leur calendrier de matchs par équipe, leurs résultats et contacte-les directement.',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
  ];

  return (
    <div className="mt-8 pt-8" style={{ borderTop: '1px solid #f1f5f9' }}>
      <h3 className="font-bold font-poppins text-center mb-5" style={{ fontSize: 15, color: '#0F1E3A' }}>
        Comment ça marche ?
      </h3>
      <div className="space-y-4">
        {steps.map(({ n, color, bg, title, desc, icon }) => (
          <div key={n} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold font-poppins text-white text-sm"
              style={{ backgroundColor: color, marginTop: 1 }}>
              {n}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold font-poppins text-sm" style={{ color: '#0F1E3A' }}>{title}</div>
              <div className="text-xs mt-0.5" style={{ color: '#94a3b8', lineHeight: 1.55 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClubBanner({ onNavigate }) {
  return (
    <div className="mt-8 rounded-2xl p-5 relative overflow-hidden" style={{ backgroundColor: '#0F1E3A' }}>
      <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(34,197,94,0.2)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
        </div>
        <div className="font-bold font-poppins text-white" style={{ fontSize: 14 }}>Tu gères un club ?</div>
      </div>
      <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.60)', lineHeight: 1.55 }}>
        Crée la page de ton club, publie ton calendrier par équipe, affiche tes matchs à domicile sur la carte et gère tes résultats.
      </p>
      <button onClick={() => onNavigate('clubs')}
        className="flex items-center gap-1.5 font-semibold font-poppins text-white"
        style={{ backgroundColor: '#22C55E', borderRadius: 12, padding: '9px 16px', fontSize: 13 }}>
        Voir les clubs
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </button>
    </div>
  );
}

// ── Stats + Features (partagé mobile & desktop) ───────────────────────────────
function FeaturesSection({ stats = {}, onNavigate }) {
  const { clubs = 0, events = 0, sports = 0 } = stats;
  return (
    <div className="px-5 pt-6 pb-6 md:px-12 md:pt-10 md:pb-10">
      {/* How it works + club banner — mobile */}
      <div className="md:hidden">
        <HowItWorks />
        <ClubBanner onNavigate={onNavigate} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 mt-8 md:mt-0 md:gap-5 md:mb-8">
        {[
          { bg:'#F0FDF4', color:'#22C55E', label:'Clubs', value: clubs, icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { bg:'#EFF6FF', color:'#3B82F6', label:'Événements', value: events, icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { bg:'#FDF4FF', color:'#a855f7', label:'Sports', value: sports, icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
        ].map(({ bg, color, label, value, icon }, i) => (
          <motion.div key={label}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 + i*0.07 }}
            className="rounded-2xl flex flex-col items-center gap-1.5 py-4 md:py-5"
            style={{ backgroundColor:bg }}>
            {icon}
            <div className="font-extrabold font-poppins md:text-3xl" style={{ fontSize:20, color, lineHeight:1 }}>{value}</div>
            <div className="font-medium text-center" style={{ fontSize:11, color:'#94a3b8' }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Features */}
      <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-5">
        {[
          { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, bg:'#F0FDF4', title:'Trouve un club', desc:'Parcours les clubs sportifs du Finistère par sport ou par ville.' },
          { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, bg:'#EFF6FF', title:'Ne rate aucun événement', desc:'Matchs, trails, tournois — tous les événements sur la carte.' },
          { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, bg:'#FDF4FF', title:'Vis ta passion', desc:'Rejoins une communauté de passionnés de sport local.' },
        ].map(({ icon, bg, title, desc }, i) => (
          <motion.div key={title}
            initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.6 + i*0.08 }}
            className="flex items-start gap-3 md:flex-col md:gap-3 md:bg-white md:rounded-2xl md:p-5 md:border md:border-gray-100 md:shadow-sm">
            <div className="rounded-xl flex items-center justify-center flex-shrink-0 md:w-12 md:h-12" style={{ width:38, height:38, backgroundColor:bg }}>
              {icon}
            </div>
            <div>
              <div className="font-bold font-poppins md:text-base" style={{ fontSize:14, color:'#0F1E3A' }}>{title}</div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:2, lineHeight:1.5 }}>{desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* How it works + club banner — mobile only (avant les features) */}

      <div className="text-center mt-6">
        <p style={{ fontSize:11, color:'#cbd5e1' }}>Finistère (29) · Version 1.0.0</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage({ onNavigate, stats }) {
  return (
    <div className="h-full overflow-y-auto" style={{ background: 'linear-gradient(160deg, #0F1E3A 0%, #1a3460 55%, #0F1E3A 100%)' }}>

      {/* ── MOBILE layout (< md) ── */}
      <div className="md:hidden flex flex-col">

        {/* Hero texte centré */}
        <div className="flex-shrink-0 px-6 pt-10 pb-6 text-white text-center relative overflow-hidden">
          <div style={{ position:'absolute', top:'-40%', left:'50%', transform:'translateX(-50%)', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 65%)', pointerEvents:'none' }} />

          <motion.div className="flex items-center justify-center gap-2 mb-6"
            initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
            <SportLinkLogo size={32} onDark />
            <span className="font-extrabold font-poppins text-white" style={{ fontSize:21, letterSpacing:'-0.3px' }}>SportLink</span>
          </motion.div>

          <motion.div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5"
            style={{ backgroundColor:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)' }}
            initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.1 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="font-semibold font-poppins" style={{ fontSize:12, color:'#22C55E' }}>Sport en Finistère</span>
          </motion.div>

          <motion.h1 className="font-extrabold font-poppins text-white mb-4"
            style={{ fontSize:40, lineHeight:1.08, letterSpacing:'-1px' }}
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
            Le sport<br />près de <span style={{ color:'#22C55E' }}>toi</span>
          </motion.h1>

          <motion.p className="font-poppins mb-7 mx-auto"
            style={{ fontSize:15, color:'rgba(255,255,255,0.65)', maxWidth:300, lineHeight:1.6 }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.25 }}>
            Trouve des clubs, des événements et des actualités sportives autour de toi.
          </motion.p>

          <motion.div className="flex gap-3 justify-center"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.32 }}>
            <motion.button whileTap={{ scale:0.95 }} whileHover={{ scale:1.03 }} onClick={() => onNavigate('map')}
              className="font-bold font-poppins text-white flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor:'#22C55E', borderRadius:14, padding:'12px 22px', fontSize:14 }}>
              Voir la carte
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </motion.button>
            <motion.button whileTap={{ scale:0.95 }} whileHover={{ scale:1.03 }} onClick={() => onNavigate('clubs')}
              className="font-semibold font-poppins border-2 cursor-pointer"
              style={{ borderColor:'rgba(255,255,255,0.25)', color:'white', borderRadius:14, padding:'12px 22px', fontSize:14, backgroundColor:'rgba(255,255,255,0.08)' }}>
              Les clubs
            </motion.button>
          </motion.div>
        </div>

        {/* Phone */}
        <motion.div className="px-8 pb-2 relative"
          initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35, type:'spring', stiffness:120, damping:18 }}>
          <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:'80%', height:60, background:'radial-gradient(ellipse, rgba(34,197,94,0.25) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
          <PhoneMockup />
        </motion.div>

        {/* White section */}
        <div style={{ backgroundColor:'white', borderRadius:'24px 24px 0 0', marginTop:'-8px', position:'relative', zIndex:1 }}>
          <FeaturesSection stats={stats} onNavigate={onNavigate} />
        </div>
      </div>

      {/* ── DESKTOP layout (≥ md) ── */}
      <div className="hidden md:flex md:flex-col md:min-h-full">

        {/* Hero — deux colonnes */}
        <div className="flex flex-1 items-center px-16 xl:px-24 py-16 gap-12 xl:gap-20 relative overflow-hidden" style={{ minHeight: '100vh' }}>

          {/* Orbes déco */}
          <div style={{ position:'absolute', top:'10%', right:'35%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 65%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'5%', left:'5%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)', pointerEvents:'none' }} />

          {/* Colonne gauche — texte */}
          <motion.div className="flex-1 text-white"
            initial={{ opacity:0, x:-24 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5 }}>

            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <SportLinkLogo size={40} onDark />
              <span className="font-extrabold font-poppins text-white" style={{ fontSize:26, letterSpacing:'-0.5px' }}>SportLink</span>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ backgroundColor:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span className="font-semibold font-poppins" style={{ fontSize:13, color:'#22C55E' }}>La plateforme sportive du Finistère</span>
            </div>

            {/* Titre */}
            <h1 className="font-extrabold font-poppins text-white mb-5"
              style={{ fontSize:64, lineHeight:1.04, letterSpacing:'-2px' }}>
              Le sport<br />
              près de <span style={{ color:'#22C55E' }}>toi</span>
            </h1>

            {/* Sous-titre */}
            <p className="font-poppins mb-8"
              style={{ fontSize:18, color:'rgba(255,255,255,0.65)', maxWidth:440, lineHeight:1.65 }}>
              Trouve des clubs, participe à des événements et suis l'actualité sportive autour de toi — tout en un seul endroit.
            </p>

            {/* Boutons */}
            <div className="flex gap-4 mb-12">
              <motion.button whileTap={{ scale:0.96 }} whileHover={{ scale:1.03, y:-1 }} onClick={() => onNavigate('map')}
                className="font-bold font-poppins text-white flex items-center gap-2.5 cursor-pointer"
                style={{ backgroundColor:'#22C55E', borderRadius:16, padding:'14px 28px', fontSize:16 }}>
                Voir la carte
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </motion.button>
              <motion.button whileTap={{ scale:0.96 }} whileHover={{ scale:1.03, y:-1 }} onClick={() => onNavigate('clubs')}
                className="font-semibold font-poppins border-2 cursor-pointer"
                style={{ borderColor:'rgba(255,255,255,0.3)', color:'white', borderRadius:16, padding:'14px 28px', fontSize:16, backgroundColor:'rgba(255,255,255,0.08)' }}>
                Explorer les clubs
              </motion.button>
            </div>

            {/* Stats mini */}
            <div className="flex gap-8">
              {[
                { value: stats?.clubs ?? 0,  label:'Clubs', color:'#22C55E' },
                { value: stats?.events ?? 0, label:'Événements', color:'#3B82F6' },
                { value: stats?.sports ?? 0, label:'Sports', color:'#a855f7' },
              ].map(({ value, label, color }) => (
                <div key={label}>
                  <div className="font-extrabold font-poppins" style={{ fontSize:32, color, lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Colonne droite — phone */}
          <motion.div className="flex-shrink-0 relative"
            style={{ width: 320 }}
            initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, type:'spring', stiffness:100, damping:18 }}>
            <div style={{ position:'absolute', bottom:'-5%', left:'50%', transform:'translateX(-50%)', width:'120%', height:80, background:'radial-gradient(ellipse, rgba(34,197,94,0.3) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none', zIndex:0 }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <PhoneMockup />
            </div>
          </motion.div>
        </div>

        {/* Features + extra sections — fond blanc */}
        <div style={{ backgroundColor:'white', position:'relative', zIndex:1 }}>
          <div className="max-w-5xl mx-auto">

            {/* How it works — desktop (en premier) */}
            <div className="px-12 pt-10 pb-10">
              <h2 className="font-bold font-poppins text-center mb-8" style={{ fontSize:28, color:'#0F1E3A' }}>
                Comment ça marche ?
              </h2>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { n:'1', color:'#22C55E', bg:'#F0FDF4', title:'Crée ton compte & choisis tes sports', desc:"Inscris-toi en 30 secondes et sélectionne tes disciplines favorites. La carte et les clubs se filtrent automatiquement selon tes préférences." },
                  { n:'2', color:'#3B82F6', bg:'#EFF6FF', title:'Explore la carte interactive', desc:"Visualise tous les événements — matchs, trails, tournois — sur une carte en temps réel. Active la géolocalisation pour voir ce qui se passe près de toi." },
                  { n:'3', color:'#a855f7', bg:'#FDF4FF', title:'Rejoins un club, suis ses matchs', desc:"Consulte les pages des clubs, leur calendrier par équipe, leurs résultats et contacte-les directement depuis l'app." },
                ].map(({ n, color, bg, title, desc }, i) => (
                  <motion.div key={n}
                    initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    whileHover={{ y:-4, boxShadow:'0 12px 32px rgba(0,0,0,0.08)' }}
                    transition={{ delay:0.5 + i*0.1 }}
                    className="rounded-2xl p-6 border border-gray-100"
                    style={{ backgroundColor:'white' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-poppins text-white text-base mb-4"
                      style={{ backgroundColor: color }}>
                      {n}
                    </div>
                    <div className="font-bold font-poppins mb-2" style={{ fontSize:15, color:'#0F1E3A' }}>{title}</div>
                    <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.6 }}>{desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Club banner — desktop */}
            <div className="px-12 pb-12" style={{ borderTop: '1px solid #f1f5f9' }}>
              <div className="rounded-2xl p-8 mt-10 relative overflow-hidden flex items-center gap-8" style={{ backgroundColor:'#0F1E3A' }}>
                <div style={{ position:'absolute', top:'-20%', right:'5%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 65%)', pointerEvents:'none' }} />
                <div className="flex-1">
                  <div className="font-bold font-poppins text-white mb-2" style={{ fontSize:20 }}>Tu gères un club ?</div>
                  <p style={{ fontSize:14, color:'rgba(255,255,255,0.60)', lineHeight:1.6 }}>
                    Crée la page de ton club, publie ton calendrier par équipe, affiche tes matchs à domicile sur la carte et gère tes résultats en temps réel.
                  </p>
                </div>
                <motion.button whileTap={{ scale:0.96 }} whileHover={{ scale:1.04, y:-1 }}
                  onClick={() => onNavigate('clubs')}
                  className="flex-shrink-0 flex items-center gap-2 font-bold font-poppins text-white cursor-pointer"
                  style={{ backgroundColor:'#22C55E', borderRadius:14, padding:'12px 24px', fontSize:15 }}>
                  Voir les clubs
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </motion.button>
              </div>
            </div>

            {/* Tout ce dont tu as besoin — en dernier */}
            <div className="px-12 pb-4" style={{ borderTop: '1px solid #f1f5f9' }}>
              <h2 className="font-bold font-poppins text-center mb-8 pt-10" style={{ fontSize:24, color:'#0F1E3A' }}>
                Tout ce dont tu as besoin
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-6 px-12 pb-12">
              {[
                { icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, bg:'#F0FDF4', color:'#22C55E', title:'Trouve un club', desc:'Parcours tous les clubs sportifs du Finistère, filtre par sport ou par ville et contacte-les directement.' },
                { icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, bg:'#EFF6FF', color:'#3B82F6', title:'Ne rate aucun événement', desc:'Matchs, trails, tournois, cyclosportives — tous les événements locaux visibles sur la carte.' },
                { icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, bg:'#FDF4FF', color:'#a855f7', title:'Vis ta passion', desc:"Rejoins une communauté de passionnés, suis l'actualité sportive et reste connecté à ton sport." },
              ].map(({ icon, bg, color, title, desc }, i) => (
                <motion.div key={title}
                  initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                  whileHover={{ y:-4, boxShadow:'0 16px 40px rgba(0,0,0,0.1)' }}
                  transition={{ delay:0.6 + i*0.1 }}
                  className="rounded-2xl p-6 border border-gray-100 shadow-sm"
                  style={{ backgroundColor:'white' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor:bg }}>
                    {icon}
                  </div>
                  <div className="font-bold font-poppins mb-2" style={{ fontSize:17, color:'#0F1E3A' }}>{title}</div>
                  <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.6 }}>{desc}</div>
                </motion.div>
              ))}
            </div>

            <div className="text-center pb-8">
              <p style={{ fontSize:12, color:'#cbd5e1' }}>Finistère (29) · Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
