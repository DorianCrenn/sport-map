import { useMemo } from 'react';
import { AnimatePresence, Reorder } from 'framer-motion';
import { motion } from 'framer-motion';
import SportIcon from '../../SportIcon.jsx';
import { DraggableRow, getRows, PlusIcon } from '../ClubPageBuilder.jsx';
import AddBlockMenu from '../AddBlockMenu.jsx';
import ClubSimpleEditor from '../ClubSimpleEditor.jsx';
import { timeAgo } from '../../../lib/dateUtils.js';

// ── Prochain match ────────────────────────────────────────────────────────────

function NextMatchCard({ event, accentColor }) {
  if (!event) return null;
  const eventDate = new Date(event.date);
  const isToday = new Date().toDateString() === eventDate.toDateString();
  const isTomorrow = (() => {
    const t = new Date(); t.setDate(t.getDate() + 1);
    return t.toDateString() === eventDate.toDateString();
  })();

  const dateLabel = isToday ? 'Aujourd\'hui'
    : isTomorrow ? 'Demain'
    : eventDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
      marginBottom: 12,
    }}>
      {/* Badge */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px',
        backgroundColor: `${accentColor}12`,
        borderBottom: `1px solid ${accentColor}20`,
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: accentColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          ⚡ Prochain match
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sl-t3)' }}>{dateLabel}</span>
      </div>

      {/* Teams */}
      <div style={{ padding: '14px 14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 2 }}>
              {event.homeTeam || 'Domicile'}
            </div>
          </div>
          <div style={{
            flexShrink: 0, padding: '4px 10px', borderRadius: 8,
            backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
            fontSize: 12, fontWeight: 800, color: 'var(--sl-t3)',
          }}>
            VS
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 2 }}>
              {event.awayTeam || 'Visiteur'}
            </div>
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {event.time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--sl-t3)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {event.time}
            </div>
          )}
          {event.venue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--sl-t3)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {event.venue}
            </div>
          )}
          {(event.championship || event.eventType) && (
            <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>
              {event.championship || event.eventType}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Annonce preview ───────────────────────────────────────────────────────────

function AnnouncementPreviewCard({ ann, accentColor }) {
  const TYPE_COLOR = { urgent: '#ef4444', result: '#22C55E', event: '#a855f7', info: '#3b82f6' };
  const color = TYPE_COLOR[ann.type] ?? accentColor;

  return (
    <div style={{
      padding: '10px 12px', borderRadius: 12,
      backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <div style={{
        width: 6, borderRadius: 3, alignSelf: 'stretch', flexShrink: 0,
        backgroundColor: color, minHeight: 36,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ann.title || ann.message?.slice(0, 50)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--sl-t3)', lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {ann.message}
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--sl-t3)', flexShrink: 0, marginTop: 1 }}>
        {timeAgo(ann.created_at)}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ClubHomeTab({
  club,
  blocks,
  rows,
  isEditing,
  simpleMode,
  accentColor,
  openMenuAfter,
  onSetOpenMenuAfter,
  effectiveEvents,
  announcements = [],
  canEdit,
  checklistDismissed,
  onDismissChecklist,
  onEditPage,
  onCreateEvent,
  onSendAnnouncement,
  onTabChange,
  // block callbacks
  updateBlock, deleteBlock, toggleBlock, setBlockSpan, moveBlockInRow, addBlockToRow, addBlock, reorderRows,
  currentUser,
}) {
  const now = new Date();

  const nextMatch = useMemo(() => {
    return effectiveEvents
      .filter(e => String(e.clubId) === String(club.id) && new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0] ?? null;
  }, [effectiveEvents, club.id]);

  const recentAnnouncements = (announcements ?? []).slice(0, 3);

  function handleAddBlock(type, afterRowId) {
    const rowBlocks = blocks.filter(b => b.rowId === afterRowId);
    const lastId = rowBlocks[rowBlocks.length - 1]?.id ?? null;
    addBlock(type, lastId);
    onSetOpenMenuAfter(null);
  }

  if (isEditing && simpleMode) {
    return (
      <ClubSimpleEditor
        blocks={blocks}
        onAddBlock={type => addBlock(type, null)}
        onAdvanced={() => {}}
        club={club}
        accentColor={accentColor}
      />
    );
  }

  return (
    <div style={{ padding: '14px 14px calc(90px + env(safe-area-inset-bottom, 0px))' }}>

      {/* Checklist post-création */}
      {canEdit && !isEditing && !checklistDismissed && (
        <ClubSetupChecklist
          club={club} blocks={blocks}
          events={effectiveEvents.filter(e => String(e.clubId) === String(club.id))}
          onDismiss={onDismissChecklist}
          onEditPage={onEditPage}
          onCreateEvent={onCreateEvent}
          onSendAnnouncement={onSendAnnouncement}
          accentColor={accentColor}
        />
      )}

      {/* Prochain match */}
      {!isEditing && nextMatch && (
        <NextMatchCard event={nextMatch} accentColor={accentColor} />
      )}

      {/* Annonces récentes */}
      {!isEditing && recentAnnouncements.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--sl-t2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Actualités
            </span>
            <button
              onClick={() => onTabChange('news')}
              style={{ fontSize: 11, color: accentColor, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px' }}
            >
              Voir tout →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentAnnouncements.map(ann => (
              <AnnouncementPreviewCard key={ann.id} ann={ann} accentColor={accentColor} />
            ))}
          </div>
        </div>
      )}

      {/* Blocs personnalisés (drag & drop en mode édition) */}
      <Reorder.Group axis="y" values={rows} onReorder={reorderRows} as="div">
        {rows.map(row => (
          <div key={row.rowId}>
            <DraggableRow
              row={row}
              isEditing={isEditing}
              onUpdate={updateBlock}
              onDelete={deleteBlock}
              onToggle={toggleBlock}
              onSetSpan={setBlockSpan}
              onMoveLeft={id => moveBlockInRow(id, 'left')}
              onMoveRight={id => moveBlockInRow(id, 'right')}
              onAddToRow={addBlockToRow}
              allEvents={effectiveEvents}
              club={club}
              currentUser={currentUser}
            />
            {isEditing && (
              <AnimatePresence>
                {openMenuAfter === row.rowId ? (
                  <AddBlockMenu
                    key={`menu-${row.rowId}`}
                    onAdd={type => handleAddBlock(type, row.rowId)}
                    onCancel={() => onSetOpenMenuAfter(null)}
                  />
                ) : (
                  <button
                    onClick={() => onSetOpenMenuAfter(row.rowId)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 6, width: '100%', marginBottom: 8, padding: '8px',
                      borderRadius: 12, border: 'none', background: 'none',
                      color: 'var(--sl-t3)', fontSize: 12, cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--sl-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <PlusIcon /> Ajouter une ligne
                  </button>
                )}
              </AnimatePresence>
            )}
          </div>
        ))}
      </Reorder.Group>

      {/* Bouton ajout fin de page */}
      {isEditing && blocks.length > 0 && openMenuAfter === null && (
        <button
          onClick={() => onSetOpenMenuAfter('__end__')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '12px', borderRadius: 14,
            border: '2px dashed var(--sl-border)', background: 'none',
            color: 'var(--sl-t3)', fontSize: 12, cursor: 'pointer', marginTop: 4,
          }}
        >
          <PlusIcon /> Ajouter un bloc à la fin
        </button>
      )}
      <AnimatePresence>
        {openMenuAfter === '__end__' && (
          <AddBlockMenu
            onAdd={type => { addBlock(type, null); onSetOpenMenuAfter(null); }}
            onCancel={() => onSetOpenMenuAfter(null)}
          />
        )}
      </AnimatePresence>

      {/* Empty state */}
      {blocks.length === 0 && !isEditing && !nextMatch && recentAnnouncements.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '32px 20px',
          borderRadius: 16, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
          marginTop: 8,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚽</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>
            Ce club n'a pas encore publié de contenu
          </div>
          {club.description ? (
            <div style={{ fontSize: 12, color: 'var(--sl-t3)', lineHeight: 1.6 }}>
              {club.description}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--sl-t3)' }}>
              Revenez bientôt pour les actualités.
            </div>
          )}
        </div>
      )}

      {/* Empty state édition */}
      {blocks.length === 0 && isEditing && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t2)', marginBottom: 16 }}>
            Page vide — ajoutez votre premier bloc
          </div>
          <button
            onClick={() => addBlock('about', null)}
            style={{
              padding: '10px 20px', borderRadius: 12, border: 'none',
              backgroundColor: accentColor, color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            + Ajouter un bloc
          </button>
        </div>
      )}
    </div>
  );
}

// ── Checklist inlined ─────────────────────────────────────────────────────────

function ClubSetupChecklist({ club, blocks, events, onDismiss, onEditPage, onCreateEvent, onSendAnnouncement, accentColor }) {
  const hasBlocks = blocks.length > 0;
  const hasEvents = events.length > 0;
  const hasMembers = (club.members ?? 0) > 0;
  const done = [hasBlocks, hasEvents, hasMembers].filter(Boolean).length;
  const pct = Math.round((done / 3) * 100);

  const items = [
    { done: hasBlocks, label: 'Personnaliser la page', action: onEditPage, actionLabel: '✏️ Modifier' },
    { done: hasEvents, label: 'Créer un événement', action: onCreateEvent, actionLabel: '📅 Événement' },
    { done: hasMembers, label: 'Inviter des membres', action: null, actionLabel: null },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        marginBottom: 14, borderRadius: 14,
        border: '1px solid rgba(99,102,241,0.25)',
        backgroundColor: 'rgba(99,102,241,0.06)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 6px' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1' }}>
          ✅ Configuration — {done}/3
        </span>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sl-t3)', padding: 4, display: 'flex' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div style={{ height: 3, backgroundColor: 'var(--sl-border)', margin: '0 12px 8px' }}>
        <div style={{ height: '100%', backgroundColor: '#6366f1', borderRadius: 2, width: `${pct}%`, transition: 'width 0.4s' }} />
      </div>
      <div style={{ padding: '0 10px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, backgroundColor: item.done ? 'rgba(34,217,106,0.06)' : 'transparent' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, backgroundColor: item.done ? '#22d96a' : 'var(--sl-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.done && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: item.done ? 'var(--sl-t3)' : 'var(--sl-t1)', textDecoration: item.done ? 'line-through' : 'none' }}>
              {item.label}
            </span>
            {!item.done && item.action && (
              <button onClick={item.action} style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid rgba(99,102,241,0.3)', backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                {item.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
