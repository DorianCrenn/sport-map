import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useEventConvocations } from '../../hooks/useEventConvocations.js';

function PlayerRow({ player, selected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(player.id)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
        backgroundColor: selected ? 'rgba(99,102,241,0.08)' : 'transparent',
        transition: 'background-color 0.12s',
      }}
    >
      {/* Avatar / numéro */}
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        backgroundColor: selected ? 'rgba(99,102,241,0.15)' : 'var(--sl-surface)',
        border: `1.5px solid ${selected ? '#6366f1' : 'var(--sl-border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', transition: 'all 0.12s',
      }}>
        {player.photo_url
          ? <img src={player.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 12, fontWeight: 800, color: selected ? '#6366f1' : 'var(--sl-t3)' }}>
              {player.number ?? player.name[0]?.toUpperCase()}
            </span>
        }
      </div>

      {/* Nom */}
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: selected ? '#6366f1' : 'var(--sl-t1)' }}>
        {player.name}
      </span>

      {/* Checkbox visuelle */}
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${selected ? '#6366f1' : 'var(--sl-border)'}`,
        backgroundColor: selected ? '#6366f1' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.12s',
      }}>
        {selected && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </div>
    </button>
  );
}

export default function EventFormStepConvocation({ event, onDone, onClose }) {
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);

  const { sendConvocations } = useEventConvocations(event?.id);

  // Charger les joueurs de l'équipe du match
  useEffect(() => {
    if (!event?.clubId && !event?.club_id) { setLoading(false); return; }
    const clubId = event.clubId ?? event.club_id;
    const teamId = event.teamName ?? event.team_name ?? null;

    let q = supabase
      .from('club_players')
      .select('id, name, number, photo_url, team_id, user_id')
      .eq('club_id', String(clubId))
      .eq('is_active', true)
      .order('name');

    // Filtre par équipe — cherche par team_name si teamId est un nom (non-UUID)
    if (teamId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(teamId));
      q = isUUID ? q.eq('team_id', teamId) : q.eq('team_name', teamId);
    }

    q.then(({ data }) => {
      setPlayers(data ?? []);
      // Pré-sélectionner tous les joueurs
      setSelected(new Set((data ?? []).map(p => p.id)));
      setLoading(false);
    });
  }, [event]);

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === players.length) setSelected(new Set());
    else setSelected(new Set(players.map(p => p.id)));
  }

  async function handleSend() {
    if (!selected.size || !event?.id) return;
    setSending(true);
    const { error } = await sendConvocations([...selected]);
    setSending(false);
    if (!error) setSent(true);
  }

  if (sent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 20px', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div>
          <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--sl-t1)', margin: '0 0 6px' }}>
            {selected.size} joueur{selected.size > 1 ? 's' : ''} convoqué{selected.size > 1 ? 's' : ''} !
          </p>
          <p style={{ fontSize: 13, color: 'var(--sl-t3)', margin: 0, lineHeight: 1.5 }}>
            Les joueurs vont recevoir une notification et pourront confirmer leur présence.
          </p>
        </div>
        <button
          onClick={onDone}
          style={{ width: '100%', maxWidth: 280, padding: '13px 0', borderRadius: 14, border: 'none', cursor: 'pointer', backgroundColor: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700 }}
        >
          Terminé
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* En-tête */}
      <div style={{ padding: '16px 20px 10px', borderBottom: '1px solid var(--sl-border)', flexShrink: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: '0 0 3px' }}>
          Convoquer les joueurs
        </p>
        <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: 0 }}>
          {loading ? 'Chargement…' : `${players.length} joueur${players.length > 1 ? 's' : ''} dans l'équipe`}
        </p>
      </div>

      {/* Sélectionner tout */}
      {players.length > 0 && (
        <div style={{ padding: '8px 14px 0', flexShrink: 0 }}>
          <button
            onClick={toggleAll}
            style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {selected.size === players.length ? 'Tout décocher' : 'Tout sélectionner'}
          </button>
        </div>
      )}

      {/* Liste joueurs */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--sl-t3)', fontSize: 13, padding: 20 }}>Chargement…</p>
        ) : players.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--sl-t3)', fontSize: 13, padding: 20 }}>
            Aucun joueur trouvé. Ajoutez des membres via la gestion de l'effectif.
          </p>
        ) : (
          players.map(p => (
            <PlayerRow key={p.id} player={p} selected={selected.has(p.id)} onToggle={toggle} />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--sl-border)', flexShrink: 0, display: 'flex', gap: 10 }}>
        <button
          onClick={onClose}
          style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: '1px solid var(--sl-border)', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600 }}
        >
          Passer
        </button>
        <button
          disabled={!selected.size || sending}
          onClick={handleSend}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 14, border: 'none', cursor: selected.size && !sending ? 'pointer' : 'not-allowed',
            backgroundColor: selected.size && !sending ? '#6366f1' : 'var(--sl-surface)',
            color: selected.size && !sending ? '#fff' : 'var(--sl-t3)',
            fontSize: 13, fontWeight: 700,
          }}
        >
          {sending ? 'Envoi…' : `Convoquer ${selected.size} joueur${selected.size > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
