import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import TeamView from '../ClubTeamSection.jsx';
import QuickAddTeamModal from '../QuickAddTeamModal.jsx';

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
