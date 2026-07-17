import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useEventConvocations } from '../../hooks/useEventConvocations.js';
import { useConvocationEmail } from '../../hooks/useConvocationEmail.js';
import { convocationEmailResult } from './convocationEmailResult.js';

interface Player {
  id: string | number;
  name: string;
  number?: number | null;
  photo_url?: string | null;
  team_id?: string | null;
  user_id?: string | null;
  email?: string | null;
}

interface PlayerRowProps {
  player: Player;
  selected: boolean;
  onToggle: (id: string | number) => void;
}

function PlayerRow({ player, selected, onToggle }: PlayerRowProps) {
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
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--sl-radius-md)', flexShrink: 0,
        backgroundColor: selected ? 'rgba(99,102,241,0.15)' : 'var(--sl-surface)',
        border: `1.5px solid ${selected ? '#6366f1' : 'var(--sl-border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', transition: 'all 0.12s',
      }}>
        {player.photo_url
          ? <img src={player.photo_url} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 12, fontWeight: 800, color: selected ? '#6366f1' : 'var(--sl-t3)' }}>
              {player.number ?? player.name[0]?.toUpperCase()}
            </span>
        }
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: selected ? '#6366f1' : 'var(--sl-t1)' }}>{player.name}</span>
        {player.email && <span style={{ fontSize: 10, color: '#2563eb', opacity: 0.7 }}>📧</span>}
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: 'var(--sl-radius-sm)', flexShrink: 0,
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

interface EventFormStepConvocationProps {
  event: Record<string, any>;
  onDone: () => void;
  onClose: () => void;
}

export default function EventFormStepConvocation({ event, onDone, onClose }: EventFormStepConvocationProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent]       = useState(false);
  const [emailCount, setEmailCount]     = useState(0);
  const [emailResult, setEmailResult]   = useState<{ sent: number; total: number } | null>(null);

  const { currentUser } = useAuth();
  const { sendConvocations } = useEventConvocations(event?.id) as any;
  const { sendEmails } = useConvocationEmail();

  useEffect(() => {
    if (!event?.clubId && !event?.club_id) { setLoading(false); return; }
    const clubId = event.clubId ?? event.club_id;
    const teamId = event.teamName ?? event.team_name ?? null;

    let q = supabase
      .from('club_players')
      .select('id, name, number, photo_url, team_id, user_id, email')
      .eq('club_id', String(clubId))
      .eq('is_active', true)
      .order('name') as any;

    if (teamId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(teamId));
      q = isUUID ? q.eq('team_id', teamId) : q.eq('team_name', teamId);
    }

    q.then(({ data }: { data: Player[] | null }) => {
      setPlayers(data ?? []);
      setSelected(new Set((data ?? []).map(p => p.id)));
      setLoading(false);
    });
  }, [event]);

  function toggle(id: string | number) {
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

  async function triggerPushForPlayers(playerList: Player[]) {
    const withUserId = playerList.filter(p => p.user_id);
    if (!withUserId.length) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const title       = `⚽ Convocation — ${event.title ?? event.homeTeam ?? 'Événement'}`;
    const body        = `${event.clubName ?? event.club_name ?? 'Votre club'} vous convoque. Répondez maintenant.`;
    await Promise.allSettled(withUserId.map(p =>
      fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: anonKey },
        body: JSON.stringify({ user_id: p.user_id, title, body, tag: `convoc-${event.id}` }),
      }).catch(() => {})
    ));
  }

  async function handleSend() {
    if (!selected.size || !event?.id) return;
    setSending(true);
    const { error } = await sendConvocations([...selected]);
    if (!error) {
      const selectedPlayers = players.filter(p => selected.has(p.id));
      triggerPushForPlayers(selectedPlayers);
      const withEmail = players.filter(p => selected.has(p.id) && p.email?.trim());
      setEmailCount(withEmail.length);
      setSent(true);
    }
    setSending(false);
  }

  async function handleSendEmails() {
    if (!event?.id || emailSending) return;
    setEmailSending(true);
    // Récupérer les IDs de convocation depuis la DB
    const { data: convocs } = await supabase
      .from('event_convocations')
      .select('id, player_id')
      .eq('event_id', event.id) as { data: { id: string; player_id: string }[] | null };

    const convocMap = new Map((convocs ?? []).map(c => [c.player_id, c.id]));
    const emailPlayers = players
      .filter(p => selected.has(p.id) && p.email?.trim())
      .map(p => ({
        convocationId: convocMap.get(String(p.id)) ?? '',
        name: p.name,
        email: p.email!.trim(),
      }))
      .filter(ep => ep.convocationId);

    if (!emailPlayers.length) { setEmailSending(false); setEmailResult({ sent: 0, total: 0 }); setEmailSent(true); return; }

    const { sentCount } = await sendEmails({
      eventId: String(event.id),
      clubId: event.clubId ?? event.club_id,
      clubName: event.clubName ?? event.club_name ?? 'Mon club',
      eventTitle: event.title ?? event.homeTeam ?? 'Événement',
      eventDate: event.date,
      eventTime: event.time,
      eventVenue: event.venue,
      coachName: currentUser?.name ?? undefined,
      players: emailPlayers,
    });

    setEmailSending(false);
    setEmailResult({ sent: sentCount, total: emailPlayers.length });
    setEmailSent(true);
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

        {/* Envoi par email si des joueurs ont un email */}
        {emailCount > 0 && !emailSent && (
          <div style={{ width: '100%', maxWidth: 320, borderRadius: 'var(--sl-radius-2xl)', border: '1px solid var(--sl-border)', background: 'var(--sl-card)', padding: 16, textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', margin: '0 0 6px' }}>
              📧 Envoyer aussi par email ?
            </p>
            <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: '0 0 12px', lineHeight: 1.5 }}>
              {emailCount} joueur{emailCount > 1 ? 's ont' : ' a'} une adresse email. Ils pourront répondre directement depuis leur boîte mail.
            </p>
            <button
              onClick={handleSendEmails}
              disabled={emailSending}
              style={{ width: '100%', padding: '11px 0', borderRadius: 'var(--sl-radius-xl)', border: 'none', cursor: emailSending ? 'not-allowed' : 'pointer', backgroundColor: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700 }}
            >
              {emailSending ? 'Envoi en cours…' : `Envoyer ${emailCount} email${emailCount > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {emailSent && (() => {
          const { severity, icon, message } = convocationEmailResult(emailResult ?? { sent: 0, total: 0 });
          const palette = {
            success: { c: '#16a34a', bg: 'rgba(34,197,94,0.1)', b: 'rgba(34,197,94,0.3)' },
            error:   { c: '#dc2626', bg: 'rgba(220,38,38,0.1)', b: 'rgba(220,38,38,0.3)' },
            warning: { c: '#d97706', bg: 'rgba(217,119,6,0.1)', b: 'rgba(217,119,6,0.3)' },
            neutral: { c: '#64748b', bg: 'rgba(100,116,139,0.1)', b: 'rgba(100,116,139,0.3)' },
          }[severity];
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: palette.bg, border: `1px solid ${palette.b}`, borderRadius: 'var(--sl-radius-xl)', padding: '10px 14px', width: '100%', maxWidth: 320 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <p style={{ fontSize: 13, color: palette.c, margin: 0, fontWeight: 600 }}>{message}</p>
            </div>
          );
        })()}

        <button
          onClick={onDone}
          style={{ width: '100%', maxWidth: 280, padding: '13px 0', borderRadius: 'var(--sl-radius-2xl)', border: 'none', cursor: 'pointer', backgroundColor: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700 }}
        >
          Terminé
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '16px 20px 10px', borderBottom: '1px solid var(--sl-border)', flexShrink: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: '0 0 3px' }}>
          Convoquer les joueurs
        </p>
        <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: 0 }}>
          {loading ? 'Chargement…' : `${players.length} joueur${players.length > 1 ? 's' : ''} dans l'équipe`}
        </p>
      </div>

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

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--sl-border)', flexShrink: 0, display: 'flex', gap: 10 }}>
        <button
          onClick={onClose}
          style={{ flex: 1, padding: '12px 0', borderRadius: 'var(--sl-radius-2xl)', border: '1px solid var(--sl-border)', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600 }}
        >
          Passer
        </button>
        <button
          disabled={!selected.size || sending}
          onClick={handleSend}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 'var(--sl-radius-2xl)', border: 'none', cursor: selected.size && !sending ? 'pointer' : 'not-allowed',
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
