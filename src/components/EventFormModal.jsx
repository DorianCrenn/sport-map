import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENT_TYPES } from '../data/cities.js';
import { useSports } from '../hooks/useSports.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import CityAutocomplete from './CityAutocomplete.jsx';

const BREST = { name: 'Brest', lat: 48.3904, lng: -4.4861 };

const EMPTY_FORM = {
  title: '',
  sport: 'Football',
  date: '',
  time: '15:00',
  cityName: BREST.name,
  cityLat:  BREST.lat,
  cityLng:  BREST.lng,
  venue: '',
  description: '',
  eventType: 'championship',
  teamName: '',
  category: '',
  homeTeam: '',
  awayTeam: '',
};

function toFormValues(event, defaults = {}) {
  if (!event || event._isNew) {
    return {
      ...EMPTY_FORM,
      teamName: defaults.teamName ?? '',
      category: defaults.category ?? '',
    };
  }
  const d = new Date(event.date);
  return {
    title:     event.title ?? '',
    sport:     event.sport ?? 'Football',
    date:      d.toISOString().slice(0, 10),
    time:      d.toTimeString().slice(0, 5),
    cityName:  event.city ?? BREST.name,
    cityLat:   event.lat  ?? BREST.lat,
    cityLng:   event.lng  ?? BREST.lng,
    venue:     event.venue ?? '',
    description: event.description ?? '',
    eventType: event.eventType ?? 'championship',
    teamName:  event.teamName ?? '',
    category:  event.category ?? '',
    homeTeam:  event.standings?.home?.team ?? '',
    awayTeam:  event.standings?.away?.team ?? '',
  };
}

function buildEvent(form, currentUser) {
  const isTeamSport = ['Football', 'Handball', 'Basketball', 'Rugby'].includes(form.sport);

  const title =
    isTeamSport && form.homeTeam && form.awayTeam
      ? `${form.homeTeam} vs ${form.awayTeam}`
      : form.title;

  return {
    title,
    sport: form.sport,
    sportGroup: form.sport,
    date: `${form.date}T${form.time}:00`,
    city: form.cityName,
    lat: form.cityLat,
    lng: form.cityLng,
    venue: form.venue,
    description: form.description,
    eventType: form.eventType,
    teamName: form.teamName,
    category: form.category,
    clubId: currentUser?.clubId ?? null,
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
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--sl-t3)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function EventTypeRadio({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {EVENT_TYPES.map((type) => {
        const selected = value === type.value;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all cursor-pointer"
            style={{
              borderColor: selected ? type.color : 'var(--sl-border)',
              backgroundColor: selected ? `${type.color}14` : 'var(--sl-surface)',
              color: selected ? type.color : 'var(--sl-t2)',
            }}
          >
            <span className="text-xl">{type.icon}</span>
            <span className="text-xs font-semibold leading-tight text-center" style={{ color: selected ? type.color : 'var(--sl-t2)' }}>
              {type.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function EventFormModal({ event, onSave, onClose }) {
  const { currentUser } = useAuth();
  const { allSports } = useSports();
  const sportOptions = Object.values(allSports).filter(s => !s.isArchived).map(s => s.label);
  const isEdit = !!event && !event?._isNew;

  const [form, setForm] = useState(() => toFormValues(
    event,
    { teamName: event?._isNew ? event.defaultTeam : undefined, category: event?._isNew ? event.defaultCategory : undefined }
  ));

  const isTeamSport = ['Football', 'Handball', 'Basketball', 'Rugby'].includes(form.sport);

  useEffect(() => {
    setForm(toFormValues(
      event,
      { teamName: event?._isNew ? event.defaultTeam : undefined, category: event?._isNew ? event.defaultCategory : undefined }
    ));
  }, [event]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.date) return;
    onSave(buildEvent(form, currentUser));
  }

  const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors';
  const inputStyle = {
    backgroundColor: 'var(--sl-surface)',
    border: '1px solid var(--sl-border-s)',
    color: 'var(--sl-t1)',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-end md:items-center justify-center md:p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          className="w-full md:max-w-lg flex flex-col overflow-hidden rounded-t-3xl md:rounded-2xl"
          style={{
            backgroundColor: 'var(--sl-card)',
            border: '1px solid var(--sl-border)',
            height: '92dvh',
            maxHeight: '92dvh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle — mobile only */}
          <div className="md:hidden flex justify-center pt-3 pb-0 flex-shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--sl-border-s)' }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--sl-border)' }}>
            <h2 className="text-base font-bold font-oswald tracking-wide" style={{ color: 'var(--sl-t1)' }}>
              {isEdit ? 'Modifier l\'événement' : 'Ajouter un événement'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)' }}
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
            className="flex-1 overflow-y-auto px-5 pb-2 space-y-4 pt-4"
          >
            {/* Event type radio */}
            <Field label="Type d'événement *">
              <EventTypeRadio value={form.eventType} onChange={(v) => set('eventType', v)} />
            </Field>

            {/* Sport */}
            <Field label="Sport *">
              <select
                value={form.sport}
                onChange={(e) => set('sport', e.target.value)}
                className={inputCls}
                style={inputStyle}
              >
                {sportOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            {/* Team sport: home/away */}
            {isTeamSport && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Domicile">
                  <input
                    type="text"
                    value={form.homeTeam}
                    onChange={(e) => set('homeTeam', e.target.value)}
                    placeholder="FC Brest"
                    className={inputCls}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Visiteur">
                  <input
                    type="text"
                    value={form.awayTeam}
                    onChange={(e) => set('awayTeam', e.target.value)}
                    placeholder="FC Quimper"
                    className={inputCls}
                    style={inputStyle}
                  />
                </Field>
              </div>
            )}

            {/* Title — hidden when team sport has both teams */}
            {(!isTeamSport || (!form.homeTeam && !form.awayTeam)) && (
              <Field label="Nom de l'événement *">
                <input
                  type="text"
                  required={!isTeamSport}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Trail des Abers, Tournoi de basket…"
                  className={inputCls}
                  style={inputStyle}
                />
              </Field>
            )}

            {/* Team + Category */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Équipe">
                <input
                  type="text"
                  value={form.teamName}
                  onChange={(e) => set('teamName', e.target.value)}
                  placeholder="Seniors A, U13…"
                  className={inputCls}
                  style={inputStyle}
                />
              </Field>
              <Field label="Catégorie">
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="Juniors, Vétérans…"
                  className={inputCls}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date *">
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  className={inputCls}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                />
              </Field>
              <Field label="Heure *">
                <input
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) => set('time', e.target.value)}
                  className={inputCls}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                />
              </Field>
            </div>

            {/* City */}
            <Field label="Ville *">
              <CityAutocomplete
                value={form.cityName}
                onChange={v => set('cityName', v)}
                onSelect={c => { set('cityName', c.nom); set('cityLat', c.lat); set('cityLng', c.lng); }}
                placeholder="ex. Brest"
                inputClassName={inputCls}
                inputStyle={inputStyle}
              />
            </Field>

            {/* Venue */}
            <Field label="Stade / Salle / Lieu">
              <input
                type="text"
                value={form.venue}
                onChange={(e) => set('venue', e.target.value)}
                placeholder="Stade municipal, Salle omnisports…"
                className={inputCls}
                style={inputStyle}
              />
            </Field>

            {/* Description */}
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Informations complémentaires : enjeu, parcours, règlement…"
                rows={3}
                className={`${inputCls} resize-none`}
                style={inputStyle}
              />
            </Field>
          </form>

          {/* Footer */}
          <div className="flex-shrink-0 px-5 py-4 flex gap-3" style={{ borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              style={{ border: '1px solid var(--sl-border-s)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)' }}
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
