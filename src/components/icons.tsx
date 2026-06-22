/**
 * SportLink Icon Set — source unique d'icônes SVG pour toute l'app.
 * 24×24 viewBox · strokeWidth 1.75 par défaut · round caps/joins · currentColor
 *
 * Usage :
 *   import { IconCalendar, IconMegaphone } from '../components/icons'
 *   <IconCalendar size={18} />
 *   <IconMegaphone size={20} color="var(--sl-green)" strokeWidth={2} />
 */

import type { CSSProperties } from 'react';

export interface IconProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

/** Factory — wraps SVG paths in the standard SportLink icon shell */
function ic(paths: React.ReactNode) {
  return function Icon({
    size = 20,
    strokeWidth = 1.75,
    color = 'currentColor',
    style,
    className,
  }: IconProps) {
    return (
      <svg
        width={size} height={size} viewBox="0 0 24 24"
        fill="none" stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round" strokeLinejoin="round"
        style={style} className={className}
        aria-hidden="true"
      >
        {paths}
      </svg>
    );
  };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export const IconPlus = ic(<>
  <line x1="12" y1="5" x2="12" y2="19" />
  <line x1="5" y1="12" x2="19" y2="12" />
</>);

export const IconEdit = ic(<>
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
</>);

export const IconTrash = ic(<>
  <polyline points="3 6 5 6 21 6" />
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  <path d="M10 11v6M14 11v6" />
  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
</>);

export const IconSearch = ic(<>
  <circle cx="11" cy="11" r="8" />
  <line x1="21" y1="21" x2="16.65" y2="16.65" />
</>);

export const IconFilter = ic(
  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
);

export const IconCopy = ic(<>
  <rect x="9" y="9" width="13" height="13" rx="2" />
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
</>);

export const IconShare = ic(<>
  <circle cx="18" cy="5" r="3" />
  <circle cx="6" cy="12" r="3" />
  <circle cx="18" cy="19" r="3" />
  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
</>);

export const IconDownload = ic(<>
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <polyline points="7 10 12 15 17 10" />
  <line x1="12" y1="15" x2="12" y2="3" />
</>);

export const IconUpload = ic(<>
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <polyline points="17 8 12 3 7 8" />
  <line x1="12" y1="3" x2="12" y2="15" />
</>);

export const IconCheck = ic(
  <polyline points="20 6 9 17 4 12" />
);

export const IconX = ic(<>
  <line x1="18" y1="6" x2="6" y2="18" />
  <line x1="6" y1="6" x2="18" y2="18" />
</>);

export const IconRefresh = ic(<>
  <polyline points="23 4 23 10 17 10" />
  <polyline points="1 20 1 14 7 14" />
  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
</>);

// ─── Navigation ───────────────────────────────────────────────────────────────

export const IconChevronRight = ic(
  <polyline points="9 18 15 12 9 6" />
);

export const IconChevronDown = ic(
  <polyline points="6 9 12 15 18 9" />
);

export const IconChevronLeft = ic(
  <polyline points="15 18 9 12 15 6" />
);

export const IconArrowRight = ic(<>
  <line x1="5" y1="12" x2="19" y2="12" />
  <polyline points="12 5 19 12 12 19" />
</>);

export const IconExternalLink = ic(<>
  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  <polyline points="15 3 21 3 21 9" />
  <line x1="10" y1="14" x2="21" y2="3" />
</>);

// ─── Contenu / UI ─────────────────────────────────────────────────────────────

export const IconCalendar = ic(<>
  <rect x="3" y="4" width="18" height="18" rx="2" />
  <line x1="16" y1="2" x2="16" y2="6" />
  <line x1="8" y1="2" x2="8" y2="6" />
  <line x1="3" y1="10" x2="21" y2="10" />
</>);

export const IconClock = ic(<>
  <circle cx="12" cy="12" r="10" />
  <polyline points="12 6 12 12 16 14" />
</>);

export const IconMapPin = ic(<>
  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
  <circle cx="12" cy="10" r="3" />
</>);

export const IconMap = ic(<>
  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
  <line x1="8" y1="2" x2="8" y2="18" />
  <line x1="16" y1="6" x2="16" y2="22" />
</>);

export const IconBell = ic(<>
  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
</>);

export const IconChat = ic(
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
);

export const IconMail = ic(<>
  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
  <polyline points="22 6 12 13 2 6" />
</>);

export const IconPhone = ic(
  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.32-1.34a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
);

export const IconGlobe = ic(<>
  <circle cx="12" cy="12" r="10" />
  <line x1="2" y1="12" x2="22" y2="12" />
  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
</>);

export const IconImage = ic(<>
  <rect x="3" y="3" width="18" height="18" rx="2" />
  <circle cx="8.5" cy="8.5" r="1.5" />
  <polyline points="21 15 16 10 5 21" />
</>);

export const IconQR = ic(<>
  <rect x="3" y="3" width="7" height="7" rx="1" />
  <rect x="14" y="3" width="7" height="7" rx="1" />
  <rect x="3" y="14" width="7" height="7" rx="1" />
  <rect x="4" y="4" width="5" height="5" fill="currentColor" stroke="none" />
  <rect x="15" y="4" width="5" height="5" fill="currentColor" stroke="none" />
  <rect x="4" y="15" width="5" height="5" fill="currentColor" stroke="none" />
  <line x1="14" y1="14" x2="14" y2="14" strokeWidth={3} strokeLinecap="round" />
  <line x1="17" y1="14" x2="17" y2="17" />
  <line x1="20" y1="14" x2="20" y2="14" strokeWidth={3} strokeLinecap="round" />
  <line x1="14" y1="17" x2="14" y2="17" strokeWidth={3} strokeLinecap="round" />
  <line x1="20" y1="17" x2="20" y2="20" />
  <line x1="14" y1="20" x2="17" y2="20" />
  <line x1="20" y1="20" x2="20" y2="20" strokeWidth={3} strokeLinecap="round" />
</>);

// ─── Statut / Feedback ────────────────────────────────────────────────────────

export const IconInfo = ic(<>
  <circle cx="12" cy="12" r="10" />
  <line x1="12" y1="16" x2="12" y2="12" />
  <line x1="12" y1="8" x2="12.01" y2="8" />
</>);

export const IconAlertTriangle = ic(<>
  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
  <line x1="12" y1="9" x2="12" y2="13" />
  <line x1="12" y1="17" x2="12.01" y2="17" />
</>);

export const IconAlertCircle = ic(<>
  <circle cx="12" cy="12" r="10" />
  <line x1="12" y1="8" x2="12" y2="12" />
  <line x1="12" y1="16" x2="12.01" y2="16" />
</>);

export const IconCheckCircle = ic(<>
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
  <polyline points="22 4 12 14.01 9 11.01" />
</>);

export const IconStar = ic(
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
);

export const IconHeart = ic(
  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
);

export const IconBulb = ic(<>
  <line x1="9" y1="18" x2="15" y2="18" />
  <line x1="10" y1="22" x2="14" y2="22" />
  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
</>);

export const IconFlame = ic(
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
);

export const IconZap = ic(
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
);

export const IconRocket = ic(<>
  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
  <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
  <path d="M15 12v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
</>);

export const IconSparkles = ic(<>
  <path d="M12 3L13.5 8.5H19L14.5 11.5L16 17L12 14L8 17L9.5 11.5L5 8.5H10.5L12 3Z" />
  <path d="M5 3L5.5 4.5L7 5L5.5 5.5L5 7L4.5 5.5L3 5L4.5 4.5Z" />
  <path d="M19 15L19.5 16.5L21 17L19.5 17.5L19 19L18.5 17.5L17 17L18.5 16.5Z" />
</>);

// ─── Admin / Business ─────────────────────────────────────────────────────────

export const IconBarChart = ic(<>
  <line x1="18" y1="20" x2="18" y2="10" />
  <line x1="12" y1="20" x2="12" y2="4" />
  <line x1="6" y1="20" x2="6" y2="14" />
  <line x1="2" y1="20" x2="22" y2="20" />
</>);

export const IconTrendUp = ic(<>
  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
  <polyline points="16 7 22 7 22 13" />
</>);

export const IconClipboard = ic(<>
  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  <rect x="8" y="2" width="8" height="4" rx="1" />
</>);

export const IconShield = ic(
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
);

export const IconUsers = ic(<>
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
  <circle cx="9" cy="7" r="4" />
  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
</>);

export const IconUserPlus = ic(<>
  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
  <circle cx="9" cy="7" r="4" />
  <line x1="19" y1="8" x2="19" y2="14" />
  <line x1="22" y1="11" x2="16" y2="11" />
</>);

export const IconCreditCard = ic(<>
  <rect x="1" y="4" width="22" height="16" rx="2" />
  <line x1="1" y1="10" x2="23" y2="10" />
</>);

export const IconPackage = ic(<>
  <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
  <line x1="12" y1="22.08" x2="12" y2="12" />
</>);

export const IconKey = ic(
  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
);

export const IconLock = ic(<>
  <rect x="3" y="11" width="18" height="11" rx="2" />
  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
</>);

export const IconSettings = ic(<>
  <circle cx="12" cy="12" r="3" />
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
</>);

export const IconMegaphone = ic(<>
  <path d="M3 11l19-9v18L3 13" />
  <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
</>);

export const IconBriefcase = ic(<>
  <rect x="2" y="7" width="20" height="14" rx="2" />
  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
</>);

export const IconPalette = ic(<>
  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
  <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
</>);

export const IconList = ic(<>
  <line x1="8" y1="6" x2="21" y2="6" />
  <line x1="8" y1="12" x2="21" y2="12" />
  <line x1="8" y1="18" x2="21" y2="18" />
  <line x1="3" y1="6" x2="3.01" y2="6" />
  <line x1="3" y1="12" x2="3.01" y2="12" />
  <line x1="3" y1="18" x2="3.01" y2="18" />
</>);

export const IconGrid = ic(<>
  <rect x="3" y="3" width="7" height="7" />
  <rect x="14" y="3" width="7" height="7" />
  <rect x="3" y="14" width="7" height="7" />
  <rect x="14" y="14" width="7" height="7" />
</>);

// ─── Sport-specific ───────────────────────────────────────────────────────────

/** Jersey / Shirt (👕) */
export const IconShirt = ic(
  <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
);

/** Trophy (🏆) */
export const IconTrophy = ic(<>
  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
  <path d="M4 22h16" />
  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
  <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
</>);

/** Medal (🏅) */
export const IconMedal = ic(<>
  <path d="M7.21 15L2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
  <path d="M11 12 5.12 2.2" />
  <path d="M13 12 18.88 2.2" />
  <path d="M8 7h8" />
  <circle cx="12" cy="17" r="5" />
  <path d="M12 15v3.56a1 1 0 0 0 .5.86l1.5.87" />
</>);

/** Target / Bullseye (🎯) */
export const IconTarget = ic(<>
  <circle cx="12" cy="12" r="10" />
  <circle cx="12" cy="12" r="6" />
  <circle cx="12" cy="12" r="2" />
</>);

/** Running (🏃) */
export const IconRun = ic(<>
  <circle cx="16" cy="4" r="1.5" />
  <path d="M6 22L9 15.5l2 2L14.5 12l-2.5-4.5 3-2.5" />
  <path d="M10 8.5L7.5 13l2.5-1.5" />
  <path d="M15.5 15l2 5" />
</>);

/** Dumbbell / Fitness (🏋️) */
export const IconDumbbell = ic(<>
  <path d="M6 5v14" />
  <path d="M18 5v14" />
  <path d="M6 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3" />
  <path d="M18 8h3a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-3" />
  <line x1="6" y1="12" x2="18" y2="12" />
  <path d="M4 9v6M20 9v6" strokeWidth={2.5} />
</>);

/** Car / Carpooling (🚗) */
export const IconCar = ic(<>
  <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h13l4 4v6H5z" />
  <circle cx="7.5" cy="17.5" r="1.5" />
  <circle cx="17.5" cy="17.5" r="1.5" />
</>);

/** Stadium (🏟) */
export const IconStadium = ic(<>
  <ellipse cx="12" cy="8" rx="9" ry="4" />
  <path d="M3 8v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8" />
  <path d="M6 8v8M18 8v8" />
  <ellipse cx="12" cy="14" rx="3" ry="1.5" />
</>);

/** Whistle */
export const IconWhistle = ic(<>
  <circle cx="6" cy="13" r="3" />
  <path d="M6 10V8" />
  <path d="M9 13h10a2 2 0 0 0 0-4H9" />
  <path d="M17 9V6l3-3" />
</>);

/** Crown / Champion (👑) */
export const IconCrown = ic(
  <path d="M2 18l4-8 6 5 6-5 4 8H2z" />
);

/** Handshake / Partner (🤝) */
export const IconHandshake = ic(<>
  <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
  <path d="M12 5.36L8.87 8.5a2.13 2.13 0 0 0 0 3h0a2.13 2.13 0 0 0 3.02 0L12 11.4l.11.1a2.13 2.13 0 0 0 3.02 0h0a2.13 2.13 0 0 0 0-3L12 5.36Z" />
</>);

/** Siren / Urgent (🚨) */
export const IconSiren = ic(<>
  <path d="M12 2a7 7 0 0 1 7 7v3H5V9a7 7 0 0 1 7-7z" />
  <rect x="3" y="12" width="18" height="4" rx="1" />
  <path d="M12 2v2" />
  <path d="M4.22 5.22L5.64 6.64" />
  <path d="M19.78 5.22l-1.42 1.42" />
  <line x1="12" y1="16" x2="12" y2="19" />
</>);

/** Football / Ball result (⚽) */
export const IconBall = ic(<>
  <circle cx="12" cy="12" r="10" />
  <path d="M12 2L9.5 7H6L4.5 12.5 8 16l4-2 4 2 3.5-3.5L18 7h-3.5L12 2z" />
</>);

/** Party / Event (🎉) */
export const IconParty = ic(<>
  <path d="M5.8 11.3L2 22l10.7-3.79" />
  <path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01M22 2l-2.24 7.35A2 2 0 0 1 18 11l-5 .7a2 2 0 0 0-1.6 1.25L10 18l-2-2 .7-1.4a2 2 0 0 0-1-2.7L3 10l2.5-3.5" />
</>);

/** Ticket / Event entry */
export const IconTicket = ic(<>
  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
  <line x1="9" y1="12" x2="15" y2="12" />
</>);

/** Question mark / FAQ */
export const IconHelpCircle = ic(<>
  <circle cx="12" cy="12" r="10" />
  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
  <line x1="12" y1="17" x2="12.01" y2="17" />
</>);
