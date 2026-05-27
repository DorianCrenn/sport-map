import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Z } from '../constants/zIndex.js';
import { eventFormSchema, validate } from '../lib/schemas.js';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENT_TYPES } from '../data/cities.js';
import { STATIC_CLUBS } from '../data/clubs.js';
import { useSports } from '../hooks/useSports.js';
import { useClubs } from '../hooks/useClubs.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import { useClubPlayers } from '../hooks/useClubPlayers.js';
import CityAutocomplete from './CityAutocomplete.jsx';
import VenueAutocomplete from './VenueAutocomplete.jsx';
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

const TOURNAMENT_TYPES = [
  { value: 'Local',       label: 'Local'       },
  { value: 'Régional',    label: 'Régional'    },
  { value: 'National',    label: 'National'    },
  { value: 'International', label: 'International' },
  { value: 'Scolaire',    label: 'Scolaire'    },
  { value: 'Entreprises', label: 'Entreprises' },
  { value: 'Interne',     label: 'Interne'     },
];

const NUM_TEAMS_OPTIONS = ['4', '6', '8', '10', '12', '16', '24', '32'];

const TOURNAMENT_FORMATS = [
  { value: 'Poules + Élimination directe', label: 'Poules + Élim.' },
  { value: 'Poules seules',                label: 'Poules' },
  { value: 'Élimination directe',          label: 'Élim. directe' },
  { value: 'Swiss',                        label: 'Swiss' },
  { value: 'Round Robin',                  label: 'Round Robin' },
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
  recurrenceEnabled: false, recurrenceFreq: 'weekly', recurrenceUntil: '',
  // Tournament-specific fields
  tournamentName: '', tournamentType: '', numTeams: '',
  tournamentFormat: '', tournamentCategories: '', prize: '', organizer: '',
  // Post-match fields
  manOfMatch: '',
};

function generateRecurring(base, freq, untilStr) {
  const step = freq === 'biweekly' ? 14 : 7;
  const seriesId = `series_${Date.now()}`;
  const until = new Date(untilStr + 'T23:59:59');
  const _p = n => String(n).padStart(2, '0');
  const _tzOff = -new Date().getTimezoneOffset();
  const _tzSuffix = `${_tzOff >= 0 ? '+' : '-'}${_p(Math.floor(Math.abs(_tzOff) / 60))}:${_p(Math.abs(_tzOff) % 60)}`;
  const events = [];
  let cur = new Date(base.date);
  while (cur <= until && events.length < 52) {
    const d = `${cur.getFullYear()}-${_p(cur.getMonth() + 1)}-${_p(cur.getDate())}`;
    const t = `${_p(cur.getHours())}:${_p(cur.getMinutes())}`;
    events.push({ ...base, date: `${d}T${t}:00${_tzSuffix}`, seriesId });
    cur = new Date(cur.getTime() + step * 86400000);
  }
  return events;
}

function toFormValues(event, defaults = {}) {
  if (!event || (event._isNew && !event._isDuplicate)) {
    return {
      ...EMPTY_FORM,
      sport:      defaults.sport      ?? EMPTY_FORM.sport,
      teamName:   defaults.teamName   ?? '',
      category:   defaults.category   ?? '',
      level:      defaults.level      ?? '',
      homeOrAway: defaults.homeOrAway ?? EMPTY_FORM.homeOrAway,
      cityName:   defaults.cityName   ?? EMPTY_FORM.cityName,
      cityLat:    defaults.cityLat    ?? EMPTY_FORM.cityLat,
      cityLng:    defaults.cityLng    ?? EMPTY_FORM.cityLng,
    };
  }
  // Duplicate: keep all fields but clear date and score
  if (event._isNew && event._isDuplicate) {
    return {
      ...EMPTY_FORM,
      title: event.title ?? '', sport: event.sport ?? 'Football',
      date: '', time: new Date(event.date || Date.now()).toTimeString().slice(0, 5),
      cityName: event.city ?? BREST.name, cityLat: event.lat ?? BREST.lat, cityLng: event.lng ?? BREST.lng,
      venue: event.venue ?? '', description: event.description ?? '',
      eventType: event.eventType ?? 'championship',
      teamName: event.teamName ?? '', category: event.category ?? '',
      level: event.level ?? '', cupType: event.cupType ?? '',
      homeOrAway: event.homeOrAway ?? 'home', adversaire: event.adversaire ?? '',
      homeTeam: event.standings?.home?.team ?? '', awayTeam: event.standings?.away?.team ?? '',
      tournamentName: event.tournamentName ?? '', tournamentType: event.tournamentType ?? '',
      numTeams: event.numTeams ? String(event.numTeams) : '', tournamentFormat: event.tournamentFormat ?? '',
      tournamentCategories: event.tournamentCategories ?? '', prize: event.prize ?? '', organizer: event.organizer ?? '',
      manOfMatch: '',
    };
  }
  const d = new Date(event.date);
  const pad2 = n => String(n).padStart(2, '0');
  const localDate = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  return {
    title: event.title ?? '', sport: event.sport ?? 'Football',
    date: localDate, time: d.toTimeString().slice(0, 5),
    cityName: event.city ?? BREST.name, cityLat: event.lat ?? BREST.lat, cityLng: event.lng ?? BREST.lng,
    venue: event.venue ?? '', description: event.description ?? '',
    eventType: event.eventType ?? 'championship',
    teamName: event.teamName ?? '', category: event.category ?? '',
    level: event.level ?? '', cupType: event.cupType ?? '',
    homeOrAway: event.homeOrAway ?? 'home', adversaire: event.adversaire ?? '',
    homeTeam: event.standings?.home?.team ?? '', awayTeam: event.standings?.away?.team ?? '',
    tournamentName: event.tournamentName ?? '', tournamentType: event.tournamentType ?? '',
    numTeams: event.numTeams ? String(event.numTeams) : '', tournamentFormat: event.tournamentFormat ?? '',
    tournamentCategories: event.tournamentCategories ?? '', prize: event.prize ?? '', organizer: event.organizer ?? '',
    manOfMatch: event.manOfMatch ?? '',
  };
}

function buildEvent(form, currentUser, myClub, useSmartMode) {
  let title = form.title;
  let homeTeam = null;
  let awayTeam = null;

  if (form.eventType === 'tournament') {
    // Tournaments: title = tournament name, no home/away teams
    title = form.tournamentName || form.title || 'Tournoi';
  } else if (useSmartMode && myClub) {
    const myName = myClub.name;
    homeTeam = form.homeOrAway === 'home' ? myName : (form.adversaire || 'Adversaire');
    awayTeam = form.homeOrAway === 'home' ? (form.adversaire || 'Adversaire') : myName;
    title = `${homeTeam} vs ${awayTeam}`;
  } else {
    homeTeam = form.homeTeam;
    awayTeam = form.awayTeam;
    const isTeamSport = ['Football', 'Handball', 'Basketball', 'Rugby'].includes(form.sport);
    if (isTeamSport && form.homeTeam && form.awayTeam) title = `${form.homeTeam} vs ${form.awayTeam}`;
  }

  const sport = useSmartMode && myClub ? myClub.sport : form.sport;

  // Append the local timezone offset so Supabase stores the correct UTC equivalent.
  // Without this, "14:30" is interpreted as 14:30 UTC and displayed as 16:30 in Paris.
  const _pad = n => String(n).padStart(2, '0');
  const _tzOff = -new Date().getTimezoneOffset(); // positive for UTC+X
  const _sign = _tzOff >= 0 ? '+' : '-';
  const _tzH = _pad(Math.floor(Math.abs(_tzOff) / 60));
  const _tzM = _pad(Math.abs(_tzOff) % 60);
  const localDatetime = `${form.date}T${form.time}:00${_sign}${_tzH}:${_tzM}`;

  return {
    title, sport, sportGroup: sport,
    date: localDatetime,
    city: form.cityName, lat: form.cityLat, lng: form.cityLng,
    venue: form.venue, description: form.description,
    eventType: form.eventType,
    teamName: form.teamName, category: form.category,
    level: form.level, cupType: form.cupType,
    homeOrAway: form.homeOrAway, adversaire: form.adversaire,
    ...(form.eventType === 'tournament' ? {
      tournamentName: form.tournamentName || undefined,
      tournamentType: form.tournamentType || undefined,
      numTeams: form.numTeams ? Number(form.numTeams) : undefined,
      tournamentFormat: form.tournamentFormat || undefined,
      tournamentCategories: form.tournamentCategories || undefined,
      prize: form.prize || undefined,
      organizer: form.organizer || undefined,
    } : {}),
    manOfMatch: form.manOfMatch || undefined,
    clubId: currentUser?.clubId ?? null,
    creatorId: currentUser?.id ?? null,
    departmentId: 'finistere', regionId: 'brittany',
    standings: (form.eventType !== 'tournament' && homeTeam && awayTeam) ? {
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

function AdversaireField({ value, onChange, sameSportClubs, myClubId, inputStyle }) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapRef = useRef(null);

  useEffect(() => { setQuery(value); }, [value]);

  const filtered = sameSportClubs
    .filter(c => String(c.id) !== String(myClubId))
    .filter(c => !query || c.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  function select(name) {
    setQuery(name);
    onChange(name);
    setFocused(false);
  }

  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
        onFocus={() => setFocused(true)}
        placeholder="ex. FC Quimper, AS Morlaix…"
        style={inputStyle}
        autoComplete="off"
      />
      {focused && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
          borderRadius: 12, marginTop: 4, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        }}>
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              onMouseDown={e => { e.preventDefault(); select(c.name); }}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1px solid var(--sl-border)',
                color: 'var(--sl-t1)',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--sl-surface)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {c.logo_url ? (
                <img src={c.logo_url} alt="" loading="lazy" style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'contain', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)' }}>
                  {c.name[0]}
                </div>
              )}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                {c.city && <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{c.city}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PillPicker({ options, value, onChange, color = '#8b5cf6' }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const v = typeof opt === 'string' ? opt : opt.value;
        const l = typeof opt === 'string' ? opt : (opt.label || opt.value);
        const sel = value === v;
        return (
          <button key={v} type="button" onClick={() => onChange(sel ? '' : v)}
            style={{
              padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: sel ? 700 : 500,
              border: `2px solid ${sel ? color : 'var(--sl-border)'}`,
              backgroundColor: sel ? `${color}18` : 'var(--sl-surface)',
              color: sel ? color : 'var(--sl-t2)', transition: 'all 0.12s',
            }}>
            {l}
          </button>
        );
      })}
    </div>
  );
}

function TournamentFields({ form, set, inputStyle, myClub }) {
  return (
    <motion.div key="tournament"
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <Field label="Nom du tournoi">
          <input
            type="text" value={form.tournamentName}
            onChange={e => set('tournamentName', e.target.value)}
            placeholder="ex: Tournoi de la Saint-Michel"
            style={inputStyle}
          />
        </Field>

        <Field label="Type de tournoi">
          <PillPicker options={TOURNAMENT_TYPES} value={form.tournamentType} onChange={v => set('tournamentType', v)} color="#8b5cf6" />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Nombre d'équipes">
            <PillPicker options={NUM_TEAMS_OPTIONS} value={form.numTeams} onChange={v => set('numTeams', v)} color="#8b5cf6" />
          </Field>
          <Field label="Format">
            <PillPicker options={TOURNAMENT_FORMATS} value={form.tournamentFormat} onChange={v => set('tournamentFormat', v)} color="#8b5cf6" />
          </Field>
        </div>

        <Field label="Catégories participantes" hint="ex: U13, U15, Sénior">
          <input
            type="text" value={form.tournamentCategories}
            onChange={e => set('tournamentCategories', e.target.value)}
            placeholder="U13, U15, Senior…"
            style={inputStyle}
          />
        </Field>

        <Field label="Prix / récompenses" hint="Optionnel">
          <input
            type="text" value={form.prize}
            onChange={e => set('prize', e.target.value)}
            placeholder="ex: Trophée, médailles, bon cadeau…"
            style={inputStyle}
          />
        </Field>

        <Field label="Organisateur" hint="Optionnel — pré-rempli avec le nom du club">
          <input
            type="text" value={form.organizer || myClub?.name || ''}
            onChange={e => set('organizer', e.target.value)}
            placeholder={myClub?.name || 'Nom de l\'organisateur'}
            style={inputStyle}
          />
        </Field>

      </div>
    </motion.div>
  );
}

function ContextualTypeFields({ eventType, level, cupType, champLevels, onLevel, onCupType, form, set, inputStyle, myClub }) {
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
      ) : eventType === 'tournament' ? (
        <TournamentFields form={form} set={set} inputStyle={inputStyle} myClub={myClub} />
      ) : null}
    </AnimatePresence>
  );
}

function EventTypeRadio({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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

// ── Joueur du match : combobox avec joueurs du roster si disponibles ───────────
function MotmField({ value, onChange, clubId, inputStyle }) {
  const { players } = useClubPlayers(clubId);
  const [open, setOpen] = useState(false);
  const filtered = players.filter(p =>
    !value || p.name.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t2)', marginBottom: 5 }}>
        Joueur du match
        <span style={{ fontWeight: 400, color: 'var(--sl-t3)', marginLeft: 6 }}>Optionnel — affiché sur l'affiche résultat</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={players.length ? 'Sélectionner ou saisir un nom…' : 'ex. Kevin Dupont'}
        style={inputStyle}
        autoComplete="off"
      />
      {open && players.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
          borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          maxHeight: 200, overflowY: 'auto', marginTop: 4,
        }}>
          {filtered.slice(0, 10).map(p => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => { onChange(p.name); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 14px', fontSize: 13, textAlign: 'left',
                backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--sl-text)',
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--sl-surface)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ width: 26, textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)' }}>
                #{p.number ?? '—'}
              </span>
              <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
              {p.position && <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{p.position}</span>}
            </button>
          ))}
          {!filtered.length && (
            <p style={{ padding: '10px 14px', fontSize: 12, color: 'var(--sl-t3)', fontStyle: 'italic' }}>
              Aucun joueur correspondant
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function EventFormModal({ event, onSave, onClose, onBulkSave, onOpenPoster }) {
  const { currentUser, isClubAdmin } = useAuth();
  const { allSports } = useSports();
  const { userClubs } = useClubs();
  const allClubs = [...userClubs, ...STATIC_CLUBS];
  const myClub = currentUser?.clubId ? allClubs.find(c => String(c.id) === String(currentUser.clubId)) : null;
  const useSmartMode = !!(isClubAdmin && myClub);
  const isEdit = !!event && !event?._isNew;
  const sportOptions = Object.values(allSports).filter(s => !s.isArchived).map(s => s.label);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef);

  const buildDefaults = useCallback((ev) => {
    if (!ev?._isNew) return {};
    const defaults = {
      teamName:   ev.defaultTeam      ?? undefined,
      category:   ev.defaultCategory  ?? undefined,
      level:      ev.defaultLevel     ?? undefined,
      sport:      ev.defaultSport     ?? undefined,
      homeOrAway: ev.defaultHomeOrAway ?? undefined,
    };
    // City: prefer explicit default, fall back to club city in smart mode
    if (ev.defaultCity) {
      defaults.cityName = ev.defaultCity;
      // Keep BREST coords as default — user can refine via CityAutocomplete
    } else if (useSmartMode && myClub?.city) {
      defaults.cityName = myClub.city;
    }
    // Smart mode always forces club sport
    if (useSmartMode && myClub) {
      defaults.sport = myClub.sport;
      // Auto-select first team if not already specified
      if (!defaults.teamName) {
        const teams = myClub.categories?.flatMap(c => c.teams?.map(t => t.name) ?? []) ?? [];
        if (teams.length > 0) {
          defaults.teamName = teams[0];
          defaults.category = inferCategory(teams[0]);
        }
      }
    }
    return defaults;
  }, [useSmartMode, myClub]);

  const [form, setForm]         = useState(() => toFormValues(event, buildDefaults(event)));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [createdEvent, setCreatedEvent] = useState(null);

  useEffect(() => {
    setForm(toFormValues(event, buildDefaults(event)));
  }, [event]); // eslint-disable-line react-hooks/exhaustive-deps

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    const { ok, errors } = validate(eventFormSchema, form);
    if (!ok) {
      setSubmitError(errors.date ?? errors.sport ?? Object.values(errors)[0] ?? 'Formulaire invalide');
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const base = buildEvent(form, currentUser, myClub, useSmartMode);
      if (!base.title?.trim()) {
        setSubmitError('Le nom de l\'événement est requis');
        return;
      }
      if (!isEdit && form.recurrenceEnabled && form.recurrenceUntil && onBulkSave) {
        const recurring = generateRecurring(base, form.recurrenceFreq, form.recurrenceUntil);
        if (recurring.length > 0) { await onBulkSave(recurring); return; }
      }
      const saved = await onSave(base);
      if (!isEdit && onOpenPoster) {
        setCreatedEvent(saved ?? base);
      }
    } catch (err) {
      setSubmitError(err.message ?? 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }

  const teamPresets = useSmartMode && myClub
    ? (myClub.categories?.length > 0
        ? myClub.categories.flatMap(c => c.teams?.map(t => t.name) ?? [])
        : TEAM_PRESETS[myClub.sport] ?? [])
    : TEAM_PRESETS[form.sport] ?? [];

  const sameSportClubs = useMemo(() => {
    const sport = useSmartMode && myClub ? myClub.sport : form.sport;
    return allClubs.filter(c => c.sport === sport);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useSmartMode, myClub?.sport, form.sport, allClubs.length]);
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
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-form-heading"
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          style={{
            width: '100%', maxWidth: 540, display: 'flex', flexDirection: 'column',
            borderRadius: '24px 24px 0 0', backgroundColor: 'var(--sl-card)',
            border: '1px solid var(--sl-border)', height: '92dvh', maxHeight: '92dvh',
            position: 'relative',
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
              <h2 id="event-form-heading" style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>
                {isEdit ? 'Modifier l\'événement' : event?._isDuplicate ? 'Dupliquer l\'événement' : 'Nouvel événement'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {useSmartMode && myClub && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--sl-green)' }} />
                    <span style={{ fontSize: 11, color: 'var(--sl-green)', fontWeight: 600 }}>{myClub.name}</span>
                  </div>
                )}
                {event?._isNew && event?.defaultTeam && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>
                    {event.defaultTeam}{event.defaultLevel ? ` · ${event.defaultLevel}` : ''}
                  </span>
                )}
              </div>
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

                {form.eventType !== 'tournament' && (
                  <>
                    {/* Mon équipe */}
                    <Field label="Mon équipe">
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          list="team-presets-list"
                          value={form.teamName}
                          onChange={e => set('teamName', e.target.value)}
                          placeholder={teamPresets.length > 0 ? 'Choisir ou saisir une équipe…' : 'Seniors A, U13 B…'}
                          style={inputStyle}
                          autoComplete="off"
                        />
                        <datalist id="team-presets-list">
                          {teamPresets.map(t => <option key={t} value={t} />)}
                        </datalist>
                      </div>
                    </Field>

                    {/* Catégorie auto */}
                    {form.category && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, backgroundColor: 'var(--sl-green-dim)', border: '1px solid rgba(34,217,106,0.2)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ fontSize: 12, color: 'var(--sl-green)', fontWeight: 600 }}>Catégorie : {form.category}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Level / Cup — animated */}
                <ContextualTypeFields
                  eventType={form.eventType} level={form.level} cupType={form.cupType}
                  champLevels={champLevels}
                  onLevel={v => set('level', v)} onCupType={v => set('cupType', v)}
                  form={form} set={set} inputStyle={inputStyle} myClub={myClub}
                />

                {form.eventType !== 'tournament' && (
                  <>
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
                    <Field label="Adversaire" hint={sameSportClubs.length > 1 ? `${sameSportClubs.length - 1} clubs ${myClub?.sport ?? ''} dans la base` : 'Saisissez le nom de l\'adversaire'}>
                      <AdversaireField
                        value={form.adversaire}
                        onChange={v => set('adversaire', v)}
                        sameSportClubs={sameSportClubs}
                        myClubId={myClub?.id}
                        inputStyle={inputStyle}
                      />
                    </Field>
                  </>
                )}
              </>
            ) : (
              <>
                {/* FULL MODE */}
                <Field label="Sport *">
                  <select value={form.sport} onChange={e => set('sport', e.target.value)} style={selectStyle}>
                    {sportOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                {form.eventType !== 'tournament' && ['Football', 'Handball', 'Basketball', 'Rugby'].includes(form.sport) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Domicile">
                      <input type="text" value={form.homeTeam} onChange={e => set('homeTeam', e.target.value)} placeholder="FC Brest" style={inputStyle} />
                    </Field>
                    <Field label="Visiteur">
                      <input type="text" value={form.awayTeam} onChange={e => set('awayTeam', e.target.value)} placeholder="FC Quimper" style={inputStyle} />
                    </Field>
                  </div>
                )}
                {(form.eventType === 'tournament' || !['Football', 'Handball', 'Basketball', 'Rugby'].includes(form.sport) || (!form.homeTeam && !form.awayTeam)) && (
                  <Field label="Nom de l'événement *">
                    <input type="text" required={form.eventType === 'tournament' || !['Football','Handball','Basketball','Rugby'].includes(form.sport)} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Trail des Abers, Tournoi de basket…" style={inputStyle} />
                  </Field>
                )}
                {form.eventType !== 'tournament' && (
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
                )}

                {/* Level / Cup — animated */}
                <ContextualTypeFields
                  eventType={form.eventType} level={form.level} cupType={form.cupType}
                  champLevels={champLevels}
                  onLevel={v => set('level', v)} onCupType={v => set('cupType', v)}
                  form={form} set={set} inputStyle={inputStyle} myClub={myClub}
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

            {/* Recurrence */}
            {!isEdit && (
              <div style={{ borderRadius: 14, border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => set('recurrenceEnabled', !form.recurrenceEnabled)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: form.recurrenceEnabled ? 'rgba(59,130,246,0.08)' : 'var(--sl-surface)', border: 'none', cursor: 'pointer', color: form.recurrenceEnabled ? '#3b82f6' : 'var(--sl-t2)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.82"/></svg>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Récurrence</span>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 999, backgroundColor: form.recurrenceEnabled ? '#3b82f6' : 'var(--sl-border)', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: form.recurrenceEnabled ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </button>
                {form.recurrenceEnabled && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Fréquence">
                        <select value={form.recurrenceFreq} onChange={e => set('recurrenceFreq', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                          <option value="weekly">Chaque semaine</option>
                          <option value="biweekly">Toutes les 2 semaines</option>
                        </select>
                      </Field>
                      <Field label="Jusqu'au">
                        <input type="date" value={form.recurrenceUntil} onChange={e => set('recurrenceUntil', e.target.value)} min={form.date || undefined} style={{ ...inputStyle, colorScheme: 'dark' }} />
                      </Field>
                    </div>
                    {form.date && form.recurrenceUntil && (() => {
                      const step = form.recurrenceFreq === 'biweekly' ? 14 : 7;
                      const until = new Date(form.recurrenceUntil + 'T23:59:59');
                      let count = 0, cur = new Date(form.date);
                      while (cur <= until && count < 52) { count++; cur = new Date(cur.getTime() + step * 86400000); }
                      return count > 0 ? (
                        <p style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>
                          {count} occurrence{count > 1 ? 's' : ''} seront créées
                        </p>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            )}

            <Field label="Ville *">
              <CityAutocomplete
                value={form.cityName} onChange={v => set('cityName', v)}
                onSelect={c => { set('cityName', c.nom); set('cityLat', c.lat); set('cityLng', c.lng); }}
                placeholder="ex. Brest"
                inputStyle={inputStyle}
              />
            </Field>

            <Field label="Stade / Salle / Lieu">
              <VenueAutocomplete
                value={form.venue}
                onChange={v => set('venue', v)}
                onSelect={({ name, city, lat, lng }) => {
                  set('venue', name);
                  if (city && !form.cityName) set('cityName', city);
                  if (lat && lng && (form.cityLat === BREST.lat && form.cityLng === BREST.lng)) {
                    set('cityLat', lat);
                    set('cityLng', lng);
                  }
                }}
                placeholder="Stade municipal, Salle omnisports…"
                style={inputStyle}
              />
            </Field>

            <Field label="Description">
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Informations complémentaires…" rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </Field>

            {form.eventType !== 'tournament' && (
              <MotmField
                value={form.manOfMatch}
                onChange={v => set('manOfMatch', v)}
                clubId={currentUser?.clubId}
                inputStyle={inputStyle}
              />
            )}
          </form>

          {/* Footer */}
          <div style={{ flexShrink: 0, padding: '14px 20px calc(14px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
            {submitError && (
              <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                {submitError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} disabled={submitting} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1px solid var(--sl-border-s)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)', fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}>
                Annuler
              </button>
              <button type="submit" form="event-form" disabled={submitting} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', backgroundColor: 'var(--sl-green)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: submitting ? 'none' : '0 4px 12px rgba(34,217,106,0.3)' }}>
                {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer l\'événement'}
              </button>
            </div>
          </div>

          {/* ── Écran succès post-création (FLOW-001a) ─────────────────────── */}
          {createdEvent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                position: 'absolute', inset: 0, zIndex: 20,
                borderRadius: 'inherit',
                backgroundColor: 'var(--sl-card)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 22, padding: '32px 28px', textAlign: 'center',
              }}
            >
              <div style={{ width: 68, height: 68, borderRadius: '50%', backgroundColor: 'rgba(34,217,106,0.12)', border: '1.5px solid rgba(34,217,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--sl-t1)', marginBottom: 6, letterSpacing: '-0.02em' }}>
                  Événement créé !
                </div>
                <div style={{ fontSize: 13, color: 'var(--sl-t3)', lineHeight: 1.5, maxWidth: 290 }}>
                  {createdEvent.title || 'Votre événement est en ligne.'}
                </div>
              </div>
              {onOpenPoster && (
                <button
                  onClick={() => { onOpenPoster(createdEvent); onClose(); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: '14px 28px', borderRadius: 16, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white', fontSize: 15, fontWeight: 800,
                    boxShadow: '0 8px 24px rgba(99,102,241,0.32)',
                    width: '100%', maxWidth: 310,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Générer l'affiche
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: '11px 28px', borderRadius: 12, cursor: 'pointer',
                  border: '1px solid var(--sl-border)', backgroundColor: 'transparent',
                  color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600,
                }}
              >
                Fermer
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
