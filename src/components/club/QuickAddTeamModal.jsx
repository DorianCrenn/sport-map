import { useState } from 'react';
import { motion } from 'framer-motion';

const AGE_CATEGORIES = [
  'U7', 'U7F', 'U9', 'U9F', 'U11', 'U11F', 'U13', 'U13F',
  'U15', 'U15F', 'U17', 'U17F', 'U19', 'U19F',
  'Seniors', 'Seniors F', 'Vétérans', 'Vétérans F', 'Loisir', 'Loisir F',
];

function catUid()  { return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }
function teamUid() { return `tm_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }

export default function QuickAddTeamModal({ club, onSave, onClose }) {
  const existingCatNames = (club.categories ?? []).map(c => c.name);
  const [catName,  setCatName]  = useState('');
  const [teamName, setTeamName] = useState('');
  const [saving,   setSaving]   = useState(false);

  function selectCat(name) {
    setCatName(name);
    const existing = (club.categories ?? []).find(c => c.name === name);
    const n = existing ? existing.teams.length + 1 : 1;
    setTeamName(`${name} ${n}`);
  }

  async function handleSave() {
    if (!catName.trim() || !teamName.trim()) return;
    setSaving(true);
    const cats = club.categories ?? [];
    const existingCat = cats.find(c => c.name === catName);
    const newTeam = { id: teamUid(), name: teamName.trim(), level: 'D4' };
    let updated;
    if (existingCat) {
      updated = cats.map(c => c.id === existingCat.id
        ? { ...c, teams: [...c.teams, newTeam] }
        : c
      );
    } else {
      updated = [...cats, { id: catUid(), name: catName.trim(), teams: [newTeam] }];
    }
    await onSave({ categories: updated }, newTeam.id);
    setSaving(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 70,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        style={{
          backgroundColor: 'var(--sl-card)', borderRadius: '20px 20px 0 0',
          padding: '0 0 env(safe-area-inset-bottom, 16px)',
          maxHeight: '80dvh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 3.5, borderRadius: 999, backgroundColor: 'var(--sl-border-s)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '8px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sl-border)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em' }}>Créer une équipe</div>
            <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>Choisissez une catégorie puis nommez l'équipe</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Catégorie</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {AGE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => selectCat(cat)}
                style={{
                  padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  backgroundColor: catName === cat ? 'var(--sl-green)' : 'var(--sl-surface)',
                  color: catName === cat ? '#fff' : 'var(--sl-t2)',
                  outline: catName === cat ? 'none'
                    : existingCatNames.includes(cat) ? '1.5px solid var(--sl-green)'
                    : '1px solid var(--sl-border)',
                }}
              >
                {cat}
              </button>
            ))}
            <input
              placeholder="Autre catégorie…"
              value={AGE_CATEGORIES.includes(catName) ? '' : catName}
              onChange={e => selectCat(e.target.value)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)',
                color: 'var(--sl-t1)', outline: 'none', width: 130,
              }}
            />
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nom de l'équipe</div>
          <input
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            placeholder="ex: Seniors 1, U13 2…"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12,
              border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)',
              color: 'var(--sl-t1)', fontSize: 14, fontWeight: 600, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--sl-border)', flexShrink: 0 }}>
          <button
            onClick={handleSave}
            disabled={saving || !catName.trim() || !teamName.trim()}
            style={{
              width: '100%', padding: '13px', borderRadius: 14, border: 'none',
              cursor: !catName.trim() || !teamName.trim() ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 800,
              backgroundColor: !catName.trim() || !teamName.trim() ? 'var(--sl-surface)' : 'var(--sl-green)',
              color: !catName.trim() || !teamName.trim() ? 'var(--sl-t3)' : '#fff',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Création…' : "Créer l'équipe"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
