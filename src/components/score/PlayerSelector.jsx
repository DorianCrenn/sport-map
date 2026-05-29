import { useState, useRef, useEffect } from 'react';
import { useClubPlayers } from '../../hooks/useClubPlayers.js';

const inp = {
  padding: '7px 10px', borderRadius: 8, fontSize: 12,
  border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)',
  color: 'var(--sl-t1)', outline: 'none', width: '100%', boxSizing: 'border-box',
};

/**
 * Sélecteur de joueur — recherche dans club_players + saisie libre.
 *
 * Props :
 *   clubId     — ID du club pour la recherche DB
 *   value      — { player_id?: string, data: { name, ranking?, club? } }
 *   onChange   — fn(value)
 *   label      — libellé du champ (ex: "Joueur dom.")
 */
export default function PlayerSelector({ clubId, value, onChange, label = 'Joueur' }) {
  const { players, loading } = useClubPlayers(clubId);
  const [query, setQuery]   = useState(value?.data?.name ?? '');
  const [open, setOpen]     = useState(false);
  const [manual, setManual] = useState(!!(value?.data?.ranking || value?.data?.club));
  const containerRef        = useRef(null);

  // Sync query quand la valeur externe change
  useEffect(() => {
    setQuery(value?.data?.name ?? '');
  }, [value?.data?.name]);

  // Fermer le dropdown si clic hors
  useEffect(() => {
    function handleClick(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = query.length >= 1
    ? players.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : players.slice(0, 6);

  function selectPlayer(player) {
    onChange({ player_id: player.id, data: { name: player.name } });
    setQuery(player.name);
    setOpen(false);
    setManual(false);
  }

  function handleQueryChange(v) {
    setQuery(v);
    setOpen(true);
    // Mise à jour partielle (pas encore sélectionné)
    onChange({ player_id: null, data: { ...value?.data, name: v } });
  }

  function setExtra(key, v) {
    onChange({ ...value, data: { ...(value?.data ?? {}), [key]: v } });
  }

  const hasPlayer = !!(value?.player_id || value?.data?.name);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>

      {/* Champ de recherche */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={loading ? 'Chargement…' : 'Nom du joueur…'}
          style={{ ...inp, paddingRight: hasPlayer ? 28 : undefined }}
        />
        {hasPlayer && (
          <button
            onClick={() => { onChange({ player_id: null, data: {} }); setQuery(''); setManual(false); }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sl-t3)', fontSize: 12, padding: 0 }}
          >✕</button>
        )}
      </div>

      {/* Dropdown suggestions */}
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
          backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border-s)',
          borderRadius: 10, boxShadow: 'var(--sl-shadow-xl)', overflow: 'hidden',
          marginTop: 2,
        }}>
          {filtered.map(p => (
            <button
              key={p.id}
              onMouseDown={() => selectPlayer(p)}
              style={{
                width: '100%', padding: '9px 12px', textAlign: 'left',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid var(--sl-border)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {p.photo_url
                  ? <img src={p.photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>{p.name[0]?.toUpperCase()}</span>
                }
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)' }}>{p.name}</div>
                {p.position && <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{p.position}</div>}
              </div>
            </button>
          ))}
          <button
            onMouseDown={() => { setOpen(false); setManual(true); }}
            style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#6366f1', fontWeight: 600 }}
          >
            + Joueur non inscrit (saisie libre)
          </button>
        </div>
      )}

      {/* Saisie libre — classement + club */}
      {manual && (
        <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          <input
            type="text"
            value={value?.data?.ranking ?? ''}
            onChange={e => setExtra('ranking', e.target.value)}
            placeholder="Classement (ex: 15/1)"
            style={{ ...inp, flex: 1 }}
          />
          <input
            type="text"
            value={value?.data?.club ?? ''}
            onChange={e => setExtra('club', e.target.value)}
            placeholder="Club"
            style={{ ...inp, flex: 1 }}
          />
        </div>
      )}
    </div>
  );
}
