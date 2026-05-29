// ─────────────────────────────────────────────────────────────────────────────
// eventFormHelpers.js — Fonctions de transformation du formulaire d'événements
// ─────────────────────────────────────────────────────────────────────────────
import { BREST, EMPTY_FORM } from './eventFormConstants.js';

/**
 * Déduit la catégorie d'âge depuis le nom d'équipe.
 * Ex: "U18 A" → "U18", "Seniors A" → "Senior"
 */
export function inferCategory(teamName) {
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

/**
 * Génère une série d'événements récurrents (hebdo ou bihebdo).
 * Retourne au maximum 52 occurrences.
 */
export function generateRecurring(base, freq, untilStr) {
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

/**
 * Convertit un objet événement (ou null pour nouveau) en valeurs de formulaire.
 */
export function toFormValues(event, defaults = {}) {
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

/**
 * Convertit les valeurs du formulaire en objet événement prêt pour Supabase.
 */
export function buildEvent(form, currentUser, myClub, useSmartMode) {
  let title = form.title;
  let homeTeam = null;
  let awayTeam = null;

  if (form.eventType === 'tournament') {
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

  // Offset timezone local pour que Supabase stocke le bon UTC
  const _pad = n => String(n).padStart(2, '0');
  const _tzOff = -new Date().getTimezoneOffset();
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
      tournamentName:        form.tournamentName        || undefined,
      tournamentType:        form.tournamentType        || undefined,
      numTeams:              form.numTeams ? Number(form.numTeams) : undefined,
      tournamentFormat:      form.tournamentFormat      || undefined,
      tournamentCategories:  form.tournamentCategories  || undefined,
      prize:                 form.prize                 || undefined,
      organizer:             form.organizer             || undefined,
    } : {}),
    manOfMatch: form.manOfMatch || undefined,
    clubId:      currentUser?.clubId ?? null,
    creatorId:   currentUser?.id    ?? null,
    departmentId: 'finistere',
    regionId:    'brittany',
    standings: (form.eventType !== 'tournament' && homeTeam && awayTeam) ? {
      home: { team: homeTeam, rank: '-', points: null, wins: 0, draws: 0, losses: 0 },
      away: { team: awayTeam, rank: '-', points: null, wins: 0, draws: 0, losses: 0 },
    } : undefined,
  };
}
