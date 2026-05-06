import { useState, useEffect } from 'react';

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
    default:                return {};
  }
}

export function useClubPage(club) {
  const storageKey = `club-page-${club.id}`;

  const [blocks, setBlocks] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaultBlocks(club);
      const parsed = JSON.parse(raw);
      // migrate: ensure rowId and span on every block
      return parsed.map(b => ({ rowId: genRowId(), span: 12, ...b }));
    } catch {
      return defaultBlocks(club);
    }
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(blocks));
  }, [blocks, storageKey]);

  // ── Helpers ────────────────────────────────────────────────────────────────

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

  // Add a block to an existing row (fills the remaining span)
  const addBlockToRow = (rowId, type) => {
    setBlocks(prev => {
      const rowBlocks = prev.filter(b => b.rowId === rowId);
      const usedSpan  = rowBlocks.reduce((s, b) => s + (b.span ?? 12), 0);
      const remaining = 12 - usedSpan;
      if (remaining <= 0) return prev;

      // Allocate span: prefer equal split
      const newSpan = remaining;
      const newBlock = { id: uid(), type, data: defaultData(type, club), enabled: true, span: newSpan, rowId };

      // Insert right after the last block of this row
      const lastIdx = prev.reduce((acc, b, i) => b.rowId === rowId ? i : acc, -1);
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

      // Going full-width but others exist → move to own row
      if (newSpan === 12 && rowBlocks.length > 1) {
        return prev.map(b => b.id === id ? { ...b, span: 12, rowId: genRowId() } : b);
      }
      // Would overflow → deny
      if (otherSpan + newSpan > 12) return prev;

      return prev.map(b => b.id === id ? { ...b, span: newSpan } : b);
    });
  };

  // Swap block left or right within its row
  const moveBlockInRow = (id, dir) => {
    setBlocks(prev => {
      const block     = prev.find(b => b.id === id);
      if (!block) return prev;
      const rowIds    = prev.filter(b => b.rowId === block.rowId).map(b => b.id);
      const pos       = rowIds.indexOf(id);
      const targetPos = pos + (dir === 'left' ? -1 : 1);
      if (targetPos < 0 || targetPos >= rowIds.length) return prev;

      const targetId  = rowIds[targetPos];
      const i1 = prev.findIndex(b => b.id === id);
      const i2 = prev.findIndex(b => b.id === targetId);
      const next = [...prev];
      [next[i1], next[i2]] = [next[i2], next[i1]];
      return next;
    });
  };

  const deleteBlock = (id) =>
    setBlocks(prev => prev.filter(b => b.id !== id));

  // Reorder entire rows (accepts flat blocks array or rows array)
  const reorderRows = (newRows) => {
    // newRows is an array of {rowId, blocks:[]} — flatten
    setBlocks(newRows.flatMap(r => r.blocks));
  };

  const toggleBlock = (id) =>
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));

  const resetPage = () => setBlocks(defaultBlocks(club));

  return {
    blocks, isEditing, setIsEditing,
    addBlock, addBlockToRow,
    updateBlock, setBlockSpan, moveBlockInRow,
    deleteBlock, reorderRows, toggleBlock, resetPage,
  };
}
