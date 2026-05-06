import { motion } from 'framer-motion';
import SportLinkLogo from '../components/SportLinkLogo.jsx';

// ── Phone mockup with map ─────────────────────────────────────────────────────
function PhoneMockup() {
  const markers = [
    { x: 72, y: 88,  color: '#22C55E', label: '⚽' },
    { x: 110, y: 68, color: '#f97316', label: '🏀' },
    { x: 48, y: 118, color: '#3B82F6', label: '🚴' },
    { x: 130, y: 105, color: '#22C55E', label: '⚽' },
    { x: 90,  y: 140, color: '#8b5cf6', label: '🏃' },
  ];

  const clusters = [
    { x: 55,  y: 60,  count: 4 },
    { x: 140, y: 130, count: 7 },
    { x: 30,  y: 148, count: 3 },
  ];

  return (
    <div style={{
      width: 155, flexShrink: 0,
      borderRadius: 28,
      border: '3.5px solid #0F1E3A',
      backgroundColor: 'white',
      overflow: 'hidden',
      boxShadow: '0 24px 60px rgba(15,30,58,0.28), 0 4px 12px rgba(15,30,58,0.12)',
    }}>
      {/* Status bar */}
      <div style={{ backgroundColor: '#0F1E3A', padding: '8px 10px 5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'white', fontSize: 7, fontWeight: 700 }}>9:41</span>
        <div style={{ width: 28, height: 5, backgroundColor: '#1e3a5f', borderRadius: 3 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <div style={{ display: 'flex', gap: '1px', alignItems: 'flex-end' }}>
            {[3,5,7,9].map((h,i) => <div key={i} style={{ width: 2, height: h, backgroundColor: 'white', borderRadius: 1 }} />)}
          </div>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="white" stroke="none"><rect x="1" y="6" width="15" height="12" rx="2"/><path d="M23 13V11a2 2 0 0 0-2-2h-1"/></svg>
        </div>
      </div>

      {/* App header */}
      <div style={{ padding: '7px 10px 5px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#0F1E3A', fontFamily: 'Poppins, sans-serif' }}>Carte</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/></svg>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 4, padding: '5px 8px', borderBottom: '1px solid #f8fafc' }}>
        <span style={{ fontSize: 7, backgroundColor: '#22C55E', color: 'white', borderRadius: 20, padding: '2px 7px', fontWeight: 700 }}>Tous</span>
        <span style={{ fontSize: 7, backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: 20, padding: '2px 7px', fontWeight: 600 }}>Football</span>
        <span style={{ fontSize: 7, backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: 20, padding: '2px 7px', fontWeight: 600 }}>Trail</span>
      </div>

      {/* Map */}
      <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox="0 0 155 190" style={{ position: 'absolute', inset: 0 }}>
          {/* Map background */}
          <rect width="155" height="190" fill="#e8f0f8"/>
          {/* Water */}
          <path d="M0 120 Q30 100 60 115 Q90 130 120 110 Q140 100 155 108 L155 190 L0 190Z" fill="#b8d4e8" opacity="0.7"/>
          <path d="M0 140 Q40 125 80 135 Q110 142 155 128 L155 190 L0 190Z" fill="#a8c8e0" opacity="0.5"/>
          {/* Roads */}
          <path d="M20 10 Q60 40 80 80 Q100 120 130 160" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M0 60 Q50 70 100 60 Q130 55 155 65" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M30 0 L40 190" stroke="white" strokeWidth="2" fill="none" opacity="0.6"/>
          <path d="M0 90 Q70 85 155 95" stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>
          {/* Green zones */}
          <ellipse cx="100" cy="45" rx="22" ry="14" fill="#c8e6c9" opacity="0.7"/>
          <ellipse cx="25" cy="155" rx="18" ry="10" fill="#c8e6c9" opacity="0.6"/>
          {/* Clusters */}
          {clusters.map((c, i) => (
            <g key={i}>
              <circle cx={c.x} cy={c.y} r="11" fill="white" stroke="#cbd5e1" strokeWidth="1"/>
              <text x={c.x} y={c.y + 3.5} textAnchor="middle" fontSize="8" fontWeight="800" fill="#0F1E3A">{c.count}</text>
            </g>
          ))}
          {/* Sport markers */}
          {markers.map((m, i) => (
            <g key={i}>
              <ellipse cx={m.x} cy={m.y + 13} rx="4" ry="2" fill="rgba(0,0,0,0.15)"/>
              <path d={`M${m.x} ${m.y - 13} C${m.x - 9} ${m.y - 13} ${m.x - 9} ${m.y + 2} ${m.x} ${m.y + 13} C${m.x + 9} ${m.y + 2} ${m.x + 9} ${m.y - 13} ${m.x} ${m.y - 13}Z`} fill={m.color}/>
              <circle cx={m.x} cy={m.y - 4} r="5" fill="white" opacity="0.9"/>
            </g>
          ))}
        </svg>

        {/* Add button */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          backgroundColor: '#0F1E3A', borderRadius: 12,
          padding: '5px 10px',
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: '0 4px 12px rgba(15,30,58,0.35)',
        }}>
          <span style={{ color: 'white', fontSize: 9, fontWeight: 700 }}>+ Ajouter</span>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'flex', borderTop: '1px solid #f1f5f9', padding: '6px 0 5px' }}>
        {[
          { label: 'Accueil', active: false },
          { label: 'Carte', active: true },
          { label: 'Actus', active: false },
          { label: 'Clubs', active: false },
          { label: 'Profil', active: false },
        ].map(({ label, active }) => (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: active ? '#22C55E' : '#e2e8f0' }} />
            <span style={{ fontSize: 5, color: active ? '#22C55E' : '#94a3b8', fontWeight: active ? 700 : 500 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    label: 'TROUVER', suffix: ' un club',
    desc: 'Cherche parmi des dizaines de clubs près de chez toi.',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    label: 'PARTICIPER', suffix: ' à des événements',
    desc: 'Ne manque aucun événement sportif local.',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    label: 'VIVRE', suffix: ' ta passion',
    desc: 'Rejoins une communauté de passionnés.',
  },
];

const BENEFITS = [
  { color: '#22C55E', title: 'Sécurisé & fiable', desc: 'Vos données protégées et vie privée respectée.', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { color: '#3B82F6', title: 'Communauté locale', desc: 'Connecte-toi avec les clubs de ta région.', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { color: '#F59E0B', title: 'Simple & rapide', desc: 'Tout le sport près de toi en quelques clics.', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { color: '#F59E0B', title: '100% passion', desc: 'Conçu par des passionnés pour des passionnés.', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
];

export default function HomePage({ onNavigate }) {
  return (
    <div className="h-full flex flex-col overflow-y-auto bg-white">

      {/* ── Title centered ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 flex flex-col items-center pt-6 pb-2"
      >
        <SportLinkLogo size={52} />
        <div className="mt-2 text-3xl font-extrabold tracking-tight font-poppins" style={{ color: '#0F1E3A' }}>
          SPORT<span style={{ color: '#22C55E' }}>LINK</span>
        </div>
      </motion.div>

      {/* ── Hero: text left + phone right ── */}
      <div className="flex-shrink-0 flex items-start gap-3 px-4 pt-3 pb-4 relative overflow-hidden">
        {/* Green blob */}
        <div className="absolute right-0 top-0 w-64 h-64 pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 65%)', transform: 'translate(20%,-20%)' }} />

        {/* Left: content */}
        <div className="flex-1 min-w-0">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3 border"
            style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="text-[10px] font-semibold font-poppins" style={{ color: '#16a34a' }}>La plateforme sportive locale</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="text-3xl font-extrabold leading-tight mb-2 font-poppins"
            style={{ color: '#0F1E3A' }}
          >
            Le sport<br />près de <span style={{ color: '#22C55E' }}>toi</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            className="text-xs leading-relaxed mb-4"
            style={{ color: '#64748b' }}
          >
            SportLink te permet de trouver des clubs, des événements et des actualités sportives autour de toi.
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
            className="space-y-2.5 mb-5"
          >
            {FEATURES.map(({ icon, label, suffix, desc }) => (
              <div key={label} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: '#F0FDF4' }}>
                  {icon}
                </div>
                <div>
                  <div className="text-xs font-poppins leading-tight">
                    <span className="font-bold" style={{ color: '#0F1E3A' }}>{label}</span>
                    <span className="font-medium" style={{ color: '#0F1E3A' }}>{suffix}</span>
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>{desc}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="flex flex-col gap-2"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('map')}
              className="flex items-center justify-center gap-1.5 py-3 rounded-2xl font-bold text-sm text-white font-poppins"
              style={{ backgroundColor: '#22C55E' }}
            >
              Découvrir la carte
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('clubs')}
              className="flex items-center justify-center py-3 rounded-2xl font-semibold text-sm font-poppins border-2"
              style={{ borderColor: '#e2e8f0', color: '#0F1E3A' }}
            >
              Explorer les clubs
            </motion.button>
          </motion.div>
        </div>

        {/* Right: phone mockup */}
        <motion.div
          initial={{ opacity: 0, x: 20, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 24 }}
          style={{ paddingTop: 8 }}
        >
          <PhoneMockup />
        </motion.div>
      </div>

      {/* ── Benefits ── */}
      <div className="flex-shrink-0 px-4 pb-6 pt-2" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="grid grid-cols-2 gap-3">
          {BENEFITS.map(({ icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.07 }}
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
  );
}
