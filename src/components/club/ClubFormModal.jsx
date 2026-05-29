import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../../hooks/useSports.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import SportIcon from '../SportIcon.jsx';
import CityAutocomplete from '../CityAutocomplete.jsx';
import { clubSchema, validate } from '../../lib/schemas.js';
import { supabase } from '../../lib/supabase.js';

const AGE_CATEGORIES = [
  'U7', 'U7F', 'U9', 'U9F', 'U11', 'U11F', 'U13', 'U13F',
  'U15', 'U15F', 'U17', 'U17F', 'U19', 'U19F',
  'Seniors', 'Seniors F', 'Vétérans', 'Vétérans F', 'Loisir', 'Loisir F',
];

const LEVELS = [
  'D4', 'D3', 'D2', 'D1',
  'R3', 'R2', 'R1',
  'N3', 'N2', 'N1',
  'Promotion de Ligue', 'Division Honneur',
  'Fédérale 3', 'Pro B',
  'Régional', 'Loisir / Compétition', 'Tout public', 'Débutant / Initiation', 'Loisir',
];

function catUid()  { return `cat_${Date.now()}_${Math.random().toString(36).slice(2,5)}`; }
function teamUid() { return `tm_${Date.now()}_${Math.random().toString(36).slice(2,5)}`; }

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 font-poppins';
const selectCls = 'text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none font-medium';


// ── Logo upload ───────────────────────────────────────────────────────────────
function LogoUpload({ logo, name, sport, clubId, userId, onChange }) {
  const ref = useRef();
  const { allSports } = useSports();
  const [uploading, setUploading] = useState(false);
  const sportColor = allSports[sport]?.color ?? '#64748b';
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 3);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image trop grande (max 2 Mo)'); return; }

    setUploading(true);
    const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const folder = clubId ?? `new-${userId ?? 'anon'}`;
    const path = `clubs/${folder}/${Date.now()}-logo.${ext}`;

    const { data, error } = await supabase.storage
      .from('club-logos')
      .upload(path, file, { contentType: file.type, upsert: true });

    if (error || !data) {
      alert("Erreur lors de l'upload du logo.");
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

  const isStorageUrl = logo && logo.startsWith('http');

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" onClick={() => !uploading && ref.current?.click()} style={{ cursor: uploading ? 'wait' : 'pointer' }}>
        <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-white text-lg font-oswald select-none"
          style={{ backgroundColor: (logo && !uploading) ? 'transparent' : sportColor, boxShadow: '0 0 0 2px white, 0 0 0 3.5px rgba(0,0,0,0.08)' }}>
          {uploading
            ? <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>Upload…</span>
            : logo
            ? <img src={logo} alt="logo" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
            : initials}
        </div>
        {!uploading && (
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center transition-opacity opacity-0 hover:opacity-100"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => !uploading && ref.current?.click()}
          className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          disabled={uploading}>
          {uploading ? 'Upload en cours…' : logo ? 'Changer le logo' : 'Ajouter un logo'}
        </button>
        {logo && !uploading && (
          <button type="button" onClick={() => onChange(null)}
            className="text-xs text-red-400 hover:text-red-600 transition-colors">
            Supprimer
          </button>
        )}
      </div>
      {isStorageUrl && (
        <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 600 }}>✓ Hébergé sur SportLink</span>
      )}
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Category block ────────────────────────────────────────────────────────────
function CategoryBlock({ cat, onAddTeam, onUpdateTeam, onRemoveTeam, onRemoveCat }) {
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      {/* Category header */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: '#F8FAFC' }}>
        <span className="font-bold text-sm font-poppins" style={{ color: '#0F1E3A' }}>{cat.name}</span>
        <button onClick={onRemoveCat}
          className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
          Supprimer
        </button>
      </div>

      {/* Teams */}
      <div className="divide-y divide-gray-100">
        {cat.teams.map((team, idx) => (
          <div key={team.id} className="flex items-center gap-2 px-4 py-2.5">
            <input
              type="text"
              value={team.name}
              onChange={e => onUpdateTeam(team.id, { name: e.target.value })}
              placeholder={`${cat.name} ${idx + 1}`}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none min-w-0"
            />
            <select
              value={team.level}
              onChange={e => onUpdateTeam(team.id, { level: e.target.value })}
              className={selectCls}
            >
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={() => onRemoveTeam(team.id)}
              className="p-1.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add team */}
      <button onClick={onAddTeam}
        className="flex items-center gap-1.5 w-full px-4 py-2.5 text-xs text-gray-400 hover:text-slate-600 hover:bg-gray-50 transition-colors border-t border-gray-100 border-dashed">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Ajouter une équipe {cat.name}
      </button>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function ClubFormModal({ club, onSave, onClose }) {
  const { allSports: SPORTS } = useSports();
  const { currentUser } = useAuth();
  const isEdit = !!club;

  const [form, setForm] = useState({
    name:       club?.name       ?? '',
    sport:      club?.sport      ?? Object.keys(SPORTS)[0],
    city:       club?.city       ?? '',
    email:      club?.email      ?? '',
    logoUrl:    club?.logoUrl    ?? null,
    categories: club?.categories ?? [],
  });
  const [errors, setErrors]               = useState({});
  const [cityValid, setCityValid]         = useState(!!club?.city);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [submitting, setSubmitting]       = useState(false);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }

  // ── Category helpers ────────────────────────────────────────────────────────
  const usedCatNames = form.categories.map(c => c.name);

  function addCategory(name) {
    setForm(f => ({
      ...f,
      categories: [...f.categories, {
        id: catUid(),
        name,
        teams: [{ id: teamUid(), name: `${name} 1`, level: 'D4' }],
      }],
    }));
    setShowCatPicker(false);
  }

  function removeCategory(catId) {
    setForm(f => ({ ...f, categories: f.categories.filter(c => c.id !== catId) }));
  }

  function addTeam(catId) {
    setForm(f => ({
      ...f,
      categories: f.categories.map(c => {
        if (c.id !== catId) return c;
        const n = c.teams.length + 1;
        return { ...c, teams: [...c.teams, { id: teamUid(), name: `${c.name} ${n}`, level: 'D4' }] };
      }),
    }));
  }

  function updateTeam(catId, teamId, patch) {
    setForm(f => ({
      ...f,
      categories: f.categories.map(c => c.id !== catId ? c : {
        ...c,
        teams: c.teams.map(t => t.id !== teamId ? t : { ...t, ...patch }),
      }),
    }));
  }

  function removeTeam(catId, teamId) {
    setForm(f => ({
      ...f,
      categories: f.categories.map(c => c.id !== catId ? c : {
        ...c,
        teams: c.teams.filter(t => t.id !== teamId),
      }).filter(c => c.teams.length > 0),
    }));
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function runValidation() {
    const { ok, errors: zodErrors } = validate(clubSchema, form);
    const extra = {};
    if (!ok) setErrors({ ...zodErrors, ...extra });
    if (ok && !cityValid) {
      setErrors({ city: 'Sélectionnez une commune valide dans la liste' });
      return false;
    }
    if (!ok) return false;
    setErrors({});
    return true;
  }

  async function handleSubmit() {
    if (!runValidation() || submitting) return;
    setSubmitting(true);
    try {
      await onSave({ ...form });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="mt-auto bg-white rounded-t-3xl flex flex-col overflow-hidden"
        style={{ maxHeight: '94dvh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold font-poppins text-lg" style={{ color: '#0F1E3A' }}>
              {isEdit ? 'Modifier le club' : 'Créer mon club'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? 'Modifiez les informations de votre club' : 'Renseignez les informations de votre club'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4 space-y-5">

          {/* Logo */}
          <LogoUpload
            logo={form.logoUrl}
            name={form.name}
            sport={form.sport}
            clubId={club?.id}
            userId={currentUser?.id}
            onChange={val => set('logoUrl', val)}
          />

          {/* Sport */}
          <Field label="Sport *">
            <div className="flex flex-wrap gap-2">
              {Object.values(SPORTS).map(sport => {
                const active = form.sport === sport.id;
                return (
                  <button key={sport.id} onClick={() => set('sport', sport.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                    style={active ? { backgroundColor: sport.color, color: 'white' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}>
                    <SportIcon sport={sport.id} size={13} color={active ? 'white' : sport.color} />
                    {sport.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Nom */}
          <Field label="Nom du club *">
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="ex. US Brest Football" className={inputCls} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </Field>

          {/* Ville */}
          <Field label="Ville *">
            <CityAutocomplete
              value={form.city}
              onChange={val => { set('city', val); setCityValid(false); }}
              onSelect={() => setCityValid(true)}
              onValidChange={setCityValid}
              inputClassName={inputCls}
              error={errors.city}
            />
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </Field>

          {/* Email */}
          <Field label="Email de contact *">
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="contact@monclub.fr" className={inputCls} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </Field>

          {/* ── Catégories & équipes ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Catégories & équipes
              </label>
              <button onClick={() => setShowCatPicker(v => !v)}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors text-white"
                style={{ backgroundColor: '#0F1E3A' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Ajouter
              </button>
            </div>

            {/* Category picker */}
            <AnimatePresence>
              {showCatPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="mb-3 p-3 bg-gray-50 rounded-2xl border border-gray-200"
                >
                  <p className="text-xs text-gray-400 mb-2 font-medium">Choisir une catégorie :</p>
                  <div className="flex flex-wrap gap-2">
                    {AGE_CATEGORIES.map(cat => {
                      const used = usedCatNames.includes(cat);
                      return (
                        <button key={cat} onClick={() => !used && addCategory(cat)}
                          disabled={used}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-40"
                          style={used
                            ? { backgroundColor: '#f1f5f9', color: '#94a3b8' }
                            : { backgroundColor: '#0F1E3A', color: 'white' }}>
                          {cat}{used ? ' ✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category list */}
            <div className="space-y-3">
              {form.categories.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-4 border-2 border-dashed border-gray-200 rounded-2xl">
                  Aucune catégorie — cliquez sur "Ajouter" pour commencer
                </p>
              ) : (
                form.categories.map(cat => (
                  <CategoryBlock
                    key={cat.id}
                    cat={cat}
                    onAddTeam={() => addTeam(cat.id)}
                    onUpdateTeam={(teamId, patch) => updateTeam(cat.id, teamId, patch)}
                    onRemoveTeam={teamId => removeTeam(cat.id, teamId)}
                    onRemoveCat={() => removeCategory(cat.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-3 rounded-2xl text-sm font-bold font-poppins text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#22C55E', cursor: submitting ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le club'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
