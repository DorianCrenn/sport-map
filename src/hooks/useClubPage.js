import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

function uid()    { return `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }
function genRowId() { return `r_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }

function defaultBlocks(club) {
  return [
    { id: uid(), type: 'title',          data: { text: `Bienvenue au ${club.name}`, level: 'h1' },                                           enabled: true, span: 12, rowId: genRowId() },
    { id: uid(), type: 'text',           data: { content: `Le ${club.name} est un club de ${club.sport} basé à ${club.city}. Cliquez sur "Modifier" pour personnaliser cette page.` }, enabled: true, span: 12, rowId: genRowId() },
    { id: uid(), type: 'upcoming-events',data: { sport: club.sport, maxItems: 5 },                                                            enabled: true, span: 12, rowId: genRowId() },
  ];
}

function defaultData(type, club) {
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

const FONT_OPTIONS = [
  { key: 'Oswald',   label: 'Oswald',   weights: '400;600;700' },
  { key: 'Inter',    label: 'Inter',    weights: '400;500;600' },
  { key: 'Manrope',  label: 'Manrope',  weights: '400;600;700' },
  { key: 'Poppins',  label: 'Poppins',  weights: '400;600;700' },
  { key: 'Raleway',  label: 'Raleway',  weights: '400;600;700' },
];

const DEFAULT_TYPOGRAPHY = { titleFont: 'Oswald', bodyFont: 'Inter' };

export { FONT_OPTIONS, DEFAULT_TYPOGRAPHY };

function injectGoogleFont(fontKey) {
  const weights = FONT_OPTIONS.find(f => f.key === fontKey)?.weights ?? '400;600;700';
  const id = `gfont-${fontKey.toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontKey.replace(/ /g, '+')}:wght@${weights}&display=swap`;
  document.head.appendChild(link);
}

// ── Analytics (localStorage, per-browser) ───────────────────────────────────

export function useClubAnalytics(clubId) {
  const key = `club-views-${clubId}`;
  const [views, setViews] = useState(() => {
    try { return parseInt(localStorage.getItem(key) ?? '0', 10) || 0; } catch { return 0; }
  });

  useEffect(() => {
    const next = views + 1;
    setViews(next);
    try { localStorage.setItem(key, String(next)); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return views;
}

// ── Club page hook (Supabase-backed) ────────────────────────────────────────

export function useClubPage(club) {
  const [blocks, setBlocks]           = useState(() => defaultBlocks(club));
  const [typography, setTypoState]    = useState(DEFAULT_TYPOGRAPHY);
  const [isEditing, setIsEditing]     = useState(false);
  const [loaded, setLoaded]           = useState(false);

  const latestRef  = useRef({ blocks: defaultBlocks(club), typography: DEFAULT_TYPOGRAPHY });
  const saveTimer  = useRef(null);
  const clubIdStr  = String(club.id);

  // ── Load from Supabase ────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('club_pages')
      .select('blocks, typography')
      .eq('club_id', clubIdStr)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[ClubPage] fetch failed, using localStorage:', error.message);
          try {
            const raw = localStorage.getItem(`club-page-${clubIdStr}`);
            if (raw) {
              const parsed = JSON.parse(raw);
              const migrated = parsed.map(b => ({ rowId: genRowId(), span: 12, ...b }));
              setBlocks(migrated);
              latestRef.current.blocks = migrated;
            }
            const typoRaw = localStorage.getItem(`club-typography-${clubIdStr}`);
            if (typoRaw) {
              const t = { ...DEFAULT_TYPOGRAPHY, ...JSON.parse(typoRaw) };
              setTypoState(t);
              latestRef.current.typography = t;
            }
          } catch {}
        } else if (data) {
          const saved = data.blocks ?? [];
          const b = saved.length > 0
            ? saved.map(bl => ({ rowId: genRowId(), span: 12, ...bl }))
            : defaultBlocks(club);
          const t = { ...DEFAULT_TYPOGRAPHY, ...(data.typography ?? {}) };
          setBlocks(b);
          setTypoState(t);
          latestRef.current = { blocks: b, typography: t };
        } else {
          // No Supabase row yet — migrate localStorage data if any
          try {
            const raw     = localStorage.getItem(`club-page-${clubIdStr}`);
            const typoRaw = localStorage.getItem(`club-typography-${clubIdStr}`);
            if (raw) {
              const b = JSON.parse(raw).map(bl => ({ rowId: genRowId(), span: 12, ...bl }));
              const t = typoRaw ? { ...DEFAULT_TYPOGRAPHY, ...JSON.parse(typoRaw) } : DEFAULT_TYPOGRAPHY;
              setBlocks(b);
              setTypoState(t);
              latestRef.current = { blocks: b, typography: t };
              supabase.from('club_pages')
                .upsert({ club_id: clubIdStr, blocks: b, typography: t }, { onConflict: 'club_id' })
                .then(({ error }) => { if (error) console.error('[ClubPage] migration upsert failed:', error.message); });
            }
          } catch {}
        }
        setLoaded(true);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubIdStr]);

  // ── Debounced save ────────────────────────────────────────────────────────

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { blocks: b, typography: t } = latestRef.current;
      const { error } = await supabase
        .from('club_pages')
        .upsert(
          { club_id: clubIdStr, blocks: b, typography: t, updated_at: new Date().toISOString() },
          { onConflict: 'club_id' }
        );
      if (error) {
        console.error('[ClubPage] save failed, fallback to localStorage:', error.message);
        try {
          localStorage.setItem(`club-page-${clubIdStr}`, JSON.stringify(b));
          localStorage.setItem(`club-typography-${clubIdStr}`, JSON.stringify(t));
        } catch {}
      }
    }, 1500);
  }, [clubIdStr]);

  useEffect(() => {
    latestRef.current.blocks = blocks;
    if (loaded) scheduleSave();
  }, [blocks, loaded, scheduleSave]);

  useEffect(() => {
    latestRef.current.typography = typography;
    injectGoogleFont(typography.titleFont);
    injectGoogleFont(typography.bodyFont);
    if (loaded) scheduleSave();
  }, [typography, loaded, scheduleSave]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const setTypography = useCallback((patch) => {
    setTypoState(prev => ({ ...prev, ...patch }));
  }, []);

  const addBlock = (type, afterId = null) => {
    const block = { id: uid(), type, data: defaultData(type, club), enabled: true, span: 12, rowId: genRowId() };
    setBlocks(prev => {
      if (!afterId) return [...prev, block];
      const idx = prev.findIndex(b => b.id === afterId);
      const next = [...prev];
      next.splice(idx + 1, 0, block);
      return next;
    });
  };

  const addBlockToRow = (rowId, type) => {
    setBlocks(prev => {
      const rowBlocks = prev.filter(b => b.rowId === rowId);
      const usedSpan  = rowBlocks.reduce((s, b) => s + (b.span ?? 12), 0);
      const remaining = 12 - usedSpan;
      if (remaining <= 0) return prev;
      const newBlock = { id: uid(), type, data: defaultData(type, club), enabled: true, span: remaining, rowId };
      const lastIdx  = prev.reduce((acc, b, i) => b.rowId === rowId ? i : acc, -1);
      const next = [...prev];
      next.splice(lastIdx + 1, 0, newBlock);
      return next;
    });
  };

  const updateBlock = (id, patch) =>
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, data: { ...b.data, ...patch } } : b));

  const setBlockSpan = (id, newSpan) => {
    setBlocks(prev => {
      const block     = prev.find(b => b.id === id);
      if (!block) return prev;
      const rowBlocks = prev.filter(b => b.rowId === block.rowId);
      const otherSpan = rowBlocks.filter(b => b.id !== id).reduce((s, b) => s + (b.span ?? 12), 0);
      if (newSpan === 12 && rowBlocks.length > 1)
        return prev.map(b => b.id === id ? { ...b, span: 12, rowId: genRowId() } : b);
      if (otherSpan + newSpan > 12) return prev;
      return prev.map(b => b.id === id ? { ...b, span: newSpan } : b);
    });
  };

  const moveBlockInRow = (id, dir) => {
    setBlocks(prev => {
      const block    = prev.find(b => b.id === id);
      if (!block) return prev;
      const rowIds   = prev.filter(b => b.rowId === block.rowId).map(b => b.id);
      const pos      = rowIds.indexOf(id);
      const targetPos = pos + (dir === 'left' ? -1 : 1);
      if (targetPos < 0 || targetPos >= rowIds.length) return prev;
      const i1 = prev.findIndex(b => b.id === id);
      const i2 = prev.findIndex(b => b.id === rowIds[targetPos]);
      const next = [...prev];
      [next[i1], next[i2]] = [next[i2], next[i1]];
      return next;
    });
  };

  const deleteBlock  = (id) => setBlocks(prev => prev.filter(b => b.id !== id));
  const reorderRows  = (newRows) => setBlocks(newRows.flatMap(r => r.blocks));
  const toggleBlock  = (id) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  const resetPage    = () => setBlocks(defaultBlocks(club));

  return {
    blocks, isEditing, setIsEditing,
    addBlock, addBlockToRow,
    updateBlock, setBlockSpan, moveBlockInRow,
    deleteBlock, reorderRows, toggleBlock, resetPage,
    typography, setTypography,
  };
}
