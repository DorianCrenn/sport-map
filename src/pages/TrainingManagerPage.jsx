import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useClubs } from '../hooks/useClubs.js';
import { useClubTrainings } from '../hooks/useClubTrainings.js';
import TrainingBlock from '../components/club/blocks/TrainingBlock.jsx';

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

export default function TrainingManagerPage({ onBack }) {
  const { currentUser } = useAuth();
  const { userClubs } = useClubs();
  const clubId = currentUser?.clubId ?? null;
  const myClub = useMemo(
    () => userClubs.find(c => String(c.id) === String(clubId)) ?? null,
    [userClubs, clubId]
  );

  const [trainings, setTrainings] = useClubTrainings(clubId);
  const [mode, setMode] = useState('calendar'); // 'calendar' | 'edit'
  const [addingTeam, setAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  // Derive team list : club.teams → then trainings keys → fallback 'default'
  const clubTeams = useMemo(() => {
    const fromClub  = (myClub?.teams ?? []).map(t => ({ id: String(t.id ?? t.name ?? t), name: t.name ?? String(t) }));
    const fromKeys  = Object.keys(trainings).filter(k => !fromClub.some(t => t.id === k));
    const extra     = fromKeys.map(k => ({ id: k, name: k === 'default' ? 'Mon équipe' : k }));
    const all       = [...fromClub, ...extra];
    return all.length > 0 ? all : [{ id: 'default', name: 'Mon équipe' }];
  }, [myClub, trainings]);

  // All sessions flattened for calendar view
  const allSessions = useMemo(() => Object.values(trainings).flat(), [trainings]);

  function handleAddTeam() {
    const name = newTeamName.trim();
    if (!name) return;
    const key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!trainings[key]) {
      setTrainings(prev => ({ ...prev, [key]: [] }));
    }
    setNewTeamName('');
    setAddingTeam(false);
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--sl-bg)', zIndex: 40,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        backgroundColor: 'var(--sl-card)',
        borderBottom: '1px solid var(--sl-border)',
        padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              width: 40, height: 40, borderRadius: 11, border: 'none', cursor: 'pointer',
              backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--sl-t2)', flexShrink: 0,
            }}
          >
            <BackIcon />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>
              🏋️ Mes entraînements
            </h1>
            {myClub && (
              <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: 0, marginTop: 1 }}>
                {myClub.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Mode toggle ────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        display: 'flex', gap: 6, padding: '10px 16px',
        borderBottom: '1px solid var(--sl-border)',
        backgroundColor: 'var(--sl-bg)',
      }}>
        {[
          { key: 'calendar', label: '📅 Calendrier' },
          { key: 'edit',     label: '✏️ Créneaux' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              border: mode === key ? 'none' : '1px solid var(--sl-border)',
              backgroundColor: mode === key ? '#6366f1' : 'var(--sl-pill-bg)',
              color: mode === key ? '#fff' : 'var(--sl-pill-text)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>

        {/* ── CALENDAR MODE ── */}
        {mode === 'calendar' && (
          <div style={{ padding: '12px 0 80px' }}>
            {allSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>🏋️</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>
                  Aucun entraînement planifié
                </p>
                <p style={{ fontSize: 12, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
                  Passez en mode <strong>Créneaux</strong> pour définir votre planning
                </p>
                <button
                  onClick={() => setMode('edit')}
                  style={{
                    marginTop: 16, padding: '10px 24px', borderRadius: 12,
                    backgroundColor: '#6366f1', color: '#fff', border: 'none',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Créer des créneaux
                </button>
              </div>
            ) : (
              <TrainingBlock
                data={{ sessions: allSessions }}
                isEditing={false}
                onUpdate={() => {}}
                clubId={String(clubId)}
                currentUser={currentUser}
                isManager={true}
              />
            )}
          </div>
        )}

        {/* ── EDIT MODE ── */}
        {mode === 'edit' && (
          <div style={{ padding: '12px 16px 80px' }}>

            {clubTeams.map((team) => (
              <TeamSection
                key={team.id}
                team={team}
                sessions={trainings[team.id] ?? []}
                onUpdate={patch => setTrainings(prev => ({ ...prev, [team.id]: patch.sessions }))}
                clubId={String(clubId)}
                currentUser={currentUser}
              />
            ))}

            {/* Add team */}
            {addingTeam ? (
              <div style={{
                marginTop: 12, padding: 12, borderRadius: 14,
                border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 8 }}>
                  Nom de l'équipe
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    autoFocus
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddTeam(); if (e.key === 'Escape') setAddingTeam(false); }}
                    placeholder="ex : Seniors A, U17…"
                    style={{
                      flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12,
                      border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)',
                      color: 'var(--sl-t1)', outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleAddTeam}
                    disabled={!newTeamName.trim()}
                    style={{
                      padding: '8px 14px', borderRadius: 8, backgroundColor: '#6366f1',
                      color: '#fff', border: 'none', fontSize: 12, fontWeight: 700,
                      cursor: newTeamName.trim() ? 'pointer' : 'not-allowed', opacity: newTeamName.trim() ? 1 : 0.5,
                    }}
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => { setAddingTeam(false); setNewTeamName(''); }}
                    style={{
                      padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--sl-surface)',
                      color: 'var(--sl-t3)', border: '1px solid var(--sl-border)', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingTeam(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', marginTop: 12, padding: '12px',
                  borderRadius: 14, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  border: '2px dashed var(--sl-border)', color: 'var(--sl-t3)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sl-border)'; e.currentTarget.style.color = 'var(--sl-t3)'; }}
              >
                + Ajouter une équipe
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Team section with collapsible TrainingBlock ───────────────────────────────
function TeamSection({ team, sessions, onUpdate, clubId, currentUser }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 14px', borderRadius: open ? '12px 12px 0 0' : 12,
          border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)',
          cursor: 'pointer', transition: 'border-radius 0.15s',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            backgroundColor: '#6366f1', flexShrink: 0,
          }} />
          {team.name}
        </span>
        <span style={{ fontSize: 11, color: 'var(--sl-t3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {sessions.length} créneau{sessions.length !== 1 ? 'x' : ''}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>

      {open && (
        <div style={{
          border: '1px solid var(--sl-border)', borderTop: 'none',
          borderRadius: '0 0 12px 12px', backgroundColor: 'var(--sl-card)',
          padding: 12,
        }}>
          <TrainingBlock
            data={{ sessions }}
            isEditing={true}
            onUpdate={onUpdate}
            clubId={clubId}
            currentUser={currentUser}
            isManager={true}
          />
        </div>
      )}
    </div>
  );
}
