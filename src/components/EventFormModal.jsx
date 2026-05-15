import { useState, useEffect, useCallback } from 'react';
import { Z } from '../constants/zIndex.js';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENT_TYPES } from '../data/cities.js';
import { STATIC_CLUBS } from '../data/clubs.js';
import { useSports } from '../hooks/useSports.js';
import { useClubs } from '../hooks/useClubs.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import CityAutocomplete from './CityAutocomplete.jsx';
import SportIcon from './SportIcon.jsx';

const BREST = { name: 'Brest', lat: 48.3904, lng: -4.4861 };

// Team presets per sport
const TEAM_PRESETS = {
  Football:   ['Seniors A', 'Seniors B', 'Seniors C', 'U18 A', 'U18 B', 'U15 A', 'U15 B', 'U13 A', 'U13 B', 'U11', 'Féminines A', 'Féminines B', 'Vétérans'],
  Handball:   ['Seniors Masculins', 'Seniors Féminines', 'U18 Masculins', 'U18 Féminines', 'U15 A', 'U15 B', 'U13', 'U11'],
  Basketball: ['Seniors Masculins', 'Seniors Féminines', 'Espoirs', 'U18 M', 'U18 F', 'U15', 'U13', 'U11'],
  Rugby:      ['Seniors 1', 'Seniors 2', 'Espoirs', 'U18 A', 'U18 B', 'U15', 'Féminines'],
  Running:    ['Elite', 'Seniors', 'Juniors', 'Vétérans', 'Tout niveau'],
  Trail:      ['Elite', 'Seniors', 'Vétérans', 'Tout niveau'],
  Cyclisme:   ['Elite', 'Seniors', 'Espoirs', 'Juniors', 'Vétérans'],
};

const CHAMPIONSHIP_LEVELS = {
  Football: [
    { value: 'National', label: 'National' },
    { value: 'R1',       label: 'R1 — Régional 1' },
    { value: 'R2',       label: 'R2 — Régional 2' },
    { value: 'R3',       label: 'R3 — Régional 3' },
    { value: 'DH',       label: "DH — Division d'Honneur" },
    { value: 'D1',       label: 'D1 — District 1' },
    { value: 'D2',       label: 'D2 — District 2' },
    { value: 'D3',       label: 'D3 — District 3' },
  ],
  Handball: [
    { value: 'N3',   label: 'N3 — Nationale 3' },
    { value: 'R1',   label: 'R1 — Régionale 1' },
    { value: 'R2',   label: 'R2 — Régionale 2' },
    { value: 'Dept', label: 'Départementale' },
  ],
  Basketball: [
    { value: 'ProB', label: 'Pro B' },
    { value: 'N2',   label: 'N2 — Nationale 2' },
    { value: 'N3',   label: 'N3 — Nationale 3' },
    { value: 'R1',   label: 'R1 — Régionale 1' },
    { value: 'R2',   label: 'R2 — Régionale 2' },
    { value: 'Dept', label: 'Départementale' },
  ],
  Rugby: [
    { value: 'F1', label: 'F1 — Fédérale 1' },
    { value: 'F2', label: 'F2 — Fédérale 2' },
    { value: 'F3', label: 'F3 — Fédérale 3' },
    { value: 'R1', label: 'R1 — Régionale 1' },
    { value: 'R2', label: 'R2 — Régionale 2' },
  ],
  default: [
    { value: 'National', label: 'National' },
    { value: 'R1',       label: 'R1 — Régional 1' },
    { value: 'R2',       label: 'R2 — Régional 2' },
    { value: 'Dept',     label: 'Départemental' },
  ],
};

const CUP_TYPES = [
  { value: 'Coupe de France',    label: 'Coupe de France'    },
  { value: 'Coupe de Bretagne',  label: 'Coupe de Bretagne'  },
  { value: 'Coupe du Finistère', label: 'Coupe du Finistère' },
  { value: 'Coupe régionale',    label: 'Coupe régionale'    },
  { value: 'Coupe de district',  label: 'Coupe de district'  },
  { value: 'Tournoi amical',     label: 'Tournoi amical'     },
];

function inferCategory(teamName) {
  if (!teamName) return '';
  const t = teamName.toLowerCase();
  if (t.includes('u18')) return 'U18';
  if (t.includes('u15')) return 'U15';
  if (t.includes('u13')) return 'U13';
  if (t.includes('u11')) return 'U11';
  if (t.includes('espoir')) return 'Espoir';
  if (t.includes('junior')) return 'Junior';
  if (t.includes('vétéran') || t.includes('veteran')) return 'Vétéran';
  if (t.includes('féminin')) return 'Féminine';
  if (t.includes('élite') || t.includes('elite')) return 'Élite';
  if (t.includes('senior')) return 'Senior';
  return '';
}

const EMPTY_FORM = {
  title: '', sport: 'Football', date: '', time: '15:00',
  cityName: BREST.name, cityLat: BREST.lat, cityLng: BREST.lng,
  venue: '', description: '',
  eventType: 'championship', teamName: '', category: '',
  level: '', cupType: '', homeOrAway: 'home', adversaire: '',
  homeTeam: '', awayTeam: '',
};

function toFormValues(event, defaults = {}) {
  if (!event || event._isNew) {
    return { ...EMPTY_FORM, teamName: defaults.teamName ?? '', category: defaults.category ?? '' };
  }
  const d = new Date(event.date);
  return {
    title: event.title ?? '', sport: event.sport ?? 'Football',
    date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5),
    cityName: event.city ?? BREST.name, cityLat: event.lat ?? BREST.lat, cityLng: event.lng ?? BREST.lng,
    venue: event.venue ?? '', description: event.description ?? '',
    eventType: event.eventType ?? 'championship',
    teamName: event.teamName ?? '', category: event.category ?? '',
    level: event.level ?? '', cupType: event.cupType ?? '',
    homeOrAway: event.homeOrAway ?? 'home', adversaire: event.adversaire ?? '',
    homeTeam: event.standings?.home?.team ?? '', awayTeam: event.standings?.away?.team ?? '',
  };
}

function buildEvent(form, currentUser, myClub, useSmartMode) {
  let title = form.title;
  let homeTeam = form.homeTeam;
  let awayTeam = form.awayTeam;

  if (useSmartMode && myClub) {
    const myName = myClub.name;
    homeTeam = form.homeOrAway === 'home' ? myName : (form.adversaire || 'Adversaire');
    awayTeam = form.homeOrAway === 'home' ? (form.adversaire || 'Adversaire') : myName;
    title = `${homeTeam} vs ${awayTeam}`;
  } else {
    const isTeamSport = ['Football', 'Handball', 'Basketball', 'Rugby'].includes(form.sport);
    if (isTeamSport && form.homeTeam && form.awayTeam) title = `${form.homeTeam} vs ${form.awayTeam}`;
  }

  const sport = useSmartMode && myClub ? myClub.sport : form.sport;

  return {
    title, sport, sportGroup: sport,
    date: `${form.date}T${form.time}:00`,
    city: form.cityName, lat: form.cityLat, lng: form.cityLng,
    venue: form.venue, description: form.description,
    eventType: form.eventType,
    teamName: form.teamName, category: form.category,
    level: form.level, cupType: form.cupType,
    homeOrAway: form.homeOrAway, adversaire: form.adversaire,
    clubId: currentUser?.clubId ?? null,
    creatorId: currentUser?.id ?? null,
    departmentId: 'finistere', regionId: 'brittany',
    standings: (homeTeam && awayTeam) ? {
      home: { team: homeTeam, rank: '-', points: null, wins: 0, draws: 0, losses: 0 },
      away: { team: awayTeam, rank: '-', points: null, wins: 0, draws: 0, losses: 0 },
    } : undefined,
  };
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function ChampionshipLevelPicker({ value, onChange, levels }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {levels.map(opt => {
        const sel = value === opt.value;
        return (
          <button key={opt.value} type="button" onClick={() => onChange(sel ? '' : opt.value)} title={opt.label}
            style={{
              padding: '6px 13px', borderRadius: 10, cursor: 'pointer',
              border: `2px solid ${sel ? '#3b82f6' : 'var(--sl-border)'}`,
              backgroundColor: sel ? 'rgba(59,130,246,0.12)' : 'var(--sl-surface)',
              color: sel ? '#3b82f6' : 'var(--sl-t2)',
              fontSize: 12, fontWeight: sel ? 800 : 600,
              transition: 'all 0.12s', letterSpacing: sel ? '0.04em' : 0,
            }}>
            {opt.value}
          </button>
        );
      })}
    </div>
  );
}

function CupTypePicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {CUP_TYPES.map(opt => {
        const sel = value === opt.value;
        return (
          <button key={opt.value} type="button" onClick={() => onChange(sel ? '' : opt.value)}
            style={{
              padding: '6px 11px', borderRadius: 10, cursor: 'pointer',
              border: `2px solid ${sel ? '#f97316' : 'var(--sl-border)'}`,
              backgroundColor: sel ? 'rgba(249,115,22,0.10)' : 'var(--sl-surface)',
              color: sel ? '#f97316' : 'var(--sl-t2)',
              fontSize: 11, fontWeight: sel ? 700 : 500,
              transition: 'all 0.12s',
            }}>
            {opt.value}
          </button>
        );
      })}
    </div>
  );
}

function ContextualTypeFields({ eventType, level, cupType, champLevels, onLevel, onCupType }) {
  return (
    <AnimatePresence mode="wait">
      {eventType === 'championship' ? (
        <motion.div key="champ"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.16 }}>
          <Field label="Niveau du championnat">
            <ChampionshipLevelPicker value={level} onChange={onLevel} levels={champLevels} />
          </Field>
        </motion.div>
      ) : eventType === 'cup' ? (
        <motion.div key="cup"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.16 }}>
          <Field label="Type de coupe">
            <CupTypePicker value={cupType} onChange={onCupType} />
          </Field>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function EventTypeRadio({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      {EVENT_TYPES.map((type) => {
        const selected = value === type.value;
        return (
          <button
            key={type.value} type="button" onClick={() => onChange(type.value)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 8px', borderRadius: 14, cursor: 'pointer',
              border: `2px solid ${selected ? type.color : 'var(--sl-border)'}`,
              backgroundColor: selected ? `${type.color}14` : 'var(--sl-surface)',
              color: selected ? type.color : 'var(--sl-t2)',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 20 }}>{type.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', color: selected ? type.color : 'var(--sl-t2)' }}>{type.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function EventFormModal({ event, onSave, onClose }) {
  const { currentUser, isClubAdmin } = useAuth();
  const { allSports } = useSports();
  const { userClubs } = useClubs();
  const allClubs = [...userClubs, ...STATIC_CLUBS];
  const myClub = currentUser?.clubId ? allClubs.find(c => String(c.id) === String(currentUser.clubId)) : null;
  const useSmartMode = !!(isClubAdmin && myClub);
  const isEdit = !!event && !event?._isNew;
  const sportOptions = Object.values(allSports).filter(s => !s.isArchived).map(s => s.label);

  const [form, setForm] = useState(() => {
    const vals = toFormValues(event, {
      teamName: event?._isNew ? event.defaultTeam : undefined,
      category: event?._isNew ? event.defaultCategory : undefined,
    });
    if (useSmartMode && myClub && !isEdit) {
      vals.sport = myClub.sport;
    }
    return vals;
  });

  useEffect(() => {
    const vals = toFormValues(event, {
      teamName: event?._isNew ? event.defaultTeam : undefined,
      category: event?._isNew ? event.defaultCategory : undefined,
    });
    if (useSmartMode && myClub && !isEdit) vals.sport = myClub.sport;
    setForm(vals);
  }, [event]);

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function set(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-category from team
      if (field === 'teamName') next.category = inferCategory(value);
      return next;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.date) return;
    onSave(buildEvent(form, currentUser, myClub, useSmartMode));
  }

  const teamPresets = useSmartMode && myClub
    ? (myClub.categories ?? []).flatMap(c => c.teams?.map(t => t.name) ?? [])
    : TEAM_PRESETS[form.sport] ?? [];
  const champLevels = CHAMPIONSHIP_LEVELS[form.sport] ?? CHAMPIONSHIP_LEVELS.default;
  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    borderRadius: 12, padding: '10px 12px', fontSize: 13,
    backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)',
    color: 'var(--sl-t1)', outline: 'none', fontFamily: 'Inter, sans-serif',
  };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.65)', zIndex: Z.formModal }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          style={{
            width: '100%', maxWidth: 540, display: 'flex', flexDirection: 'column',
            borderRadius: '24px 24px 0 0', backgroundColor: 'var(--sl-card)',
            border: '1px solid var(--sl-border)', height: '92dvh', maxHeight: '92dvh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
            <div style={{ width: 36, height: 3, borderRadius: 999, backgroundColor: 'var(--sl-border-s)' }} />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 14px', borderBottom: '1px solid var(--sl-border)', flexShrink: 0 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>
                {isEdit ? 'Modifier l\'événement' : 'Nouvel événement'}
              </h2>
              {useSmartMode && myClub && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--sl-green)' }} />
                  <span style={{ fontSize: 11, color: 'var(--sl-green)', fontWeight: 600 }}>{myClub.name}</span>
                </div>
              )}
            </div>
            <button onClick={onClose} aria-label="Fermer" style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'var(--sl-surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Form */}
          <form id="event-form" onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Type */}
            <Field label="Type d'événement *">
              <EventTypeRadio value={form.eventType} onChange={(v) => set('eventType', v)} />
            </Field>

            {useSmartMode && myClub ? (
              <>
                {/* SMART MODE */}
                {/* Sport auto */}
                <Field label="Sport">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
                    <SportIcon sport={myClub.sport} size={16} color="var(--sl-green)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{myClub.sport}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--sl-green)', fontWeight: 700 }}>AUTO</span>
                  </div>
                </Field>

                {/* Mon équipe */}
                <Field label="Mon équipe">
                  <select value={form.teamName} onChange={e => set('teamName', e.target.value)} style={selectStyle}>
                    <option value="">Sélectionner une équipe…</option>
                    {teamPresets.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>

                {/* Catégorie auto */}
                {form.category && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, backgroundColor: 'var(--sl-green-dim)', border: '1px solid rgba(34,217,106,0.2)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ fontSize: 12, color: 'var(--sl-green)', fontWeight: 600 }}>Catégorie : {form.category}</span>
                  </div>
                )}

                {/* Level / Cup — animated */}
                <ContextualTypeFields
                  eventType={form.eventType} level={form.level} cupType={form.cupType}
                  champLevels={champLevels}
                  onLevel={v => set('level', v)} onCupType={v => set('cupType', v)}
                />

                {/* Domicile / Extérieur */}
                <Field label="Réception">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { value: 'home', label: '🏠 Domicile', desc: 'Match à domicile' },
                      { value: 'away', label: '✈️ Extérieur', desc: 'Match en déplacement' },
                    ].map(opt => (
                      <button
                        key={opt.value} type="button" onClick={() => set('homeOrAway', opt.value)}
                        style={{
                          padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                          border: `2px solid ${form.homeOrAway === opt.value ? 'var(--sl-green)' : 'var(--sl-border)'}`,
                          backgroundColor: form.homeOrAway === opt.value ? 'var(--sl-green-dim)' : 'var(--sl-surface)',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: 14, marginBottom: 2 }}>{opt.label.split(' ')[0]}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: form.homeOrAway === opt.value ? 'var(--sl-green)' : 'var(--sl-t1)' }}>{opt.label.split(' ').slice(1).join(' ')}</div>
                        <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 2 }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Adversaire */}
                <Field label="Adversaire" hint="Saisissez uniquement le nom de l'adversaire">
                  <input
                    type="text" value={form.adversaire} onChange={e => set('adversaire', e.target.value)}
                    placeholder={`ex. FC Quimper, AS Morlaix…`}
                    style={inputStyle}
                  />
                </Field>
              </>
            ) : (
              <>
                {/* FULL MODE */}
                <Field label="Sport *">
                  <select value={form.sport} onChange={e => set('sport', e.target.value)} style={selectStyle}>
                    {sportOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                {['Football', 'Handball', 'Basketball', 'Rugby'].includes(form.sport) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Domicile">
                      <input type="text" value={form.homeTeam} onChange={e => set('homeTeam', e.target.value)} placeholder="FC Brest" style={inputStyle} />
                    </Field>
                    <Field label="Visiteur">
                      <input type="text" value={form.awayTeam} onChange={e => set('awayTeam', e.target.value)} placeholder="FC Quimper" style={inputStyle} />
                    </Field>
                  </div>
                )}
                {(!['Football', 'Handball', 'Basketball', 'Rugby'].includes(form.sport) || (!form.homeTeam && !form.awayTeam)) && (
                  <Field label="Nom de l'événement *">
                    <input type="text" required={!['Football','Handball','Basketball','Rugby'].includes(form.sport)} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Trail des Abers, Tournoi de basket…" style={inputStyle} />
                  </Field>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Équipe">
                    {teamPresets.length > 0 ? (
                      <select value={form.teamName} onChange={e => set('teamName', e.target.value)} style={selectStyle}>
                        <option value="">Équipe (optionnel)</option>
                        {teamPresets.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={form.teamName} onChange={e => set('teamName', e.target.value)} placeholder="Seniors A, U13…" style={inputStyle} />
                    )}
                  </Field>
                  <Field label="Catégorie">
                    <input type="text" value={form.category} onChange={e => set('category', e.target.value)} placeholder="Senior, U18…" style={inputStyle} readOnly={!!inferCategory(form.teamName)} />
                  </Field>
                </div>

                {/* Level / Cup — animated */}
                <ContextualTypeFields
                  eventType={form.eventType} level={form.level} cupType={form.cupType}
                  champLevels={champLevels}
                  onLevel={v => set('level', v)} onCupType={v => set('cupType', v)}
                />
              </>
            )}

            {/* Common fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Date *">
                <input type="date" required value={form.date} onChange={e => set('date', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </Field>
              <Field label="Heure *">
                <input type="time" required value={form.time} onChange={e => set('time', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </Field>
            </div>

            <Field label="Ville *">
              <CityAutocomplete
                value={form.cityName} onChange={v => set('cityName', v)}
                onSelect={c => { set('cityName', c.nom); set('cityLat', c.lat); set('cityLng', c.lng); }}
                placeholder="ex. Brest"
                inputStyle={inputStyle}
              />
            </Field>

            <Field label="Stade / Salle / Lieu">
              <input type="text" value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="Stade municipal, Salle omnisports…" style={inputStyle} />
            </Field>

            <Field label="Description">
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Informations complémentaires…" rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </Field>
          </form>

          {/* Footer */}
          <div style={{ flexShrink: 0, padding: '14px 20px', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1px solid var(--sl-border-s)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Annuler
            </button>
            <button type="submit" form="event-form" style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', backgroundColor: 'var(--sl-green)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,217,106,0.3)' }}>
              {isEdit ? 'Enregistrer' : 'Créer l\'événement'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
