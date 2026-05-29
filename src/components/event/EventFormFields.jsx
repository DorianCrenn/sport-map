/**
 * EventFormFields — Tous les sous-composants réutilisables du formulaire d'événement.
 * Extrait de EventFormModal.jsx pour réduire sa taille.
 *
 * Exports : Field, ChampionshipLevelPicker, CupTypePicker, AdversaireField,
 *           PillPicker, TournamentFields, ContextualTypeFields, EventTypeRadio, MotmField
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENT_TYPES } from '../../data/cities.js';
import { CUP_TYPES, TOURNAMENT_TYPES, NUM_TEAMS_OPTIONS, TOURNAMENT_FORMATS } from '../../lib/eventFormConstants.js';
import { useClubPlayers } from '../../hooks/useClubPlayers.js';

// ── Field wrapper ─────────────────────────────────────────────────────────────

export function Field({ label, children, hint }) {
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

// ── Championship level picker ─────────────────────────────────────────────────

export function ChampionshipLevelPicker({ value, onChange, levels }) {
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

// ── Cup type picker ───────────────────────────────────────────────────────────

export function CupTypePicker({ value, onChange }) {
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
              fontSize: 11, fontWeight: sel ? 700 : 500, transition: 'all 0.12s',
            }}>
            {opt.value}
          </button>
        );
      })}
    </div>
  );
}

// ── Adversaire autocomplete ───────────────────────────────────────────────────

export function AdversaireField({ value, onChange, sameSportClubs, myClubId, inputStyle }) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery]     = useState(value);
  const wrapRef = useRef(null);

  useEffect(() => { setQuery(value); }, [value]);

  const filtered = sameSportClubs
    .filter(c => String(c.id) !== String(myClubId))
    .filter(c => !query || c.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  function select(name) { setQuery(name); onChange(name); setFocused(false); }

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
        type="text" value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
        onFocus={() => setFocused(true)}
        placeholder="ex. FC Quimper, AS Morlaix…"
        style={inputStyle} autoComplete="off"
      />
      {focused && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', borderRadius: 12, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          {filtered.map(c => (
            <button
              key={c.id} type="button"
              onMouseDown={e => { e.preventDefault(); select(c.name); }}
              style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--sl-border)', color: 'var(--sl-t1)' }}
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

// ── Pill picker générique ─────────────────────────────────────────────────────

export function PillPicker({ options, value, onChange, color = '#8b5cf6' }) {
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

// ── Champs spécifiques tournoi ────────────────────────────────────────────────

export function TournamentFields({ form, set, inputStyle, myClub }) {
  return (
    <motion.div key="tournament"
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <Field label="Nom du tournoi">
          <input type="text" value={form.tournamentName}
            onChange={e => set('tournamentName', e.target.value)}
            placeholder="ex: Tournoi de la Saint-Michel" style={inputStyle} />
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
          <input type="text" value={form.tournamentCategories}
            onChange={e => set('tournamentCategories', e.target.value)}
            placeholder="U13, U15, Senior…" style={inputStyle} />
        </Field>

        <Field label="Prix / récompenses" hint="Optionnel">
          <input type="text" value={form.prize}
            onChange={e => set('prize', e.target.value)}
            placeholder="ex: Trophée, médailles, bon cadeau…" style={inputStyle} />
        </Field>

        <Field label="Organisateur" hint="Optionnel — pré-rempli avec le nom du club">
          <input type="text" value={form.organizer || myClub?.name || ''}
            onChange={e => set('organizer', e.target.value)}
            placeholder={myClub?.name || "Nom de l'organisateur"} style={inputStyle} />
        </Field>
      </div>
    </motion.div>
  );
}

// ── Champs contextuels selon le type d'événement ─────────────────────────────

export function ContextualTypeFields({ eventType, level, cupType, champLevels, onLevel, onCupType, form, set, inputStyle, myClub }) {
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

// ── Sélecteur du type d'événement ────────────────────────────────────────────

export function EventTypeRadio({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {EVENT_TYPES.map(type => {
        const selected = value === type.value;
        return (
          <button key={type.value} type="button" onClick={() => onChange(type.value)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 8px', borderRadius: 14, cursor: 'pointer',
              border: `2px solid ${selected ? type.color : 'var(--sl-border)'}`,
              backgroundColor: selected ? `${type.color}14` : 'var(--sl-surface)',
              color: selected ? type.color : 'var(--sl-t2)', transition: 'all 0.15s',
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

// ── Joueur du match (combobox avec roster) ────────────────────────────────────

export function MotmField({ value, onChange, clubId, inputStyle }) {
  const { players } = useClubPlayers(clubId);
  const [open, setOpen] = useState(false);
  const filtered = players.filter(p => !value || p.name.toLowerCase().includes(value.toLowerCase()));

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t2)', marginBottom: 5 }}>
        Joueur du match
        <span style={{ fontWeight: 400, color: 'var(--sl-t3)', marginLeft: 6 }}>Optionnel — affiché sur l'affiche résultat</span>
      </div>
      <input
        type="text" value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={players.length ? 'Sélectionner ou saisir un nom…' : 'ex. Kevin Dupont'}
        style={inputStyle} autoComplete="off"
      />
      {open && players.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
          {filtered.slice(0, 10).map(p => (
            <button key={p.id} type="button"
              onMouseDown={() => { onChange(p.name); setOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', fontSize: 13, textAlign: 'left', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--sl-text)' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--sl-surface)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ width: 26, textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)' }}>#{p.number ?? '—'}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
              {p.position && <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{p.position}</span>}
            </button>
          ))}
          {!filtered.length && (
            <p style={{ padding: '10px 14px', fontSize: 12, color: 'var(--sl-t3)', fontStyle: 'italic' }}>Aucun joueur correspondant</p>
          )}
        </div>
      )}
    </div>
  );
}
