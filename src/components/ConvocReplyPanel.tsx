import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase.js';

async function sendReplyConfirmation(token: string, status: string) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    await fetch(`${supabaseUrl}/functions/v1/convoc-reply-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey },
      body: JSON.stringify({ token, status }),
    });
  } catch {
    // non-blocking — confirmation is best-effort
  }
}

interface ConvocToken {
  id: string;
  player_name: string | null;
  reply_status: string | null;
  expires_at: string;
  events: {
    title: string | null;
    date: string;
    time: string | null;
    venue: string | null;
  } | null;
  clubs: { name: string } | null;
}

interface ConvocReplyPanelProps {
  token: string;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  accepted: 'Présent(e) ✅',
  declined:  'Absent(e) ❌',
  unavailable: 'Peut-être 🤔',
};

const STATUS_COLORS: Record<string, string> = {
  accepted: '#22c55e',
  declined: '#ef4444',
  unavailable: '#f97316',
};

export default function ConvocReplyPanel({ token, onClose }: ConvocReplyPanelProps) {
  const [data, setData]       = useState<ConvocToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<string | null>(null);
  const [done, setDone]       = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    supabase
      .from('convocation_reply_tokens')
      .select('id, player_name, reply_status, expires_at, events(title, date, time, venue), clubs(name)')
      .eq('token', token)
      .maybeSingle()
      .then(({ data: row }: any) => {
        setLoading(false);
        if (!row) { setExpired(true); return; }
        if (new Date(row.expires_at) < new Date()) { setExpired(true); return; }
        setData(row as ConvocToken);
        if (row.reply_status) setDone(row.reply_status);
      });
  }, [token]);

  async function reply(status: string) {
    if (saving || done) return;
    setSaving(status);
    const { error } = await supabase
      .from('convocation_reply_tokens')
      .update({ reply_status: status, replied_at: new Date().toISOString() })
      .eq('token', token) as { error: any };

    if (!error && data) {
      // Mettre à jour event_convocations
      const { data: td } = await supabase
        .from('convocation_reply_tokens')
        .select('convocation_id')
        .eq('token', token)
        .maybeSingle() as { data: { convocation_id: string } | null };
      if (td?.convocation_id) {
        await supabase.from('event_convocations').update({ status }).eq('id', td.convocation_id);
        window.dispatchEvent(new CustomEvent('sl-analytics', { detail: { type: 'convocation_responded', data: { status } } }));
      }
      setDone(status);
      sendReplyConfirmation(token, status);
    }
    setSaving(null);
  }

  const dateFr = data?.events?.date
    ? new Date(data.events.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        style={{ background: 'var(--sl-bg)', borderRadius: '20px 20px 16px 16px', width: '100%', maxWidth: 440, overflow: 'hidden', boxShadow: '0 -4px 32px rgba(0,0,0,0.25)' }}
      >
        {/* Handle */}
        <div style={{ padding: '10px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--sl-border)' }} />
        </div>

        <div style={{ padding: '12px 20px 24px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--sl-t3)', fontSize: 13, padding: '20px 0' }}>Chargement…</p>
          ) : expired ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>⏰</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--sl-t1)', margin: '0 0 6px' }}>Lien expiré</p>
              <p style={{ fontSize: 13, color: 'var(--sl-t3)', margin: 0 }}>Ce lien n'est plus valide.</p>
            </div>
          ) : done ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${STATUS_COLORS[done]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <span style={{ fontSize: 24 }}>{done === 'accepted' ? '✅' : done === 'declined' ? '❌' : '🤔'}</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: '0 0 4px' }}>{STATUS_LABELS[done]}</p>
              <p style={{ fontSize: 13, color: 'var(--sl-t3)', margin: '0 0 16px' }}>Réponse enregistrée !</p>
              <button onClick={onClose} style={{ padding: '11px 28px', borderRadius: 12, border: 'none', background: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                {data?.clubs?.name && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eff6ff', color: '#1d4ed8', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
                    🏆 {data.clubs.name}
                  </div>
                )}
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: '0 0 4px' }}>
                  Convocation — {data?.events?.title ?? 'Événement'}
                </p>
                {dateFr && (
                  <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: 0 }}>
                    📅 {dateFr}{data?.events?.time ? ` à ${data.events.time}` : ''}
                    {data?.events?.venue ? ` · 📍 ${data.events.venue}` : ''}
                  </p>
                )}
                {data?.player_name && (
                  <p style={{ fontSize: 12, color: 'var(--sl-t2)', margin: '6px 0 0', fontWeight: 600 }}>Bonjour {data.player_name} 👋</p>
                )}
              </div>

              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', margin: '0 0 12px', textAlign: 'center' }}>Serez-vous présent(e) ?</p>

              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                {(['accepted', 'declined', 'unavailable'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => reply(s)}
                    disabled={!!saving}
                    style={{
                      padding: '14px 0', borderRadius: 14, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                      background: saving === s ? STATUS_COLORS[s] : `${STATUS_COLORS[s]}15`,
                      color: saving === s ? '#fff' : STATUS_COLORS[s],
                      fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
                    }}
                  >
                    {saving === s ? '…' : STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
