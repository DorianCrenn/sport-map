import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Z } from '../constants/zIndex.js';
import { eventFormSchema, validate } from '../lib/schemas.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useClubs } from '../hooks/useClubs.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import CityAutocomplete from './CityAutocomplete.jsx';
import VenueAutocomplete from './VenueAutocomplete.jsx';
import SportIcon from './SportIcon.jsx';
import { BREST, TEAM_PRESETS, CHAMPIONSHIP_LEVELS } from '../lib/eventFormConstants.js';
import { inferCategory, generateRecurring, toFormValues, buildEvent } from '../lib/eventFormHelpers.js';
import {
  Field, AdversaireField, ContextualTypeFields, EventTypeRadio,
} from './event/EventFormFields.jsx';

export default function EventFormModal({ event, onSave, onClose, onBulkSave, onOpenPoster }) {
  const { currentUser, isClubAdmin } = useAuth();
  const { allSports } = useSports();
  const { userClubs } = useClubs();
  const allClubs = userClubs;
  const myClub = allClubs.find(c => String(c.id) === String(currentUser?.clubId))
    ?? allClubs.find(c => String(c.userId) === String(currentUser?.id))
    ?? null;
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

  // ── Stepper (uniquement pour la création, pas l'édition) ──────────────────
  const useSteps = !isEdit;
  const [step, setStep]       = useState(1);
  const [stepDir, setStepDir] = useState(1); // 1=avant, -1=arrière

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
          <div style={{ flexShrink: 0, borderBottom: '1px solid var(--sl-border)' }}>
            {/* Ligne titre + fermer */}
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

            {/* Indicateur de progression (création uniquement) */}
            {useSteps && (
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px 12px', gap: 0 }}>
                {['Type', 'Équipe', 'Quand & Où'].map((label, i) => (
                  <AnimatePresence key={i} mode="wait">
                    <>
                      <button
                        type="button"
                        onClick={() => { if (i + 1 < step) { setStepDir(-1); setStep(i + 1); } }}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          background: 'none', border: 'none', padding: 0,
                          cursor: i + 1 < step ? 'pointer' : 'default',
                        }}
                        aria-label={`Étape ${i + 1} : ${label}${i + 1 < step ? ' (revenir)' : ''}`}
                      >
                        <motion.div
                          animate={{
                            backgroundColor: i + 1 < step ? 'var(--sl-green)' : i + 1 === step ? '#6366f1' : 'var(--sl-surface)',
                            borderColor: i + 1 <= step ? (i + 1 < step ? 'var(--sl-green)' : '#6366f1') : 'var(--sl-border)',
                          }}
                          transition={{ duration: 0.25 }}
                          style={{
                            width: 26, height: 26, borderRadius: '50%',
                            border: '2px solid',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800,
                            color: i + 1 <= step ? '#fff' : 'var(--sl-t3)',
                          }}
                        >
                          {i + 1 < step
                            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            : i + 1}
                        </motion.div>
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                          color: i + 1 === step ? '#6366f1' : i + 1 < step ? 'var(--sl-green)' : 'var(--sl-t3)',
                          whiteSpace: 'nowrap',
                        }}>
                          {label}
                        </span>
                      </button>
                      {i < 2 && (
                        <motion.div
                          animate={{ backgroundColor: i + 1 < step ? 'var(--sl-green)' : 'var(--sl-border)' }}
                          transition={{ duration: 0.3 }}
                          style={{ flex: 1, height: 2, margin: '0 6px 14px' }}
                        />
                      )}
                    </>
                  </AnimatePresence>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <form id="event-form" onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ═══════════════════════════════════════════════
                ÉTAPE 1 — TYPE D'ÉVÉNEMENT
                (toujours visible en mode édition)
            ═══════════════════════════════════════════════ */}
            <div style={{ display: (!useSteps || step === 1) ? 'contents' : 'none' }}>

              {/* Type */}
              <Field label="Type d'événement *">
                <EventTypeRadio value={form.eventType} onChange={(v) => set('eventType', v)} />
              </Field>

              {/* Sport */}
              {useSmartMode && myClub ? (
                <Field label="Sport">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
                    <SportIcon sport={myClub.sport} size={16} color="var(--sl-green)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{myClub.sport}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--sl-green)', fontWeight: 700 }}>AUTO</span>
                  </div>
                </Field>
              ) : (
                <Field label="Sport *">
                  <select value={form.sport} onChange={e => set('sport', e.target.value)} style={selectStyle}>
                    {sportOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              )}

            </div>{/* /ÉTAPE 1 */}

            {/* ═══════════════════════════════════════════════
                ÉTAPE 2 — QUI JOUE ?
            ═══════════════════════════════════════════════ */}
            <div style={{ display: (!useSteps || step === 2) ? 'contents' : 'none' }}>

            {useSmartMode && myClub ? (
              <>
                {/* SMART MODE */}
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
                {/* FULL MODE — Sport déjà sélectionné en étape 1 */}
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

            </div>{/* /ÉTAPE 2 */}

            {/* ═══════════════════════════════════════════════
                ÉTAPE 3 — QUAND & OÙ ?
            ═══════════════════════════════════════════════ */}
            <div style={{ display: (!useSteps || step === 3) ? 'contents' : 'none' }}>

            {/* Date + Heure */}
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
                cityLat={form.cityLat}
                cityLng={form.cityLng}
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

            </div>{/* /ÉTAPE 3 */}

          </form>

          {/* Footer */}
          <div style={{ flexShrink: 0, padding: '14px 20px calc(14px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
            {submitError && (
              <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                {submitError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              {/* Bouton gauche : Annuler (étape 1 ou édition) / Précédent (étapes 2-3) */}
              {useSteps && step > 1 ? (
                <button
                  type="button"
                  onClick={goPrev}
                  style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1px solid var(--sl-border-s)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Précédent
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1px solid var(--sl-border-s)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)', fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}
                >
                  Annuler
                </button>
              )}

              {/* Bouton droit : Suivant (étapes 1-2) / Créer ou Enregistrer (étape 3 ou édition) */}
              {useSteps && step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', backgroundColor: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
                >
                  Suivant
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ) : (
                <button
                  type="submit"
                  form="event-form"
                  disabled={submitting}
                  style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', backgroundColor: 'var(--sl-green)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: submitting ? 'none' : '0 4px 12px rgba(34,217,106,0.3)' }}
                >
                  {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer l\'événement'}
                </button>
              )}
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
