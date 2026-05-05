import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FINISTERE_CITIES, SPORT_TO_GROUP, SPORT_OPTIONS, LEVEL_OPTIONS } from '../data/cities.js';

const EMPTY_FORM = {
  title: '',
  sport: 'Football',
  date: '',
  time: '15:00',
  cityName: 'Brest',
  venue: '',
  description: '',
  level: 'Amateur',
  homeTeam: '',
  awayTeam: '',
};

function toFormValues(event) {
  if (!event) return EMPTY_FORM;
  const d = new Date(event.date);
  return {
    title: event.title ?? '',
    sport: event.sport ?? 'Football',
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 5),
    cityName: event.city ?? 'Brest',
    venue: event.venue ?? '',
    description: event.description ?? '',
    level: event.level ?? 'Amateur',
    homeTeam: event.standings?.home?.team ?? '',
    awayTeam: event.standings?.away?.team ?? '',
  };
}

function buildEvent(form) {
  const city = FINISTERE_CITIES.find((c) => c.name === form.cityName) ?? FINISTERE_CITIES[0];
  const sportGroup = SPORT_TO_GROUP[form.sport] ?? 'endurance';
  const isTeamSport = ['Football', 'Handball', 'Basketball', 'Rugby'].includes(form.sport);

  const title =
    isTeamSport && form.homeTeam && form.awayTeam
      ? `${form.homeTeam} vs ${form.awayTeam}`
      : form.title;

  return {
    title,
    sport: form.sport,
    sportGroup,
    date: `${form.date}T${form.time}:00`,
    city: city.name,
    lat: city.lat,
    lng: city.lng,
    venue: form.venue,
    description: form.description,
    level: form.level,
    departmentId: 'finistere',
    regionId: 'brittany',
    standings: isTeamSport && form.homeTeam && form.awayTeam
      ? {
          home: { team: form.homeTeam, rank: '-', points: null, wins: 0, draws: 0, losses: 0 },
          away: { team: form.awayTeam, rank: '-', points: null, wins: 0, draws: 0, losses: 0 },
        }
      : undefined,
  };
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition-colors';

export default function EventFormModal({ event, onSave, onClose }) {
  const isEdit = !!event;
  const [form, setForm] = useState(() => toFormValues(event));
  const isTeamSport = ['Football', 'Handball', 'Basketball', 'Rugby'].includes(form.sport);

  useEffect(() => { setForm(toFormValues(event)); }, [event]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.date) return;
    onSave(buildEvent(form));
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-end md:items-center justify-center md:p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Modal card */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          className="bg-white w-full md:max-w-lg flex flex-col overflow-hidden rounded-t-3xl md:rounded-2xl"
          style={{ height: '92dvh', maxHeight: '92dvh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle — mobile only */}
          <div className="md:hidden flex justify-center pt-3 pb-0 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
            <h2 className="text-base font-bold text-gray-800">
              {isEdit ? 'Modifier l\'événement' : 'Ajouter un événement'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Scrollable fields */}
          <form
            id="event-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-5 pb-2 space-y-4"
          >
            <Field label="Type de sport *">
              <select value={form.sport} onChange={(e) => set('sport', e.target.value)} className={inputCls}>
                {SPORT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            {isTeamSport && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Domicile">
                  <input
                    type="text"
                    value={form.homeTeam}
                    onChange={(e) => set('homeTeam', e.target.value)}
                    placeholder="FC Brest"
                    className={inputCls}
                  />
                </Field>
                <Field label="Visiteur">
                  <input
                    type="text"
                    value={form.awayTeam}
                    onChange={(e) => set('awayTeam', e.target.value)}
                    placeholder="FC Quimper"
                    className={inputCls}
                  />
                </Field>
              </div>
            )}

            {(!isTeamSport || (!form.homeTeam && !form.awayTeam)) && (
              <Field label="Nom de l'événement *">
                <input
                  type="text"
                  required={!isTeamSport}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Trail des Abers, Tournoi de basket…"
                  className={inputCls}
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date *">
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Heure *">
                <input
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) => set('time', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Ville *">
              <select value={form.cityName} onChange={(e) => set('cityName', e.target.value)} className={inputCls}>
                {FINISTERE_CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </Field>

            <Field label="Stade / Salle / Lieu">
              <input
                type="text"
                value={form.venue}
                onChange={(e) => set('venue', e.target.value)}
                placeholder="Stade municipal, Salle omnisports…"
                className={inputCls}
              />
            </Field>

            <Field label="Niveau">
              <select value={form.level} onChange={(e) => set('level', e.target.value)} className={inputCls}>
                {LEVEL_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Informations complémentaires : enjeu du match, parcours, règlement…"
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </Field>
          </form>

          {/* Footer buttons — fixed outside scroll */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 flex gap-3 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="event-form"
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer"
              style={{ backgroundColor: '#1e293b' }}
            >
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
