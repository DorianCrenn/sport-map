import { useState, useRef, useEffect } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { useAndroidBack } from '../../hooks/useAndroidBack.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../../hooks/useSports.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import CityAutocomplete from '../CityAutocomplete.jsx';
import SportIcon from '../SportIcon.jsx';
import { supabase } from '../../lib/supabase.js';
import { Z } from '../../constants/zIndex.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function catUid()  { return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }
function teamUid() { return `tm_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }


const QUICK_TEAMS = [
  { cat: 'Seniors',   name: 'Seniors 1' },
  { cat: 'Seniors F', name: 'Seniors F 1' },
  { cat: 'U17',       name: 'U17' },
  { cat: 'U15',       name: 'U15' },
  { cat: 'U13',       name: 'U13' },
  { cat: 'Loisir',    name: 'Loisir' },
];

const LEVEL_OPTIONS = [
  'Loisir', 'Départemental', 'Régional', 'National', 'Fédéral',
];

const COLOR_PRESETS = [
  '#22C55E', '#3B82F6', '#EF4444', '#F97316', '#8B5CF6',
  '#EC4899', '#14B8A6', '#EAB308', '#0F172A', '#6B7280',
];

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px', borderRadius: 12, fontSize: 14,
  border: '1.5px solid var(--sl-border)',
  backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)',
  outline: 'none', fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.15s',
};

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'block', marginBottom: 6,
};

// ── Step header ───────────────────────────────────────────────────────────────

function StepHeader({ step, total, title, subtitle, optional }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', letterSpacing: '0.06em' }}>
          ÉTAPE {step}/{total}
        </span>
        {optional && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
            backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
            color: 'var(--sl-t3)', letterSpacing: '0.04em',
          }}>
            OPTIONNEL
          </span>
        )}
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, marginBottom: 4, letterSpacing: '-0.02em' }}>
        {title}
      </h2>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--sl-t3)', margin: 0, lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step, total, accentColor }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '0 18px', marginBottom: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          backgroundColor: i < step ? accentColor : 'var(--sl-border)',
          transition: 'background-color 0.3s',
        }} />
      ))}
    </div>
  );
}

// ── Logo upload ───────────────────────────────────────────────────────────────

function LogoUpload({ logo, name, accentColor, onUpload, uploading }) {
  const fileRef = useRef();
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 3);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          width: 72, height: 72, borderRadius: 16, flexShrink: 0,
          backgroundColor: logo ? '#fff' : accentColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', overflow: 'hidden',
          border: `2px dashed ${logo ? 'transparent' : 'rgba(255,255,255,0.4)'}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          position: 'relative',
        }}
      >
        {uploading ? (
          <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'sl-spin 0.7s linear infinite' }} />
        ) : logo ? (
          <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
        ) : (
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: '"Oswald", sans-serif' }}>{initials}</span>
        )}
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onUpload} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 3 }}>Logo du club</div>
        <div style={{ fontSize: 11, color: 'var(--sl-t3)', lineHeight: 1.4 }}>
          PNG ou JPG · max 2 Mo<br />Fond blanc ou transparent recommandé
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            marginTop: 6, padding: '4px 10px', borderRadius: 8,
            border: `1px solid ${accentColor}50`, backgroundColor: `${accentColor}10`,
            color: accentColor, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {logo ? '↺ Changer' : '+ Ajouter'}
        </button>
      </div>
    </div>
  );
}

// ── Banner upload ─────────────────────────────────────────────────────────────

function BannerUpload({ banner, accentColor, onUpload, uploading }) {
  const fileRef = useRef();
  return (
    <div>
      <label style={labelStyle}>Bannière du club</label>
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          width: '100%', height: 96, borderRadius: 14, cursor: 'pointer',
          border: `2px dashed ${banner ? 'transparent' : 'var(--sl-border)'}`,
          backgroundColor: banner ? 'transparent' : 'var(--sl-surface)',
          overflow: 'hidden', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.15s',
        }}
      >
        {banner ? (
          <img src={banner} alt="Bannière" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : uploading ? (
          <div style={{ width: 20, height: 20, border: '2px solid var(--sl-border)', borderTopColor: accentColor, borderRadius: '50%', animation: 'sl-spin 0.7s linear infinite' }} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="1.5" strokeLinecap="round" style={{ display: 'block', margin: '0 auto 6px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>Ajouter une bannière · 16:9 recommandé</span>
          </div>
        )}
        {banner && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0'}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>↺ Changer</span>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onUpload} />
    </div>
  );
}

// ── Mini preview ──────────────────────────────────────────────────────────────

function ClubPreview({ form, accentColor }) {
  const initials = (form.name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 3);
  const teamCount = (form.categories ?? []).flatMap(c => c.teams ?? []).length;
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', marginBottom: 16 }}>
      <div style={{ height: 56, background: `linear-gradient(135deg, #0f172a 0%, ${accentColor}40 100%)`, display: 'flex', alignItems: 'flex-end', padding: '0 12px 8px', position: 'relative' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, backgroundColor: form.logoUrl ? '#fff' : accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px rgba(255,255,255,0.8)', overflow: 'hidden' }}>
          {form.logoUrl
            ? <img src={form.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} />
            : <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{initials}</span>}
        </div>
        <div style={{ marginLeft: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{form.name || 'Nom du club'}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', lineHeight: 1.2 }}>
            {[form.sport, form.city].filter(Boolean).join(' · ') || 'Sport · Ville'}
          </div>
        </div>
      </div>
      {teamCount > 0 && (
        <div style={{ padding: '6px 12px', fontSize: 10, color: 'var(--sl-t3)' }}>
          {teamCount} équipe{teamCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// ── Récapitulatif ─────────────────────────────────────────────────────────────

function RecapRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--sl-border)' }}>
      <span style={{ fontSize: 11, color: 'var(--sl-t3)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', textAlign: 'right', wordBreak: 'break-word' }}>{String(value)}</span>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function ClubCreationWizard({ onSave, onClose }) {
  const { allSports: SPORTS } = useSports();
  const { currentUser } = useAuth();

  const panelRef = useRef(null);
  useFocusTrap(panelRef);
  useAndroidBack(true, onClose);

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (step > 1) { setDir(-1); setStep(s => s - 1); } else onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [step, onClose]);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [cityValid, setCityValid] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    // Étape 1 — Identité
    name: '', sigle: '', sport: '', city: '',
    foundingYear: '', primaryColor: '#22C55E', logoUrl: '',
    // Étape 2 — Présentation
    description: '', slogan: '',
    // Étape 3 — Localisation
    venue: '', address: '', postalCode: '', region: '',
    // Étape 4 — Contact
    managerName: '', managerFunction: '', email: '', phone: '',
    // Étape 5 — Sport & Médias
    categories: [], level: '', memberCount: '',
    bannerUrl: '', facebook: '', instagram: '', tiktok: '', website: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const sportList = Object.entries(SPORTS)
    .filter(([, s]) => !s.isArchived)
    .map(([id, s]) => ({ id, ...s }));

  const accentColor = form.primaryColor || SPORTS[form.sport]?.color || '#22C55E';

  // ── Navigation ──────────────────────────────────────────────────────────────

  function goNext() {
    if (step === 1) {
      const errs = {};
      if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Nom requis (min 2 caractères)';
      if (!form.sport) errs.sport = 'Choisissez un sport';
      if (!form.city || !cityValid) errs.city = 'Sélectionnez une commune valide';
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
    }
    setDir(1);
    setStep(s => Math.min(s + 1, 6));
  }

  function goBack() { setDir(-1); setStep(s => Math.max(s - 1, 1)); }
  function skip()   { setDir(1);  setStep(s => Math.min(s + 1, 6)); }

  // ── Logo upload ─────────────────────────────────────────────────────────────

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image trop grande (max 2 Mo)'); return; }
    setLogoUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `clubs/new-${currentUser?.id ?? 'anon'}/${Date.now()}-logo.${ext}`;
    const { data, error } = await supabase.storage.from('club-logos').upload(path, file, { contentType: file.type, upsert: true });
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from('club-logos').getPublicUrl(data.path);
      set('logoUrl', publicUrl);
    }
    setLogoUploading(false);
    e.target.value = '';
  }

  // ── Banner upload ───────────────────────────────────────────────────────────

  async function handleBannerUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image trop grande (max 5 Mo)'); return; }
    setBannerUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `clubs/new-${currentUser?.id ?? 'anon'}/${Date.now()}-banner.${ext}`;
    const { data, error } = await supabase.storage.from('club-logos').upload(path, file, { contentType: file.type, upsert: true });
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from('club-logos').getPublicUrl(data.path);
      set('bannerUrl', publicUrl);
    }
    setBannerUploading(false);
    e.target.value = '';
  }

  // ── Teams ───────────────────────────────────────────────────────────────────

  function toggleQuickTeam(qt) {
    const cats = [...(form.categories ?? [])];
    const existing = cats.find(c => c.name === qt.cat);
    if (existing) {
      const hasTeam = existing.teams?.some(t => t.name === qt.name);
      if (hasTeam) {
        existing.teams = (existing.teams ?? []).filter(t => t.name !== qt.name);
        if (!existing.teams.length) cats.splice(cats.indexOf(existing), 1);
      } else {
        existing.teams = [...(existing.teams ?? []), { id: teamUid(), name: qt.name }];
      }
    } else {
      cats.push({ id: catUid(), name: qt.cat, teams: [{ id: teamUid(), name: qt.name }] });
    }
    set('categories', cats);
  }

  function isTeamSelected(qt) {
    return (form.categories ?? []).some(c => c.name === qt.cat && c.teams?.some(t => t.name === qt.name));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSave({
        ...form,
        name:        form.name.trim(),
        memberCount: form.memberCount ? Number(form.memberCount) : null,
        foundingYear: form.foundingYear ? Number(form.foundingYear) : null,
      });
    } catch (e) {
      setErrors({ submit: e.message || 'Erreur lors de la création' });
      setSubmitting(false);
    }
  }

  // ── Step content ─────────────────────────────────────────────────────────────

  const stepContent = {

    // ── Étape 1 : Identité ────────────────────────────────────────────────────
    1: (
      <>
        <StepHeader step={1} total={6} title="Créez votre club" subtitle="Ces 3 informations sont obligatoires. Le reste est optionnel." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Nom */}
          <div>
            <label style={labelStyle}>Nom du club *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="FC Brest, US Landerneau…"
              style={{ ...inputStyle, borderColor: errors.name ? '#ef4444' : 'var(--sl-border)' }}
              autoFocus />
            {errors.name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.name}</div>}
          </div>

          {/* Sigle */}
          <div>
            <label style={labelStyle}>Sigle / Acronyme</label>
            <input value={form.sigle} onChange={e => set('sigle', e.target.value)}
              placeholder="FCB, USL…" maxLength={8}
              style={inputStyle} />
          </div>

          {/* Sport */}
          <div>
            <label style={labelStyle}>Sport *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 6 }}>
              {sportList.slice(0, 12).map(s => (
                <button key={s.id} onClick={() => { set('sport', s.id); if (!form.primaryColor || form.primaryColor === '#22C55E') set('primaryColor', s.color ?? '#22C55E'); }}
                  style={{
                    padding: '8px 6px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${form.sport === s.id ? (s.color ?? '#22C55E') : 'var(--sl-border)'}`,
                    backgroundColor: form.sport === s.id ? `${s.color ?? '#22C55E'}12` : 'var(--sl-surface)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'all 0.12s',
                  }}>
                  <SportIcon sport={s.id} size={18} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: form.sport === s.id ? (s.color ?? '#22C55E') : 'var(--sl-t3)' }}>{s.id}</span>
                </button>
              ))}
            </div>
            {errors.sport && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.sport}</div>}
          </div>

          {/* Ville */}
          <div>
            <label style={labelStyle}>Ville *</label>
            <CityAutocomplete
              value={form.city}
              onChange={val => { set('city', val); setCityValid(false); }}
              onSelect={commune => {
                set('city', commune.nom);
                if (commune.codesPostaux?.[0]) set('postalCode', commune.codesPostaux[0]);
                if (commune.codeDepartement) set('region', commune.codeRegion ?? '');
                setCityValid(true);
              }}
              placeholder="Brest, Quimper, Landerneau…"
              inputStyle={{ ...inputStyle, borderColor: errors.city ? '#ef4444' : 'var(--sl-border)' }}
            />
            {errors.city && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.city}</div>}
          </div>

          {/* Année de création */}
          <div>
            <label style={labelStyle}>Année de création</label>
            <input type="number" value={form.foundingYear} onChange={e => set('foundingYear', e.target.value)}
              placeholder={`Ex : 1952`} min={1800} max={new Date().getFullYear()}
              style={inputStyle} />
          </div>

          {/* Couleur principale */}
          <div>
            <label style={labelStyle}>Couleur principale</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map(c => (
                <button key={c} onClick={() => set('primaryColor', c)}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0,
                    backgroundColor: c,
                    outline: form.primaryColor === c ? `3px solid ${c}` : 'none',
                    outlineOffset: 2,
                    transition: 'transform 0.1s',
                  }} />
              ))}
              <input type="color" value={form.primaryColor}
                onChange={e => set('primaryColor', e.target.value)}
                style={{ width: 30, height: 30, borderRadius: 8, cursor: 'pointer', border: 'none', padding: 0 }}
                title="Couleur personnalisée" />
            </div>
          </div>

          {/* Logo */}
          <LogoUpload logo={form.logoUrl} name={form.name} accentColor={accentColor}
            onUpload={handleLogoUpload} uploading={logoUploading} />

        </div>
      </>
    ),

    // ── Étape 2 : Présentation ────────────────────────────────────────────────
    2: (
      <>
        <StepHeader step={2} total={6} title="Présentation" subtitle="Racontez l'histoire de votre club pour attirer de nouveaux membres." optional />
        <ClubPreview form={form} accentColor={accentColor} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div>
            <label style={labelStyle}>Description courte</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Fondé en 1952, le FC Brest est un club de football amateur ancré dans le tissu sportif brestois…"
              rows={4} style={{ ...inputStyle, resize: 'none', lineHeight: 1.55 }} />
            <div style={{ textAlign: 'right', fontSize: 10, color: form.description.length > 380 ? '#ef4444' : 'var(--sl-t3)', marginTop: 3 }}>
              {form.description.length}/400
            </div>
          </div>

          <div>
            <label style={labelStyle}>Slogan du club</label>
            <input value={form.slogan} onChange={e => set('slogan', e.target.value)}
              placeholder="Ensemble, on va plus loin !"
              style={inputStyle} maxLength={80} />
          </div>

        </div>
      </>
    ),

    // ── Étape 3 : Localisation ────────────────────────────────────────────────
    3: (
      <>
        <StepHeader step={3} total={6} title="Localisation" subtitle="Où se trouvent vos installations ? Les membres pourront vous trouver facilement." optional />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div>
            <label style={labelStyle}>Stade / Salle / Terrain</label>
            <input value={form.venue} onChange={e => set('venue', e.target.value)}
              placeholder="Stade Francis-Le Blé, Gymnase Kerichen…"
              style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Adresse</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="15 rue du Stade"
              style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Code postal</label>
              <input value={form.postalCode} onChange={e => set('postalCode', e.target.value)}
                placeholder="29200"
                style={inputStyle} maxLength={10} />
            </div>
            <div>
              <label style={labelStyle}>Région</label>
              <input value={form.region} onChange={e => set('region', e.target.value)}
                placeholder="Bretagne"
                style={inputStyle} />
            </div>
          </div>

          {form.postalCode && (
            <div style={{ padding: '10px 14px', borderRadius: 12, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', fontSize: 12, color: 'var(--sl-t2)' }}>
              📍 {form.address ? `${form.address}, ` : ''}{form.postalCode} {form.city}
              {form.region ? ` — ${form.region}` : ''}
            </div>
          )}

        </div>
      </>
    ),

    // ── Étape 4 : Contact ─────────────────────────────────────────────────────
    4: (
      <>
        <StepHeader step={4} total={6} title="Contact" subtitle="Les coordonnées du responsable principal du club." optional />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Nom du responsable</label>
              <input value={form.managerName} onChange={e => set('managerName', e.target.value)}
                placeholder="Jean Dupont"
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fonction</label>
              <input value={form.managerFunction} onChange={e => set('managerFunction', e.target.value)}
                placeholder="Président"
                style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email de contact</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="contact@monclub.fr"
              style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Téléphone</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="06 12 34 56 78"
              style={inputStyle} />
          </div>

        </div>
      </>
    ),

    // ── Étape 5 : Sport & Médias ──────────────────────────────────────────────
    5: (
      <>
        <StepHeader step={5} total={6} title="Sport & Médias" subtitle="Vos équipes, votre niveau et vos réseaux sociaux." optional />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Équipes rapides */}
          <div>
            <label style={labelStyle}>Équipes</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {QUICK_TEAMS.map(qt => {
                const selected = isTeamSelected(qt);
                return (
                  <button key={`${qt.cat}-${qt.name}`} onClick={() => toggleQuickTeam(qt)}
                    style={{
                      padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${selected ? accentColor : 'var(--sl-border)'}`,
                      backgroundColor: selected ? `${accentColor}10` : 'var(--sl-surface)',
                      textAlign: 'left', transition: 'all 0.12s',
                    }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selected ? accentColor : 'var(--sl-t1)' }}>
                      {selected ? '✓ ' : ''}{qt.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 2 }}>{qt.cat}</div>
                  </button>
                );
              })}
            </div>
            {form.categories.length > 0 && (
              <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 10, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {form.categories.flatMap(c => c.teams).map(t => (
                    <span key={t.id} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, backgroundColor: `${accentColor}12`, color: accentColor, border: `1px solid ${accentColor}30` }}>
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Niveau + licenciés */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Niveau</label>
              <select value={form.level} onChange={e => set('level', e.target.value)}
                style={{ ...inputStyle, appearance: 'none' }}>
                <option value="">Sélectionner…</option>
                {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Nbre de licenciés</label>
              <input type="number" value={form.memberCount} onChange={e => set('memberCount', e.target.value)}
                placeholder="Ex : 120" min={1} style={inputStyle} />
            </div>
          </div>

          {/* Bannière */}
          <BannerUpload banner={form.bannerUrl} accentColor={accentColor}
            onUpload={handleBannerUpload} uploading={bannerUploading} />

          {/* Réseaux sociaux */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={labelStyle}>Réseaux sociaux</label>
            {[
              { key: 'facebook',  icon: '📘', label: 'Facebook',  placeholder: 'facebook.com/monclub' },
              { key: 'instagram', icon: '📸', label: 'Instagram', placeholder: '@monclub' },
              { key: 'tiktok',    icon: '🎵', label: 'TikTok',    placeholder: '@monclub' },
              { key: 'website',   icon: '🌐', label: 'Site web',  placeholder: 'www.monclub.fr' },
            ].map(({ key, icon, placeholder }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                <input value={form[key]} onChange={e => set(key, e.target.value)}
                  placeholder={placeholder} style={{ ...inputStyle, flex: 1 }} />
              </div>
            ))}
          </div>

        </div>
      </>
    ),

    // ── Étape 6 : Récapitulatif ───────────────────────────────────────────────
    6: (
      <>
        <StepHeader step={6} total={6} title="Récapitulatif" subtitle="Vérifiez les informations avant de créer votre club." />
        <ClubPreview form={form} accentColor={accentColor} />

        <div style={{ borderRadius: 14, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', padding: '0 14px', marginBottom: 16 }}>
          <RecapRow label="Nom"            value={form.name} />
          <RecapRow label="Sigle"          value={form.sigle} />
          <RecapRow label="Sport"          value={form.sport} />
          <RecapRow label="Ville"          value={form.city} />
          <RecapRow label="Code postal"    value={form.postalCode} />
          <RecapRow label="Région"         value={form.region} />
          <RecapRow label="Fondé en"       value={form.foundingYear} />
          <RecapRow label="Slogan"         value={form.slogan} />
          <RecapRow label="Stade"          value={form.venue} />
          <RecapRow label="Adresse"        value={form.address} />
          <RecapRow label="Responsable"    value={[form.managerName, form.managerFunction].filter(Boolean).join(' — ')} />
          <RecapRow label="Email"          value={form.email} />
          <RecapRow label="Téléphone"      value={form.phone} />
          <RecapRow label="Niveau"         value={form.level} />
          <RecapRow label="Licenciés"      value={form.memberCount} />
          <RecapRow label="Équipes"        value={form.categories.flatMap(c => c.teams).map(t => t.name).join(', ')} />
          <RecapRow label="Facebook"       value={form.facebook} />
          <RecapRow label="Instagram"      value={form.instagram} />
          <RecapRow label="Site web"       value={form.website} />
        </div>

        <div style={{ padding: '12px 14px', borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
            <strong>Votre club sera créé immédiatement.</strong> Vous pourrez commencer à utiliser SportLink de suite.
            Notre équipe vérifiera les informations fournies sous 48h.
          </p>
        </div>

        {errors.submit && (
          <div style={{ padding: '8px 12px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#ef4444', marginBottom: 8 }}>
            {errors.submit}
          </div>
        )}
      </>
    ),
  };

  const isLastStep = step === 6;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: Z.formModal,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 34 }}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Créer mon club"
        style={{
          width: '100%', maxWidth: 540,
          backgroundColor: 'var(--sl-card)',
          borderRadius: '22px 22px 0 0',
          border: '1px solid var(--sl-border)', borderBottom: 'none',
          maxHeight: '92dvh',
          display: 'flex', flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 3.5, borderRadius: 999, backgroundColor: 'var(--sl-border-s)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px 12px', flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em' }}>
            🏟️ Créer un club
          </span>
          <button onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Progress */}
        <ProgressBar step={step} total={6} accentColor={accentColor} />

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 8px', overscrollBehavior: 'contain' }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ x: dir > 0 ? 40 : -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir > 0 ? -40 : 40, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0, padding: '12px 18px 18px',
          borderTop: '1px solid var(--sl-border)',
          display: 'flex', gap: 10,
        }}>
          {step > 1 ? (
            <button onClick={goBack} style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              ← Précédent
            </button>
          ) : (
            <button onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Annuler
            </button>
          )}

          {step > 1 && !isLastStep && (
            <button onClick={skip} style={{ padding: '13px 16px', borderRadius: 14, border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent', color: 'var(--sl-t3)', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
              Passer
            </button>
          )}

          <button
            onClick={isLastStep ? handleSubmit : goNext}
            disabled={submitting}
            style={{
              flex: 2, padding: '13px', borderRadius: 14, border: 'none',
              backgroundColor: submitting ? 'var(--sl-surface)' : accentColor,
              color: submitting ? 'var(--sl-t3)' : '#fff',
              fontSize: 14, fontWeight: 800, cursor: submitting ? 'default' : 'pointer',
              boxShadow: submitting ? 'none' : `0 4px 14px ${accentColor}50`,
              transition: 'all 0.15s',
            }}
          >
            {submitting ? 'Création…' : isLastStep ? '🏟️ Créer le club' : 'Suivant →'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
