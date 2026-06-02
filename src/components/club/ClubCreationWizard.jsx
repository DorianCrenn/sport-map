import { useState, useRef } from 'react';
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

const AGE_CATEGORIES = [
  'U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U19',
  'Seniors', 'Seniors F', 'Vétérans', 'Loisir',
];

const QUICK_TEAMS = [
  { cat: 'Seniors', name: 'Seniors 1' },
  { cat: 'Seniors F', name: 'Seniors F 1' },
  { cat: 'U17', name: 'U17' },
  { cat: 'U15', name: 'U15' },
  { cat: 'U13', name: 'U13' },
  { cat: 'Loisir', name: 'Loisir' },
];

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px', borderRadius: 12, fontSize: 14,
  border: '1.5px solid var(--sl-border)',
  backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)',
  outline: 'none', fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.15s',
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

// ── Logo mini-upload ──────────────────────────────────────────────────────────

function LogoPreview({ logo, name, sport, accentColor, onUpload, uploading }) {
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
          transition: 'transform 0.15s',
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
          PNG ou JPG · max 2 Mo<br />
          Fond blanc ou transparent recommandé
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

// ── Mini preview ──────────────────────────────────────────────────────────────

function ClubPreview({ form, accentColor }) {
  const initials = (form.name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 3);
  const teamCount = (form.categories ?? []).flatMap(c => c.teams ?? []).length;

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      border: '1px solid var(--sl-border)',
      backgroundColor: 'var(--sl-card)',
      marginBottom: 16,
    }}>
      {/* Mini hero */}
      <div style={{
        height: 56,
        background: `linear-gradient(135deg, #0f172a 0%, ${accentColor}40 100%)`,
        display: 'flex', alignItems: 'flex-end',
        padding: '0 12px 8px',
        position: 'relative',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          backgroundColor: form.logoUrl ? '#fff' : accentColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 2px rgba(255,255,255,0.8)',
          overflow: 'hidden',
        }}>
          {form.logoUrl
            ? <img src={form.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} />
            : <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{initials}</span>}
        </div>
        <div style={{ marginLeft: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            {form.name || 'Nom du club'}
          </div>
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

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function ClubCreationWizard({ onSave, onClose }) {
  const { allSports: SPORTS } = useSports();
  const { currentUser } = useAuth();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [cityValid, setCityValid] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    sport: '',
    city: '',
    email: '',
    logoUrl: '',
    description: '',
    slogan: '',
    venue: '',
    address: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    website: '',
    categories: [],
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const sportList = Object.entries(SPORTS)
    .filter(([, s]) => !s.isArchived)
    .map(([id, s]) => ({ id, ...s }));

  const accentColor = SPORTS[form.sport]?.color ?? '#22C55E';

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

  function goBack() {
    setDir(-1);
    setStep(s => Math.max(s - 1, 1));
  }

  function skip() {
    setDir(1);
    setStep(s => Math.min(s + 1, 6));
  }

  // ── Logo upload ─────────────────────────────────────────────────────────────

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image trop grande (max 2 Mo)'); return; }
    setLogoUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const folder = `new-${currentUser?.id ?? 'anon'}`;
    const path = `clubs/${folder}/${Date.now()}-logo.${ext}`;
    const { data, error } = await supabase.storage.from('club-logos').upload(path, file, { contentType: file.type, upsert: true });
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from('club-logos').getPublicUrl(data.path);
      set('logoUrl', publicUrl);
    }
    setLogoUploading(false);
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
        if (!existing.teams.length) {
          const idx = cats.indexOf(existing);
          cats.splice(idx, 1);
        }
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
        name: form.name.trim(),
        sport: form.sport,
        city: form.city,
        email: form.email.trim(),
        logoUrl: form.logoUrl,
        description: form.description.trim(),
        categories: form.categories,
      });
    } catch (e) {
      setErrors({ submit: e.message || 'Erreur lors de la création' });
      setSubmitting(false);
    }
  }

  // ── Step content ─────────────────────────────────────────────────────────────

  const stepContent = {
    1: (
      <>
        <StepHeader step={1} total={6} title="Créez votre club" subtitle="Seules ces 3 informations sont obligatoires." />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nom */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Nom du club *
            </label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="FC Brest, US Landerneau…"
              style={{ ...inputStyle, borderColor: errors.name ? '#ef4444' : 'var(--sl-border)' }}
              autoFocus
            />
            {errors.name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.name}</div>}
          </div>

          {/* Sport */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              Sport *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6 }}>
              {sportList.slice(0, 12).map(s => (
                <button
                  key={s.id}
                  onClick={() => set('sport', s.id)}
                  style={{
                    padding: '8px 6px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${form.sport === s.id ? (s.color ?? '#22C55E') : 'var(--sl-border)'}`,
                    backgroundColor: form.sport === s.id ? `${s.color ?? '#22C55E'}12` : 'var(--sl-surface)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'all 0.12s',
                  }}
                >
                  <SportIcon sport={s.id} size={18} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: form.sport === s.id ? (s.color ?? '#22C55E') : 'var(--sl-t3)' }}>
                    {s.id}
                  </span>
                </button>
              ))}
            </div>
            {errors.sport && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.sport}</div>}
          </div>

          {/* Ville */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Ville *
            </label>
            <CityAutocomplete
              value={form.city}
              onChange={val => { set('city', val); setCityValid(false); }}
              onSelect={commune => { set('city', commune.nom); setCityValid(true); }}
              placeholder="Brest, Quimper, Landerneau…"
              inputStyle={{ ...inputStyle, borderColor: errors.city ? '#ef4444' : 'var(--sl-border)' }}
            />
            {errors.city && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.city}</div>}
          </div>
        </div>
      </>
    ),

    2: (
      <>
        <StepHeader step={2} total={6} title="Identité visuelle" subtitle="Ajoutez un logo et personnalisez l'apparence de votre club." optional />
        <ClubPreview form={form} accentColor={accentColor} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <LogoPreview
            logo={form.logoUrl}
            name={form.name}
            sport={form.sport}
            accentColor={accentColor}
            onUpload={handleLogoUpload}
            uploading={logoUploading}
          />
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Email de contact
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="contact@monclub.fr"
              style={inputStyle}
            />
          </div>
        </div>
      </>
    ),

    3: (
      <>
        <StepHeader step={3} total={6} title="Présentation" subtitle="Racontez l'histoire de votre club pour attirer de nouveaux membres." optional />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Description du club
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Fondé en 1952, le FC Brest est un club de football amateur ancré dans le tissu sportif brestois…"
              rows={4}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.55 }}
            />
            <div style={{ textAlign: 'right', fontSize: 10, color: form.description.length > 300 ? '#ef4444' : 'var(--sl-t3)', marginTop: 3 }}>
              {form.description.length}/400
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Slogan du club
            </label>
            <input
              value={form.slogan}
              onChange={e => set('slogan', e.target.value)}
              placeholder="Ensemble, on va plus loin !"
              style={inputStyle}
              maxLength={80}
            />
          </div>
        </div>
      </>
    ),

    4: (
      <>
        <StepHeader step={4} total={6} title="Localisation" subtitle="Où se trouvent vos installations ? Les joueurs pourront vous localiser facilement." optional />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Stade / Salle
            </label>
            <input
              value={form.venue}
              onChange={e => set('venue', e.target.value)}
              placeholder="Stade Francis-Le Blé, Gymnase Kerichen…"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Adresse
            </label>
            <input
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="15 rue du Stade, 29200 Brest"
              style={inputStyle}
            />
          </div>
        </div>
      </>
    ),

    5: (
      <>
        <StepHeader step={5} total={6} title="Réseaux sociaux" subtitle="Connectez vos réseaux pour maximiser votre visibilité." optional />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'facebook',  icon: '📘', label: 'Facebook',  placeholder: 'facebook.com/monclub' },
            { key: 'instagram', icon: '📸', label: 'Instagram', placeholder: '@monclub' },
            { key: 'tiktok',    icon: '🎵', label: 'TikTok',    placeholder: '@monclub' },
            { key: 'website',   icon: '🌐', label: 'Site web',  placeholder: 'www.monclub.fr' },
          ].map(({ key, icon, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                {icon} {label}
              </label>
              <input
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                style={{ ...inputStyle, paddingLeft: 12 }}
              />
            </div>
          ))}
        </div>
      </>
    ),

    6: (
      <>
        <StepHeader step={6} total={6} title="Vos équipes" subtitle="Sélectionnez les équipes de votre club. Vous pourrez les modifier à tout moment." optional />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
          {QUICK_TEAMS.map(qt => {
            const selected = isTeamSelected(qt);
            return (
              <button
                key={`${qt.cat}-${qt.name}`}
                onClick={() => toggleQuickTeam(qt)}
                style={{
                  padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${selected ? accentColor : 'var(--sl-border)'}`,
                  backgroundColor: selected ? `${accentColor}10` : 'var(--sl-surface)',
                  textAlign: 'left', transition: 'all 0.12s',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: selected ? accentColor : 'var(--sl-t1)' }}>
                  {selected ? '✓ ' : ''}{qt.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 2 }}>{qt.cat}</div>
              </button>
            );
          })}
        </div>

        {form.categories.length > 0 && (
          <div style={{
            padding: '10px 14px', borderRadius: 12,
            backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t2)', marginBottom: 6 }}>
              {form.categories.flatMap(c => c.teams).length} équipe{form.categories.flatMap(c => c.teams).length > 1 ? 's' : ''} sélectionnée{form.categories.flatMap(c => c.teams).length > 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {form.categories.flatMap(c => c.teams).map(t => (
                <span key={t.id} style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                  backgroundColor: `${accentColor}12`, color: accentColor,
                  border: `1px solid ${accentColor}30`,
                }}>
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {errors.submit && (
          <div style={{ padding: '8px 12px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#ef4444' }}>
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
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 18px 12px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em' }}>
            🏟️ Créer un club
          </span>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
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
            <button
              onClick={goBack}
              style={{
                flex: 1, padding: '13px', borderRadius: 14,
                border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)',
                color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ← Précédent
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '13px', borderRadius: 14,
                border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)',
                color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Annuler
            </button>
          )}

          {step > 1 && !isLastStep && (
            <button
              onClick={skip}
              style={{
                padding: '13px 16px', borderRadius: 14,
                border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent',
                color: 'var(--sl-t3)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Passer
            </button>
          )}

          <button
            onClick={isLastStep ? handleSubmit : goNext}
            disabled={submitting}
            style={{
              flex: isLastStep ? 2 : 2, padding: '13px',
              borderRadius: 14, border: 'none',
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
