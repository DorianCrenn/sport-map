import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Z } from '../constants/zIndex.js';
import { eventFormSchema, validate } from '../lib/schemas.js';
import { supabase, isDemoMode } from '../lib/supabase.js';
import { sanitizeText } from '../lib/sanitize.js';
import HelpTooltip from './HelpTooltip.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useClubs } from '../hooks/useClubs.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import { useAndroidBack } from '../hooks/useAndroidBack.js';
import { useScrollInputIntoView } from '../hooks/useScrollInputIntoView.js';
import CityAutocomplete from './CityAutocomplete.jsx';
import VenueAutocomplete from './VenueAutocomplete.jsx';
import SportIcon from './SportIcon.jsx';
import { BREST, TEAM_PRESETS, CHAMPIONSHIP_LEVELS } from '../lib/eventFormConstants.js';
import { inferCategory, inferTeamLevel, generateRecurring, toFormValues, buildEvent } from '../lib/eventFormHelpers.js';
import {
  Field, AdversaireField, ContextualTypeFields, EventTypeRadio,
} from './event/EventFormFields.jsx';
import EventFormStepper from './event/EventFormStepper.jsx';
import EventFormSuccessScreen from './event/EventFormSuccessScreen.jsx';

interface EventFormModalProps {
  event: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<Record<string, any>>;
  onClose: () => void;
  onBulkSave?: (events: Record<string, any>[]) => Promise<void>;
  onOpenPoster?: (event: Record<string, any>, opts?: Record<string, any>) => void;
}

function HomeAwaySelector({ value, onChange }: { value: 'home' | 'away'; onChange: (v: 'home' | 'away') => void }) {
  return (
    <Field label="Réception *">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {([
          { value: 'home', emoji: '🏠', label: 'Domicile' },
          { value: 'away', emoji: '✈️', label: 'Extérieur' },
        ] as const).map(opt => (
          <button
            key={opt.value} type="button" onClick={() => onChange(opt.value)}
            style={{
              padding: '11px 8px', borderRadius: 'var(--sl-radius-xl)', cursor: 'pointer',
              border: `1.5px solid ${value === opt.value ? 'var(--sl-green)' : 'var(--sl-border)'}`,
              backgroundColor: value === opt.value ? 'var(--sl-green-dim)' : 'var(--sl-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 15 }}>{opt.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: value === opt.value ? 'var(--sl-green)' : 'var(--sl-t2)' }}>
              {opt.label}
            </span>
            {value === opt.value && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="3" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </button>
        ))}
      </div>
    </Field>
  );
}

export default function EventFormModal({ event, onSave, onClose, onBulkSave, onOpenPoster }: EventFormModalProps) {
  const { currentUser, isClubAdmin } = useAuth();
  // Demo: coach/president profiles can create convocations
  const demoIsCoach = isDemoMode() && ['coach', 'president'].includes(sessionStorage.getItem('sl-demo-profile') ?? '');
  const { allSports } = useSports();
  const { userClubs } = useClubs();
  const allClubs = userClubs;
  const myClub = allClubs.find((c: any) => String(c.id) === String(currentUser?.clubId))
    ?? allClubs.find((c: any) => String(c.userId) === String(currentUser?.id))
    ?? null;
  const useSmartMode = !!(isClubAdmin && myClub);
  const isEdit = !!event && !event?._isNew;

  const teamOptions: string[] = (() => {
    const club = myClub ?? null;
    if (!club?.categories?.length) return [];
    const cats = club.categories as any[];
    const fromTeams = cats.flatMap((c: any) => c.teams?.map((t: any) => typeof t === 'string' ? t : (t?.name ?? '')) ?? []).filter(Boolean);
    if (fromTeams.length) return fromTeams;
    return cats.map((c: any) => typeof c === 'string' ? c : (c?.name ?? c?.label ?? '')).filter(Boolean);
  })();
  const sportOptions = Object.values(allSports).filter((s: any) => !s.isArchived).map((s: any) => s.label);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);
  useAndroidBack(true, onClose);
  useScrollInputIntoView(dialogRef);

  function handleHandleDown(e: React.MouseEvent | React.TouchEvent) {
    const el = dialogRef.current;
    if (!el) return;
    const startY = (e as React.TouchEvent).touches?.[0]?.clientY ?? (e as React.MouseEvent).clientY;
    function onMove(e: TouchEvent | MouseEvent) {
      const dy = Math.max(0, ((e as TouchEvent).touches?.[0]?.clientY ?? (e as MouseEvent).clientY) - startY);
      el.style.transform = `translateY(${dy}px)`;
      el.style.transition = 'none';
    }
    function onEnd(e: TouchEvent | MouseEvent) {
      const dy = ((e as TouchEvent).changedTouches?.[0] ?? e as MouseEvent).clientY - startY;
      el.style.transform = '';
      el.style.transition = '';
      if (dy > 120) onClose();
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
    }
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
  }

  const buildDefaults = useCallback((ev: Record<string, any>) => {
    if (!ev?._isNew) return {};
    const defaults: Record<string, any> = {
      teamName:   ev.defaultTeam      ?? undefined,
      category:   ev.defaultCategory  ?? undefined,
      level:      ev.defaultLevel     ?? undefined,
      sport:      ev.defaultSport     ?? undefined,
      homeOrAway: ev.defaultHomeOrAway ?? undefined,
    };
    if (ev.defaultCity) {
      defaults.cityName = ev.defaultCity;
    } else if (useSmartMode && myClub?.city) {
      defaults.cityName = myClub.city;
    }
    if (useSmartMode && myClub) {
      defaults.sport = myClub.sport;
      if (!defaults.teamName) {
        const firstTeam = myClub.categories?.flatMap((c: any) => c.teams ?? [])?.[0];
        if (firstTeam) {
          defaults.teamName = firstTeam?.name ?? firstTeam;
          defaults.category = inferCategory(defaults.teamName);
          defaults.level    = firstTeam?.level ?? '';
        }
      }
    }
    if (isDemoMode()) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      Object.assign(defaults, {
        adversaire: defaults.adversaire ?? 'AS Plougastel',
        date:       d.toISOString().slice(0, 10),
        time:       '15:00',
        eventType:  defaults.eventType ?? 'championship',
      });
    }
    return defaults;
  }, [useSmartMode, myClub]);

  const DRAFT_KEY = 'sl-event-form-draft';

  const [form, setForm] = useState<Record<string, any>>(() => {
    const base = toFormValues(event, buildDefaults(event));
    if (!event || event._isNew) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const { data, ts } = JSON.parse(saved);
          if (data && ts && Date.now() - ts < 24 * 3600 * 1000) {
            return { ...base, ...data };
          }
        }
      } catch { /* ignore */ }
    }
    return base;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<Record<string, any> | null>(null);
  const [trainingTeams, setTrainingTeams] = useState<string[]>(['all']);

  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sauvegarde debounced (1.5s)
  useEffect(() => {
    if (isEdit) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: form, ts: Date.now() })); } catch { /* ignore */ }
    }, 1500);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [form, isEdit]);

  // Session recovery : sauvegarder immédiatement en cas de fermeture brutale
  useEffect(() => {
    if (isEdit) return;
    function saveImmediate() {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: form, ts: Date.now() })); } catch { /* ignore */ }
    }
    // Fermeture onglet / navigateur
    window.addEventListener('beforeunload', saveImmediate);
    // Passage en arrière-plan (mobile : app mise en veille)
    function onVisibilityChange() { if (document.visibilityState === 'hidden') saveImmediate(); }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', saveImmediate);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  // form en dep : capture la valeur courante dans le closure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isEdit]);

  const useSteps = !isEdit;
  const [step, setStep]       = useState(1);
  const [, setStepDir] = useState(1);

  function goNext() {
    setSubmitError(null);
    setStepDir(1);
    setStep(s => Math.min(s + 1, 3));
    document.getElementById('event-form')?.scrollTo({ top: 0 });
  }
  function goPrev() {
    setSubmitError(null);
    setStepDir(-1);
    setStep(s => Math.max(s - 1, 1));
  }

  useEffect(() => {
    setForm(toFormValues(event, buildDefaults(event)));
  }, [event]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function set(field: string, value: any) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'teamName') {
        next.category = inferCategory(value);
        const teamLevel = inferTeamLevel(value, myClub);
        if (teamLevel) next.level = teamLevel;
      }
      return next;
    });
  }

  async function handleTrainingSubmit() {
    const club = useSmartMode ? myClub : activeClub;
    const clubId = String(club?.id ?? '');
    if (!clubId) throw new Error('Aucun club associé à votre compte');
    if (!form.date) throw new Error('La date est requise');
    if (!form.time) throw new Error('L\'heure est requise');
    if (isDemoMode()) { onClose(); return; }

    const dates: string[] = [];
    if (!isEdit && form.recurrenceEnabled && form.recurrenceUntil) {
      const step = form.recurrenceFreq === 'biweekly' ? 14 : 7;
      const until = new Date(form.recurrenceUntil + 'T23:59:59');
      let cur = new Date(form.date);
      while (cur <= until && dates.length < 52) {
        dates.push(cur.toISOString().slice(0, 10));
        cur = new Date(cur.getTime() + step * 86400000);
      }
    } else {
      dates.push(form.date);
    }

    const teams: (string | null)[] = trainingTeams.includes('all') || !trainingTeams.length ? [null] : trainingTeams;
    const location = sanitizeText(form.venue ?? '').trim() || null;
    const inserts = dates.flatMap(date =>
      teams.map(team_id => ({ club_id: clubId, date, time: form.time || null, location, status: 'active', team_id: team_id ?? null }))
    );
    const { error } = await (supabase.from('training_sessions').insert(inserts) as any);
    if (error) throw new Error((error as any).message ?? 'Erreur lors de la création');
    window.dispatchEvent(new CustomEvent('sl-analytics', { detail: { type: 'training_created' } }));
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (form.eventType === 'training') {
      setSubmitting(true);
      setSubmitError(null);
      try { await handleTrainingSubmit(); }
      catch (err: any) { setSubmitError(err.message ?? 'Erreur lors de la création'); }
      finally { setSubmitting(false); }
      return;
    }

    const { ok, errors } = (validate as any)(eventFormSchema, form);
    if (!ok) {
      setSubmitError(errors.date ?? errors.sport ?? Object.values(errors)[0] ?? 'Formulaire invalide');
      return;
    }

    if (!isEdit && form.date) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(form.date) < today) {
        setSubmitError('La date de l\'événement ne peut pas être dans le passé');
        return;
      }
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const sanitizedForm = {
        ...form,
        adversaire:           sanitizeText(form.adversaire ?? ''),
        adversaireTeam:       sanitizeText(form.adversaireTeam ?? ''),
        description:          sanitizeText(form.description ?? ''),
        venue:                sanitizeText(form.venue ?? ''),
        teamName:             sanitizeText(form.teamName ?? ''),
        homeTeam:             !useSmartMode && activeClub?.name ? activeClub.name : sanitizeText(form.homeTeam ?? ''),
        awayTeam:             sanitizeText(form.awayTeam ?? ''),
        tournamentName:       sanitizeText(form.tournamentName ?? ''),
        prize:                sanitizeText(form.prize ?? ''),
        organizer:            sanitizeText(form.organizer ?? ''),
        tournamentCategories: sanitizeText(form.tournamentCategories ?? ''),
      };
      const base = buildEvent(sanitizedForm as any, currentUser, myClub, useSmartMode);
      if (!(base as any).title?.trim()) {
        setSubmitError('Le nom de l\'événement est requis');
        return;
      }
      if (!isEdit && form.recurrenceEnabled && form.recurrenceUntil && onBulkSave) {
        const recurring = generateRecurring(base as any, form.recurrenceFreq, form.recurrenceUntil);
        if (recurring.length > 0) {
          try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
          await onBulkSave(recurring);
          return;
        }
      }
      if (isEdit && event?.id && event?.updatedAt) {
        const { data: fresh } = await supabase
          .from('events')
          .select('updated_at')
          .eq('id', event.id)
          .maybeSingle();
        if ((fresh as any)?.updated_at && (fresh as any).updated_at !== event.updatedAt) {
          setSubmitError('Cet événement a été modifié dans un autre onglet. Fermez et rouvrez le formulaire.');
          return;
        }
      }

      const saved = await onSave(base);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      if (!isEdit && onOpenPoster) {
        setCreatedEvent(saved ?? base);
      }
    } catch (err: any) {
      setSubmitError(err.message ?? 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }

  const teamPresets = useSmartMode && myClub
    ? (myClub.categories?.length > 0
        ? myClub.categories.flatMap((c: any) => c.teams?.map((t: any) => t?.name ?? t) ?? [])
        : (TEAM_PRESETS as any)[myClub.sport] ?? [])
    : (TEAM_PRESETS as any)[form.sport] ?? [];

  // Non-smartMode : club actif (auto si 1 seul, sélectionnable si plusieurs)
  const [selectedClubId, setSelectedClubId] = useState<string>(() =>
    !useSmartMode && allClubs.length > 0 ? String(allClubs[0]?.id ?? '') : ''
  );
  useEffect(() => {
    if (!useSmartMode && allClubs.length > 0 && !selectedClubId) {
      setSelectedClubId(String(allClubs[0].id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allClubs.length, useSmartMode]);
  const activeClub: any = !useSmartMode
    ? (allClubs.find((c: any) => String(c.id) === selectedClubId) ?? allClubs[0] ?? null)
    : null;

  // Presets équipes du club actif (non-smartMode)
  const nonSmartTeamPresets = useMemo(() => {
    if (useSmartMode || !activeClub) return (TEAM_PRESETS as any)[form.sport] ?? [];
    return activeClub.categories?.length > 0
      ? activeClub.categories.flatMap((c: any) => c.teams?.map((t: any) => t?.name ?? t) ?? [])
      : (TEAM_PRESETS as any)[activeClub.sport] ?? [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useSmartMode, activeClub?.id, form.sport]);

  const sameSportClubs = useMemo(() => {
    const sport = useSmartMode && myClub ? myClub.sport : (activeClub?.sport ?? form.sport);
    return allClubs.filter((c: any) => c.sport === sport);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useSmartMode, myClub?.sport, activeClub?.sport, form.sport, allClubs.length]);

  // Club adverse trouvé dans la base + ses équipes
  const adversaireClub = useMemo(
    () => sameSportClubs.find((c: any) => c.name === form.adversaire) ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sameSportClubs, form.adversaire],
  );
  const adversaireTeamPresets = useMemo(() => {
    if (!adversaireClub) return [];
    return adversaireClub.categories?.length > 0
      ? adversaireClub.categories.flatMap((c: any) => c.teams?.map((t: any) => t?.name ?? t) ?? [])
      : (TEAM_PRESETS as any)[adversaireClub.sport] ?? [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adversaireClub?.id]);
  const champLevels = (CHAMPIONSHIP_LEVELS as any)[form.sport] ?? (CHAMPIONSHIP_LEVELS as any).default;
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    borderRadius: 'var(--sl-radius-xl)', padding: '10px 12px', fontSize: 13,
    backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)',
    color: 'var(--sl-t1)', outline: 'none', fontFamily: 'var(--sl-font-ui)',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.65)', zIndex: (Z as any).formModal }}
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
          <div
            onMouseDown={handleHandleDown}
            onTouchStart={handleHandleDown}
            style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0', cursor: 'grab', touchAction: 'none' }}
          >
            <div style={{ width: 36, height: 3, borderRadius: 'var(--sl-radius-full)', backgroundColor: 'var(--sl-border-s)' }} />
          </div>

          <div style={{ flexShrink: 0, borderBottom: '1px solid var(--sl-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 10px' }}>
              <div>
                <h2 id="event-form-heading" style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>
                  {isEdit ? 'Modifier l\'événement' : event?._isDuplicate ? 'Dupliquer l\'événement' : 'Nouvel événement'}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                  {useSmartMode && myClub && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--sl-green)' }} />
                      <span style={{ fontSize: 11, color: 'var(--sl-green)', fontWeight: 600 }}>{myClub.name}</span>
                    </div>
                  )}
                  {event?._isNew && event?.defaultTeam && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--sl-radius-full)', backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>
                      {event.defaultTeam}{event.defaultLevel ? ` · ${event.defaultLevel}` : ''}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose} aria-label="Fermer" style={{ width: 44, height: 44, borderRadius: 'var(--sl-radius-xl)', backgroundColor: 'var(--sl-surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {useSteps && (
              <EventFormStepper step={step} setStep={setStep} setStepDir={setStepDir} />
            )}
          </div>

          <form id="event-form" onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {isDemoMode() && !isEdit && (
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--sl-radius-md)', padding: '6px 12px', fontSize: 11, color: 'var(--demo-indigo-text, #818cf8)', display: 'flex', gap: 6, alignItems: 'center' }}>
                <span>✨</span>
                <span>Données pré-remplies — modifiez ou validez directement</span>
              </div>
            )}

            <div style={{ display: (!useSteps || step === 1) ? 'contents' : 'none' }}>

              <Field label="Type d'événement *">
                <EventTypeRadio value={form.eventType} onChange={(v: string) => set('eventType', v)} />
              </Field>

              {useSmartMode && myClub ? (
                <Field label="Sport">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 'var(--sl-radius-xl)', backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
                    <SportIcon sport={myClub.sport} size={16} color="var(--sl-green)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{myClub.sport}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--sl-green)', fontWeight: 700 }}>AUTO</span>
                  </div>
                </Field>
              ) : (
                <Field label="Sport *">
                  <select value={form.sport} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('sport', e.target.value)} style={selectStyle}>
                    {sportOptions.map((s: string) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              )}

            </div>

            <div style={{ display: (!useSteps || step === 2) ? 'contents' : 'none' }}>

            {form.eventType === 'training' ? (
              <Field label="Équipes / Catégories">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(['Toutes les équipes', ...teamOptions] as string[]).map((label, i) => {
                    const val = i === 0 ? 'all' : label;
                    const sel = trainingTeams.includes(val);
                    return (
                      <button
                        key={val} type="button"
                        onClick={() => {
                          if (val === 'all') { setTrainingTeams(['all']); return; }
                          setTrainingTeams(prev => {
                            const without = prev.filter(t => t !== 'all');
                            const next = without.includes(val) ? without.filter(t => t !== val) : [...without, val];
                            return next.length ? next : ['all'];
                          });
                        }}
                        style={{ padding: '8px 14px', borderRadius: 'var(--sl-radius-lg)', cursor: 'pointer', border: `1.5px solid ${sel ? '#10b981' : 'var(--sl-border)'}`, backgroundColor: sel ? 'rgba(16,185,129,0.12)' : 'var(--sl-surface)', color: sel ? '#10b981' : 'var(--sl-t2)', fontSize: 12, fontWeight: sel ? 700 : 500, transition: 'all 0.12s' }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {teamOptions.length === 0 && (
                  <p style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 6 }}>Ajoutez des catégories à votre club pour les sélectionner ici.</p>
                )}
              </Field>
            ) : useSmartMode && myClub ? (
              <>
                {form.eventType !== 'tournament' && (
                  <>
                    <Field label="Mon équipe">
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          list="team-presets-list"
                          value={form.teamName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('teamName', e.target.value)}
                          placeholder={teamPresets.length > 0 ? 'Choisir ou saisir une équipe…' : 'Seniors A, U13 B…'}
                          style={inputStyle}
                          autoComplete="off"
                        />
                        <datalist id="team-presets-list">
                          {teamPresets.map((t: string) => <option key={t} value={t} />)}
                        </datalist>
                      </div>
                    </Field>

                    {form.category && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 'var(--sl-radius-lg)', backgroundColor: 'var(--sl-green-dim)', border: '1px solid rgba(34,217,106,0.2)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ fontSize: 12, color: 'var(--sl-green)', fontWeight: 600 }}>Catégorie : {form.category}</span>
                      </div>
                    )}
                  </>
                )}

                <ContextualTypeFields
                  eventType={form.eventType} level={form.level} cupType={form.cupType}
                  champLevels={champLevels}
                  onLevel={(v: string) => set('level', v)} onCupType={(v: string) => set('cupType', v)}
                  form={form} set={set} inputStyle={inputStyle} myClub={myClub}
                />

                {form.eventType !== 'tournament' && (
                  <>
                    <HomeAwaySelector
                      value={form.homeOrAway as 'home' | 'away'}
                      onChange={(v: 'home' | 'away') => set('homeOrAway', v)}
                    />

                    <Field label="Adversaire" hint={sameSportClubs.length > 1 ? `${sameSportClubs.length - 1} clubs ${myClub?.sport ?? ''} dans la base` : 'Saisissez le nom de l\'adversaire'}>
                      <AdversaireField
                        value={form.adversaire}
                        onChange={(v: string) => set('adversaire', v)}
                        sameSportClubs={sameSportClubs}
                        myClubId={myClub?.id}
                        inputStyle={inputStyle}
                      />
                    </Field>

                    <Field label="Équipe adverse">
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          list="smart-adversaire-team-presets"
                          value={form.adversaireTeam}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('adversaireTeam', e.target.value)}
                          placeholder={adversaireTeamPresets.length > 0 ? 'Choisir ou saisir…' : 'Seniors B, U17…'}
                          style={inputStyle}
                          autoComplete="off"
                        />
                        <datalist id="smart-adversaire-team-presets">
                          {adversaireTeamPresets.map((t: string) => <option key={t} value={t} />)}
                        </datalist>
                      </div>
                    </Field>

                    {form.adversaire && (
                      <p style={{ margin: '-4px 0 0', fontSize: 11, color: 'var(--sl-t3)', textAlign: 'center' }}>
                        {(() => {
                          const myTeam = form.teamName ? ` (${form.teamName})` : '';
                          const advTeam = form.adversaireTeam ? ` (${form.adversaireTeam})` : '';
                          return form.homeOrAway === 'home'
                            ? `${myClub?.name ?? 'Mon club'}${myTeam} (dom.) vs ${form.adversaire}${advTeam}`
                            : `${form.adversaire}${advTeam} vs ${myClub?.name ?? 'Mon club'}${myTeam} (ext.)`;
                        })()}
                      </p>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {/* Sélecteur de club — affiché uniquement si l'utilisateur gère plusieurs clubs */}
                {form.eventType !== 'tournament'
                  && ['Football','Handball','Basketball','Rugby'].includes(form.sport)
                  && allClubs.length > 1 && (
                  <Field label="Mon club">
                    <select value={selectedClubId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedClubId(e.target.value)} style={selectStyle}>
                      {allClubs.map((c: any) => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                )}

                {form.eventType !== 'tournament' && ['Football','Handball','Basketball','Rugby'].includes(form.sport) && (
                  <>
                    <Field label="Mon équipe">
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          list="ns-team-presets"
                          value={form.teamName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('teamName', e.target.value)}
                          placeholder={nonSmartTeamPresets.length > 0 ? 'Choisir ou saisir une équipe…' : 'Seniors A, U13 B…'}
                          style={inputStyle}
                          autoComplete="off"
                        />
                        <datalist id="ns-team-presets">
                          {nonSmartTeamPresets.map((t: string) => <option key={t} value={t} />)}
                        </datalist>
                      </div>
                    </Field>

                    {form.category && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 'var(--sl-radius-lg)', backgroundColor: 'var(--sl-green-dim)', border: '1px solid rgba(34,217,106,0.2)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ fontSize: 12, color: 'var(--sl-green)', fontWeight: 600 }}>Catégorie : {form.category}</span>
                      </div>
                    )}

                    <HomeAwaySelector
                      value={form.homeOrAway as 'home' | 'away'}
                      onChange={(v: 'home' | 'away') => set('homeOrAway', v)}
                    />

                    <Field label="Adversaire">
                      <AdversaireField
                        value={form.adversaire}
                        onChange={(v: string) => set('adversaire', v)}
                        sameSportClubs={sameSportClubs}
                        myClubId={activeClub?.id}
                        inputStyle={inputStyle}
                      />
                    </Field>

                    <Field label="Équipe adverse">
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          list="ns-adversaire-team-presets"
                          value={form.adversaireTeam}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('adversaireTeam', e.target.value)}
                          placeholder={adversaireTeamPresets.length > 0 ? 'Choisir ou saisir…' : 'Seniors B, U17…'}
                          style={inputStyle}
                          autoComplete="off"
                        />
                        <datalist id="ns-adversaire-team-presets">
                          {adversaireTeamPresets.map((t: string) => <option key={t} value={t} />)}
                        </datalist>
                      </div>
                    </Field>

                    {form.adversaire && (
                      <p style={{ margin: '-4px 0 0', fontSize: 11, color: 'var(--sl-t3)', textAlign: 'center' }}>
                        {(() => {
                          const myName = activeClub?.name ?? form.homeTeam ?? 'Mon équipe';
                          const myTeam = form.teamName ? ` (${form.teamName})` : '';
                          const advTeam = form.adversaireTeam ? ` (${form.adversaireTeam})` : '';
                          return form.homeOrAway === 'home'
                            ? `${myName}${myTeam} (dom.) vs ${form.adversaire}${advTeam}`
                            : `${form.adversaire}${advTeam} vs ${myName}${myTeam} (ext.)`;
                        })()}
                      </p>
                    )}
                  </>
                )}

                {(form.eventType === 'tournament' || !['Football','Handball','Basketball','Rugby'].includes(form.sport)) && (
                  <Field label="Nom de l'événement *">
                    <input type="text" required={form.eventType === 'tournament' || !['Football','Handball','Basketball','Rugby'].includes(form.sport)} value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('title', e.target.value)} placeholder="Trail des Abers, Tournoi de basket…" style={inputStyle} />
                  </Field>
                )}

                {form.eventType !== 'tournament' && !['Football','Handball','Basketball','Rugby'].includes(form.sport) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Équipe">
                      {nonSmartTeamPresets.length > 0 ? (
                        <select value={form.teamName} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('teamName', e.target.value)} style={selectStyle}>
                          <option value="">Équipe (optionnel)</option>
                          {nonSmartTeamPresets.map((t: string) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : (
                        <input type="text" value={form.teamName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('teamName', e.target.value)} placeholder="Seniors A, U13…" style={inputStyle} />
                      )}
                    </Field>
                    <Field label="Catégorie">
                      <input type="text" value={form.category} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('category', e.target.value)} placeholder="Senior, U18…" style={inputStyle} readOnly={!!inferCategory(form.teamName)} />
                    </Field>
                  </div>
                )}

                <ContextualTypeFields
                  eventType={form.eventType} level={form.level} cupType={form.cupType}
                  champLevels={champLevels}
                  onLevel={(v: string) => set('level', v)} onCupType={(v: string) => set('cupType', v)}
                  form={form} set={set} inputStyle={inputStyle} myClub={activeClub ?? myClub}
                />
              </>
            )}

            </div>

            <div style={{ display: (!useSteps || step === 3) ? 'contents' : 'none' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Date *">
                <input type="date" required value={form.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('date', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties} />
              </Field>
              <Field label="Heure *">
                <input type="time" required value={form.time} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('time', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties} />
              </Field>
            </div>

            {!isEdit && (
              <div style={{ borderRadius: 'var(--sl-radius-2xl)', border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => set('recurrenceEnabled', !form.recurrenceEnabled)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: form.recurrenceEnabled ? 'rgba(59,130,246,0.08)' : 'var(--sl-surface)', border: 'none', cursor: 'pointer', color: form.recurrenceEnabled ? '#3b82f6' : 'var(--sl-t2)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.82"/></svg>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Récurrence</span>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 'var(--sl-radius-full)', backgroundColor: form.recurrenceEnabled ? '#3b82f6' : 'var(--sl-border)', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: form.recurrenceEnabled ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </button>
                {form.recurrenceEnabled && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Fréquence">
                        <select value={form.recurrenceFreq} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('recurrenceFreq', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' } as React.CSSProperties}>
                          <option value="weekly">Chaque semaine</option>
                          <option value="biweekly">Toutes les 2 semaines</option>
                        </select>
                      </Field>
                      <Field label="Jusqu'au">
                        <input type="date" value={form.recurrenceUntil} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('recurrenceUntil', e.target.value)} min={form.date || undefined} style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties} />
                      </Field>
                    </div>
                    {form.date && form.recurrenceUntil && (() => {
                      const dayStep = form.recurrenceFreq === 'biweekly' ? 14 : 7;
                      const until = new Date(form.recurrenceUntil + 'T23:59:59');
                      let count = 0, cur = new Date(form.date);
                      while (cur <= until && count < 52) { count++; cur = new Date(cur.getTime() + dayStep * 86400000); }
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

            {form.eventType !== 'training' && (
              <Field label="Ville *">
                <CityAutocomplete
                  value={form.cityName} onChange={(v: string) => set('cityName', v)}
                  onSelect={(c: any) => { set('cityName', c.nom); set('cityLat', c.lat); set('cityLng', c.lng); }}
                  placeholder="ex. Brest"
                  inputStyle={inputStyle}
                />
              </Field>
            )}

            <Field label={form.eventType === 'training' ? 'Lieu (optionnel)' : 'Stade / Salle / Lieu'}>
              {form.eventType === 'training' ? (
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('venue', e.target.value)}
                  placeholder="Gymnase municipal, Terrain annexe…"
                  style={inputStyle}
                />
              ) : (
                <VenueAutocomplete
                  value={form.venue}
                  onChange={(v: string) => set('venue', v)}
                  cityLat={form.cityLat}
                  cityLng={form.cityLng}
                  cityName={form.cityName}
                  onSelect={({ name, city, lat, lng }: any) => {
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
              )}
            </Field>

            {form.eventType !== 'training' && <Field label={<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Description <HelpTooltip content="Informations complémentaires visibles par tous : convocation, tenue à porter, consignes pratiques, lieu de rendez-vous exact…" /></span>}>
              <textarea
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set('description', e.target.value)}
                placeholder="Informations complémentaires…"
                rows={3}
                maxLength={2000}
                style={{ ...inputStyle, resize: 'none' }}
              />
              {(form.description?.length ?? 0) > 1800 && (
                <span style={{ fontSize: 11, color: (form.description?.length ?? 0) >= 2000 ? '#ef4444' : 'var(--sl-t3)', textAlign: 'right', display: 'block', marginTop: 3 }}>
                  {form.description?.length ?? 0}/2000
                </span>
              )}
            </Field>}

            </div>

          </form>

          <div style={{ flexShrink: 0, padding: '14px 20px calc(14px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
            {submitError && (
              <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 'var(--sl-radius-lg)', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                {submitError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              {useSteps && step > 1 ? (
                <button
                  type="button"
                  onClick={goPrev}
                  style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--sl-radius-2xl)', border: '1px solid var(--sl-border-s)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Précédent
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--sl-radius-2xl)', border: '1px solid var(--sl-border-s)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)', fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}
                >
                  Annuler
                </button>
              )}

              {useSteps && step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--sl-radius-2xl)', border: 'none', backgroundColor: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
                >
                  Suivant
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ) : (
                <button
                  type="submit"
                  form="event-form"
                  disabled={submitting}
                  style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--sl-radius-2xl)', border: 'none', backgroundColor: 'var(--sl-green)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: submitting ? 'none' : '0 4px 12px rgba(34,217,106,0.3)' }}
                >
                  {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : form.eventType === 'training' ? '🏃 Créer l\'entraînement' : 'Créer l\'événement'}
                </button>
              )}
            </div>
          </div>

          {createdEvent && (
            <EventFormSuccessScreen
              createdEvent={createdEvent}
              onOpenPoster={onOpenPoster}
              onClose={onClose}
              isCoach={isClubAdmin || demoIsCoach}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
