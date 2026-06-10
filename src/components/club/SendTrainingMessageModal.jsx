import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import ModalFrame from '../ModalFrame.jsx';
import { useFormDraft } from '../../hooks/useFormDraft.js';
import DraftBanner from '../ui/DraftBanner.jsx';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { useAndroidBack } from '../../hooks/useAndroidBack.js';
import { useScrollInputIntoView } from '../../hooks/useScrollInputIntoView.js';

const TYPES = [
  { id: 'info',        label: 'Information',    emoji: 'ℹ️', color: '#3b82f6' },
  { id: 'urgent',      label: 'Urgent',          emoji: '🚨', color: '#ef4444' },
  { id: 'cancelled',   label: 'Annulation',      emoji: '❌', color: '#ef4444' },
  { id: 'rescheduled', label: 'Horaire modifié', emoji: '🕐', color: '#f97316' },
];

export default function SendTrainingMessageModal({
  session, clubId, onSend, onClose, targetGroup = null, counts = {},
}) {
  const [type,    setType]    = useState('info');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const panelRef = useRef(null);
  useFocusTrap(panelRef);
  useAndroidBack(true, onClose);
  useScrollInputIntoView(panelRef);

  const { hasDraft, saveDraft, loadDraft, clearDraft } = useFormDraft('sl-training-msg-draft');

  useEffect(() => {
    if (content) saveDraft({ type, content });
  }, [type, content]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (ok) { clearDraft(); onClose(); }
  }

  const selected = TYPES.find(t => t.id === type);
  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 12, fontSize: 13,
    backgroundColor: 'var(--sl-surface)',
    border: `1.5px solid ${content ? selected?.color : 'var(--sl-border)'}`,
    color: 'var(--sl-t1)', outline: 'none', fontFamily: 'Inter, sans-serif',
    resize: 'none',
  };

  return (
    <ModalFrame open variant="sheet" onClose={onClose} labelledBy="training-msg-title">
      <div ref={panelRef} style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Draft banner */}
        <AnimatePresence>
          {hasDraft && (
            <DraftBanner
              onRestore={() => { const d = loadDraft(); if (d) { setType(d.type ?? 'info'); setContent(d.content ?? ''); } clearDraft(); }}
              onDiscard={clearDraft}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div style={{ padding: '4px 0 14px' }}>
          <h3 id="training-msg-title" style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)', margin: '0 0 3px' }}>
            📬 Message aux participants
          </h3>
          {session && (
            <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: 0 }}>
              {session.date}{session.time ? ` · ${session.time}` : ''}{session.location ? ` · ${session.location}` : ''}
            </p>
          )}
          {targetGroup && (
            <div style={{
              marginTop: 8, padding: '6px 10px', borderRadius: 8,
              backgroundColor: targetGroup === 'absent' ? 'rgba(239,68,68,0.08)' : 'rgba(249,115,22,0.08)',
              border: `1px solid ${targetGroup === 'absent' ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.25)'}`,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 12 }}>📬</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: targetGroup === 'absent' ? '#ef4444' : '#f97316' }}>
                Message ciblé :&nbsp;
                <strong>
                  {targetGroup === 'absent'
                    ? `Absents (${counts?.absent ?? 0})`
                    : `Peut-être (${counts?.unsure ?? 0})`}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Type selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => prefill(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${type === t.id ? t.color : 'var(--sl-border)'}`,
                backgroundColor: type === t.id ? `${t.color}12` : 'var(--sl-surface)',
                color: type === t.id ? t.color : 'var(--sl-t2)',
                fontSize: 12, fontWeight: 600, textAlign: 'left',
                transition: 'all 0.12s',
              }}
            >
              <span style={{ fontSize: 16 }}>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Message */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', display: 'block', marginBottom: 6 }}>
            Message
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Rédigez votre message…"
            style={inputStyle}
          />
          {content.length > 400 && (
            <span style={{ fontSize: 11, color: content.length >= 500 ? '#ef4444' : 'var(--sl-t3)', display: 'block', textAlign: 'right', marginTop: 3 }}>
              {content.length}/500
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer',
              border: '1px solid var(--sl-border-s)', color: 'var(--sl-t2)',
              backgroundColor: 'var(--sl-surface)', fontSize: 13, fontWeight: 600,
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            style={{
              flex: 2, padding: '12px 0', borderRadius: 12, cursor: sending || !content.trim() ? 'not-allowed' : 'pointer',
              border: 'none',
              backgroundColor: sending || !content.trim() ? 'var(--sl-surface)' : (selected?.color ?? 'var(--sl-green)'),
              color: sending || !content.trim() ? 'var(--sl-t3)' : '#fff',
              fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
            }}
          >
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
