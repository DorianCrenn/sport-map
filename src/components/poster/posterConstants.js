import { IcoModeles, IcoEquipes, IcoStyle, IcoFond, IcoJoueurs } from './PosterAtoms.jsx';

export const COLOR_PRESETS = [
  { id: 'neon',     label: 'Neon',    color: '#00F5FF' },
  { id: 'fire',     label: 'Feu',     color: '#FF4500' },
  { id: 'gold',     label: 'Or',      color: '#D4AF37' },
  { id: 'electric', label: 'Vert',    color: '#22D96A' },
  { id: 'royal',    label: 'Mauve',   color: '#8b5cf6' },
  { id: 'ice',      label: 'Bleu',    color: '#3b82f6' },
  { id: 'crimson',  label: 'Rouge',   color: '#ef4444' },
  { id: 'solar',    label: 'Orange',  color: '#f97316' },
  { id: 'rose',     label: 'Rose',    color: '#ec4899' },
  { id: 'silver',   label: 'Blanc',   color: '#ffffff' },
  { id: 'lime',     label: 'Lime',    color: '#84cc16' },
  { id: 'cyber',    label: 'Cyber',   color: '#a855f7' },
];

export const SPORT_PALETTE = {
  football:   ['#22c55e', '#4ade80', '#16a34a'],
  tennis:     ['#F5A87C', '#fbbf24', '#C0542A'],
  basket:     ['#EA580C', '#FB923C', '#f97316'],
  handball:   ['#3b82f6', '#60A5FA', '#1d4ed8'],
  volleyball: ['#8b5cf6', '#A78BFA', '#6d28d9'],
  rugby:      ['#ef4444', '#F87171', '#dc2626'],
  padel:      ['#0ea5e9', '#38BDF8', '#0369a1'],
  squash:     ['#0ea5e9', '#38BDF8', '#0369a1'],
  badminton:  ['#10b981', '#34D399', '#059669'],
};

export const TINT_PALETTE = ['#FF4500', '#00F5FF', '#8b5cf6', '#D4AF37', '#22D96A', '#ef4444', '#f97316', '#ec4899'];

export const LAYER_BLOCKS = [
  { id: 'title',   label: 'Titre',       icon: '▬' },
  { id: 'meta',    label: 'Date & lieu', icon: '📍' },
  { id: 'champ',   label: 'Compétition', icon: '🏆' },
  { id: 'vs',      label: 'VS / Score',  icon: '⚔' },
  { id: 'tagline', label: 'Accroche',    icon: '◈' },
  { id: 'teams',   label: 'Équipes',     icon: '◉' },
];

export const PANEL_TABS = [
  { id: 'template', label: 'Modèles',  Icon: IcoModeles },
  { id: 'teams',    label: 'Équipes',  Icon: IcoEquipes },
  { id: 'style',    label: 'Style',    Icon: IcoStyle   },
  { id: 'fond',     label: 'Fond',     Icon: IcoFond    },
  { id: 'joueurs',  label: 'Joueurs',  Icon: IcoJoueurs },
];

// ── AI background / element favorites (localStorage) ─────────────────────────

export const aiBgLsKey = (clubId) => `sl-ai-bgs-${clubId || 'anon'}`;
export function loadSavedBgs(clubId) {
  try { return JSON.parse(localStorage.getItem(aiBgLsKey(clubId)) || '[]'); }
  catch { return []; }
}
export function persistSavedBgs(clubId, bgs) {
  try { localStorage.setItem(aiBgLsKey(clubId), JSON.stringify(bgs)); }
  catch {}
}

export const aiElLsKey = (clubId) => `sl-ai-els-${clubId || 'anon'}`;
export function loadSavedEls(clubId) {
  try { return JSON.parse(localStorage.getItem(aiElLsKey(clubId)) || '[]'); }
  catch { return []; }
}
export function persistSavedEls(clubId, els) {
  try { localStorage.setItem(aiElLsKey(clubId), JSON.stringify(els)); }
  catch {}
}
