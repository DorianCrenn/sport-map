import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { Reorder } from 'framer-motion';
import { DraggableRow, PlusIcon } from '../ClubPageBuilder.jsx';
import AddBlockMenu from '../AddBlockMenu.jsx';
import ClubSimpleEditor from '../ClubSimpleEditor.jsx';
import NextMatchBlock from '../blocks/NextMatchBlock.jsx';
import { timeAgo } from '../../../lib/dateUtils.js';
import { isDemoMode } from '../../../lib/supabase.js';

function AnnouncementPreviewCard({ ann, accentColor }: { ann: Record<string, any>; accentColor?: string }) {
  const TYPE_COLOR: Record<string, string> = { urgent: '#ef4444', result: '#22C55E', event: '#a855f7', info: '#3b82f6' };
  const color = TYPE_COLOR[ann.type] ?? accentColor;

  return (
    <div style={{ padding: '10px 12px', borderRadius: 'var(--sl-radius-xl)', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ width: 6, borderRadius: 'var(--sl-radius-xs)', alignSelf: 'stretch', flexShrink: 0, backgroundColor: color, minHeight: 36 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ann.title || ann.message?.slice(0, 50)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--sl-t3)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
          {ann.message}
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--sl-t3)', flexShrink: 0, marginTop: 1 }}>{timeAgo(ann.createdAt)}</div>
    </div>
  );
}

interface ClubHomeTabProps {
  club: Record<string, any>;
  blocks: Record<string, any>[];
  rows: Record<string, any>[];
  isEditing?: boolean;
  simpleMode?: boolean;
  accentColor?: string;
  openMenuAfter: string | null;
  onSetOpenMenuAfter: (id: string | null) => void;
  effectiveEvents: Record<string, any>[];
  announcements?: Record<string, any>[];
  canEdit?: boolean;
  checklistDismissed?: boolean;
  onDismissChecklist?: () => void;
  onEditPage?: () => void;
  onCreateEvent?: () => void;
  onSendAnnouncement?: () => void;
  onTabChange?: (tab: string) => void;
  updateBlock: (id: string, patch: Record<string, any>) => void;
  deleteBlock: (id: string) => void;
  toggleBlock: (id: string) => void;
  setBlockSpan: (id: string, span: number) => void;
  moveBlockInRow: (id: string, dir: 'left' | 'right') => void;
  addBlockToRow: (id: string, type: string) => void;
  addBlock: (type: string, afterId: string | null) => void;
  reorderRows: (rows: Record<string, any>[]) => void;
  currentUser?: Record<string, any> | null;
}

export default function ClubHomeTab({
  club, blocks, rows, isEditing, simpleMode, accentColor,
  openMenuAfter, onSetOpenMenuAfter, effectiveEvents,
  announcements = [], canEdit, checklistDismissed,
  onDismissChecklist, onEditPage, onCreateEvent, onSendAnnouncement, onTabChange,
  updateBlock, deleteBlock, toggleBlock, setBlockSpan, moveBlockInRow, addBlockToRow, addBlock, reorderRows,
  currentUser,
}: ClubHomeTabProps) {
  const recentAnnouncements = (announcements ?? []).slice(0, 3);

  function handleAddBlock(type: string, afterRowId: string) {
    const rowBlocks = blocks.filter(b => b.rowId === afterRowId);
    const lastId = rowBlocks[rowBlocks.length - 1]?.id ?? null;
    addBlock(type, lastId);
    onSetOpenMenuAfter(null);
  }

  if (isEditing && simpleMode) {
    return (
      <ClubSimpleEditor
        blocks={blocks}
        onAddBlock={(type: string) => addBlock(type, null)}
        onAdvanced={() => {}}
        club={club}
        accentColor={accentColor}
      />
    );
  }

  return (
    <div style={{ padding: '14px 14px calc(90px + env(safe-area-inset-bottom, 0px))' }}>

      {canEdit && !isEditing && !checklistDismissed && !isDemoMode() && (
        <ClubSetupChecklist
          club={club} blocks={blocks}
          events={effectiveEvents.filter(e => String(e.clubId) === String(club.id))}
          hasConvocations={effectiveEvents.some(e => String(e.clubId) === String(club.id) && ((e.convocation_count ?? e.convocations ?? 0) > 0))}
          onDismiss={onDismissChecklist}
          onEditPage={onEditPage}
          onCreateEvent={onCreateEvent}
          onManageRoster={() => onTabChange?.('effectif')}
          onGoToMatches={() => onTabChange?.('matchs')}
          onSendAnnouncement={onSendAnnouncement}
          accentColor={accentColor}
        />
      )}

      {!isEditing && (
        <div style={{ marginBottom: 12 }}>
          <NextMatchBlock allEvents={effectiveEvents} club={club} />
        </div>
      )}

      {!isEditing && recentAnnouncements.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--sl-t2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Actualités</span>
            <button onClick={() => onTabChange?.('news')} style={{ fontSize: 11, color: accentColor, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px' }}>
              Voir tout →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentAnnouncements.map(ann => <AnnouncementPreviewCard key={ann.id} ann={ann} accentColor={accentColor} />)}
          </div>
        </div>
      )}

      <Reorder.Group axis="y" values={rows} onReorder={reorderRows} as="div">
        {rows.map(row => (
          <div key={row.rowId}>
            <DraggableRow
              row={row as any} isEditing={isEditing}
              onUpdate={updateBlock} onDelete={deleteBlock}
              onToggle={toggleBlock} onSetSpan={setBlockSpan}
              onMoveLeft={(id: string) => moveBlockInRow(id, 'left')}
              onMoveRight={(id: string) => moveBlockInRow(id, 'right')}
              onAddToRow={addBlockToRow}
              allEvents={effectiveEvents} club={club} currentUser={currentUser}
            />
            {isEditing && (
              <AnimatePresence>
                {openMenuAfter === row.rowId ? (
                  <AddBlockMenu
                    key={`menu-${row.rowId}`}
                    onAdd={(type: string) => handleAddBlock(type, row.rowId)}
                    onCancel={() => onSetOpenMenuAfter(null)}
                  />
                ) : (
                  <button
                    onClick={() => onSetOpenMenuAfter(row.rowId)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginBottom: 8, padding: '8px', borderRadius: 'var(--sl-radius-xl)', border: 'none', background: 'none', color: 'var(--sl-t3)', fontSize: 12, cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--sl-hover)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                  >
                    <PlusIcon /> Ajouter une ligne
                  </button>
                )}
              </AnimatePresence>
            )}
          </div>
        ))}
      </Reorder.Group>

      {isEditing && blocks.length > 0 && openMenuAfter === null && (
        <button
          onClick={() => onSetOpenMenuAfter('__end__')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 'var(--sl-radius-2xl)', border: '2px dashed var(--sl-border)', background: 'none', color: 'var(--sl-t3)', fontSize: 12, cursor: 'pointer', marginTop: 4 }}
        >
          <PlusIcon /> Ajouter un bloc à la fin
        </button>
      )}
      <AnimatePresence>
        {openMenuAfter === '__end__' && (
          <AddBlockMenu
            onAdd={(type: string) => { addBlock(type, null); onSetOpenMenuAfter(null); }}
            onCancel={() => onSetOpenMenuAfter(null)}
          />
        )}
      </AnimatePresence>

      {blocks.length === 0 && !isEditing && recentAnnouncements.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 20px', borderRadius: 'var(--sl-radius-3xl)', backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', marginTop: 8 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚽</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>Ce club n'a pas encore publié de contenu</div>
          {club.description ? (
            <div style={{ fontSize: 12, color: 'var(--sl-t3)', lineHeight: 1.6 }}>{club.description}</div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--sl-t3)' }}>Revenez bientôt pour les actualités.</div>
          )}
        </div>
      )}

      {blocks.length === 0 && isEditing && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t2)', marginBottom: 16 }}>Page vide — ajoutez votre premier bloc</div>
          <button onClick={() => addBlock('about', null)} style={{ padding: '10px 20px', borderRadius: 'var(--sl-radius-xl)', border: 'none', backgroundColor: accentColor, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + Ajouter un bloc
          </button>
        </div>
      )}
    </div>
  );
}

interface ChecklistItem {
  done: boolean;
  label: string;
  action?: (() => void) | null;
  actionLabel?: string | null;
}

function ClubSetupChecklist({ club, blocks, events, hasConvocations, onDismiss, onEditPage, onCreateEvent, onManageRoster, onGoToMatches }: {
  club: Record<string, any>;
  blocks: Record<string, any>[];
  events: Record<string, any>[];
  hasConvocations?: boolean;
  onDismiss?: () => void;
  onEditPage?: () => void;
  onCreateEvent?: () => void;
  onManageRoster?: () => void;
  onGoToMatches?: () => void;
  onSendAnnouncement?: () => void;
  accentColor?: string;
}) {
  const hasBlocks = blocks.length > 0;
  const hasEvents = events.length > 0;
  const hasRoster = (club.members ?? club.players ?? 0) > 0;

  // Feuille de route club-first : l'effectif et la convocation d'abord (cœur du
  // métier), la page ensuite. Chaque étape ouvre directement l'action.
  const items: ChecklistItem[] = [
    { done: hasRoster,         label: 'Ajouter ton effectif',   action: onManageRoster, actionLabel: '👥 Effectif' },
    { done: hasEvents,         label: 'Créer ton 1ᵉʳ match',     action: onCreateEvent,  actionLabel: '📅 Match' },
    { done: !!hasConvocations, label: 'Convoquer tes joueurs',  action: onGoToMatches,  actionLabel: '📋 Convoquer' },
    { done: hasBlocks,         label: 'Personnaliser la page',  action: onEditPage,     actionLabel: '✏️ Page' },
  ];
  const done = items.filter(i => i.done).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: 14, borderRadius: 'var(--sl-radius-2xl)', border: '1px solid rgba(99,102,241,0.25)', backgroundColor: 'rgba(99,102,241,0.06)', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 6px' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1' }}>✅ Configuration — {done}/{items.length}</span>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sl-t3)', padding: '6px 8px', minHeight: 32, display: 'flex', alignItems: 'center' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div style={{ height: 3, backgroundColor: 'var(--sl-border)', margin: '0 12px 8px' }}>
        <div style={{ height: '100%', backgroundColor: '#6366f1', borderRadius: 'var(--sl-radius-xs)', width: `${pct}%`, transition: 'width 0.4s' }} />
      </div>
      <div style={{ padding: '0 10px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 'var(--sl-radius-md)', backgroundColor: item.done ? 'rgba(34,217,106,0.06)' : 'transparent' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, backgroundColor: item.done ? '#22d96a' : 'var(--sl-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.done && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: item.done ? 'var(--sl-t3)' : 'var(--sl-t1)', textDecoration: item.done ? 'line-through' : 'none' }}>
              {item.label}
            </span>
            {!item.done && item.action && (
              <button onClick={item.action} style={{ padding: '4px 8px', borderRadius: 'var(--sl-radius-sm)', border: '1px solid rgba(99,102,241,0.3)', backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                {item.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
