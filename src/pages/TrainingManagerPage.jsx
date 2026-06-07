import { useState, useMemo, useEffect, useRef } from 'react';
import { useAndroidBack } from '../hooks/useAndroidBack.js';
import { Z } from '../constants/zIndex.js';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useManagedClubs } from '../hooks/useManagedClubs.js';
import { useMyPlayerProfile } from '../hooks/useMyPlayerProfile.js';
import { useClubTrainings } from '../hooks/useClubTrainings.js';
import { useTrainingSessions } from '../hooks/useTrainingSessions.js';
import { useTrainingAttendance } from '../hooks/useTrainingAttendance.js';
import TrainingBlock from '../components/club/blocks/TrainingBlock.jsx';

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const STATUS_CFG = {
  present: { label: 'Présent',   emoji: '✅', color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  absent:  { label: 'Absent',    emoji: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  unsure:  { label: 'Peut-être', emoji: '🤔', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
};

const FRENCH_DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const FRENCH_MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function formatSessionDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${FRENCH_DAYS[d.getDay()]} ${d.getDate()} ${FRENCH_MONTHS[d.getMonth()]}`;
}

// ── Composant carte de séance pour la vue joueur "À venir" ────────────────────
function UpcomingSessionCard({ session, currentUser }) {
  const { counts, myStatus, respond } = useTrainingAttendance(session.id, currentUser?.id);
  return (
    <div style={{
      borderRadius: 14, border: '1px solid var(--sl-border)',
      backgroundColor: 'var(--sl-card)', overflow: 'hidden', marginBottom: 10,
    }}>
      <div style={{ height: 3, background: myStatus === 'present' ? '#22c55e' : myStatus === 'absent' ? '#ef4444' : myStatus === 'unsure' ? '#f97316' : 'var(--sl-border)' }} />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--sl-t1)', margin: 0 }}>
              {formatSessionDate(session.date)}
            </p>
            <p style={{ fontSize: 12, color: 'var(--sl-t2)', margin: '2px 0 0', display: 'flex', gap: 6 }}>
              {session.time && <span>{session.time}</span>}
              {session.time && session.location && <span>·</span>}
              {session.location && <span>{session.location}</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 4, fontSize: 10, color: 'var(--sl-t3)' }}>
            <span>✅ {counts.present}</span>
            <span>❌ {counts.absent}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(STATUS_CFG).map(([s, cfg]) => (
            <button
              key={s}
              onClick={() => respond(s)}
              style={{
                flex: 1, padding: '7px 4px', borderRadius: 10, cursor: 'pointer',
                border: `1.5px solid ${myStatus === s ? cfg.color : 'var(--sl-border)'}`,
                backgroundColor: myStatus === s ? cfg.bg : 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: myStatus === s ? cfg.color : 'var(--sl-t3)' }}>
                {cfg.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function TrainingManagerPage({ onBack }) {
  const { currentUser } = useAuth();
  const isManager = ['club_admin', 'admin', 'superadmin'].includes(currentUser?.role);

  // ── Données manager ───────────────────────────────────────────────────────
  const { managedClubs, loading: clubsLoading } = useManagedClubs();
  const [selectedClubId, setSelectedClubId] = useState(null);

  // Initialise selectedClubId quand managedClubs se charge
  useEffect(() => {
    if (selectedClubId || !managedClubs.length) return;
     
    setSelectedClubId(String(managedClubs[0].id));
  }, [managedClubs, selectedClubId]);

  const myClub = useMemo(
    () => managedClubs.find(c => String(c.id) === selectedClubId) ?? null,
    [managedClubs, selectedClubId]
  );

  useAndroidBack(true, onBack);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onBack?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onBack]);

  const [trainings, setTrainings] = useClubTrainings(isManager ? selectedClubId : null);
  const { generateFromRecurring } =
    useTrainingSessions(isManager ? selectedClubId : null, null);

  // ── Données joueur ────────────────────────────────────────────────────────
  const { profile: playerProfile, loading: playerLoading } = useMyPlayerProfile();
  const playerClubId  = playerProfile?.club_id  ?? null;
  const playerTeamId  = playerProfile?.team_id  ?? null;
  const playerTeamName = useMemo(() => {
    if (!playerProfile) return null;
    // Chercher le nom de l'équipe dans les clubs chargés
    for (const club of managedClubs) {
      if (String(club.id) !== String(playerClubId)) continue;
      for (const cat of (club.categories ?? [])) {
        const t = (cat.teams ?? []).find(t => String(t.id) === String(playerTeamId));
        if (t) return t.name;
      }
    }
    return null;
  }, [playerProfile, playerClubId, playerTeamId, managedClubs]);

  const { sessions: playerDbSessions, generateFromRecurring: playerGenerateFromRecurring } =
    useTrainingSessions(!isManager ? playerClubId : null, !isManager ? playerTeamId : null);
  const [playerTrainings] = useClubTrainings(!isManager ? playerClubId : null);

  // ── Mode UI ───────────────────────────────────────────────────────────────
  // Manager : 'calendar' | 'edit'   Joueur : 'upcoming' | 'calendar'
  const [mode, setMode] = useState(isManager ? 'calendar' : 'upcoming');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [addingTeam, setAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [generatedCount, setGeneratedCount] = useState(0);
  const [activeTabId, setActiveTabId] = useState(null);

  // ── Dérivation des équipes (manager) ─────────────────────────────────────
  const clubTeams = useMemo(() => {
    const fromCategories = (myClub?.categories ?? []).flatMap(cat =>
      (cat.teams ?? []).map(t => ({
        id:      String(t.id),
        name:    t.name,
        catName: cat.name,
        level:   t.level ?? '',
      }))
    );
    const fromKeys = Object.keys(trainings).filter(k => !fromCategories.some(t => t.id === k));
    const extra    = fromKeys.map(k => ({ id: k, name: k === 'default' ? 'Mon équipe' : k, catName: '' }));
    const all      = [...fromCategories, ...extra];
    return all.length > 0 ? all : [{ id: 'default', name: 'Mon équipe', catName: '' }];
  }, [myClub, trainings]);

  // Initialiser l'onglet actif sur la première équipe dès que clubTeams est disponible
  useEffect(() => {
     
    if (!activeTabId && clubTeams.length > 0) setActiveTabId(clubTeams[0].id);
  }, [clubTeams, activeTabId]);

  // Séances communes reçues par l'équipe active (depuis d'autres équipes)
  const mergedSessionsForActiveTeam = useMemo(() => {
    if (!activeTabId) return [];
    const result = [];
    for (const team of clubTeams) {
      if (team.id === activeTabId) continue;
      for (const session of trainings[team.id] ?? []) {
        if ((session.mergedTeamIds ?? []).includes(activeTabId)) {
          result.push({ session, hostTeam: team });
        }
      }
    }
    return result;
  }, [activeTabId, clubTeams, trainings]);

  // Sessions templates aplaties (pour le mode calendrier manager)
  const allTemplateSessions = useMemo(() => Object.values(trainings).flat(), [trainings]);

  // Sessions filtrées par équipe sélectionnée (manager calendar)
  const filteredTemplateSessions = useMemo(() => {
    if (selectedTeam === 'all') return allTemplateSessions;
    return trainings[selectedTeam] ?? [];
  }, [allTemplateSessions, trainings, selectedTeam]);

  // ── Auto-génération des séances concrètes (manager) ───────────────────────
  const hasGenerated = useRef(new Set()); // guard une seule génération par club
  useEffect(() => {
    if (!isManager || !selectedClubId || !clubTeams.length || hasGenerated.current.has(selectedClubId)) return;
    if (Object.keys(trainings).length === 0) return;
    hasGenerated.current.add(selectedClubId);
    let total = 0;
    async function gen() {
      for (const team of clubTeams) {
        const recurring = (trainings[team.id] ?? []).filter(s => s.recurring);
        if (!recurring.length) continue;
        const n = await generateFromRecurring(recurring, team.id, 4);
        total += n ?? 0;
      }
      if (total > 0) setGeneratedCount(c => c + total);
    }
    gen();
  }, [isManager, selectedClubId, clubTeams, trainings, generateFromRecurring, hasGenerated]);

  // ── Auto-génération joueur ────────────────────────────────────────────────
  const playerGenerated = useRef(new Set());
  useEffect(() => {
    if (isManager || !playerClubId || !playerTeamId || playerGenerated.current.has(playerClubId)) return;
    if (Object.keys(playerTrainings).length === 0) return;
    playerGenerated.current.add(playerClubId);
    const recurring = (playerTrainings[playerTeamId] ?? Object.values(playerTrainings).flat()).filter(s => s.recurring);
    if (!recurring.length) return;
    playerGenerateFromRecurring(recurring, playerTeamId, 4);
  }, [isManager, playerClubId, playerTeamId, playerTrainings, playerGenerateFromRecurring, playerGenerated]);

  // Prochaines séances joueur (8 max)
  const upcomingSessions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return playerDbSessions
      .filter(s => s.date >= today && s.cancelled !== true)
      .slice(0, 8);
  }, [playerDbSessions]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleAddTeam() {
    const name = newTeamName.trim();
    if (!name) return;
    const key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!trainings[key]) setTrainings(prev => ({ ...prev, [key]: [] }));
    setNewTeamName(''); setAddingTeam(false);
    setActiveTabId(key);
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  const isPlayerMode = !isManager;
  const headerTitle  = isPlayerMode ? '📋 Mon planning' : '🏋️ Mes entraînements';
  const headerSub    = isPlayerMode
    ? playerTeamName ?? playerProfile?.name ?? null
    : myClub?.name ?? null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={headerTitle}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--sl-bg)', zIndex: Z.formModal,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, backgroundColor: 'var(--sl-card)',
        borderBottom: '1px solid var(--sl-border)', padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            aria-label="Retour"
            style={{
              width: 44, height: 44, borderRadius: 11, border: 'none', cursor: 'pointer',
              backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--sl-t2)', flexShrink: 0,
            }}
          >
            <BackIcon />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>
                {headerTitle}
              </h1>
              {isManager && generatedCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                  backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1',
                }}>
                  {generatedCount} séance{generatedCount > 1 ? 's' : ''} planifiée{generatedCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {headerSub && (
              <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: 0, marginTop: 1 }}>
                {headerSub}
              </p>
            )}
          </div>
        </div>

        {/* Sélecteur de club (multi-club manager) */}
        {isManager && managedClubs.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {managedClubs.map(club => (
              <button
                key={club.id}
                onClick={() => { setSelectedClubId(String(club.id)); setSelectedTeam('all'); }}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: String(club.id) === selectedClubId ? 'none' : '1px solid var(--sl-border)',
                  backgroundColor: String(club.id) === selectedClubId ? '#6366f1' : 'var(--sl-pill-bg)',
                  color: String(club.id) === selectedClubId ? '#fff' : 'var(--sl-pill-text)',
                }}
              >
                {club.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Mode toggle ─────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: 'flex', gap: 6, padding: '10px 16px',
        borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-bg)',
      }}>
        {(isManager
          ? [{ key: 'calendar', label: '📅 Calendrier' }, { key: 'edit', label: '✏️ Créneaux' }]
          : [{ key: 'upcoming', label: '📋 À venir' }, { key: 'calendar', label: '📅 Calendrier' }]
        ).map(({ key, label }) => (
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

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>

        {/* ════════ PLAYER NOT LINKED ════════ */}
        {isPlayerMode && !playerLoading && !playerProfile && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>👤</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>
              Vous n'êtes rattaché à aucune équipe
            </p>
            <p style={{ fontSize: 12, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
              Demandez à votre manager de vous ajouter au roster de votre club
            </p>
          </div>
        )}

        {/* ════════ PLAYER — À VENIR ════════ */}
        {isPlayerMode && playerProfile && mode === 'upcoming' && (
          <div style={{ padding: '12px 16px 80px' }}>
            {upcomingSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>📅</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>
                  Aucune séance à venir
                </p>
                <p style={{ fontSize: 12, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
                  Votre entraîneur n'a pas encore planifié de séances
                </p>
              </div>
            ) : (
              upcomingSessions.map(s => (
                <UpcomingSessionCard key={s.id} session={s} currentUser={currentUser} />
              ))
            )}
          </div>
        )}

        {/* ════════ PLAYER — CALENDRIER ════════ */}
        {isPlayerMode && playerProfile && mode === 'calendar' && (
          <div style={{ padding: '12px 0 80px' }}>
            {(playerTrainings[playerTeamId] ?? Object.values(playerTrainings).flat()).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>🏋️</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)' }}>
                  Aucun planning défini
                </p>
              </div>
            ) : (
              <TrainingBlock
                data={{ sessions: playerTrainings[playerTeamId] ?? Object.values(playerTrainings).flat() }}
                isEditing={false}
                onUpdate={() => {}}
                clubId={String(playerClubId)}
                currentUser={currentUser}
                isManager={false}
              />
            )}
          </div>
        )}

        {/* ════════ MANAGER — CALENDRIER ════════ */}
        {isManager && mode === 'calendar' && (
          <div style={{ padding: '12px 0 80px' }}>
            {/* Filtre par équipe */}
            {clubTeams.length > 1 && (
              <div style={{
                display: 'flex', gap: 6, padding: '0 16px 10px',
                overflowX: 'auto', flexShrink: 0,
              }}>
                {[{ id: 'all', name: 'Tout' }, ...clubTeams].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeam(t.id)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      border: selectedTeam === t.id ? 'none' : '1px solid var(--sl-border)',
                      backgroundColor: selectedTeam === t.id ? '#6366f1' : 'var(--sl-pill-bg)',
                      color: selectedTeam === t.id ? '#fff' : 'var(--sl-pill-text)',
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}

            {filteredTemplateSessions.length === 0 ? (
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
                data={{ sessions: filteredTemplateSessions }}
                isEditing={false}
                onUpdate={() => {}}
                clubId={String(selectedClubId)}
                currentUser={currentUser}
                isManager={true}
              />
            )}
          </div>
        )}

        {/* ════════ MANAGER — EDIT ════════ */}
        {isManager && mode === 'edit' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {clubsLoading ? (
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: 40, borderRadius: 10, backgroundColor: 'var(--sl-surface)', opacity: 1 - i * 0.2 }} />
                ))}
              </div>
            ) : (
              <>
                {/* ── Barre d'onglets ── */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, padding: '10px 16px 0', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
                  {clubTeams.map(team => {
                    const isActive = activeTabId === team.id;
                    const count = (trainings[team.id] ?? []).length;
                    return (
                      <button
                        key={team.id}
                        onClick={() => setActiveTabId(team.id)}
                        style={{
                          padding: '7px 14px 8px', borderRadius: '10px 10px 0 0',
                          border: '1px solid var(--sl-border)',
                          borderBottom: isActive ? '1px solid var(--sl-card)' : '1px solid var(--sl-border)',
                          backgroundColor: isActive ? 'var(--sl-card)' : 'var(--sl-surface)',
                          color: isActive ? '#6366f1' : 'var(--sl-t3)',
                          fontSize: 12, fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                          transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 5,
                          marginBottom: isActive ? -1 : 0,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isActive ? '#6366f1' : 'var(--sl-border-s)', flexShrink: 0 }} />
                        {team.name}
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 8, backgroundColor: isActive ? 'rgba(99,102,241,0.12)' : 'var(--sl-border)', color: isActive ? '#6366f1' : 'var(--sl-t3)' }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setAddingTeam(true)}
                    title="Ajouter une équipe"
                    style={{
                      padding: '7px 12px 8px', borderRadius: '10px 10px 0 0',
                      border: '1px dashed var(--sl-border)', borderBottom: '1px solid var(--sl-border)',
                      backgroundColor: 'transparent', color: 'var(--sl-t3)',
                      fontSize: 16, cursor: 'pointer', flexShrink: 0, lineHeight: 1,
                    }}
                  >
                    +
                  </button>
                </div>

                {/* ── Contenu de l'onglet actif ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 80px', borderTop: '1px solid var(--sl-border)' }}>
                  {/* Formulaire ajout équipe */}
                  {addingTeam && (
                    <div style={{ margin: '12px 0', padding: 12, borderRadius: 12, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 8 }}>Nouvelle équipe</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          autoFocus value={newTeamName}
                          onChange={e => setNewTeamName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddTeam(); if (e.key === 'Escape') setAddingTeam(false); }}
                          placeholder="ex : Seniors A, U17…"
                          style={{ flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none' }}
                        />
                        <button onClick={handleAddTeam} disabled={!newTeamName.trim()} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#6366f1', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: newTeamName.trim() ? 'pointer' : 'not-allowed', opacity: newTeamName.trim() ? 1 : 0.5 }}>Ajouter</button>
                        <button onClick={() => { setAddingTeam(false); setNewTeamName(''); }} style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t3)', border: '1px solid var(--sl-border)', fontSize: 12, cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  )}

                  {activeTabId && (() => {
                    const activeTeam = clubTeams.find(t => t.id === activeTabId);
                    if (!activeTeam) return null;
                    return (
                      <div>
                        <div style={{ borderRadius: '0 0 12px 12px', backgroundColor: 'var(--sl-card)', padding: 12, border: '1px solid var(--sl-border)', borderTop: 'none', marginBottom: 12 }}>
                          <TrainingBlock
                            data={{ sessions: trainings[activeTabId] ?? [] }}
                            isEditing={true}
                            onUpdate={patch => setTrainings(prev => ({ ...prev, [activeTabId]: patch.sessions }))}
                            clubId={String(selectedClubId)}
                            currentUser={currentUser}
                            isManager={true}
                            allTeams={clubTeams}
                            currentTeamId={activeTabId}
                          />
                        </div>

                        {/* Séances communes reçues d'autres équipes */}
                        {mergedSessionsForActiveTeam.length > 0 && (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6366f1', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                              Séances communes
                            </div>
                            {mergedSessionsForActiveTeam.map(({ session, hostTeam }) => (
                              <MergedSessionRow key={session.id} session={session} hostTeam={hostTeam} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Séance commune (lecture seule) ───────────────────────────────────────────
const DAY_BADGE_COLORS = {
  Lundi: '#6366f1', Mardi: '#8b5cf6', Mercredi: '#ec4899',
  Jeudi: '#f97316', Vendredi: '#eab308', Samedi: '#22c55e', Dimanche: '#ef4444',
};

function MergedSessionRow({ session, hostTeam }) {
  const col = DAY_BADGE_COLORS[session.day] ?? '#6366f1';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      padding: '8px 12px', borderRadius: 10, marginBottom: 6,
      border: '1px dashed rgba(99,102,241,0.3)',
      backgroundColor: 'rgba(99,102,241,0.04)',
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: col, flexShrink: 0 }}>{session.day}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)' }}>{session.time}</span>
      {session.duration && <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{session.duration} min</span>}
      {session.location && (
        <span style={{ fontSize: 11, color: 'var(--sl-t3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.location}
        </span>
      )}
      <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1', flexShrink: 0 }}>
        🔗 {hostTeam.name}
      </span>
    </div>
  );
}

