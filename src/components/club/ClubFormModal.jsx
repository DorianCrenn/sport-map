import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPORTS } from '../../data/events.js';
import SportIcon from '../SportIcon.jsx';

const LEVELS = [
  'Loisir', 'Tout public', 'Débutant / Initiation', 'Loisir / Compétition',
  'D4', 'D3', 'D2', 'D1',
  'R3', 'R2', 'R1',
  'N3', 'N2', 'N1',
  'Promotion de Ligue', 'Division Honneur', 'N3 Régional',
  'Fédérale 3', 'Pro B',
];

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 font-poppins';

export default function ClubFormModal({ club, onSave, onClose }) {
  const isEdit = !!club;

  const [form, setForm] = useState({
    name:    club?.name    ?? '',
    sport:   club?.sport   ?? Object.keys(SPORTS)[0],
    city:    club?.city    ?? '',
    level:   club?.level   ?? 'Loisir',
    members: club?.members ?? 50,
    contact: club?.contact ?? '',
  });
  const [errors, setErrors] = useState({});

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim())    e.name    = 'Nom requis';
    if (!form.city.trim())    e.city    = 'Ville requise';
    if (!form.contact.trim()) e.contact = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact)) e.contact = 'Email invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave({ ...form, members: Number(form.members) });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="mt-auto bg-white rounded-t-3xl flex flex-col"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold font-poppins text-lg" style={{ color: '#0F1E3A' }}>
              {isEdit ? 'Modifier le club' : 'Créer mon club'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? 'Modifiez les informations de base' : 'Renseignez les informations de votre club'}
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
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Sport */}
          <Field label="Sport *">
            <div className="flex flex-wrap gap-2">
              {Object.values(SPORTS).map(sport => {
                const active = form.sport === sport.id;
                return (
                  <button key={sport.id} onClick={() => set('sport', sport.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                    style={active
                      ? { backgroundColor: sport.color, color: 'white' }
                      : { backgroundColor: '#f1f5f9', color: '#64748b' }}>
                    <SportIcon sport={sport.id} size={13} color={active ? 'white' : sport.color} />
                    {sport.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Nom */}
          <Field label="Nom du club *">
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="ex. US Brest Football"
              className={inputCls}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </Field>

          {/* Ville */}
          <Field label="Ville *">
            <input
              type="text"
              value={form.city}
              onChange={e => set('city', e.target.value)}
              placeholder="ex. Brest"
              className={inputCls}
            />
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </Field>

          {/* Niveau */}
          <Field label="Niveau">
            <select value={form.level} onChange={e => set('level', e.target.value)}
              className={inputCls}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>

          {/* Membres */}
          <Field label="Nombre de membres">
            <input
              type="number"
              value={form.members}
              onChange={e => set('members', e.target.value)}
              min={1}
              className={inputCls}
            />
          </Field>

          {/* Contact */}
          <Field label="Email de contact *">
            <input
              type="email"
              value={form.contact}
              onChange={e => set('contact', e.target.value)}
              placeholder="contact@monclub.fr"
              className={inputCls}
            />
            {errors.contact && <p className="text-xs text-red-500 mt-1">{errors.contact}</p>}
          </Field>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold font-poppins border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
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
