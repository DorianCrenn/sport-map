import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPORTS } from '../../data/events.js';
import SportIcon from '../SportIcon.jsx';

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

// ── City autocomplete with geo.api.gouv.fr ────────────────────────────────────
function CityField({ value, onChange, onValidChange, error }) {
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState(null); // null | 'checking' | 'valid' | 'invalid'
  const [open, setOpen] = useState(false);
  const debounce = useRef(null);

  function handleInput(val) {
    onChange(val);
    setStatus(null);
    clearTimeout(debounce.current);
    if (val.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
    setStatus('checking');
    debounce.current = setTimeout(async () => {
      try {
        const res  = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(val.trim())}&limit=6&boost=population&fields=nom,codeDepartement`);
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
        const exact = data.some(c => c.nom.toLowerCase() === val.trim().toLowerCase());
        const st = data.length === 0 ? 'invalid' : exact ? 'valid' : 'partial';
        setStatus(st);
        onValidChange(st === 'valid');
      } catch { setStatus(null); }
    }, 380);
  }

  function pick(commune) {
    onChange(commune.nom);
    setSuggestions([]);
    setOpen(false);
    setStatus('valid');
    onValidChange(true);
  }

  return (
    <div className="relative">
      <div className="relative">
        <input type="text" value={value}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          placeholder="ex. Brest"
          className={`${inputCls} pr-8`} />
        {/* Status icon */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {status === 'checking' && (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          )}
          {status === 'valid' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          {status === 'invalid' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </span>
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            {suggestions.map(c => (
              <button key={c.code} type="button" onMouseDown={() => pick(c)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 text-left transition-colors">
                <span className="text-sm font-medium text-gray-800">{c.nom}</span>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">dép. {c.codeDepartement}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'invalid' && (
        <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
          Commune introuvable en France — vérifiez l'orthographe
        </p>
      )}
      {status === 'partial' && suggestions.length > 0 && (
        <p className="text-xs text-gray-400 mt-1">Sélectionnez une commune dans la liste</p>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Logo upload ───────────────────────────────────────────────────────────────
function LogoUpload({ logo, name, sport, onChange }) {
  const ref = useRef();
  const sportColor = SPORTS[sport]?.color ?? '#64748b';
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 3);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image trop grande (max 2 Mo)'); return; }
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" onClick={() => ref.current?.click()} style={{ cursor: 'pointer' }}>
        <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-white text-lg font-oswald select-none"
          style={{ backgroundColor: logo ? 'transparent' : sportColor, boxShadow: '0 0 0 2px white, 0 0 0 3.5px rgba(0,0,0,0.08)' }}>
          {logo
            ? <img src={logo} alt="logo" className="w-full h-full object-cover" />
            : initials}
        </div>
        {/* Camera overlay */}
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center transition-opacity opacity-0 hover:opacity-100"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => ref.current?.click()}
          className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors">
          {logo ? 'Changer le logo' : 'Ajouter un logo'}
        </button>
        {logo && (
          <button type="button" onClick={() => onChange(null)}
            className="text-xs text-red-400 hover:text-red-600 transition-colors">
            Supprimer
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
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
  const isEdit = !!club;

  const [form, setForm] = useState({
    name:       club?.name       ?? '',
    sport:      club?.sport      ?? Object.keys(SPORTS)[0],
    city:       club?.city       ?? '',
    members:    club?.members    ?? 50,
    contact:    club?.contact    ?? '',
    categories: club?.categories ?? [],
    logo:       club?.logo       ?? null,
  });
  const [errors, setErrors]             = useState({});
  const [cityValid, setCityValid]       = useState(!!club?.city);
  const [showCatPicker, setShowCatPicker] = useState(false);

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
  function validate() {
    const e = {};
    if (!form.name.trim())    e.name    = 'Nom requis';
    if (!form.city.trim())    e.city    = 'Ville requise';
    else if (!cityValid)      e.city    = 'Sélectionnez une commune valide dans la liste';
    if (!form.contact.trim()) e.contact = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact)) e.contact = 'Email invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    // Derive main level from first team of first category (or fallback)
    const firstTeam = form.categories[0]?.teams[0];
    const level = firstTeam?.level ?? 'Loisir';
    onSave({ ...form, members: Number(form.members), level });
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
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4 space-y-5">

          {/* Logo */}
          <LogoUpload
            logo={form.logo}
            name={form.name}
            sport={form.sport}
            onChange={val => set('logo', val)}
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

          {/* Ville + Membres */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville *">
              <CityField
                value={form.city}
                onChange={val => { set('city', val); setCityValid(false); }}
                onValidChange={setCityValid}
                error={errors.city}
              />
            </Field>
            <Field label="Membres">
              <input type="number" value={form.members} onChange={e => set('members', e.target.value)}
                min={1} className={inputCls} />
            </Field>
          </div>

          {/* Email */}
          <Field label="Email de contact *">
            <input type="email" value={form.contact} onChange={e => set('contact', e.target.value)}
              placeholder="contact@monclub.fr" className={inputCls} />
            {errors.contact && <p className="text-xs text-red-500 mt-1">{errors.contact}</p>}
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
          <button onClick={handleSubmit}
            className="flex-1 py-3 rounded-2xl text-sm font-bold font-poppins text-white transition-colors"
            style={{ backgroundColor: '#22C55E' }}>
            {isEdit ? 'Enregistrer' : 'Créer le club'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
