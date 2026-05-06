import { useState } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { SPORTS } from '../../data/events.js';
import { useClubPage } from '../../hooks/useClubPage.js';
import SportIcon from '../SportIcon.jsx';
import TitleBlock from './blocks/TitleBlock.jsx';
import TextBlock from './blocks/TextBlock.jsx';
import UpcomingEventsBlock from './blocks/UpcomingEventsBlock.jsx';
import TrainingBlock from './blocks/TrainingBlock.jsx';
import ImageBlock from './blocks/ImageBlock.jsx';
import MatchesBlock from './blocks/MatchesBlock.jsx';
import AddBlockMenu from './AddBlockMenu.jsx';

const BLOCK_LABELS = {
  title: 'Titre', text: 'Texte',
  'upcoming-events': 'Événements', training: 'Entraînements',
  image: 'Image', matches: 'Matchs',
};

// ── Span helpers ──────────────────────────────────────────────────────────────
const SPAN_OPTIONS = [
  { span: 12, label: '1/1' },
  { span: 6,  label: '1/2' },
  { span: 4,  label: '1/3' },
  { span: 8,  label: '2/3' },
];

function spanToFlex(span) {
  if (span === 4)  return '0 0 calc(33.33% - 8px)';
  if (span === 6)  return '0 0 calc(50% - 8px)';
  if (span === 8)  return '0 0 calc(66.67% - 8px)';
  return '1 1 100%';
}

function remainingSpanLabel(rem) {
  if (rem === 6)  return '1/2 restant';
  if (rem === 4)  return '1/3 restant';
  if (rem === 8)  return '2/3 restant';
  if (rem === 3)  return '1/4 restant';
  return `${rem}/12 restant`;
}

// Group consecutive blocks by rowId
function getRows(blocks) {
  const result = [];
  const seen   = new Map();
  for (const block of blocks) {
    const rid = block.rowId ?? block.id;
    if (!seen.has(rid)) {
      const row = { rowId: rid, blocks: [] };
      seen.set(rid, row);
      result.push(row);
    }
    seen.get(rid).blocks.push(block);
  }
  return result;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
);
const EyeOn = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const DragDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
  </svg>
);

// ── Block content renderer ────────────────────────────────────────────────────
function BlockContent({ block, isEditing, onUpdate, allEvents, club }) {
  return (
    <>
      {block.type === 'title'           && <TitleBlock           data={block.data} isEditing={isEditing} onUpdate={onUpdate} />}
      {block.type === 'text'            && <TextBlock            data={block.data} isEditing={isEditing} onUpdate={onUpdate} />}
      {block.type === 'upcoming-events' && <UpcomingEventsBlock  data={block.data} allEvents={allEvents} isEditing={isEditing} onUpdate={onUpdate} />}
      {block.type === 'training'        && <TrainingBlock        data={block.data} isEditing={isEditing} onUpdate={onUpdate} />}
      {block.type === 'image'           && <ImageBlock           data={block.data} isEditing={isEditing} onUpdate={onUpdate} />}
      {block.type === 'matches'         && <MatchesBlock         data={block.data} isEditing={isEditing} onUpdate={onUpdate} club={club} />}
    </>
  );
}

// ── Single block in edit mode ─────────────────────────────────────────────────
function EditBlock({ block, rowBlocks, isFirst, isLast, onUpdate, onDelete, onToggle, onSetSpan, onMoveLeft, onMoveRight, allEvents, club }) {
  const usedByOthers = rowBlocks.filter(b => b.id !== block.id).reduce((s, b) => s + (b.span ?? 12), 0);

  return (
    <div className={`flex flex-col border border-dashed rounded-2xl overflow-hidden ${!block.enabled ? 'opacity-40' : ''}`}
      style={{ flex: spanToFlex(block.span ?? 12), minWidth: 0, borderColor: '#e2e8f0', backgroundColor: 'white' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50 flex-wrap">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">
          {BLOCK_LABELS[block.type] ?? block.type}
        </span>

        {/* Span picker */}
        <div className="flex gap-0.5">
          {SPAN_OPTIONS.map(opt => {
            const wouldExceed = usedByOthers + opt.span > 12;
            return (
              <button key={opt.span} onClick={() => onSetSpan(opt.span)}
                disabled={wouldExceed}
                title={wouldExceed ? 'Pas assez de place dans cette ligne' : opt.label}
                className="text-[9px] px-1.5 py-0.5 rounded font-bold transition-colors disabled:opacity-30"
                style={(block.span ?? 12) === opt.span
                  ? { backgroundColor: '#0F1E3A', color: 'white' }
                  : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Move within row */}
        {rowBlocks.length > 1 && (
          <div className="flex">
            <button onClick={onMoveLeft} disabled={isFirst}
              className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={onMoveRight} disabled={isLast}
              className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}

        <button onClick={onToggle} className="p-1 text-gray-300 hover:text-gray-600 transition-colors">
          {block.enabled ? <EyeOn /> : <EyeOff />}
        </button>
        <button onClick={onDelete} className="p-1 text-red-300 hover:text-red-600 transition-colors">
          <TrashIcon />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1">
        <BlockContent block={block} isEditing={true} onUpdate={onUpdate} allEvents={allEvents} club={club} />
      </div>
    </div>
  );
}

// ── Empty slot placeholder ────────────────────────────────────────────────────
function EmptySlot({ remaining, onAdd }) {
  const [picking, setPicking] = useState(false);

  return (
    <div style={{ flex: spanToFlex(remaining), minWidth: 0 }}>
      {picking ? (
        <AddBlockMenu
          onAdd={type => { onAdd(type); setPicking(false); }}
          onCancel={() => setPicking(false)}
        />
      ) : (
        <button
          onClick={() => setPicking(true)}
          className="w-full h-full min-h-[80px] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-400 hover:bg-blue-50 transition-colors"
        >
          <PlusIcon />
          <span className="text-xs font-medium">{remainingSpanLabel(remaining)}</span>
        </button>
      )}
    </div>
  );
}

// ── Draggable row ─────────────────────────────────────────────────────────────
function DraggableRow({ row, isEditing, onUpdate, onDelete, onToggle, onSetSpan, onMoveLeft, onMoveRight, onAddToRow, allEvents, club }) {
  const dragControls = useDragControls();

  const usedSpan   = row.blocks.reduce((s, b) => s + (b.span ?? 12), 0);
  const remaining  = 12 - usedSpan;

  return (
    <Reorder.Item value={row} dragListener={false} dragControls={dragControls} as="div" className="mb-4">
      {isEditing && (
        /* Row drag handle */
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <div
            onPointerDown={e => { e.preventDefault(); dragControls.start(e); }}
            className="flex items-center gap-1 text-gray-300 hover:text-gray-500 transition-colors touch-none"
            style={{ cursor: 'grab' }}
          >
            <DragDots />
            <span className="text-[9px] font-bold uppercase tracking-wider">Ligne</span>
          </div>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
      )}

      {/* Blocks side by side */}
      <div className="flex gap-3 items-stretch flex-wrap">
        {row.blocks.map((block, blockIdx) => (
          isEditing ? (
            <EditBlock
              key={block.id}
              block={block}
              rowBlocks={row.blocks}
              isFirst={blockIdx === 0}
              isLast={blockIdx === row.blocks.length - 1}
              onUpdate={patch => onUpdate(block.id, patch)}
              onDelete={() => onDelete(block.id)}
              onToggle={() => onToggle(block.id)}
              onSetSpan={span => onSetSpan(block.id, span)}
              onMoveLeft={() => onMoveLeft(block.id)}
              onMoveRight={() => onMoveRight(block.id)}
              allEvents={allEvents}
              club={club}
            />
          ) : block.enabled ? (
            <div key={block.id} style={{ flex: spanToFlex(block.span ?? 12), minWidth: 0, marginBottom: 0 }}>
              <BlockContent block={block} isEditing={false} onUpdate={() => {}} allEvents={allEvents} club={club} />
            </div>
          ) : null
        ))}

        {/* Empty slot(s) when space remains */}
        {isEditing && remaining > 0 && remaining < 12 && (
          <EmptySlot remaining={remaining} onAdd={type => onAddToRow(row.rowId, type)} />
        )}
      </div>
    </Reorder.Item>
  );
}

function useMatchStats(blocks) {
  const matches = blocks
    .filter(b => b.type === 'matches')
    .flatMap(b => b.data?.matches ?? []);
  const played = matches.filter(m => m.date && new Date(m.date + 'T23:59:59') < new Date() && m.scoreHome !== null && m.scoreHome !== undefined);
  let W = 0, D = 0, L = 0;
  for (const m of played) {
    const h = Number(m.scoreHome), a = Number(m.scoreAway);
    if (h === a) { D++; continue; }
    const won = m.isHome ? h > a : a > h;
    won ? W++ : L++;
  }
  return { W, D, L, played: played.length };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ClubPageView({ club, allEvents, onBack }) {
  const {
    blocks, isEditing, setIsEditing,
    addBlock, addBlockToRow,
    updateBlock, setBlockSpan, moveBlockInRow,
    deleteBlock, reorderRows, toggleBlock,
  } = useClubPage(club);

  const [openMenuAfter, setOpenMenuAfter] = useState(null);
  const sportData = SPORTS[club.sport];
  const rows = getRows(blocks);
  const stats = useMatchStats(blocks);

  function handleAddBlock(type, afterRowId) {
    // Find the last block of that row to insert after
    const rowBlocks = blocks.filter(b => b.rowId === afterRowId);
    const lastId    = rowBlocks[rowBlocks.length - 1]?.id ?? null;
    addBlock(type, lastId);
    setOpenMenuAfter(null);
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      className="absolute inset-0 bg-gray-50 flex flex-col z-10"
    >
      {/* ── Header ── */}
      <div className="flex-shrink-0 relative text-white" style={{ backgroundColor: '#1e293b' }}>
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Clubs
          </button>
          <button
            onClick={() => { setIsEditing(e => !e); setOpenMenuAfter(null); }}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
              isEditing ? 'bg-green-500 text-white hover:bg-green-400' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
            }`}
          >
            {isEditing
              ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Terminé</>
              : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg> Modifier</>
            }
          </button>
        </div>

        <div className="px-4 pb-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-white text-base font-oswald flex-shrink-0"
            style={{ backgroundColor: club.logo ? 'transparent' : (sportData?.color ?? '#64748b') }}>
            {club.logo
              ? <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
              : club.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 3)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold font-oswald tracking-wide leading-tight">{club.name}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-slate-300 text-sm">
              <SportIcon sport={club.sport} size={13} color="#cbd5e1" />
              <span>{club.sport}</span>
              <span className="text-slate-500">·</span>
              <span>{club.city}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{club.level}</span>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{club.members} membres</span>
              {club.contact && (
                <a href={`mailto:${club.contact}`} className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full hover:bg-slate-600 transition-colors">
                  Contacter
                </a>
              )}
              {stats.played > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: '#1e3a5f', color: '#94a3b8' }}>
                  <span style={{ color: '#22C55E' }}>{stats.W}V</span>
                  <span>·</span>
                  <span style={{ color: '#f59e0b' }}>{stats.D}N</span>
                  <span>·</span>
                  <span style={{ color: '#ef4444' }}>{stats.L}D</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="px-4 py-2 bg-amber-500 text-white text-xs font-medium flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Glissez ⠿ pour réordonner les lignes · Réduisez un bloc pour placer du contenu à côté
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5">

        {/* Rows */}
        <Reorder.Group
          axis="y"
          values={rows}
          onReorder={reorderRows}
          as="div"
        >
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
                allEvents={allEvents ?? []}
                club={club}
              />

              {/* Add new row after this one */}
              {isEditing && (
                <AnimatePresence>
                  {openMenuAfter === row.rowId ? (
                    <AddBlockMenu
                      key={`menu-${row.rowId}`}
                      onAdd={type => handleAddBlock(type, row.rowId)}
                      onCancel={() => setOpenMenuAfter(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setOpenMenuAfter(row.rowId)}
                      className="flex items-center justify-center gap-1 w-full mb-3 py-1.5 text-xs text-gray-300 hover:text-slate-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <PlusIcon /> Ajouter une ligne ici
                    </button>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </Reorder.Group>

        {/* Empty state */}
        {blocks.length === 0 && isEditing && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-sm mb-4">Page vide — ajoutez votre premier bloc</p>
            <button onClick={() => addBlock('title', null)}
              className="px-4 py-2 bg-slate-800 text-white text-sm rounded-xl hover:bg-slate-700 transition-colors">
              + Ajouter un bloc
            </button>
          </div>
        )}

        {/* Add at the very end */}
        {isEditing && blocks.length > 0 && openMenuAfter === null && (
          <button onClick={() => setOpenMenuAfter('__end__')}
            className="flex items-center justify-center gap-2 w-full py-3 mt-1 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-slate-400 hover:text-slate-600 transition-colors">
            <PlusIcon /> Ajouter un bloc à la fin
          </button>
        )}
        <AnimatePresence>
          {openMenuAfter === '__end__' && (
            <AddBlockMenu
              onAdd={type => { addBlock(type, null); setOpenMenuAfter(null); }}
              onCancel={() => setOpenMenuAfter(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
