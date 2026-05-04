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

export default function EventFormModal({ event, onSave, onClose }) {
  const isEdit = !!event;
  const [form, setForm] = useState(() => toFormValues(event));
  const isTeamSport = ['Football', 'Handball', 'Basketball', 'Rugby'].includes(form.sport);

  useEffect(() => {
    setForm(toFormValues(event));
  }, [event]);

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-800">
              {isEdit ? 'Modifier l\'événement' : 'Ajouter un événement'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">

            {/* Sport */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Type de sport *
              </label>
              <select
                value={form.sport}
                onChange={(e) => set('sport', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
              >
                {SPORT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Équipes (sports collectifs) */}
            {isTeamSport && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Équipe domicile
                  </label>
                  <input
                    type="text"
                    value={form.homeTeam}
                    onChange={(e) => set('homeTeam', e.target.value)}
                    placeholder="FC Brest"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Équipe visiteur
                  </label>
                  <input
                    type="text"
                    value={form.awayTeam}
                    onChange={(e) => set('awayTeam', e.target.value)}
                    placeholder="FC Quimper"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
            )}

            {/* Titre (sports non-collectifs ou si pas d'équipes renseignées) */}
            {(!isTeamSport || (!form.homeTeam && !form.awayTeam)) && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Nom de l'événement *
                </label>
                <input
                  type="text"
                  required={!isTeamSport}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Trail des Abers, Tournoi de basket…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            )}

            {/* Date + Heure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Heure *
                </label>
                <input
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) => set('time', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                />
              </div>
            </div>

            {/* Ville */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Ville *
              </label>
              <select
                value={form.cityName}
                onChange={(e) => set('cityName', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
              >
                {FINISTERE_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Lieu */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Stade / Salle / Lieu
              </label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => set('venue', e.target.value)}
                placeholder="Stade municipal, Salle omnisports…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Niveau */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Niveau
              </label>
              <select
                value={form.level}
                onChange={(e) => set('level', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
              >
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Informations complémentaires : enjeu du match, parcours, règlement…"
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer"
                style={{ backgroundColor: '#1e293b' }}
              >
                {isEdit ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
