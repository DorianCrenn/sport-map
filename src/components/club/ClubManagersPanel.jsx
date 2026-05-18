import { useState } from 'react';
import { motion } from 'framer-motion';

const ROW = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 10px', borderRadius: 12,
  backgroundColor: 'var(--sl-surface)',
};

function Avatar({ name, color }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
      backgroundColor: `${color}20`, color,
      fontSize: 13, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {(name?.[0] ?? '?').toUpperCase()}
    </div>
  );
}

export default function ClubManagersPanel({ managers, ownerEmail, ownerName, onAdd, onRemove, onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  async function handleAdd() {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    if (!normalized.includes('@')) { setError('Email invalide'); return; }
    if (normalized === ownerEmail?.toLowerCase()) {
      setError("C'est déjà le propriétaire du club");
      return;
    }
    const ok = await onAdd(normalized);
    if (!ok) { setError('Cet email est déjà gestionnaire'); return; }
    setEmail('');
    setError('');
    setSuccess(`${normalized} ajouté`);
    setTimeout(() => setSuccess(''), 3000);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          backgroundColor: 'var(--sl-card)',
          borderRadius: 24, padding: 20,
          border: '1px solid var(--sl-border)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sl-t1)' }}>Gestionnaires</div>
            <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>
              Peuvent modifier la page du club
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t3)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Owner */}
        <div style={{ ...ROW, marginBottom: 6 }}>
          <Avatar name={ownerName} color="#22C55E" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ownerName ?? 'Propriétaire'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--sl-t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ownerEmail ?? '—'}
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E', flexShrink: 0 }}>
            Propriétaire
          </span>
        </div>

        {/* Manager list */}
        {managers.map(m => (
          <div key={m.email} style={{ ...ROW, marginBottom: 6 }}>
            <Avatar name={m.name} color="#3b82f6" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--sl-t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.email}
              </div>
            </div>
            <button
              onClick={() => onRemove(m.email)}
              aria-label={`Retirer ${m.name}`}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}

        {managers.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--sl-t3)', textAlign: 'center', padding: '12px 0', marginBottom: 4 }}>
            Aucun gestionnaire délégué pour l'instant
          </p>
        )}

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '12px 0' }} />

        {/* Invite form */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          Inviter un gestionnaire
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="email@exemple.com"
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 12,
              border: `1px solid ${error ? '#ef4444' : 'var(--sl-border-s)'}`,
              backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none',
            }}
          />
          <button
            onClick={handleAdd}
            disabled={!email.trim()}
            style={{
              padding: '9px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              backgroundColor: '#0F1E3A', color: '#fff', fontSize: 12, fontWeight: 700,
              opacity: email.trim() ? 1 : 0.4,
            }}
          >
            Ajouter
          </button>
        </div>

        {error   && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>{error}</p>}
        {success && <p style={{ fontSize: 11, color: '#22C55E', marginTop: 6 }}>{success}</p>}
        <p style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 8 }}>
          La personne doit avoir un compte SportLink avec cet email pour accéder à l'édition.
        </p>
      </motion.div>
    </div>
  );
}
