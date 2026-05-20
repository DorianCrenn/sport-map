import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useClubBrandKit } from '../../hooks/useClubBrandKit.js';

const PRESET_COLORS = [
  '#22D96A', '#3b82f6', '#f97316', '#eab308', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f59e0b',
  '#0D1117', '#1e293b', '#374151', '#ffffff',
];

const FONT_OPTIONS = [
  { value: 'Inter',    label: 'Inter' },
  { value: 'Poppins',  label: 'Poppins' },
  { value: 'Roboto',   label: 'Roboto' },
  { value: 'Oswald',   label: 'Oswald' },
  { value: 'Raleway',  label: 'Raleway' },
];

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            style={{
              width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer',
              flexShrink: 0, backgroundColor: c,
              outline: value === c ? `2.5px solid ${c}` : '2px solid transparent',
              outlineOffset: 2,
              boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.15)' : 'none',
            }}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width: 26, height: 26, borderRadius: 7, cursor: 'pointer', border: '1px solid var(--sl-border)', padding: 2, backgroundColor: 'transparent' }}
          title="Couleur personnalisée"
        />
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--sl-t2)', marginLeft: 2 }}>{value}</span>
      </div>
    </div>
  );
}

function Preview({ form }) {
  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      border: '1px solid var(--sl-border)',
      fontFamily: `${form.primary_font}, sans-serif`,
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${form.secondary_color} 0%, ${form.primary_color}22 100%)`,
        padding: '16px 14px',
        borderBottom: `3px solid ${form.primary_color}`,
      }}>
        <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: `${form.text_color}88`, marginBottom: 4 }}>
          Aperçu
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: form.text_color, marginBottom: 2 }}>
          Nom du club
        </div>
        <div style={{ fontSize: 10, color: `${form.text_color}aa` }}>
          Sport · Ville
        </div>
      </div>
      <div style={{ background: form.bg_color, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          padding: '5px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700,
          backgroundColor: form.primary_color, color: form.text_color,
        }}>
          J'y serai
        </div>
        <div style={{
          padding: '5px 12px', borderRadius: 20, fontSize: 10, fontWeight: 600,
          border: `1px solid ${form.accent_color}44`, color: form.accent_color,
        }}>
          Suivre
        </div>
      </div>
    </div>
  );
}

export default function ClubBrandKitEditor({ club, onClose }) {
  const { kit, loading, saving, error, save } = useClubBrandKit(club.id);

  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && kit && !form) setForm({ ...kit });
  }, [loading, kit, form]);

  function set(field) {
    return (value) => setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form) return;
    const result = await save(form);
    if (!result.error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 30,
        backgroundColor: 'var(--sl-bg)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        flexShrink: 0, backgroundColor: '#0F1E3A',
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, color: 'white',
      }}>
        <button
          onClick={onClose}
          aria-label="Retour à la page du club"
          style={{ width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Identité visuelle</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{club.name}</div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !form}
          style={{
            padding: '8px 14px', borderRadius: 10, border: 'none', cursor: saving ? 'wait' : 'pointer',
            fontSize: 12, fontWeight: 700,
            backgroundColor: saved ? '#22D96A' : 'rgba(34,217,106,0.2)',
            color: saved ? '#0D1117' : '#22D96A',
            transition: 'all 0.2s',
          }}
        >
          {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading || !form ? (
          <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--sl-t3)', fontSize: 13 }}>
            Chargement…
          </div>
        ) : (
          <>
            {/* Preview */}
            <Preview form={form} />

            {/* Couleurs */}
            <div style={{ borderRadius: 14, padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)' }}>
                Couleurs
              </div>
              <ColorField label="Couleur principale" value={form.primary_color} onChange={set('primary_color')} />
              <ColorField label="Couleur de fond du header" value={form.secondary_color} onChange={set('secondary_color')} />
              <ColorField label="Fond des blocs" value={form.bg_color} onChange={set('bg_color')} />
              <ColorField label="Accent / boutons secondaires" value={form.accent_color} onChange={set('accent_color')} />
              <ColorField label="Texte sur fond coloré" value={form.text_color} onChange={set('text_color')} />
            </div>

            {/* Typographie */}
            <div style={{ borderRadius: 14, padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 12 }}>
                Police principale
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {FONT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('primary_font')(opt.value)}
                    style={{
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      border: `2px solid ${form.primary_font === opt.value ? form.primary_color : 'var(--sl-border)'}`,
                      backgroundColor: form.primary_font === opt.value ? `${form.primary_color}14` : 'var(--sl-surface)',
                      fontFamily: `${opt.value}, sans-serif`,
                      fontSize: 14, fontWeight: 600,
                      color: form.primary_font === opt.value ? form.primary_color : 'var(--sl-t2)',
                      transition: 'all 0.12s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ fontSize: 12, color: '#ef4444', textAlign: 'center' }}>
                Erreur : {error}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
