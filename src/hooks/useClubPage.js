import { useState, useEffect } from 'react';

function uid() {
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function defaultBlocks(club) {
  return [
    {
      id: uid(),
      type: 'title',
      data: { text: `Bienvenue au ${club.name}`, level: 'h1' },
      enabled: true,
      span: 12,
    },
    {
      id: uid(),
      type: 'text',
      data: { content: `Le ${club.name} est un club de ${club.sport} basé à ${club.city}. Cliquez sur "Modifier" pour personnaliser cette page.` },
      enabled: true,
      span: 12,
    },
    {
      id: uid(),
      type: 'upcoming-events',
      data: { sport: club.sport, maxItems: 5 },
      enabled: true,
      span: 12,
    },
  ];
}

function defaultData(type, club) {
  switch (type) {
    case 'title':           return { text: 'Nouvelle section', level: 'h2' };
    case 'text':            return { content: 'Ajoutez votre texte ici…' };
    case 'upcoming-events': return { sport: club.sport, maxItems: 5 };
    case 'training':        return { sessions: [] };
    case 'image':           return { src: '', caption: '', fit: 'cover', ratio: '16/9' };
    default:                return {};
  }
}

export function useClubPage(club) {
  const storageKey = `club-page-${club.id}`;

  const [blocks, setBlocks] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaultBlocks(club);
      // migrate: ensure every block has a span field
      const parsed = JSON.parse(raw);
      return parsed.map(b => ({ span: 12, ...b }));
    } catch {
      return defaultBlocks(club);
    }
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(blocks));
  }, [blocks, storageKey]);

  const addBlock = (type, afterId = null) => {
    const block = { id: uid(), type, data: defaultData(type, club), enabled: true, span: 12 };
    setBlocks(prev => {
      if (!afterId) return [...prev, block];
      const idx = prev.findIndex(b => b.id === afterId);
      const next = [...prev];
      next.splice(idx + 1, 0, block);
      return next;
    });
  };

  const updateBlock = (id, patch) =>
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, data: { ...b.data, ...patch } } : b));

  const setBlockSpan = (id, span) =>
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, span } : b));

  const deleteBlock = (id) =>
    setBlocks(prev => prev.filter(b => b.id !== id));

  const reorderBlocks = (newOrder) => setBlocks(newOrder);

  const moveBlock = (id, dir) =>
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      const to = dir === 'up' ? idx - 1 : idx + 1;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });

  const toggleBlock = (id) =>
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));

  const resetPage = () => setBlocks(defaultBlocks(club));

  return {
    blocks, isEditing, setIsEditing,
    addBlock, updateBlock, setBlockSpan, deleteBlock,
    reorderBlocks, moveBlock, toggleBlock, resetPage,
  };
}
