import { useState } from 'react';

const TYPES = [
  { id: 'info',         label: 'Information',      emoji: 'ℹ️',  color: '#3b82f6' },
  { id: 'urgent',       label: 'Urgent',            emoji: '🚨',  color: '#ef4444' },
  { id: 'cancelled',    label: 'Annulation',        emoji: '❌',  color: '#ef4444' },
  { id: 'rescheduled',  label: 'Horaire modifié',   emoji: '🕐',  color: '#f97316' },
];

export default function SendTrainingMessageModal({ session, clubId, userId, onSend, onClose, targetGroup = null, counts = {} }) {
  const [type, setType]       = useState('info');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  // Pre-fill common messages
  function prefill(t) {
    setType(t);
    if (t === 'cancelled')   setContent("L'entraînement est annulé. Désolé pour la gêne occasionnée.");
    else if (t === 'rescheduled') setContent("L'horaire de l'entraînement a été modifié. ");
    else setContent('');
  }

  async function handleSend() {
    if (!content.trim()) return;
    setSending(true);
    const ok = await onSend({ clubId, content, type });
    setSending(false);
    if (ok) onClose();
  }

  const selected = TYPES.find(t => t.id === type);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <p className="font-bold text-base font-poppins" style={{ color: '#0F1E3A' }}>
            Message aux participants
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {session?.date} · {session?.time ?? ''} · {session?.location ?? ''}
          </p>
          {targetGroup && (
            <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, backgroundColor: targetGroup === 'absent' ? 'rgba(239,68,68,0.08)' : 'rgba(249,115,22,0.08)', border: `1px solid ${targetGroup === 'absent' ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.25)'}`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12 }}>📬</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: targetGroup === 'absent' ? '#ef4444' : '#f97316' }}>
                Message ciblé : <strong>{targetGroup === 'absent' ? `Absents (${counts?.absent ?? 0})` : `Peut-être (${counts?.unsure ?? 0})`}</strong>
              </span>
            </div>
          )}
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Type selection */}
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(t => (
              <button key={t.id} onClick={() => prefill(t.id)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors text-left"
                style={type === t.id
                  ? { borderColor: t.color, color: t.color, backgroundColor: `${t.color}10` }
                  : { borderColor: '#e5e7eb', color: '#6b7280' }}>
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              placeholder="Rédigez votre message…"
              className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none resize-none"
              style={{ borderColor: content ? selected?.color : undefined }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500">
              Annuler
            </button>
            <button onClick={handleSend} disabled={sending || !content.trim()}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
              style={{ backgroundColor: selected?.color ?? '#0F1E3A' }}>
              {sending ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
