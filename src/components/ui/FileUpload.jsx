import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

const ALLOWED = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024; // 2 Mo

function sanitize(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Composant d'upload vers Supabase Storage bucket "club-logos".
 *
 * Props :
 *   clubId      string   — dossier racine dans le bucket
 *   value       string   — URL actuelle (affichée en prévisualisation)
 *   onChange    fn(url)  — appelée avec l'URL publique après upload
 *   label       string   — libellé du bouton
 *   hint        string   — texte d'aide optionnel
 *   dark        bool     — afficher la prévisualisation sur fond sombre
 */
export default function FileUpload({ clubId, value, onChange, label = 'Choisir un fichier', hint, dark = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED.includes(file.type)) {
      setError('Format non supporté. Utilisez PNG, JPG, SVG ou WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Fichier trop lourd (max 2 Mo).');
      return;
    }

    setUploading(true);
    const path = `${clubId}/${Date.now()}-${sanitize(file.name)}`;
    const { data, error: uploadErr } = await supabase.storage
      .from('club-logos')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadErr || !data) {
      setError(uploadErr?.message ?? "Erreur lors de l'upload.");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('club-logos')
      .getPublicUrl(data.path);

    onChange(publicUrl);
    setUploading(false);
    e.target.value = '';
  }

  const inp = {
    padding: '7px 10px', borderRadius: 8, fontSize: 12,
    border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)',
    color: 'var(--sl-t1)', outline: 'none', flex: 1, boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: '1.5px dashed var(--sl-border-s)', cursor: uploading ? 'wait' : 'pointer',
            backgroundColor: value ? 'rgba(99,102,241,0.08)' : 'var(--sl-surface)',
            color: value ? '#6366f1' : 'var(--sl-t2)',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {uploading ? '⏳ Upload…' : value ? '✓ Remplacer' : `📎 ${label}`}
        </button>

        {/* URL de fallback */}
        <input
          type="url"
          placeholder="ou coller une URL…"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          style={inp}
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14 }}
          >✕</button>
        )}
      </div>

      <input ref={inputRef} type="file" accept={ALLOWED.join(',')} onChange={handleFile} style={{ display: 'none' }} />

      {error && (
        <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>
      )}
      {hint && !error && (
        <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{hint}</span>
      )}

      {value && (
        <div style={{
          padding: '8px 10px', borderRadius: 8,
          backgroundColor: dark ? '#111827' : 'var(--sl-surface)',
          border: '1px solid var(--sl-border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <img
            src={value}
            alt="Aperçu"
            style={{ height: 32, maxWidth: 80, objectFit: 'contain', borderRadius: 4 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <span style={{ fontSize: 10, color: dark ? 'rgba(255,255,255,0.5)' : 'var(--sl-t3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value.split('/').pop()}
          </span>
        </div>
      )}
    </div>
  );
}
