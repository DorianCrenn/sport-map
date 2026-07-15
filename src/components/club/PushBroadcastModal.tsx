import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePushBroadcast, type PushTarget } from '../../hooks/usePushBroadcast.js';

interface Team { id: string; name: string; }
interface Event { id: string; title: string; date: string; }

interface Props {
  clubId: string;
  clubName: string;
  teams?: Team[];
  upcomingEvents?: Event[];
  onClose: () => void;
}

const TARGET_OPTIONS: { value: PushTarget; label: string; desc: string }[] = [
  { value: 'all',   label: 'Tous les joueurs',         desc: 'Tous les joueurs du club inscrits' },
  { value: 'team',  label: 'Une équipe',                desc: 'Seulement les joueurs d\'une équipe' },
  { value: 'event', label: 'Convoqués pour un match',   desc: 'Joueurs convoqués pour un événement' },
];

export default function PushBroadcastModal({ clubId, clubName, teams = [], upcomingEvents = [], onClose }: Props) {
  const [target,  setTarget]  = useState<PushTarget>('all');
  const [teamId,  setTeamId]  = useState('');
  const [eventId, setEventId] = useState('');
  const [title,   setTitle]   = useState('');
  const [body,    setBody]    = useState('');
  const { broadcast, loading, result, error, reset } = usePushBroadcast();

  const canSend = title.trim().length > 0 && body.trim().length > 0
    && (target !== 'team' || teamId !== '')
    && (target !== 'event' || eventId !== '');

  async function handleSend() {
    await broadcast({ clubId, title: title.trim(), body: body.trim(), target, teamId: teamId || undefined, eventId: eventId || undefined });
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    padding: '10px 12px', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)',
    backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13,
    outline: 'none',
  };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--sl-t2)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 5, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 'var(--sl-z-modal)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        role="dialog" aria-modal="true" aria-label="Notification push"
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{ width: '100%', maxWidth: 480, backgroundColor: 'var(--sl-card)', borderRadius: '20px 20px 0 0', padding: '20px 20px calc(28px + env(safe-area-inset-bottom, 0px))', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)' }}>Envoyer une notification</div>
            <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>{clubName}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 'var(--sl-radius-md)', border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t3)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '24px 0' }}
            >
              <div style={{ fontSize: 40, marginBottom: 10 }}>{result.sent > 0 ? '🔔' : '😶'}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 6 }}>
                {result.sent > 0 ? `${result.sent} notification${result.sent > 1 ? 's' : ''} envoyée${result.sent > 1 ? 's' : ''}` : 'Aucune notification envoyée'}
              </div>
              {result.sent > 0 && result.total && result.total > result.sent && (
                <div style={{ fontSize: 12, color: 'var(--sl-t3)', marginBottom: 4 }}>
                  {result.total - result.sent} joueur{result.total - result.sent > 1 ? 's' : ''} sans notifications activées
                </div>
              )}
              {result.reason === 'no_targets' && (
                <div style={{ fontSize: 12, color: 'var(--sl-t3)' }}>Aucun joueur inscrit dans cette cible.</div>
              )}
              {result.skipped && (
                <div style={{ fontSize: 12, color: 'var(--sl-t3)' }}>Push non configuré (VAPID manquant).</div>
              )}
              <button onClick={() => { reset(); setTitle(''); setBody(''); }} style={{ marginTop: 18, padding: '10px 24px', borderRadius: 'var(--sl-radius-lg)', border: 'none', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Nouvelle notification
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Target */}
              <div>
                <label style={labelStyle}>Destinataires</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {TARGET_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setTarget(opt.value)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--sl-radius-lg)', border: `1.5px solid ${target === opt.value ? 'var(--sl-accent)' : 'var(--sl-border)'}`, backgroundColor: target === opt.value ? 'rgba(99,102,241,0.08)' : 'var(--sl-surface)', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${target === opt.value ? 'var(--sl-accent)' : 'var(--sl-border)'}`, backgroundColor: target === opt.value ? 'var(--sl-accent)' : 'transparent', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)' }}>{opt.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Team selector */}
              {target === 'team' && (
                <div>
                  <label style={labelStyle}>Équipe</label>
                  <select value={teamId} onChange={e => setTeamId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                    <option value="">— Choisir une équipe —</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}

              {/* Event selector */}
              {target === 'event' && (
                <div>
                  <label style={labelStyle}>Événement</label>
                  <select value={eventId} onChange={e => setEventId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                    <option value="">— Choisir un événement —</option>
                    {upcomingEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} — {new Date(ev.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label style={labelStyle}>Titre <span style={{ color: 'var(--sl-t3)', fontWeight: 400 }}>({title.length}/60)</span></label>
                <input
                  value={title} onChange={e => setTitle(e.target.value.slice(0, 60))}
                  placeholder="Ex : Entraînement annulé ce soir"
                  style={inputStyle}
                />
              </div>

              {/* Body */}
              <div>
                <label style={labelStyle}>Message <span style={{ color: 'var(--sl-t3)', fontWeight: 400 }}>({body.length}/160)</span></label>
                <textarea
                  value={body} onChange={e => setBody(e.target.value.slice(0, 160))}
                  placeholder="Ex : En raison des intempéries, l'entraînement est reporté à jeudi 20h."
                  rows={3}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.4 }}
                />
              </div>

              {/* Preview */}
              {(title || body) && (
                <div style={{ padding: 12, borderRadius: 'var(--sl-radius-lg)', backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 6, letterSpacing: '0.06em' }}>APERÇU NOTIFICATION</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 'var(--sl-radius-md)', backgroundColor: 'var(--sl-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏆</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)' }}>{title || '…'}</div>
                      <div style={{ fontSize: 11, color: 'var(--sl-t2)', marginTop: 2, lineHeight: 1.4 }}>{body || '…'}</div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div style={{ padding: '8px 12px', borderRadius: 'var(--sl-radius-md)', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 12 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSend} disabled={!canSend || loading}
                style={{ padding: '13px', borderRadius: 'var(--sl-radius-xl)', border: 'none', backgroundColor: canSend && !loading ? 'var(--sl-accent)' : 'var(--sl-border)', color: canSend && !loading ? '#fff' : 'var(--sl-t3)', fontSize: 14, fontWeight: 800, cursor: canSend && !loading ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
              >
                {loading ? '🔄 Envoi…' : '🔔 Envoyer la notification'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
