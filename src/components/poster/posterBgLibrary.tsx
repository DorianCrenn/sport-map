/* eslint-disable react-refresh/only-export-components */
// ── Premium Background Library ─────────────────────────────────────────────────
// 20 CSS-only cinematic backgrounds for match posters.
// Each component fills its parent container (100% × 100%, position relative).
// Rendered at z-index 5 by PosterRenderer — above template bg layers (z≤3),
// below template content (z=10).

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

interface OrbProps { top?: string; left?: string; bottom?: string; right?: string; size?: number; color: string; blur?: number; }
function Orb({ top, left, bottom, right, size = 280, color, blur = 55 }: OrbProps) {
  return (
    <div style={{
      position: 'absolute', top, left, bottom, right,
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
      filter: `blur(${blur}px)`, pointerEvents: 'none',
    }} />
  );
}

// ── 1. Or Premium ─────────────────────────────────────────────────────────────
function BgGoldRush({ format }) {
  const isStory = format === 'story';
  const gold = '#C9A84C';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#030200' }}>
      {/* Top cascade spotlights */}
      <Orb top="-15%" left="50%" size={380} color="rgba(201,168,76,0.30)" blur={70} />
      <Orb top="-8%" left="50%" size={220} color="rgba(255,220,140,0.35)" blur={45} />
      <Orb top="-2%" left="50%" size={90} color="rgba(255,240,190,0.55)" blur={20} />
      {/* Bottom ambient */}
      <Orb bottom="-20%" left="20%" size={260} color="rgba(201,168,76,0.12)" blur={60} />
      {/* Diagonal luxury lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 360 640" preserveAspectRatio="none">
        {Array.from({ length: 18 }, (_, i) => (
          <line key={i} x1={-60 + i * 28} y1="-100" x2={-60 + i * 28 + 220} y2="740"
            stroke={gold} strokeWidth="0.6" opacity="0.07" />
        ))}
      </svg>
      {/* Gold particle field */}
      {[[8,18],[92,12],[45,30],[78,22],[15,55],[88,60],[35,75],[65,42],[52,8],[25,88],[73,78]].map(([lp,tp],i) => (
        <div key={i} style={{ position: 'absolute', left: `${lp}%`, top: `${tp * (isStory ? 1 : 0.7)}%`, width: i%3===0?2:1, height: i%3===0?2:1, borderRadius: '50%', background: gold, opacity: 0.35 + (i%3)*0.1 }} />
      ))}
      {/* Bottom vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.82) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.04, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 2. Stadium Cinematic ──────────────────────────────────────────────────────
function BgStadiumNight({ format }) {
  const isStory = format === 'story';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#020612' }}>
      {/* Stadium arcs (top) */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: isStory ? '48%' : '44%', pointerEvents: 'none', overflow: 'visible' }} viewBox="0 0 360 280" preserveAspectRatio="none">
        {[300,240,190,148].map((rx, i) => (
          <ellipse key={i} cx="180" cy="-20" rx={rx} ry={rx * 0.55}
            fill="none" stroke={`rgba(100,180,255,${0.18 - i*0.03})`} strokeWidth={i===0?1:0.7} />
        ))}
        {/* Radial spokes */}
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI;
          const r = 300;
          return <line key={i} x1="180" y1="-20" x2={180 + Math.cos(a) * r} y2={-20 + Math.sin(a) * r}
            stroke="rgba(100,180,255,0.06)" strokeWidth="0.6" />;
        })}
      </svg>
      {/* Floodlight orbs at arc corners */}
      <Orb top="-5%" left="-8%" size={160} color="rgba(120,200,255,0.30)" blur={40} />
      <Orb top="-5%" right="-8%" size={160} color="rgba(120,200,255,0.30)" blur={40} />
      <Orb top="8%" left="50%" size={200} color="rgba(180,220,255,0.18)" blur={50} />
      {/* Green pitch glow bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isStory ? '35%' : '30%', background: 'linear-gradient(0deg, rgba(20,80,30,0.55) 0%, rgba(10,60,20,0.25) 55%, transparent 100%)', pointerEvents: 'none' }} />
      <Orb bottom="-10%" left="50%" size={320} color="rgba(20,140,40,0.22)" blur={60} />
      {/* Fog wisps mid */}
      <div style={{ position: 'absolute', top: isStory ? '38%' : '34%', left: '-10%', right: '-10%', height: isStory ? '22%' : '18%', background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(30,50,100,0.18) 0%, transparent 100%)', filter: 'blur(12px)' }} />
      {/* Heavy vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 65% at 50% 45%, transparent 0%, rgba(0,0,0,0.88) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.04, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 3. Neon Pulse ─────────────────────────────────────────────────────────────
function BgNeonPulse() {
  const cyan = '#00F5FF';
  const mag = '#FF00AA';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#020018' }}>
      {/* Horizontal neon tubes */}
      {[0.22, 0.38, 0.55, 0.72].map((yFrac, i) => (
        <div key={i} style={{
          position: 'absolute', top: `${yFrac * 100}%`,
          left: i % 2 === 0 ? '-5%' : '15%', right: i % 2 === 0 ? '15%' : '-5%',
          height: 1, background: i % 2 === 0 ? cyan : mag,
          boxShadow: `0 0 8px ${i % 2 === 0 ? cyan : mag}, 0 0 20px ${i % 2 === 0 ? cyan : mag}55`,
          opacity: 0.7 - i * 0.1,
        }} />
      ))}
      {/* Vertical crossing lines */}
      {[0.25, 0.5, 0.75].map((xFrac, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${xFrac * 100}%`,
          top: '-2%', bottom: '-2%', width: 1,
          background: i === 1 ? mag : cyan,
          boxShadow: `0 0 6px ${i === 1 ? mag : cyan}`,
          opacity: 0.25,
        }} />
      ))}
      {/* Glow at crossing points */}
      <Orb top="22%" left="25%" size={100} color={`${cyan}35`} blur={25} />
      <Orb top="55%" left="75%" size={100} color={`${mag}30`} blur={25} />
      <Orb top="38%" left="50%" size={80} color={`${cyan}25`} blur={20} />
      {/* Top ambient */}
      <Orb top="-10%" left="50%" size={300} color={`${cyan}18`} blur={60} />
      <Orb bottom="-5%" right="-5%" size={200} color={`${mag}20`} blur={50} />
      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)', opacity: 0.5 }} />
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 72% 68% at 50% 50%, transparent 20%, rgba(0,0,0,0.80) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.05, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 4. Frosted Arena ──────────────────────────────────────────────────────────
function BgFrostedArena({ format }) {
  const isStory = format === 'story';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#080814' }}>
      <Orb top="-10%" left="60%" size={320} color="rgba(99,102,241,0.28)" blur={70} />
      <Orb bottom="-15%" left="20%" size={280} color="rgba(139,92,246,0.22)" blur={65} />
      <Orb top="35%" right="-10%" size={200} color="rgba(59,130,246,0.20)" blur={55} />
      {/* Glass panels */}
      <div style={{
        position: 'absolute', top: isStory ? '12%' : '10%', bottom: isStory ? '10%' : '8%',
        left: '5%', right: '-12%', borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)',
        border: '1px solid rgba(255,255,255,0.09)', transform: 'rotate(3deg) skewY(1.5deg)',
      }} />
      <div style={{
        position: 'absolute', top: isStory ? '8%' : '6%', bottom: isStory ? '6%' : '5%',
        left: '8%', right: '8%', borderRadius: 22,
        background: 'linear-gradient(125deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 30px 80px rgba(0,0,0,0.6)',
        transform: 'rotate(-1deg)',
      }} />
      {/* Top glass shine */}
      <div style={{
        position: 'absolute', top: isStory ? 'calc(8% + 1px)' : 'calc(6% + 1px)',
        left: '9%', right: '9%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
        transform: 'rotate(-1deg)',
      }} />
      {/* Left glow edge */}
      <div style={{
        position: 'absolute', top: isStory ? '8%' : '6%', bottom: isStory ? '6%' : '5%',
        left: '8%', width: 1, filter: 'blur(1px)',
        background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.7), rgba(139,92,246,0.5), transparent)',
        transform: 'rotate(-1deg)',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 65% at 50% 50%, transparent 25%, rgba(0,0,0,0.78) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.04, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 5. Concrete Jungle ────────────────────────────────────────────────────────
function BgConcreteJungle({ format }) {
  const isStory = format === 'story';
  const orange = '#EA580C';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0A0A0A' }}>
      {/* Concrete micro-grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 18px), repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 18px)' }} />
      {/* Main diagonal slash */}
      <div style={{
        position: 'absolute', top: isStory ? '-12%' : '-10%', left: '-10%', right: '-5%', height: isStory ? '62%' : '58%',
        background: `linear-gradient(105deg, ${orange}55 0%, ${orange}35 35%, transparent 70%)`,
        transform: 'skewY(-9deg)', transformOrigin: 'left',
        filter: 'blur(2px)',
      }} />
      {/* Inner slash light accent */}
      <div style={{
        position: 'absolute', top: isStory ? '5%' : '4%', left: '0%', width: '50%', height: isStory ? '30%' : '26%',
        background: 'linear-gradient(105deg, rgba(255,200,120,0.18) 0%, transparent 60%)',
        transform: 'skewY(-9deg)', transformOrigin: 'left',
        filter: 'blur(6px)',
      }} />
      {/* Paint drip dots upper right */}
      {[[82,5],[88,12],[95,8],[75,18],[91,22]].map(([lp,tp],i) => (
        <div key={i} style={{ position: 'absolute', left: `${lp}%`, top: `${tp}%`, width: i%2===0?3:2, height: i%2===0?12:8, borderRadius: 2, background: orange, opacity: 0.3 + i*0.06 }} />
      ))}
      {/* Grain heavy */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '180px', opacity: 0.09, mixBlendMode: 'overlay' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 75% 70% at 35% 55%, transparent 20%, rgba(0,0,0,0.82) 100%)' }} />
    </div>
  );
}

// ── 6. Power Surge ────────────────────────────────────────────────────────────
function BgPowerSurge({ format }) {
  const isStory = format === 'story';
  const purple = '#7C3AED';
  const teal = '#06B6D4';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#050008' }}>
      {/* Explosive radial from right-center */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 75% 60% at 70% ${isStory?'45%':'42%'}, ${purple}55 0%, ${teal}22 40%, transparent 70%)` }} />
      {/* Diagonal lightning cuts */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 360 640" preserveAspectRatio="none">
        {[
          'M 280,0 L 310,160 L 270,160 L 330,320 L 290,320 L 360,500',
          'M 230,0 L 255,120 L 218,120 L 275,280 L 238,280 L 300,450',
        ].map((d, i) => (
          <path key={i} d={d} fill="none" stroke={i===0?purple:teal} strokeWidth={i===0?1.5:1} opacity={0.55-i*0.1} />
        ))}
      </svg>
      {/* Energy pulse rings */}
      {[80,140,210,290].map((r, i) => (
        <div key={i} style={{
          position: 'absolute', top: (isStory?290:200) - r, left: 250 - r,
          width: r*2, height: r*2, borderRadius: '50%',
          border: `1px solid ${i<2?purple:teal}${['50','35','22','12'][i]}`,
        }} />
      ))}
      <Orb top={isStory?'35%':'32%'} left="62%" size={140} color={`${purple}60`} blur={30} />
      <Orb top={isStory?'38%':'35%'} left="65%" size={60} color={`${teal}80`} blur={14} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(5,0,8,0.85) 0%, rgba(5,0,8,0.4) 55%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 65% 60% at 50% 50%, transparent 25%, rgba(0,0,0,0.78) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.045, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 7. Blue Steel ─────────────────────────────────────────────────────────────
function BgBlueSteel() {
  const royal = '#1D4ED8';
  const silver = '#C8D8F0';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#010510' }}>
      {/* Deep blue ambient */}
      <Orb top="-15%" left="50%" size={400} color="rgba(29,78,216,0.32)" blur={75} />
      <Orb bottom="-10%" right="-10%" size={250} color="rgba(29,78,216,0.18)" blur={65} />
      {/* Geometric angles */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 360 640" preserveAspectRatio="none">
        {/* Large diagonal shapes */}
        <polygon points="360,0 360,220 200,0" fill={`${royal}22`} />
        <polygon points="360,0 360,180 240,0" fill={`${royal}15`} />
        {/* Silver shimmer lines */}
        <line x1="0" y1="200" x2="360" y2="120" stroke={silver} strokeWidth="0.7" opacity="0.22" />
        <line x1="0" y1="220" x2="360" y2="140" stroke={silver} strokeWidth="0.4" opacity="0.12" />
        <line x1="0" y1="350" x2="360" y2="290" stroke={silver} strokeWidth="0.5" opacity="0.14" />
        {/* Star field */}
        {[[30,8],[85,15],[50,25],[15,40],[92,32],[70,52],[25,68],[78,72],[42,85],[95,90]].map(([lp,tp],i) => (
          <circle key={i} cx={lp*3.6} cy={tp*6.4} r={i%3===0?1:0.6} fill={silver} opacity={0.25+i%3*0.1} />
        ))}
      </svg>
      {/* Diagonal stripe accents */}
      {[0.3, 0.32, 0.34].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', top: '-20%', bottom: '-20%', left: `${pos*100}%`, width: 1,
          background: `linear-gradient(180deg, transparent, ${silver}${['35','22','12'][i]}, transparent)`,
          transform: 'rotate(-20deg)', transformOrigin: 'top',
        }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 68% 62% at 50% 50%, transparent 22%, rgba(0,0,0,0.85) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.04, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 8. Smoke & Lights ─────────────────────────────────────────────────────────
function BgSmokeLights({ format }) {
  const isStory = format === 'story';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#010101' }}>
      {/* Volumetric smoke clouds */}
      {[
        { top: '10%', left: '20%', w: 280, h: 200, color: 'rgba(40,50,80,0.35)' },
        { top: '30%', left: '-10%', w: 240, h: 180, color: 'rgba(30,40,70,0.28)' },
        { top: '50%', right: '-5%', w: 220, h: 160, color: 'rgba(50,35,70,0.30)' },
        { bottom: '5%', left: '30%', w: 260, h: 180, color: 'rgba(30,50,60,0.25)' },
      ].map(({ top, left, bottom, right, w, h, color }, i) => (
        <div key={i} style={{ position: 'absolute', top, left, bottom, right, width: w, height: h, borderRadius: '50%', background: `radial-gradient(ellipse, ${color} 0%, transparent 70%)`, filter: 'blur(28px)' }} />
      ))}
      {/* Colored light beams from top */}
      {[
        { angle: -18, color: 'rgba(0,245,255,0.22)', left: '25%' },
        { angle: 0,  color: 'rgba(255,255,220,0.18)', left: '50%' },
        { angle: 18, color: 'rgba(255,0,170,0.20)', left: '75%' },
      ].map((beam, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: beam.left,
          width: 2, height: isStory ? '65%' : '58%',
          background: `linear-gradient(180deg, ${beam.color} 0%, transparent 100%)`,
          filter: 'blur(14px)',
          transform: `translateX(-50%) rotate(${beam.angle}deg)`,
          transformOrigin: 'top center',
        }} />
      ))}
      {/* Orb halos for beams */}
      <Orb top="-8%" left="25%" size={120} color="rgba(0,245,255,0.22)" blur={30} />
      <Orb top="-8%" left="50%" size={100} color="rgba(255,235,180,0.25)" blur={25} />
      <Orb top="-8%" left="75%" size={120} color="rgba(255,0,170,0.22)" blur={30} />
      {/* Extreme vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 58% 55% at 50% 48%, transparent 0%, rgba(0,0,0,0.92) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '180px', opacity: 0.07, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 9. Cyber Grid ─────────────────────────────────────────────────────────────
function BgCyberGrid({ format }) {
  const isStory = format === 'story';
  const cyan = '#00FFD4';
  const purple = '#9B4AFF';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#030015' }}>
      {/* Perspective grid */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: isStory ? '52%' : '48%', pointerEvents: 'none' }} viewBox="0 0 360 340" preserveAspectRatio="none">
        {[0.08, 0.2, 0.35, 0.52, 0.72, 1.0].map((t, i) => {
          const y = t * 340;
          const sp = t * 185;
          return <line key={i} x1={180-sp} y1={y} x2={180+sp} y2={y} stroke={`${cyan}${i<3?'20':'12'}`} strokeWidth="0.8" />;
        })}
        {[-4,-2,0,2,4].map((off, i) => (
          <line key={i} x1={180+off*0} y1="0" x2={180+off*38} y2="340" stroke={`${cyan}${Math.abs(off)<2?'22':'10'}`} strokeWidth="0.7" />
        ))}
        <line x1="0" y1="0" x2="360" y2="0" stroke={cyan} strokeWidth="0.6" opacity="0.5" />
      </svg>
      {/* Holographic horizontal bands */}
      {[0.32, 0.48, 0.64, 0.8].map((yF, i) => (
        <div key={i} style={{
          position: 'absolute', top: `${yF*100}%`, left: 0, right: 0,
          height: isStory ? 18 : 14, opacity: 0.08,
          background: `linear-gradient(90deg, transparent, ${['#FF00AA','#00FFD4','#FFD700','#7B2FFF'][i]}, transparent)`,
        }} />
      ))}
      {/* Glitch lines */}
      {[0.42, 0.58].map((yF, i) => (
        <div key={i} style={{ position: 'absolute', top: `${yF*100}%`, left: `${i*30+10}%`, width: `${40-i*12}%`, height: 1, background: cyan, opacity: 0.25 }} />
      ))}
      {/* Angular HUD brackets */}
      {[{top:'12%',left:'4%',rot:'0deg'},{top:'12%',right:'4%',rot:'90deg'},{bottom:'8%',left:'4%',rot:'270deg'},{bottom:'8%',right:'4%',rot:'180deg'}].map((pos,i) => (
        <div key={i} style={{ position: 'absolute', ...pos, width: 18, height: 18 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M1 9 L1 1 L9 1" stroke={cyan} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"
              transform={`rotate(${pos.rot} 9 9)`} />
          </svg>
        </div>
      ))}
      <Orb top="-5%" left="50%" size={280} color={`${cyan}20`} blur={50} />
      <Orb bottom="-8%" right="-5%" size={220} color={`${purple}25`} blur={55} />
      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.14) 3px, rgba(0,0,0,0.14) 4px)', opacity: 0.55 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 66% at 50% 50%, transparent 22%, rgba(0,0,0,0.82) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.05, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 10. Abstract Force ────────────────────────────────────────────────────────
function BgAbstractForce() {
  const blue = '#2563EB';
  const orange = '#EA580C';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#040408' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 360 640" preserveAspectRatio="none">
        {/* Large diamond */}
        <polygon points="180,60 310,280 180,500 50,280" fill="none" stroke={`${blue}30`} strokeWidth="1.2" />
        <polygon points="180,100 285,280 180,460 75,280" fill="none" stroke={`${blue}20`} strokeWidth="0.8" />
        {/* Overlapping triangles */}
        <polygon points="50,100 310,100 180,380" fill="none" stroke={`${orange}22`} strokeWidth="1" />
        <polygon points="50,540 310,540 180,260" fill="none" stroke={`${blue}18`} strokeWidth="0.8" />
        {/* Corner accent lines */}
        <line x1="0" y1="0" x2="80" y2="80" stroke={orange} strokeWidth="1.5" opacity="0.4" />
        <line x1="360" y1="640" x2="280" y2="560" stroke={blue} strokeWidth="1.5" opacity="0.35" />
        <line x1="360" y1="0" x2="300" y2="70" stroke={blue} strokeWidth="1" opacity="0.3" />
      </svg>
      <Orb top="30%" left="50%" size={200} color={`${blue}22`} blur={55} />
      <Orb top="0%" right="0%" size={160} color={`${orange}18`} blur={45} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 68% 64% at 50% 50%, transparent 20%, rgba(0,0,0,0.85) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.04, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 11. Chrome Rush ───────────────────────────────────────────────────────────
function BgChromeRush() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#090909' }}>
      {/* Brushed metal bands */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          position: 'absolute', top: `${i * 16.6}%`, left: '-5%', right: '-5%', height: '17%',
          background: `linear-gradient(95deg, #0A0A0A, #${['151515','111111','181818','0E0E0E','161616','101010'][i]}, #0A0A0A)`,
          transform: `skewY(${i%2===0?0.3:-0.3}deg)`,
        }} />
      ))}
      {/* Silver highlight sweep */}
      <div style={{
        position: 'absolute', top: '-10%', bottom: '-10%', left: '35%', width: '30%',
        background: 'linear-gradient(90deg, transparent, rgba(200,210,220,0.08), rgba(220,228,240,0.12), rgba(200,210,220,0.08), transparent)',
        transform: 'skewX(-12deg)',
      }} />
      {/* Fine metallic lines */}
      {Array.from({ length: 24 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, bottom: 0, left: `${(i / 24) * 100}%`, width: 0.5,
          background: `rgba(180,190,200,${0.03 + (i % 3) * 0.01})`,
        }} />
      ))}
      {/* Blue-grey tint orb */}
      <Orb top="10%" left="60%" size={280} color="rgba(50,80,120,0.18)" blur={65} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 72% 68% at 50% 50%, transparent 25%, rgba(0,0,0,0.80) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '180px', opacity: 0.06, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 12. Noir Luxe ─────────────────────────────────────────────────────────────
function BgNoirLuxe({ format }) {
  const isStory = format === 'story';
  const gold = '#C9A84C';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000000' }}>
      {/* Single gold rule */}
      <div style={{ position: 'absolute', top: isStory ? '42%' : '40%', left: '8%', right: '8%', height: 1, background: `linear-gradient(90deg, transparent, ${gold}80, ${gold}CC, ${gold}80, transparent)` }} />
      {/* Corner accents */}
      {[
        { top: isStory ? '10%' : '8%', left: '8%' },
        { top: isStory ? '10%' : '8%', right: '8%' },
        { bottom: isStory ? '10%' : '8%', left: '8%' },
        { bottom: isStory ? '10%' : '8%', right: '8%' },
      ].map((pos, i) => (
        <div key={i} style={{ position: 'absolute', ...pos, width: 14, height: 14 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d={i < 2 ? (i===0?'M1 8L1 1L8 1':'M13 8L13 1L6 1') : (i===2?'M1 6L1 13L8 13':'M13 6L13 13L6 13')} stroke={gold} strokeWidth="1" opacity="0.45" strokeLinecap="round" />
          </svg>
        </div>
      ))}
      {/* Minimal dot texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, ${gold}20 1px, transparent 1px)`, backgroundSize: '32px 32px', opacity: 0.12 }} />
      {/* Bottom faint glow */}
      <Orb bottom="-20%" left="50%" size={280} color={`${gold}12`} blur={65} />
      <Orb top="-15%" left="50%" size={250} color={`${gold}10`} blur={60} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.035, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 13. Raw Power ─────────────────────────────────────────────────────────────
function BgRawPower({ format }) {
  const isStory = format === 'story';
  const red = '#B91C1C';
  const crimson = '#DC2626';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#060304' }}>
      {/* Dark red diagonal brush stroke */}
      <div style={{
        position: 'absolute', top: isStory ? '-8%' : '-6%', left: '-15%', right: '-10%',
        height: isStory ? '55%' : '50%',
        background: `linear-gradient(108deg, ${crimson}55 0%, ${red}35 40%, transparent 75%)`,
        transform: 'skewY(-8deg)', transformOrigin: 'left',
        filter: 'blur(3px)',
      }} />
      {/* Inner highlight */}
      <div style={{
        position: 'absolute', top: isStory ? '2%' : '1%', left: '-5%', width: '55%',
        height: isStory ? '22%' : '18%',
        background: `linear-gradient(108deg, rgba(255,100,100,0.18) 0%, transparent 60%)`,
        transform: 'skewY(-8deg)', transformOrigin: 'left',
        filter: 'blur(8px)',
      }} />
      {/* Paint splatter */}
      {[[20,35],[72,28],[55,52],[85,45],[38,62],[90,18],[12,78],[60,75]].map(([lp,tp],i) => (
        <div key={i} style={{ position: 'absolute', left: `${lp}%`, top: `${tp}%`, width: i%3===0?5:i%2===0?3:2, height: i%3===0?5:i%2===0?3:2, borderRadius: '50%', background: [red,crimson,'#991B1B'][i%3], opacity: 0.2 + i%4*0.05 }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '180px', opacity: 0.10, mixBlendMode: 'overlay' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 65% at 38% 55%, transparent 20%, rgba(0,0,0,0.85) 100%)' }} />
    </div>
  );
}

// ── 14. Light Streams ─────────────────────────────────────────────────────────
function BgLightStreams({ format }) {
  const isStory = format === 'story';
  const h = isStory ? 640 : 450;
  const streaks = Array.from({ length: 22 }, (_, i) => ({
    x1: (i / 22) * 500 - 70, y1: -30,
    x2: (i / 22) * 500 - 70 - 180, y2: h + 30,
    op: i % 4 === 0 ? 0.45 : i % 3 === 0 ? 0.28 : i % 2 === 0 ? 0.16 : 0.09,
    sw: i % 4 === 0 ? 1.5 : i % 3 === 0 ? 1 : 0.6,
    color: i % 5 === 0 ? '#60A5FA' : i % 3 === 0 ? '#C084FC' : '#E2E8F0',
  }));
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#020208' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox={`0 0 360 ${h}`} preserveAspectRatio="none">
        {streaks.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke={s.color} strokeWidth={s.sw} opacity={s.op} strokeLinecap="round" />
        ))}
        {/* Comet heads — brighter nodes */}
        {[3, 7, 12, 17].map(idx => (
          <circle key={idx} cx={streaks[idx].x1} cy={20} r={2}
            fill={streaks[idx].color} opacity={0.7} />
        ))}
      </svg>
      <Orb top="-5%" left="70%" size={200} color="rgba(96,165,250,0.22)" blur={50} />
      <Orb bottom="10%" left="20%" size={160} color="rgba(192,132,252,0.18)" blur={45} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 65% at 55% 50%, transparent 20%, rgba(0,0,0,0.83) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.04, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 15. Prism ─────────────────────────────────────────────────────────────────
function BgPrism({ format }) {
  const isStory = format === 'story';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#040310' }}>
      {/* Iridescent color bands */}
      {[
        { top: '8%', color: '#FF006A', op: 0.12 },
        { top: '24%', color: '#00F5FF', op: 0.10 },
        { top: '40%', color: '#39FF14', op: 0.08 },
        { top: '56%', color: '#FFD700', op: 0.09 },
        { top: '72%', color: '#BF00FF', op: 0.11 },
        { top: '88%', color: '#FF4500', op: 0.09 },
      ].map(({ top, color, op }, i) => (
        <div key={i} style={{
          position: 'absolute', top, left: '-5%', right: '-5%',
          height: isStory ? '14%' : '12%', filter: 'blur(18px)',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: op,
          transform: `skewY(${i%2===0?-0.5:0.5}deg)`,
        }} />
      ))}
      {/* Aurora waves */}
      <div style={{ position: 'absolute', top: '20%', left: '-10%', right: '-10%', height: isStory ? '40%' : '35%', background: 'linear-gradient(90deg, rgba(0,245,255,0.06) 0%, rgba(191,0,255,0.06) 33%, rgba(255,0,106,0.06) 66%, rgba(57,255,20,0.05) 100%)', filter: 'blur(25px)', transform: 'skewY(-2deg)' }} />
      {/* Diffraction center glow */}
      <Orb top="30%" left="50%" size={220} color="rgba(120,80,255,0.18)" blur={55} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 72% 68% at 50% 50%, transparent 18%, rgba(0,0,0,0.88) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.04, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 16. Ignite ────────────────────────────────────────────────────────────────
function BgIgnite({ format }) {
  const isStory = format === 'story';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#080000' }}>
      {/* Fire gradient rising from bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isStory ? '75%' : '70%', background: 'linear-gradient(0deg, #DC2626 0%, #EA580C 22%, #F97316 42%, rgba(251,146,60,0.35) 65%, transparent 100%)' }} />
      {/* Heat ripple wisps */}
      {[[30,30],[55,20],[75,40],[20,55],[65,62]].map(([lp,tp],i) => (
        <div key={i} style={{
          position: 'absolute', left: `${lp}%`, bottom: `${tp-10}%`,
          width: isStory ? 60+i*15 : 45+i*12, height: isStory ? 60+i*15 : 45+i*12,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(251,${100+i*20},30,0.35) 0%, transparent 65%)`,
          filter: 'blur(10px)',
        }} />
      ))}
      {/* Ember particles */}
      {[[15,28],[40,35],[60,18],[80,42],[25,55],[70,30],[50,48],[35,22],[85,58],[45,12]].map(([lp,tp],i) => (
        <div key={i} style={{ position: 'absolute', left: `${lp}%`, bottom: `${tp}%`, width: i%3===0?3:2, height: i%3===0?3:2, borderRadius: '50%', background: ['#FCD34D','#FCA5A5','#F97316'][i%3], opacity: 0.55 + i%3*0.1 }} />
      ))}
      {/* Top dark fade */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isStory ? '35%' : '30%', background: 'linear-gradient(180deg, #080000 0%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 68% 60% at 50% 38%, transparent 20%, rgba(0,0,0,0.82) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.05, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 17. Voltage ───────────────────────────────────────────────────────────────
function BgVoltage({ format }) {
  const isStory = format === 'story';
  const h = isStory ? 640 : 450;
  const blue = '#3B82F6';
  const cyan = '#06B6D4';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#010614' }}>
      {/* Lightning bolt SVGs */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox={`0 0 360 ${h}`} preserveAspectRatio="none">
        {/* Main bolt */}
        <polyline points="200,0 180,120 210,120 170,280 200,280 140,450" fill="none" stroke={blue} strokeWidth="1.5" opacity="0.65" strokeLinejoin="round" />
        <polyline points="200,0 180,120 210,120 170,280 200,280 140,450" fill="none" stroke={cyan} strokeWidth="4" opacity="0.08" strokeLinejoin="round" />
        {/* Secondary bolt */}
        <polyline points="120,80 105,180 125,180 90,320 115,320 70,480" fill="none" stroke={blue} strokeWidth="1" opacity="0.40" strokeLinejoin="round" />
        {/* Horizontal speed streaks */}
        {[0.2, 0.38, 0.52, 0.70, 0.85].map((yF, i) => (
          <line key={i} x1={i%2===0?-10:80} y1={yF*h} x2={i%2===0?280:370} y2={yF*h}
            stroke={blue} strokeWidth="0.8" opacity={0.12 + i*0.04} />
        ))}
      </svg>
      {/* Plasma glow around bolts */}
      <Orb top="0%" left="55%" size={180} color={`${blue}28`} blur={40} />
      <Orb top="30%" left="47%" size={140} color={`${cyan}25`} blur={35} />
      <Orb bottom="15%" left="38%" size={160} color={`${blue}20`} blur={45} />
      {/* Electric ambient */}
      <Orb top="-10%" left="50%" size={300} color={`${blue}18`} blur={65} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 66% at 50% 50%, transparent 22%, rgba(0,0,0,0.85) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.04, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 18. Golden Hour ───────────────────────────────────────────────────────────
function BgGoldenHour({ format }) {
  const isStory = format === 'story';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#050102' }}>
      {/* Warm sunset gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isStory ? '72%' : '66%', background: 'linear-gradient(0deg, #C2410C 0%, #EA580C 18%, #F97316 35%, #FB923C 52%, rgba(253,186,116,0.45) 70%, rgba(251,113,133,0.25) 85%, transparent 100%)' }} />
      {/* Horizon glow */}
      <Orb bottom={isStory?'38%':'34%'} left="50%" size={360} color="rgba(249,115,22,0.30)" blur={55} />
      <Orb bottom={isStory?'43%':'38%'} left="50%" size={200} color="rgba(253,186,116,0.40)" blur={30} />
      {/* Soft bokeh circles */}
      {[[15,40],[82,38],[40,52],[68,48],[25,62],[90,58]].map(([lp,tp],i) => (
        <div key={i} style={{
          position: 'absolute', left: `${lp}%`, top: `${tp}%`,
          width: [28,20,36,16,24,18][i], height: [28,20,36,16,24,18][i],
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${['253,186,116','251,146,60','252,211,77','253,186,116','250,204,21','252,165,165'][i]},0.35) 0%, transparent 70%)`,
          filter: 'blur(8px)',
        }} />
      ))}
      {/* Rose/pink upper accent */}
      <Orb top="-10%" right="10%" size={200} color="rgba(251,113,133,0.22)" blur={60} />
      {/* Top dark fade */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isStory ? '32%' : '28%', background: 'linear-gradient(180deg, #050102 0%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 65% 60% at 50% 42%, transparent 20%, rgba(0,0,0,0.78) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.045, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 19. Trophy Room ───────────────────────────────────────────────────────────
function BgTrophyRoom({ format }) {
  const isStory = format === 'story';
  const gold = '#C9A84C';
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#010413' }}>
      {/* Deep velvet texture — subtle color gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 80% at 50% 30%, rgba(15,20,50,0.8) 0%, rgba(1,4,19,0.95) 100%)' }} />
      {/* Golden God ray from top */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: `${isStory?90:70}px solid transparent`, borderRight: `${isStory?90:70}px solid transparent`, borderTop: `${isStory?260:200}px solid rgba(201,168,76,0.10)`, filter: 'blur(18px)' }} />
      {/* God ray center — bright core */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '30px solid transparent', borderRight: '30px solid transparent', borderTop: `${isStory?200:155}px solid rgba(242,220,144,0.12)`, filter: 'blur(8px)' }} />
      {/* Cascading spotlight orbs */}
      <Orb top="-14%" left="50%" size={340} color="rgba(201,168,76,0.25)" blur={65} />
      <Orb top="-6%" left="50%" size={180} color="rgba(255,230,160,0.30)" blur={40} />
      <Orb top="-1%" left="50%" size={70} color="rgba(255,245,200,0.48)" blur={18} />
      {/* Diamond pattern */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(45deg, ${gold}08 0px, ${gold}08 1px, transparent 1px, transparent 24px), repeating-linear-gradient(-45deg, ${gold}08 0px, ${gold}08 1px, transparent 1px, transparent 24px)`, opacity: 0.5 }} />
      {/* Gold dust */}
      {[[18,22],[82,18],[45,38],[70,30],[28,60],[88,52],[55,70],[35,82]].map(([lp,tp],i) => (
        <div key={i} style={{ position: 'absolute', left: `${lp}%`, top: `${tp}%`, width: 1.5, height: 1.5, borderRadius: '50%', background: gold, opacity: 0.25+i%3*0.08 }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 65% 62% at 50% 50%, transparent 25%, rgba(0,0,0,0.88) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.04, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── 20. Carbon Fiber ──────────────────────────────────────────────────────────
function BgCarbonFiber() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#050505' }}>
      {/* Carbon weave — SVG pattern */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <pattern id="carbon" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#0E0E0E" />
            <rect x="6" y="6" width="6" height="6" fill="#0E0E0E" />
            <rect width="6" height="6" x="0" y="0" fill="none" stroke="#1A1A1A" strokeWidth="0.5" />
            <rect x="6" y="0" width="6" height="6" fill="#111111" />
            <rect x="0" y="6" width="6" height="6" fill="#111111" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#carbon)" opacity="0.8" />
      </svg>
      {/* Metallic sheen sweep */}
      <div style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: '25%', width: '50%', background: 'linear-gradient(90deg, transparent, rgba(80,100,130,0.07), rgba(100,120,150,0.10), rgba(80,100,130,0.07), transparent)', transform: 'skewX(-8deg)' }} />
      {/* Blue-grey ambient */}
      <Orb top="20%" left="60%" size={250} color="rgba(50,80,120,0.15)" blur={70} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 72% 68% at 50% 50%, transparent 25%, rgba(0,0,0,0.82) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '200px', opacity: 0.05, mixBlendMode: 'overlay' }} />
    </div>
  );
}

// ── Registry ──────────────────────────────────────────────────────────────────

export const BG_PRESETS = [
  {
    id: 'gold-rush',
    label: 'Or Premium',
    desc: 'Noir · Or · Luxe',
    preview: 'linear-gradient(135deg, #030200, #3D2800, #C9A84C55, #030200)',
    isPremium: true,
    Component: BgGoldRush,
  },
  {
    id: 'stadium-night',
    label: 'Stadium',
    desc: 'Cinématique · Arena',
    preview: 'linear-gradient(135deg, #020612, #0A1A3A, #1D4ED855, #020612)',
    isPremium: true,
    Component: BgStadiumNight,
  },
  {
    id: 'neon-pulse',
    label: 'Néon Pulse',
    desc: 'Futuriste · Tubes · Glow',
    preview: 'linear-gradient(135deg, #020018, #00F5FF22, #FF00AA22, #020018)',
    isPremium: true,
    Component: BgNeonPulse,
  },
  {
    id: 'frosted-arena',
    label: 'Frosted',
    desc: 'Glass · Depth · Premium',
    preview: 'linear-gradient(135deg, #080814, #6366F135, #8B5CF625, #080814)',
    isPremium: true,
    Component: BgFrostedArena,
  },
  {
    id: 'concrete-jungle',
    label: 'Béton',
    desc: 'Street · Urban · Raw',
    preview: 'linear-gradient(108deg, #0A0A0A, #EA580C44, #0A0A0A)',
    isPremium: false,
    Component: BgConcreteJungle,
  },
  {
    id: 'power-surge',
    label: 'Power Surge',
    desc: 'Explosion · Énergie · Violet',
    preview: 'linear-gradient(135deg, #050008, #7C3AED44, #06B6D433, #050008)',
    isPremium: true,
    Component: BgPowerSurge,
  },
  {
    id: 'blue-steel',
    label: 'Blue Steel',
    desc: 'Navy · Argent · Champions',
    preview: 'linear-gradient(135deg, #010510, #1D4ED855, #C8D8F022, #010510)',
    isPremium: true,
    Component: BgBlueSteel,
  },
  {
    id: 'smoke-lights',
    label: 'Smoke & Lights',
    desc: 'Fumée · Faisceaux · Arena',
    preview: 'linear-gradient(135deg, #010101, #00F5FF18, #FF00AA18, #010101)',
    isPremium: true,
    Component: BgSmokeLights,
  },
  {
    id: 'cyber-grid',
    label: 'Cyber Grid',
    desc: 'Esport · HUD · Cyberpunk',
    preview: 'linear-gradient(135deg, #030015, #00FFD435, #9B4AFF30, #030015)',
    isPremium: true,
    Component: BgCyberGrid,
  },
  {
    id: 'abstract-force',
    label: 'Géométrie',
    desc: 'Abstrait · Angles · Force',
    preview: 'linear-gradient(135deg, #040408, #2563EB30, #EA580C28, #040408)',
    isPremium: false,
    Component: BgAbstractForce,
  },
  {
    id: 'chrome-rush',
    label: 'Chrome',
    desc: 'Métal · Brossé · Argent',
    preview: 'linear-gradient(95deg, #090909, #181818, #111111, #090909)',
    isPremium: true,
    Component: BgChromeRush,
  },
  {
    id: 'noir-luxe',
    label: 'Noir Luxe',
    desc: 'Minimal · Or · Élégance',
    preview: 'linear-gradient(135deg, #000000, #C9A84C25, #000000)',
    isPremium: true,
    Component: BgNoirLuxe,
  },
  {
    id: 'raw-power',
    label: 'Raw Power',
    desc: 'Grunge · Rouge · Intensité',
    preview: 'linear-gradient(108deg, #060304, #B91C1C55, #060304)',
    isPremium: false,
    Component: BgRawPower,
  },
  {
    id: 'light-streams',
    label: 'Light Streams',
    desc: 'Particules · Filantes · Deep',
    preview: 'linear-gradient(135deg, #020208, #60A5FA25, #C084FC20, #020208)',
    isPremium: true,
    Component: BgLightStreams,
  },
  {
    id: 'prism',
    label: 'Prisme',
    desc: 'Holographique · Irisé · Art',
    preview: 'linear-gradient(135deg, #040310, #FF006A22, #00F5FF20, #BF00FF20, #040310)',
    isPremium: true,
    Component: BgPrism,
  },
  {
    id: 'ignite',
    label: 'Ignite',
    desc: 'Feu · Rouge · Braise',
    preview: 'linear-gradient(0deg, #DC2626, #EA580C, #F97316, #050102)',
    isPremium: false,
    Component: BgIgnite,
  },
  {
    id: 'voltage',
    label: 'Voltage',
    desc: 'Électrique · Bleu · Motion',
    preview: 'linear-gradient(135deg, #010614, #3B82F650, #06B6D430, #010614)',
    isPremium: true,
    Component: BgVoltage,
  },
  {
    id: 'golden-hour',
    label: 'Golden Hour',
    desc: 'Coucher · Chaud · Festival',
    preview: 'linear-gradient(0deg, #C2410C, #EA580C, #F97316, #FB923C, #050102)',
    isPremium: false,
    Component: BgGoldenHour,
  },
  {
    id: 'trophy-room',
    label: 'Trophy Room',
    desc: 'Velours · Or · Prestige',
    preview: 'linear-gradient(180deg, #010413, #C9A84C35, #010413)',
    isPremium: true,
    Component: BgTrophyRoom,
  },
  {
    id: 'carbon-fiber',
    label: 'Carbon',
    desc: 'Carbone · Texturé · Tech',
    preview: 'repeating-linear-gradient(45deg, #0E0E0E, #0E0E0E 6px, #111111 6px, #111111 12px)',
    isPremium: false,
    Component: BgCarbonFiber,
  },
];
