/* eslint-disable react-refresh/only-export-components */
// src/components/poster/posterElements.jsx
// Decorative overlay elements for PosterStudio
// Each component: props = { h, color } — width is always 360px

const r = n => Math.round(n);

// ── 1. Smoke ──────────────────────────────────────────────────────────────────
function ElSmoke({ h = 640, color = '#aaaaaa' }) {
  return (
    <svg width="360" height={h} viewBox={`0 0 360 ${h}`} fill="none" style={{ position: 'absolute', inset: 0 }}>
      <path
        d={`M70,${r(h)} C50,${r(h*.75)} 112,${r(h*.60)} 80,${r(h*.43)} C58,${r(h*.28)} 102,${r(h*.15)} 74,${r(h*.06)}`}
        stroke={color} strokeWidth="50" strokeLinecap="round" opacity="0.14"
      />
      <path
        d={`M200,${r(h)} C228,${r(h*.78)} 168,${r(h*.64)} 200,${r(h*.47)} C228,${r(h*.32)} 186,${r(h*.20)} 212,${r(h*.09)}`}
        stroke={color} strokeWidth="65" strokeLinecap="round" opacity="0.09"
      />
      <path
        d={`M312,${r(h)} C292,${r(h*.82)} 342,${r(h*.67)} 316,${r(h*.50)} C300,${r(h*.36)} 334,${r(h*.22)} 298,${r(h*.10)}`}
        stroke={color} strokeWidth="40" strokeLinecap="round" opacity="0.11"
      />
    </svg>
  );
}

// ── 2. Lightning ──────────────────────────────────────────────────────────────
function ElLightning({ h = 640, color = '#FFD700' }) {
  const t = v => r(h * v);
  return (
    <svg width="360" height={h} viewBox={`0 0 360 ${h}`} fill="none" style={{ position: 'absolute', inset: 0 }}>
      {/* Outer glow */}
      <path
        d={`M202,0 L168,${t(.33)} L200,${t(.33)} L148,${t(.66)} L210,${t(.66)} L160,${h}`}
        stroke={color} strokeWidth="20" strokeLinejoin="round" opacity="0.12"
      />
      {/* Branch 1 */}
      <path d={`M182,${t(.28)} L128,${t(.44)}`} stroke={color} strokeWidth="2" opacity="0.5" />
      {/* Branch 2 */}
      <path d={`M164,${t(.57)} L230,${t(.71)}`} stroke={color} strokeWidth="2" opacity="0.5" />
      {/* Branch mini */}
      <path d={`M148,${t(.40)} L110,${t(.50)}`} stroke={color} strokeWidth="1.5" opacity="0.35" />
      {/* Main bolt */}
      <path
        d={`M202,0 L168,${t(.33)} L200,${t(.33)} L148,${t(.66)} L210,${t(.66)} L160,${h}`}
        stroke={color} strokeWidth="3.5" strokeLinejoin="round"
      />
    </svg>
  );
}

// ── 3. Cracks ────────────────────────────────────────────────────────────────
function ElCracks({ h = 640, color = '#ffffff' }) {
  const t = v => r(h * v);
  const ox = 258, oy = t(.42);
  return (
    <svg width="360" height={h} viewBox={`0 0 360 ${h}`} fill="none" style={{ position: 'absolute', inset: 0 }}>
      <path d={`M${ox},${oy} L${ox-190},${oy-92} L${ox-234},${oy-74}`} stroke={color} strokeWidth="2" opacity="0.70" />
      <path d={`M${ox},${oy} L${ox-158},${oy+128} L${ox-196},${oy+176}`} stroke={color} strokeWidth="1.5" opacity="0.65" />
      <path d={`M${ox},${oy} L${ox+78},${oy-174} L${ox+62},${oy-238}`} stroke={color} strokeWidth="1.5" opacity="0.60" />
      <path d={`M${ox},${oy} L${ox+88},${oy+196}`} stroke={color} strokeWidth="1.5" opacity="0.55" />
      <path d={`M${ox},${oy} L${ox-42},${oy-208} L${ox-22},${oy-284}`} stroke={color} strokeWidth="1" opacity="0.50" />
      <path d={`M${ox},${oy} L${ox-96},${oy+260}`} stroke={color} strokeWidth="1" opacity="0.45" />
      {/* Sub-cracks off main arms */}
      <path d={`M${ox-124},${oy-52} L${ox-166},${oy-30} M${ox-124},${oy-52} L${ox-132},${oy-94}`} stroke={color} strokeWidth="1" opacity="0.38" />
      <path d={`M${ox-98},${oy+82} L${ox-146},${oy+72} M${ox-98},${oy+82} L${ox-108},${oy+122}`} stroke={color} strokeWidth="1" opacity="0.35" />
      <path d={`M${ox+50},${oy-100} L${ox+90},${oy-92}`} stroke={color} strokeWidth="1" opacity="0.30" />
      {/* Origin */}
      <circle cx={ox} cy={oy} r="4" fill={color} opacity="0.70" />
      <circle cx={ox} cy={oy} r="11" fill={color} opacity="0.15" />
    </svg>
  );
}

// ── 4. Torn paper edge ────────────────────────────────────────────────────────
function ElTear({ h = 640, color = '#ffffff' }) {
  const midY = r(h * 0.50);
  const pts = [
    [0, midY - 6], [18, midY + 10], [34, midY - 14], [50, midY + 6],
    [68, midY - 10], [86, midY + 12], [104, midY - 6], [122, midY + 8],
    [140, midY - 16], [158, midY + 4], [176, midY - 8], [194, midY + 14],
    [212, midY - 4], [230, midY + 10], [248, midY - 12], [266, midY + 6],
    [284, midY - 8], [302, midY + 12], [320, midY - 6], [338, midY + 8],
    [360, midY - 4],
  ];
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const fillBelow = `${line} L360,${h} L0,${h} Z`;
  return (
    <svg width="360" height={h} viewBox={`0 0 360 ${h}`} style={{ position: 'absolute', inset: 0 }}>
      {/* Shadow fill below tear */}
      <path d={fillBelow} fill={color} opacity="0.07" />
      {/* Tear edge highlight */}
      <path d={line} stroke={color} strokeWidth="2.5" fill="none" opacity="0.65" />
      {/* Subtle top-edge sheen */}
      <path d={line} stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" fill="none" opacity="0.5" />
    </svg>
  );
}

// ── 5. Soccer ball ────────────────────────────────────────────────────────────
function ElBallFoot({ h = 640, color = '#ffffff' }) {
  const cx = 298, cy = r(h * 0.78), R = 158;
  return (
    <svg width="360" height={h} viewBox={`0 0 360 ${h}`} fill="none" style={{ position: 'absolute', inset: 0 }}>
      <circle cx={cx} cy={cy} r={R} stroke={color} strokeWidth="2" opacity="0.30" />
      {/* Center pentagon */}
      <polygon
        points={`${cx},${cy-28} ${cx+26},${cy-9} ${cx+16},${cy+22} ${cx-16},${cy+22} ${cx-26},${cy-9}`}
        stroke={color} strokeWidth="1.5" fill="none" opacity="0.32"
      />
      {/* Top arm */}
      <path d={`M${cx},${cy-28} L${cx+8},${cy-56} M${cx},${cy-28} L${cx-8},${cy-56}`} stroke={color} strokeWidth="1.5" opacity="0.28" />
      {/* Right arm */}
      <path d={`M${cx+26},${cy-9} L${cx+52},${cy-18} M${cx+26},${cy-9} L${cx+54},${cy+8}`} stroke={color} strokeWidth="1.5" opacity="0.28" />
      {/* Bottom-right arm */}
      <path d={`M${cx+16},${cy+22} L${cx+38},${cy+44}`} stroke={color} strokeWidth="1.5" opacity="0.28" />
      {/* Bottom-left arm */}
      <path d={`M${cx-16},${cy+22} L${cx-38},${cy+44}`} stroke={color} strokeWidth="1.5" opacity="0.28" />
      {/* Left arm */}
      <path d={`M${cx-26},${cy-9} L${cx-54},${cy-18} M${cx-26},${cy-9} L${cx-54},${cy+8}`} stroke={color} strokeWidth="1.5" opacity="0.28" />
    </svg>
  );
}

// ── 6. Basketball ─────────────────────────────────────────────────────────────
function ElBallBasket({ h = 640, color = '#E85D04' }) {
  const cx = 292, cy = r(h * 0.74), R = 152;
  return (
    <svg width="360" height={h} viewBox={`0 0 360 ${h}`} fill="none" style={{ position: 'absolute', inset: 0 }}>
      <circle cx={cx} cy={cy} r={R} stroke={color} strokeWidth="2.5" opacity="0.35" />
      {/* Horizontal seam */}
      <path d={`M${cx - R},${cy} A${R},${R} 0 0,1 ${cx + R},${cy}`} stroke={color} strokeWidth="2" opacity="0.35" />
      {/* Left arc seam */}
      <path d={`M${cx},${cy - R} C${cx-65},${cy - r(R*.60)} ${cx-65},${cy + r(R*.60)} ${cx},${cy + R}`}
        stroke={color} strokeWidth="2" opacity="0.35" />
      {/* Right arc seam */}
      <path d={`M${cx},${cy - R} C${cx+65},${cy - r(R*.60)} ${cx+65},${cy + r(R*.60)} ${cx},${cy + R}`}
        stroke={color} strokeWidth="2" opacity="0.35" />
    </svg>
  );
}

// ── 7. Stars ──────────────────────────────────────────────────────────────────
function ElStars({ h = 640, color = '#FFD700' }) {
  const t = v => r(h * v);
  const stars = [
    [52, t(.11), 22, 0.70],
    [302, t(.08), 16, 0.60],
    [142, t(.22), 14, 0.55],
    [28,  t(.44), 10, 0.50],
    [332, t(.30), 20, 0.65],
    [178, t(.60), 12, 0.50],
    [262, t(.55), 10, 0.45],
    [78,  t(.72), 18, 0.60],
    [316, t(.70), 12, 0.50],
    [200, t(.18), 8,  0.40],
  ];
  function starPath(cx, cy, size) {
    const pts = Array.from({ length: 8 }, (_, i) => {
      const angle = (i * Math.PI / 4) - Math.PI / 2;
      const radius = i % 2 === 0 ? size : size * 0.38;
      return [r(cx + radius * Math.cos(angle)), r(cy + radius * Math.sin(angle))];
    });
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';
  }
  return (
    <svg width="360" height={h} viewBox={`0 0 360 ${h}`} style={{ position: 'absolute', inset: 0 }}>
      {stars.map(([cx, cy, size, op], i) => (
        <path key={i} d={starPath(cx, cy, size)} fill={color} opacity={op} />
      ))}
    </svg>
  );
}

// ── 8. Sparks / burst ─────────────────────────────────────────────────────────
function ElSparks({ h = 640, color = '#FFD700' }) {
  const cx = 180, cy = r(h * 0.44);
  const sparks = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const len = 55 + (i % 5) * 25;
    const x1 = r(cx + Math.cos(angle) * 14);
    const y1 = r(cy + Math.sin(angle) * 14);
    const x2 = r(cx + Math.cos(angle) * len);
    const y2 = r(cy + Math.sin(angle) * len);
    const op = 0.25 + (i % 4) * 0.18;
    return { x1, y1, x2, y2, op, sw: i % 4 === 0 ? 2 : 1 };
  });
  return (
    <svg width="360" height={h} viewBox={`0 0 360 ${h}`} fill="none" style={{ position: 'absolute', inset: 0 }}>
      {sparks.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke={color} strokeWidth={s.sw} strokeLinecap="round" opacity={s.op} />
      ))}
      <circle cx={cx} cy={cy} r="5" fill={color} opacity="0.85" />
      <circle cx={cx} cy={cy} r="14" fill={color} opacity="0.20" />
      <circle cx={cx} cy={cy} r="28" fill={color} opacity="0.07" />
    </svg>
  );
}

// ── 9. Confetti ───────────────────────────────────────────────────────────────
function ElConfetti({ h = 640, color = '#FF6B6B' }) {
  const t = v => r(h * v);
  const palette = [color, '#FFD700', '#60A5FA', '#4ADE80', '#F472B6', '#A78BFA'];
  const items = [
    [40,  t(.07), 12, 5,  20],  [102, t(.14), 8,  4, -30],
    [200, t(.06), 10, 4,  15],  [280, t(.11), 14, 5, -45],
    [58,  t(.24), 8,  4,  60],  [162, t(.19), 10, 4, -20],
    [322, t(.21), 8,  3,  35],  [130, t(.34), 12, 5, -60],
    [232, t(.30), 8,  4,  45],  [18,  t(.40), 10, 4, -15],
    [300, t(.37), 14, 5,  30],  [170, t(.50), 8,  3, -50],
    [78,  t(.54), 10, 4,  20],  [258, t(.59), 8,  4, -35],
    [350, t(.44), 12, 5,  55],  [140, t(.66), 10, 4,  10],
    [50,  t(.70), 8,  4, -25],  [290, t(.76), 12, 5,  40],
    [200, t(.80), 10, 3, -10],  [110, t(.85), 8,  4,  70],
  ];
  return (
    <svg width="360" height={h} viewBox={`0 0 360 ${h}`} style={{ position: 'absolute', inset: 0 }}>
      {items.map(([x, y, w, hh, rot], i) => (
        <rect key={i}
          x={x - w / 2} y={y - hh / 2} width={w} height={hh}
          fill={palette[i % palette.length]}
          opacity={0.45 + (i % 4) * 0.12}
          transform={`rotate(${rot},${x},${y})`}
        />
      ))}
    </svg>
  );
}

// ── 10. Flames ────────────────────────────────────────────────────────────────
function ElFire({ h = 640, color = '#FF4500' }) {
  const t = v => r(h * v);
  return (
    <svg width="360" height={h} viewBox={`0 0 360 ${h}`} style={{ position: 'absolute', inset: 0 }}>
      {/* Left flame */}
      <path
        d={`M78,${h} C74,${t(.78)} 38,${t(.70)} 54,${t(.56)} C64,${t(.46)} 90,${t(.52)} 84,${t(.39)} C94,${t(.52)} 116,${t(.42)} 100,${t(.32)} C106,${t(.46)} 122,${t(.57)} 110,${t(.70)} C126,${t(.62)} 132,${t(.78)} 132,${h} Z`}
        fill={color} opacity="0.24"
      />
      {/* Center flame (tallest) */}
      <path
        d={`M154,${h} C149,${t(.70)} 108,${t(.60)} 128,${t(.43)} C143,${t(.31)} 170,${t(.39)} 164,${t(.22)} C174,${t(.36)} 200,${t(.26)} 190,${t(.15)} C196,${t(.31)} 216,${t(.41)} 204,${t(.56)} C220,${t(.46)} 226,${t(.66)} 222,${h} Z`}
        fill={color} opacity="0.32"
      />
      {/* Inner center highlight */}
      <path
        d={`M175,${h} C172,${t(.78)} 148,${t(.68)} 160,${t(.55)} C170,${t(.46)} 185,${t(.52)} 182,${t(.40)} C188,${t(.50)} 200,${t(.42)} 194,${t(.30)} C198,${t(.42)} 210,${t(.56)} 204,${t(.70)} C212,${t(.64)} 215,${t(.78)} 212,${h} Z`}
        fill={color} opacity="0.18"
      />
      {/* Right flame */}
      <path
        d={`M250,${h} C246,${t(.80)} 214,${t(.73)} 230,${t(.61)} C240,${t(.51)} 266,${t(.56)} 260,${t(.43)} C270,${t(.53)} 288,${t(.43)} 275,${t(.34)} C280,${t(.48)} 298,${t(.58)} 286,${t(.72)} C300,${t(.63)} 306,${t(.78)} 302,${h} Z`}
        fill={color} opacity="0.22"
      />
    </svg>
  );
}

// ── 11. Geometric shards ──────────────────────────────────────────────────────
function ElShards({ h = 640, color = '#00F5FF' }) {
  const t = v => r(h * v);
  const shards = [
    { d: `M318,${t(.09)} L352,${t(.20)} L304,${t(.29)} Z`,     op: 0.38 },
    { d: `M8,${t(.14)} L44,${t(.07)} L48,${t(.26)} Z`,          op: 0.32 },
    { d: `M278,${t(.37)} L334,${t(.31)} L320,${t(.52)} Z`,      op: 0.36 },
    { d: `M28,${t(.44)} L66,${t(.37)} L54,${t(.60)} Z`,         op: 0.30 },
    { d: `M238,${t(.64)} L292,${t(.59)} L268,${t(.79)} Z`,      op: 0.34 },
    { d: `M78,${t(.70)} L122,${t(.65)} L100,${t(.84)} Z`,       op: 0.28 },
    { d: `M342,${t(.70)} L360,${t(.61)} L360,${t(.82)} Z`,      op: 0.22 },
    { d: `M160,${t(.12)} L190,${t(.05)} L195,${t(.20)} Z`,      op: 0.26 },
  ];
  return (
    <svg width="360" height={h} viewBox={`0 0 360 ${h}`} style={{ position: 'absolute', inset: 0 }}>
      {shards.map((s, i) => (
        <path key={i} d={s.d} fill={color} stroke={color} strokeWidth="1" opacity={s.op} />
      ))}
    </svg>
  );
}

// ── 12. Speed lines ───────────────────────────────────────────────────────────
function ElSpeed({ h = 640, color = '#ffffff' }) {
  const t = v => r(h * v);
  // Horizontal scan lines with slight perspective
  const lineCount = 18;
  const topY = t(.06), botY = t(.94);
  const step = (botY - topY) / (lineCount - 1);
  const lines = Array.from({ length: lineCount }, (_, i) => {
    const y = topY + i * step;
    const op = i === 0 || i === lineCount - 1 ? 0.04 : i % 5 === 0 ? 0.22 : i % 2 === 0 ? 0.12 : 0.07;
    const sw = i % 5 === 0 ? 1.5 : 0.75;
    return { y: r(y), op, sw };
  });
  return (
    <svg width="360" height={h} viewBox={`0 0 360 ${h}`} fill="none" style={{ position: 'absolute', inset: 0 }}>
      {lines.map((l, i) => (
        <line key={i} x1={0} y1={l.y} x2={360} y2={l.y}
          stroke={color} strokeWidth={l.sw} opacity={l.op} />
      ))}
      {/* Subtle diagonal streaks */}
      {Array.from({ length: 6 }, (_, i) => {
        const y1 = topY + i * ((botY - topY) / 5);
        const vanishY = t(.48);
        return (
          <line key={`d${i}`}
            x1={0} y1={r(y1)} x2={360} y2={vanishY}
            stroke={color} strokeWidth="0.5" opacity="0.05"
          />
        );
      })}
    </svg>
  );
}

// ── Element library ───────────────────────────────────────────────────────────

export const ELEMENT_LIBRARY = [
  {
    id: 'smoke',
    label: 'Fumée',
    icon: '💨',
    defaultColor: '#aaaaaa',
    preview: 'linear-gradient(135deg, #222 0%, #888 100%)',
    Component: ElSmoke,
  },
  {
    id: 'lightning',
    label: 'Éclair',
    icon: '⚡',
    defaultColor: '#FFD700',
    preview: 'linear-gradient(135deg, #111 0%, #FFD70080 100%)',
    Component: ElLightning,
  },
  {
    id: 'cracks',
    label: 'Fissures',
    icon: '💥',
    defaultColor: '#ffffff',
    preview: 'radial-gradient(circle at 70% 42%, #fff2 0%, #111 70%)',
    Component: ElCracks,
  },
  {
    id: 'tear',
    label: 'Déchirure',
    icon: '✂',
    defaultColor: '#ffffff',
    preview: 'linear-gradient(180deg, #111 48%, #fff3 48%, #fff2 52%, #111 52%)',
    Component: ElTear,
  },
  {
    id: 'ball-foot',
    label: 'Ballon foot',
    icon: '⚽',
    defaultColor: '#ffffff',
    preview: 'radial-gradient(circle at 76% 80%, #fff3 0%, #111 55%)',
    Component: ElBallFoot,
  },
  {
    id: 'ball-basket',
    label: 'Ballon basket',
    icon: '🏀',
    defaultColor: '#E85D04',
    preview: 'radial-gradient(circle at 74% 78%, #E85D0440 0%, #111 55%)',
    Component: ElBallBasket,
  },
  {
    id: 'stars',
    label: 'Étoiles',
    icon: '✦',
    defaultColor: '#FFD700',
    preview: 'radial-gradient(circle at 80% 10%, #FFD70050 0%, #111 50%), radial-gradient(circle at 30% 22%, #FFD70040 0%, transparent 40%)',
    Component: ElStars,
  },
  {
    id: 'sparks',
    label: 'Étincelles',
    icon: '✨',
    defaultColor: '#FFD700',
    preview: 'radial-gradient(circle at 50% 44%, #FFD70050 0%, #111 65%)',
    Component: ElSparks,
  },
  {
    id: 'confetti',
    label: 'Confettis',
    icon: '🎊',
    defaultColor: '#FF6B6B',
    preview: 'linear-gradient(135deg, #1a0a20 0%, #0a0a1a 100%)',
    Component: ElConfetti,
  },
  {
    id: 'fire',
    label: 'Flammes',
    icon: '🔥',
    defaultColor: '#FF4500',
    preview: 'linear-gradient(0deg, #FF450050 0%, #111 60%)',
    Component: ElFire,
  },
  {
    id: 'shards',
    label: 'Éclats',
    icon: '💎',
    defaultColor: '#00F5FF',
    preview: 'linear-gradient(135deg, #001020 0%, #003344 100%)',
    Component: ElShards,
  },
  {
    id: 'speed',
    label: 'Speed lines',
    icon: '◀◀',
    defaultColor: '#ffffff',
    preview: 'repeating-linear-gradient(0deg, #fff2, #fff2 1px, #111 1px, #111 12px)',
    Component: ElSpeed,
  },
];
