import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import type { SportLinkClub } from '../types/sportlink.js';

function uid()     { return `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }
function genRowId() { return `r_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }

interface ClubBlock {
  id: string;
  type: string;
  data: Record<string, unknown>;
  enabled: boolean;
  span: number;
  rowId: string;
}

interface Typography { titleFont: string; bodyFont: string; }
interface Theme { primary: string; accent: string | null; heroStyle: string; }

type PartialClub = Pick<SportLinkClub, 'id' | 'name' | 'sport' | 'city'>;

function defaultBlocks(club: PartialClub): ClubBlock[] {
  return [
    { id: uid(), type: 'title',           data: { text: `Bienvenue au ${club.name}`, level: 'h1' },                                                         enabled: true, span: 12, rowId: genRowId() },
    { id: uid(), type: 'text',            data: { content: `Le ${club.name} est un club de ${club.sport} basé à ${club.city}. Cliquez sur "Modifier" pour personnaliser cette page.` }, enabled: true, span: 12, rowId: genRowId() },
    { id: uid(), type: 'upcoming-events', data: { sport: club.sport, maxItems: 5 },                                                                           enabled: true, span: 12, rowId: genRowId() },
  ];
}

function defaultData(type: string, club: PartialClub | null): Record<string, unknown> {
  switch (type) {
    case 'title':           return { text: 'Nouvelle section', level: 'h2' };
    case 'text':            return { content: 'Ajoutez votre texte ici…' };
    case 'upcoming-events': return { sport: club?.sport ?? '', maxItems: 5 };
    case 'training':        return { sessions: [] };
    case 'image':           return { src: '', caption: '', fit: 'cover', ratio: '16/9' };
    case 'matches':         return { matches: [] };
    case 'about':           return { description: '', founded: '', address: '', prices: [], contacts: [] };
    default:                return {};
  }
}

export const FONT_OPTIONS = [
  { key: 'Oswald',  label: 'Oswald',  weights: '400;600;700' },
  { key: 'Inter',   label: 'Inter',   weights: '400;500;600' },
  { key: 'Manrope', label: 'Manrope', weights: '400;600;700' },
  { key: 'Poppins', label: 'Poppins', weights: '400;600;700' },
  { key: 'Raleway', label: 'Raleway', weights: '400;600;700' },
];

export const DEFAULT_TYPOGRAPHY: Typography = { titleFont: 'Oswald', bodyFont: 'Inter' };
export const DEFAULT_THEME: Theme = { primary: '#0F1E3A', accent: null, heroStyle: 'solid' };

export const HERO_STYLE_OPTIONS = [
  { key: 'solid',    label: 'Uni' },
  { key: 'gradient', label: 'Dégradé' },
  { key: 'night',    label: 'Nuit' },
  { key: 'aurora',   label: 'Aurore' },
  { key: 'jersey',   label: 'Maillot' },
  { key: 'stadium',  label: 'Stade' },
];

function svgUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const PITCH_SVG = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130">` +
  `<rect x="10" y="10" width="180" height="110" rx="4" stroke="rgba(255,255,255,0.22)" stroke-width="1.5" fill="rgba(255,255,255,0.03)"/>` +
  `<line x1="100" y1="10" x2="100" y2="120" stroke="rgba(255,255,255,0.18)" stroke-width="1.2"/>` +
  `<circle cx="100" cy="65" r="22" stroke="rgba(255,255,255,0.18)" stroke-width="1.2" fill="none"/>` +
  `<circle cx="100" cy="65" r="2" fill="rgba(255,255,255,0.3)"/>` +
  `<rect x="50" y="10" width="100" height="32" stroke="rgba(255,255,255,0.14)" stroke-width="1" fill="none"/>` +
  `<rect x="50" y="88" width="100" height="32" stroke="rgba(255,255,255,0.14)" stroke-width="1" fill="none"/>` +
  `<rect x="72" y="10" width="56" height="13" stroke="rgba(255,255,255,0.10)" stroke-width="0.8" fill="none"/>` +
  `<rect x="72" y="107" width="56" height="13" stroke="rgba(255,255,255,0.10)" stroke-width="0.8" fill="none"/>` +
  `<rect x="85" y="4" width="30" height="8" rx="1" stroke="rgba(255,255,255,0.18)" stroke-width="0.8" fill="rgba(255,255,255,0.06)"/>` +
  `<rect x="85" y="118" width="30" height="8" rx="1" stroke="rgba(255,255,255,0.18)" stroke-width="0.8" fill="rgba(255,255,255,0.06)"/>` +
  `<circle cx="100" cy="30" r="1.8" fill="rgba(255,255,255,0.25)"/>` +
  `<circle cx="100" cy="100" r="1.8" fill="rgba(255,255,255,0.25)"/>` +
  `<path d="M10,15 A5,5 0 0,1 15,10" stroke="rgba(255,255,255,0.13)" stroke-width="0.8" fill="none"/>` +
  `<path d="M185,10 A5,5 0 0,1 190,15" stroke="rgba(255,255,255,0.13)" stroke-width="0.8" fill="none"/>` +
  `<path d="M10,115 A5,5 0 0,0 15,120" stroke="rgba(255,255,255,0.13)" stroke-width="0.8" fill="none"/>` +
  `<path d="M185,120 A5,5 0 0,0 190,115" stroke="rgba(255,255,255,0.13)" stroke-width="0.8" fill="none"/>` +
  `</svg>`,
);

export function getHeroBackground(primary: string, accent: string | null, heroStyle: string): Record<string, string> {
  const a = accent || '#22C55E';
  switch (heroStyle) {
    case 'gradient': return { background: `linear-gradient(135deg, ${primary} 0%, ${a} 100%)` };
    case 'night':    return { background: `linear-gradient(175deg, #060f1e 0%, #0d1b36 40%, ${primary} 100%)` };
    case 'aurora':   return { background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 35%, ${a}77 70%, ${primary}99 100%)` };
    case 'jersey':   return {
      backgroundColor:  primary,
      backgroundImage: [
        `linear-gradient(160deg, ${primary} 0%, ${a}22 100%)`,
        `repeating-linear-gradient(45deg,  transparent 0px, transparent 3px, rgba(255,255,255,0.07) 3px, rgba(255,255,255,0.07) 4px)`,
        `repeating-linear-gradient(-45deg, transparent 0px, transparent 3px, rgba(255,255,255,0.07) 3px, rgba(255,255,255,0.07) 4px)`,
      ].join(', '),
    };
    case 'stadium':  return {
      backgroundColor:    primary,
      backgroundImage:    `${PITCH_SVG}, linear-gradient(160deg, ${primary} 0%, ${a}33 100%)`,
      backgroundSize:     'auto 92%, cover',
      backgroundPosition: 'center center, center',
      backgroundRepeat:   'no-repeat, no-repeat',
    };
    default: return { backgroundColor: primary };
  }
}

export function injectGoogleFont(fontKey: string): void {
  const weights = FONT_OPTIONS.find(f => f.key === fontKey)?.weights ?? '400;600;700';
  const id = `gfont-${fontKey.toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id   = id;
  link.rel  = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontKey.replace(/ /g, '+')}:wght@${weights}&display=swap`;
  document.head.appendChild(link);
}

export function useClubAnalytics(clubId: string): number {
  const key = `club-views-${clubId}`;
  const [views, setViews] = useState(() => {
    try { return parseInt(localStorage.getItem(key) ?? '0', 10) || 0; } catch { return 0; }
  });

  useEffect(() => {
    const next = views + 1;
    setViews(next);
    try { localStorage.setItem(key, String(next)); } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return views;
}

interface UseClubPageResult {
  blocks: ClubBlock[];
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  addBlock: (type: string, afterId?: string | null) => void;
  addBlockToRow: (rowId: string, type: string) => void;
  updateBlock: (id: string, patch: Record<string, unknown>) => void;
  setBlockSpan: (id: string, newSpan: number) => void;
  moveBlockInRow: (id: string, dir: 'left' | 'right') => void;
  deleteBlock: (id: string) => void;
  reorderRows: (newRows: { blocks: ClubBlock[] }[]) => void;
  toggleBlock: (id: string) => void;
  resetPage: () => void;
  typography: Typography;
  setTypography: (patch: Partial<Typography>) => void;
  theme: Theme;
  setTheme: (patch: Partial<Theme>) => void;
}

export function useClubPage(club: PartialClub): UseClubPageResult {
  const [blocks, setBlocks]        = useState<ClubBlock[]>(() => defaultBlocks(club));
  const [typography, setTypoState] = useState<Typography>(DEFAULT_TYPOGRAPHY);
  const [theme, setThemeState]     = useState<Theme>(DEFAULT_THEME);
  const [isEditing, setIsEditing]  = useState(false);
  const [loaded, setLoaded]        = useState(false);

  const latestRef  = useRef({ blocks: defaultBlocks(club), typography: DEFAULT_TYPOGRAPHY, theme: DEFAULT_THEME });
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clubIdStr  = String(club.id);

  useEffect(() => {
    setLoaded(false);
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }

    let cancelled = false;
    supabase
      .from('club_pages')
      .select('blocks, typography, theme')
      .eq('club_id', clubIdStr)
      .maybeSingle()
      .then(({ data, error }: { data: { blocks?: ClubBlock[]; typography?: Partial<Typography>; theme?: Partial<Theme> } | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (error) {
          console.error('[ClubPage] fetch failed, using localStorage:', error.message);
          try {
            const raw = localStorage.getItem(`club-page-${clubIdStr}`);
            if (raw) {
              const migrated = (JSON.parse(raw) as ClubBlock[]).map(b => ({ rowId: genRowId(), span: 12, ...b }));
              setBlocks(migrated); latestRef.current.blocks = migrated;
            }
            const typoRaw = localStorage.getItem(`club-typography-${clubIdStr}`);
            if (typoRaw) {
              const t = { ...DEFAULT_TYPOGRAPHY, ...(JSON.parse(typoRaw) as Partial<Typography>) };
              setTypoState(t); latestRef.current.typography = t;
            }
          } catch { /* ignore */ }
        } else if (data) {
          const saved = data.blocks ?? [];
          const b = saved.length > 0
            ? saved.map(bl => ({ rowId: genRowId(), span: 12, ...bl }))
            : defaultBlocks(club);
          const t = { ...DEFAULT_TYPOGRAPHY, ...(data.typography ?? {}) };
          const th = { ...DEFAULT_THEME, ...(data.theme ?? {}) };
          setBlocks(b); setTypoState(t); setThemeState(th);
          latestRef.current = { blocks: b, typography: t, theme: th };
        } else {
          try {
            const raw     = localStorage.getItem(`club-page-${clubIdStr}`);
            const typoRaw = localStorage.getItem(`club-typography-${clubIdStr}`);
            if (raw) {
              const b = (JSON.parse(raw) as ClubBlock[]).map(bl => ({ rowId: genRowId(), span: 12, ...bl }));
              const t = typoRaw ? { ...DEFAULT_TYPOGRAPHY, ...(JSON.parse(typoRaw) as Partial<Typography>) } : DEFAULT_TYPOGRAPHY;
              setBlocks(b); setTypoState(t);
              latestRef.current = { blocks: b, typography: t, theme: DEFAULT_THEME };
              supabase.from('club_pages').upsert({ club_id: clubIdStr, blocks: b, typography: t }, { onConflict: 'club_id' })
                .then(({ error: e }: { error: { message: string } | null }) => { if (e) console.error('[ClubPage] migration upsert failed:', e.message); });
            }
          } catch { /* ignore */ }
        }
        setLoaded(true);
      });
    return () => {
      cancelled = true;
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubIdStr]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { blocks: b, typography: t } = latestRef.current;
      const { error } = await supabase.from('club_pages').upsert(
        { club_id: clubIdStr, blocks: b, typography: t, theme: latestRef.current.theme, updated_at: new Date().toISOString() },
        { onConflict: 'club_id' },
      ) as { error: { message: string } | null };
      if (error) {
        console.error('[ClubPage] save failed, fallback to localStorage:', error.message);
        try { localStorage.setItem(`club-page-${clubIdStr}`, JSON.stringify(b)); localStorage.setItem(`club-typography-${clubIdStr}`, JSON.stringify(t)); } catch { /* ignore */ }
      }
    }, 1500);
  }, [clubIdStr]);

  useEffect(() => { latestRef.current = { blocks, typography, theme }; injectGoogleFont(typography.titleFont); injectGoogleFont(typography.bodyFont); }, [blocks, typography, theme]);
  useEffect(() => { if (loaded) scheduleSave(); }, [blocks, typography, theme, loaded, scheduleSave]);

  const setTypography = useCallback((patch: Partial<Typography>) => { setTypoState(prev => ({ ...prev, ...patch })); }, []);
  const setTheme      = useCallback((patch: Partial<Theme>) =>       { setThemeState(prev => ({ ...prev, ...patch })); }, []);

  const addBlock = (type: string, afterId: string | null = null) => {
    const block: ClubBlock = { id: uid(), type, data: defaultData(type, club), enabled: true, span: 12, rowId: genRowId() };
    setBlocks(prev => {
      if (!afterId) return [...prev, block];
      const idx = prev.findIndex(b => b.id === afterId);
      const next = [...prev]; next.splice(idx + 1, 0, block); return next;
    });
  };

  const addBlockToRow = (rowId: string, type: string) => {
    setBlocks(prev => {
      const rowBlocks = prev.filter(b => b.rowId === rowId);
      const usedSpan  = rowBlocks.reduce((s, b) => s + (b.span ?? 12), 0);
      const remaining = 12 - usedSpan;
      if (remaining <= 0) return prev;
      const newBlock: ClubBlock = { id: uid(), type, data: defaultData(type, club), enabled: true, span: remaining, rowId };
      const lastIdx = prev.reduce((acc, b, i) => b.rowId === rowId ? i : acc, -1);
      const next = [...prev]; next.splice(lastIdx + 1, 0, newBlock); return next;
    });
  };

  const updateBlock  = (id: string, patch: Record<string, unknown>) =>
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, data: { ...b.data, ...patch } } : b));

  const setBlockSpan = (id: string, newSpan: number) => {
    setBlocks(prev => {
      const block = prev.find(b => b.id === id);
      if (!block) return prev;
      const rowBlocks = prev.filter(b => b.rowId === block.rowId);
      const otherSpan = rowBlocks.filter(b => b.id !== id).reduce((s, b) => s + (b.span ?? 12), 0);
      if (newSpan === 12 && rowBlocks.length > 1)
        return prev.map(b => b.id === id ? { ...b, span: 12, rowId: genRowId() } : b);
      if (otherSpan + newSpan > 12) return prev;
      return prev.map(b => b.id === id ? { ...b, span: newSpan } : b);
    });
  };

  const moveBlockInRow = (id: string, dir: 'left' | 'right') => {
    setBlocks(prev => {
      const block = prev.find(b => b.id === id);
      if (!block) return prev;
      const rowIds   = prev.filter(b => b.rowId === block.rowId).map(b => b.id);
      const pos      = rowIds.indexOf(id);
      const targetPos = pos + (dir === 'left' ? -1 : 1);
      if (targetPos < 0 || targetPos >= rowIds.length) return prev;
      const i1 = prev.findIndex(b => b.id === id);
      const i2 = prev.findIndex(b => b.id === rowIds[targetPos]);
      const next = [...prev]; [next[i1], next[i2]] = [next[i2], next[i1]]; return next;
    });
  };

  const deleteBlock  = (id: string) => setBlocks(prev => prev.filter(b => b.id !== id));
  const reorderRows  = (newRows: { blocks: ClubBlock[] }[]) => setBlocks(newRows.flatMap(r => r.blocks));
  const toggleBlock  = (id: string) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  const resetPage    = () => setBlocks(defaultBlocks(club));

  return {
    blocks, isEditing, setIsEditing,
    addBlock, addBlockToRow, updateBlock, setBlockSpan, moveBlockInRow,
    deleteBlock, reorderRows, toggleBlock, resetPage,
    typography, setTypography, theme, setTheme,
  };
}
