import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z } from '../../constants/zIndex.js';
import { announcementSchema, validate } from '../../lib/schemas.js';

const TYPE_OPTIONS = [
  { key: 'urgent', label: 'Urgent',     icon: '🚨', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { key: 'info',   label: 'Info',       icon: 'ℹ️', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'result', label: 'Résultat',   icon: '⚽', color: '#22d96a', bg: 'rgba(34,217,106,0.12)' },
  { key: 'event',  label: 'Événement',  icon: '🎉', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
];

const TEMPLATES = {
  urgent: [
    { label: 'Match annulé',    text: '⚠️ Le match de ce soir est annulé.' },
    { label: 'Terrain changé',  text: '📍 Changement de terrain — nouveau lieu à confirmer.' },
    { label: 'Retard',          text: '⏰ Le coup d\'envoi est décalé. Nouvelles infos à venir.' },
    { label: 'Météo',           text: '🌧️ En raison des conditions météo, le match est annulé.' },
  ],
  info: [
    { label: 'Rappel match',    text: '📅 Rappel : match demain. Rendez-vous à l\'heure habituelle.' },
    { label: 'Entraînement',    text: '🏃 Entraînement ce soir à l\'heure habituelle.' },
    { label: 'Infos pratiques', text: '📋 Informations pratiques pour ce week-end :' },
  ],
  result: [
    { label: 'Victoire',        text: '🏆 Victoire ce soir ! Bravo à toute l\'équipe.' },
    { label: 'Score final',     text: '⚽ Score final : ' },
    { label: 'Match nul',       text: '🤝 Match nul ce soir. Belle prestation de l\'équipe.' },
  ],
  event: [
    { label: 'Tournoi',         text: '🏅 Tournoi ce week-end. Venez soutenir l\'équipe !' },
    { label: 'Portes ouvertes', text: '🎊 Portes ouvertes au club ce dimanche. Venez nombreux !' },
    { label: 'Soirée club',     text: '🥂 Soirée club vendredi soir. Tous les membres sont invités.' },
  ],
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  borderRadius: 12, padding: '10px 12px', fontSize: 13,
  backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
  color: 'var(--sl-t1)', outline: 'none', fontFamily: 'Inter, sans-serif',
  resize: 'none',
};

export default function SendAnnouncementModal({ club, onSend, onClose }) {
  const [type,    setType]    = useState('urgent');
  const [message, setMessage] = useState('');
  const [targets, setTargets] = useState([]); // empty = all
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const selectedType = TYPE_OPTIONS.find(t => t.key === type);
  const allTeams = (club.categories ?? []).flatMap(cat =>
    (cat.teams ?? []).map(team => ({ id: team.id ?? team.name, name: team.name, catName: cat.name }))
  );
  const isAll = targets.length === 0;

  function toggleTarget(id) {
    setTargets(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }

  async function handleSend() {
    const { ok, errors } = validate(announcementSchema, { type, message });
    if (!ok) {
      setError(errors.message ?? errors.type ?? 'Formulaire invalide');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSend({ type, message: message.trim(), targetTeams: targets, clubName: club.name });
      onClose();
    } catch (e) {
      setError(e.message ?? 'Erreur lors de l\'envoi');
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: Z.formModal, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 34 }}
        style={{ width: '100%', maxWidth: 540, backgroundColor: 'var(--sl-card)', borderRadius: '22px 22px 0 0', border: '1px solid var(--sl-border)', borderBottom: 'none', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 3, borderRadius: 999, backgroundColor: 'var(--sl-border-s)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px 14px', borderBottom: '1px solid var(--sl-border)', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>
              📢 Envoyer une annonce
            </h2>
            <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 3 }}>{club.name}</div>
          </div>
          <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 8px', display: 'flex', flexDirection: 'column', gap: 16, overscrollBehavior: 'contain' }}>

          {/* Type */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 8 }}>Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {TYPE_OPTIONS.map(opt => {
                const sel = type === opt.key;
                return (
                  <button key={opt.key} onClick={() => setType(opt.key)} style={{ padding: '10px 4px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', border: `2px solid ${sel ? opt.color : 'var(--sl-border)'}`, backgroundColor: sel ? opt.bg : 'var(--sl-surface)', transition: 'all 0.12s' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: sel ? 700 : 500, color: sel ? opt.color : 'var(--sl-t2)' }}>{opt.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Templates */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 8 }}>Templates rapides</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {(TEMPLATES[type] ?? []).map(tpl => (
                <button key={tpl.label} onClick={() => setMessage(tpl.text)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', border: `1.5px solid ${selectedType?.color}40`, backgroundColor: message === tpl.text ? selectedType?.bg : 'var(--sl-surface)', color: message === tpl.text ? selectedType?.color : 'var(--sl-t2)', transition: 'all 0.12s' }}>
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 6 }}>Message *</div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tapez votre message…"
              rows={3}
              style={inputStyle}
              autoFocus
            />
            <div style={{ textAlign: 'right', fontSize: 10, color: message.length > 240 ? '#ef4444' : 'var(--sl-t3)', marginTop: 4 }}>{message.length}/280</div>
          </div>

          {/* Targeting */}
          {allTeams.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 8 }}>Envoyer à</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <button
                  onClick={() => setTargets([])}
                  style={{ padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: isAll ? 700 : 500, border: `2px solid ${isAll ? 'var(--sl-green)' : 'var(--sl-border)'}`, backgroundColor: isAll ? 'rgba(34,217,106,0.12)' : 'var(--sl-surface)', color: isAll ? 'var(--sl-green)' : 'var(--sl-t2)', transition: 'all 0.12s' }}
                >
                  ✓ Tous les abonnés
                </button>
                {allTeams.map(team => {
                  const sel = targets.includes(team.id);
                  return (
                    <button key={team.id} onClick={() => { if (isAll) setTargets([team.id]); else toggleTarget(team.id); }} style={{ padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: sel ? 700 : 500, border: `2px solid ${sel ? '#3b82f6' : 'var(--sl-border)'}`, backgroundColor: sel ? 'rgba(59,130,246,0.1)' : 'var(--sl-surface)', color: sel ? '#3b82f6' : 'var(--sl-t2)', transition: 'all 0.12s' }}>
                      {team.name}
                    </button>
                  );
                })}
              </div>
              {!isAll && (
                <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 6 }}>
                  {targets.length} équipe{targets.length > 1 ? 's' : ''} sélectionnée{targets.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {error && <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, margin: 0 }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '14px 18px 20px', borderTop: '1px solid var(--sl-border)', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1px solid var(--sl-border-s)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={handleSend} disabled={saving || !message.trim()}
            style={{ flex: 2, padding: '13px 0', borderRadius: 14, border: 'none', fontSize: 14, fontWeight: 700, cursor: saving || !message.trim() ? 'default' : 'pointer', backgroundColor: saving || !message.trim() ? 'var(--sl-surface)' : (selectedType?.color ?? 'var(--sl-green)'), color: saving || !message.trim() ? 'var(--sl-t3)' : '#fff', boxShadow: saving || !message.trim() ? 'none' : `0 4px 14px ${selectedType?.color ?? '#22d96a'}55`, transition: 'all 0.15s' }}
          >
            {saving ? 'Envoi…' : `${selectedType?.icon} Envoyer l'annonce`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
