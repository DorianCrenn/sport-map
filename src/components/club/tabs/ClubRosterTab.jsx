import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TeamView from '../ClubTeamSection.jsx';

const AGE_CATEGORIES = [
  'U7', 'U7F', 'U9', 'U9F', 'U11', 'U11F', 'U13', 'U13F',
  'U15', 'U15F', 'U17', 'U17F', 'U19', 'U19F',
  'Seniors', 'Seniors F', 'Vétérans', 'Vétérans F', 'Loisir', 'Loisir F',
];

function catUid()  { return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }
function teamUid() { return `tm_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`; }

function QuickAddTeamModal({ club, onSave, onClose }) {
  const existingCatNames = (club.categories ?? []).map(c => c.name);
  const [catName,  setCatName]  = useState('');
  const [teamName, setTeamName] = useState('');
  const [saving,   setSaving]   = useState(false);

  function selectCat(name) {
    setCatName(name);
    const existing = (club.categories ?? []).find(c => c.name === name);
    const n = existing ? existing.teams.length + 1 : 1;
    setTeamName(`${name} ${n}`);
  }

  async function handleSave() {
    if (!catName.trim() || !teamName.trim()) return;
    setSaving(true);
    const cats = club.categories ?? [];
    const existingCat = cats.find(c => c.name === catName);
    const newTeam = { id: teamUid(), name: teamName.trim(), level: 'D4' };
    let updated;
    if (existingCat) {
      updated = cats.map(c => c.id === existingCat.id
        ? { ...c, teams: [...c.teams, newTeam] }
        : c
      );
    } else {
      updated = [...cats, { id: catUid(), name: catName.trim(), teams: [newTeam] }];
    }
    await onSave({ categories: updated }, newTeam.id);
    setSaving(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        style={{
          backgroundColor: 'var(--sl-card)', borderRadius: '20px 20px 0 0',
          padding: '0 0 env(safe-area-inset-bottom, 16px)',
          maxHeight: '80dvh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 3.5, borderRadius: 999, backgroundColor: 'var(--sl-border-s)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '8px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sl-border)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em' }}>Créer une équipe</div>
            <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>Choisissez une catégorie puis nommez l'équipe</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Catégorie</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {AGE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => selectCat(cat)}
                style={{
                  padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  backgroundColor: catName === cat ? 'var(--sl-green)' : existingCatNames.includes(cat) ? 'var(--sl-surface)' : 'var(--sl-surface)',
                  color: catName === cat ? '#fff' : existingCatNames.includes(cat) ? 'var(--sl-t2)' : 'var(--sl-t2)',
                  outline: catName === cat ? 'none' : existingCatNames.includes(cat) ? '1.5px solid var(--sl-green)' : '1px solid var(--sl-border)',
                }}
              >
                {cat}
                {existingCatNames.includes(cat) && catName !== cat && (
                  <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>·</span>
                )}
              </button>
            ))}
            <input
              placeholder="Autre catégorie…"
              value={AGE_CATEGORIES.includes(catName) ? '' : catName}
              onChange={e => selectCat(e.target.value)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)',
                color: 'var(--sl-t1)', outline: 'none', width: 130,
              }}
            />
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nom de l'équipe</div>
          <input
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            placeholder="ex: Seniors 1, U13 2…"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12,
              border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)',
              color: 'var(--sl-t1)', fontSize: 14, fontWeight: 600, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--sl-border)', flexShrink: 0 }}>
          <button
            onClick={handleSave}
            disabled={saving || !catName.trim() || !teamName.trim()}
            style={{
              width: '100%', padding: '13px', borderRadius: 14, border: 'none',
              cursor: !catName.trim() || !teamName.trim() ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 800,
              backgroundColor: !catName.trim() || !teamName.trim() ? 'var(--sl-surface)' : 'var(--sl-green)',
              color: !catName.trim() || !teamName.trim() ? 'var(--sl-t3)' : '#fff',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Création…' : 'Créer l\'équipe'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ClubRosterTab({
  club,
  allTeams,
  blocks,
  isEditing,
  updateBlock,
  addBlock,
  effectiveEvents,
  trainings,
  onUpdateTrainings,
  onAddEventForTeam,
  canAddEvent,
  onBulkAddTrainingEvents,
  accentColor,
  canEdit,
  onUpdateClub,
}) {
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [showAddTeam, setShowAddTeam]   = useState(false);
  const tabBarRef = useRef(null);

  useEffect(() => {
    const el = tabBarRef.current;
    if (!el) return;
    const active = el.querySelector('[data-active="true"]');
    active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTeamId]);

  const activeTeam = allTeams.find(t => t.id === activeTeamId) ?? null;

  async function handleTeamSaved(patch, newTeamId) {
    await onUpdateClub?.(patch);
    setShowAddTeam(false);
    if (newTeamId) setActiveTeamId(newTeamId);
  }

  if (allTeams.length === 0) {
    return (
      <div style={{ padding: '14px 14px calc(90px + env(safe-area-inset-bottom, 0px))', position: 'relative' }}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>
            Aucune équipe configurée
          </div>
          {canEdit ? (
            <button
              onClick={() => setShowAddTeam(true)}
              style={{
                marginTop: 8, padding: '10px 22px', borderRadius: 14, border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 800,
                backgroundColor: 'var(--sl-green)', color: '#fff',
              }}
            >
              + Créer une équipe
            </button>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
              Aucune équipe n'a encore été ajoutée.
            </div>
          )}
        </div>
        <AnimatePresence>
          {showAddTeam && (
            <QuickAddTeamModal
              club={club}
              onSave={handleTeamSaved}
              onClose={() => setShowAddTeam(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Team tab bar */}
      <div style={{
        flexShrink: 0,
        borderBottom: '1px solid var(--sl-border)',
        backgroundColor: 'var(--sl-card)',
        position: 'relative',
      }}>
        <div
          ref={tabBarRef}
          style={{
            display: 'flex', overflowX: 'auto',
            scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          }}
        >
          <button
            data-active={activeTeamId === null}
            onClick={() => setActiveTeamId(null)}
            style={{
              flexShrink: 0, padding: '10px 16px',
              fontSize: 12, fontWeight: 700,
              border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${activeTeamId === null ? accentColor : 'transparent'}`,
              color: activeTeamId === null ? 'var(--sl-t1)' : 'var(--sl-t3)',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            Général
          </button>
          {allTeams.map(team => (
            <button
              key={team.id}
              data-active={activeTeamId === team.id}
              onClick={() => setActiveTeamId(team.id)}
              style={{
                flexShrink: 0, padding: '10px 16px',
                fontSize: 12, fontWeight: 700,
                border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: `2px solid ${activeTeamId === team.id ? accentColor : 'transparent'}`,
                color: activeTeamId === team.id ? 'var(--sl-t1)' : 'var(--sl-t3)',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {team.name}
            </button>
          ))}
          {canEdit && (
            <button
              onClick={() => setShowAddTeam(true)}
              title="Créer une équipe"
              style={{
                flexShrink: 0, padding: '10px 14px',
                fontSize: 16, fontWeight: 700, lineHeight: 1,
                border: 'none', background: 'none', cursor: 'pointer',
                color: 'var(--sl-t3)',
              }}
            >
              +
            </button>
          )}
          <div style={{ flexShrink: 0, width: 8 }} />
        </div>
        {allTeams.length > 2 && (
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 28,
            pointerEvents: 'none',
            background: 'linear-gradient(to right, transparent, var(--sl-card))',
          }} />
        )}
      </div>

      {/* Team content */}
      <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', position: 'relative' }}>
        <AnimatePresence>
          {showAddTeam && (
            <QuickAddTeamModal
              club={club}
              onSave={handleTeamSaved}
              onClose={() => setShowAddTeam(false)}
            />
          )}
        </AnimatePresence>
        {activeTeam ? (
          <TeamView
            key={activeTeam.id}
            team={activeTeam}
            blocks={blocks}
            isEditing={isEditing}
            updateBlock={updateBlock}
            addBlock={addBlock}
            club={club}
            allEvents={effectiveEvents}
            trainings={trainings}
            onUpdateTrainings={onUpdateTrainings}
            onAddEventForTeam={onAddEventForTeam}
            canAddEvent={canAddEvent}
            onBulkAddTrainingEvents={onBulkAddTrainingEvents}
          />
        ) : (
          <div style={{ padding: '14px 14px calc(90px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>
                  Équipes
                </h2>
                {canEdit && (
                  <button
                    onClick={() => setShowAddTeam(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700,
                      backgroundColor: 'rgba(34,217,106,0.12)',
                      color: 'var(--sl-green)',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>+</span> Ajouter une équipe
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(club.categories ?? []).map(cat => (
                  <div key={cat.id} style={{
                    padding: '12px 14px', borderRadius: 12,
                    backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sl-t2)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {cat.name}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(cat.teams ?? []).map(team => (
                        <button
                          key={team.id}
                          onClick={() => setActiveTeamId(team.id)}
                          style={{
                            padding: '5px 12px', borderRadius: 20,
                            border: `1px solid ${accentColor}40`,
                            backgroundColor: `${accentColor}10`,
                            color: accentColor, fontSize: 11, fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {team.name}
                          {team.level && <span style={{ marginLeft: 4, opacity: 0.7 }}>· {team.level}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
