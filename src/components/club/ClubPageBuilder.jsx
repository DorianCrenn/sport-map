/**
 * ClubPageBuilder — Rendu + édition des blocs de page club.
 * Contient : BlockContent, EditBlock, EmptySlot, DraggableRow, getRows.
 * Extrait de ClubPageView.jsx.
 */
import { useState, useEffect } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { FONT_OPTIONS, injectGoogleFont } from '../../hooks/useClubPage.js';
import TitleBlock from './blocks/TitleBlock.jsx';
import TextBlock from './blocks/TextBlock.jsx';
import UpcomingEventsBlock from './blocks/UpcomingEventsBlock.jsx';
import TrainingBlock from './blocks/TrainingBlock.jsx';
import ImageBlock from './blocks/ImageBlock.jsx';
import MatchesBlock from './blocks/MatchesBlock.jsx';
import { AboutBlockEditor, AboutBlockView } from './blocks/AboutBlock.jsx';
import { GalleryBlockEditor, GalleryBlockView } from './blocks/GalleryBlock.jsx';
import { SponsorsBlockView, SponsorsBlockEditor } from './blocks/SponsorsBlock.jsx';
import NextMatchBlock from './blocks/NextMatchBlock.jsx';
import RosterBlock from './blocks/RosterBlock.jsx';
import AddBlockMenu from './AddBlockMenu.jsx';

// ── Constantes ────────────────────────────────────────────────────────────────

const BLOCK_LABELS = {
  title: 'Titre', text: 'Texte',
  'upcoming-events': 'Événements', training: 'Entraînements',
  image: 'Image', matches: 'Matchs', about: 'À propos', gallery: 'Galerie',
  sponsors: 'Sponsors', 'next-match': 'Prochain match', roster: 'Effectif',
};

const SPAN_OPTIONS = [
  { span: 12, label: '1/1' },
  { span: 6,  label: '1/2' },
  { span: 4,  label: '1/3' },
  { span: 8,  label: '2/3' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function spanToFlex(span) {
  if (span === 4) return '0 0 calc(33.33% - 8px)';
  if (span === 6) return '0 0 calc(50% - 8px)';
  if (span === 8) return '0 0 calc(66.67% - 8px)';
  return '1 1 100%';
}

export function remainingSpanLabel(rem) {
  if (rem === 6) return '1/2 restant';
  if (rem === 4) return '1/3 restant';
  if (rem === 8) return '2/3 restant';
  if (rem === 3) return '1/4 restant';
  return `${rem}/12 restant`;
}

export function getRows(blocks) {
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
export const PlusIcon = () => (
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

// ── FontInjector ──────────────────────────────────────────────────────────────

function FontInjector({ font }) {
  useEffect(() => { if (font) injectGoogleFont(font); }, [font]);
  return null;
}

// ── BlockContent ──────────────────────────────────────────────────────────────

export function BlockContent({ block, isEditing, onUpdate, allEvents, club, currentUser }) {
  return (
    <>
      {block.type === 'title'           && <TitleBlock           data={block.data} isEditing={isEditing} onUpdate={onUpdate} />}
      {block.type === 'text'            && <TextBlock            data={block.data} isEditing={isEditing} onUpdate={onUpdate} />}
      {block.type === 'upcoming-events' && <UpcomingEventsBlock  data={block.data} allEvents={allEvents} club={club} isEditing={isEditing} onUpdate={onUpdate} />}
      {block.type === 'training'        && <TrainingBlock        data={block.data} isEditing={isEditing} onUpdate={onUpdate} />}
      {block.type === 'image'           && <ImageBlock           data={block.data} isEditing={isEditing} onUpdate={onUpdate} />}
      {block.type === 'matches'         && <MatchesBlock         data={block.data} isEditing={isEditing} onUpdate={patch => onUpdate(patch)} club={club} allEvents={allEvents} />}
      {block.type === 'about'           && (isEditing
        ? <AboutBlockEditor block={block} onChange={updated => onUpdate(updated.data)} />
        : <AboutBlockView   block={block} />
      )}
      {block.type === 'gallery'         && (isEditing
        ? <GalleryBlockEditor block={block} onChange={data => onUpdate(data)} />
        : <GalleryBlockView   block={block} />
      )}
      {block.type === 'sponsors'        && (isEditing
        ? <SponsorsBlockEditor block={block} onChange={data => onUpdate(data)} />
        : <SponsorsBlockView   block={block} clubId={club?.id} />
      )}
      {block.type === 'next-match'      && <NextMatchBlock data={block.data} allEvents={allEvents} club={club} />}
      {block.type === 'roster'          && <RosterBlock data={block.data} clubId={club.id} currentUser={currentUser} />}
    </>
  );
}

// ── EditBlock ─────────────────────────────────────────────────────────────────

function EditBlock({ block, rowBlocks, isFirst, isLast, onUpdate, onDelete, onToggle, onSetSpan, onMoveLeft, onMoveRight, allEvents, club }) {
  const usedByOthers = rowBlocks.filter(b => b.id !== block.id).reduce((s, b) => s + (b.span ?? 12), 0);

  return (
    <div
      className={`flex flex-col rounded-2xl overflow-hidden transition-opacity ${!block.enabled ? 'opacity-40' : ''}`}
      style={{ flex: spanToFlex(block.span ?? 12), minWidth: 0, border: '1.5px dashed var(--sl-border-s)', backgroundColor: 'var(--sl-card)' }}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 flex-wrap" style={{ borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)' }}>
        <span className="text-[10px] font-bold uppercase tracking-wider mr-1" style={{ color: 'var(--sl-t3)' }}>
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
                className="text-[9px] px-1.5 py-0.5 rounded font-bold transition-colors disabled:opacity-30 cursor-pointer"
                style={(block.span ?? 12) === opt.span
                  ? { backgroundColor: '#0F1E3A', color: 'white' }
                  : { backgroundColor: 'var(--sl-bg)', color: 'var(--sl-t3)' }}>
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Font picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 2 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--sl-t3)', letterSpacing: '0.04em', userSelect: 'none' }}>Aa</span>
          <select
            value={block.data?.font ?? ''}
            onChange={e => {
              const font = e.target.value || null;
              if (font) injectGoogleFont(font);
              onUpdate({ font });
            }}
            title="Police du bloc"
            style={{
              fontSize: 10, fontWeight: 600,
              fontFamily: block.data?.font ? `'${block.data.font}', sans-serif` : undefined,
              backgroundColor: 'var(--sl-bg)',
              color: block.data?.font ? 'var(--sl-t1)' : 'var(--sl-t3)',
              border: `1px solid ${block.data?.font ? 'var(--sl-green)' : 'var(--sl-border)'}`,
              borderRadius: 6, padding: '2px 4px', cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="">Auto</option>
            {FONT_OPTIONS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>

        {/* Text color picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 1 }}>
          <label title="Couleur du texte" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
            <div style={{
              width: 13, height: 13, borderRadius: 3,
              background: block.data?.color || 'var(--sl-t1)',
              border: `1.5px solid ${block.data?.color ? 'var(--sl-green)' : 'var(--sl-border)'}`,
              flexShrink: 0,
            }} />
            <input
              type="color"
              value={block.data?.color || '#deeeff'}
              onChange={e => onUpdate({ color: e.target.value })}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
              tabIndex={-1}
            />
          </label>
          {block.data?.color && (
            <button onClick={() => onUpdate({ color: null })} title="Réinitialiser la couleur"
              style={{ fontSize: 10, lineHeight: 1, color: 'var(--sl-t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>×</button>
          )}
        </div>

        <div className="flex-1" />

        {/* Move within row */}
        {rowBlocks.length > 1 && (
          <div className="flex">
            <button onClick={onMoveLeft} disabled={isFirst} aria-label="Déplacer le bloc à gauche"
              className="p-1 transition-colors cursor-pointer disabled:opacity-20" style={{ color: 'var(--sl-t3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={onMoveRight} disabled={isLast} aria-label="Déplacer le bloc à droite"
              className="p-1 transition-colors cursor-pointer disabled:opacity-20" style={{ color: 'var(--sl-t3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}

        <button onClick={onToggle} aria-label={block.enabled ? 'Masquer le bloc' : 'Afficher le bloc'} aria-pressed={block.enabled}
          className="p-1 transition-colors cursor-pointer" style={{ color: 'var(--sl-t3)' }}>
          {block.enabled ? <EyeOn /> : <EyeOff />}
        </button>
        <button onClick={onDelete} aria-label="Supprimer le bloc"
          className="p-1 transition-colors cursor-pointer" style={{ color: '#ef4444' }}>
          <TrashIcon />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1" style={{ fontFamily: block.data?.font ? `'${block.data.font}', sans-serif` : undefined }}>
        <FontInjector font={block.data?.font} />
        <BlockContent block={block} isEditing={true} onUpdate={onUpdate} allEvents={allEvents} club={club} currentUser={undefined} />
      </div>
    </div>
  );
}

// ── EmptySlot ─────────────────────────────────────────────────────────────────

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
          className="w-full h-full min-h-[80px] flex flex-col items-center justify-center gap-2 rounded-2xl transition-colors cursor-pointer"
          style={{ border: '2px dashed var(--sl-border-s)', color: 'var(--sl-t3)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sl-border-s)'; e.currentTarget.style.color = 'var(--sl-t3)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <PlusIcon />
          <span className="text-xs font-medium">{remainingSpanLabel(remaining)}</span>
        </button>
      )}
    </div>
  );
}

// ── DraggableRow ──────────────────────────────────────────────────────────────

export function DraggableRow({ row, isEditing, onUpdate, onDelete, onToggle, onSetSpan, onMoveLeft, onMoveRight, onAddToRow, allEvents, club, currentUser }) {
  const dragControls = useDragControls();
  const usedSpan     = row.blocks.reduce((s, b) => s + (b.span ?? 12), 0);
  const remaining    = 12 - usedSpan;

  return (
    <Reorder.Item value={row} dragListener={false} dragControls={dragControls} as="div" className="mb-4">
      {isEditing && (
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <div
            onPointerDown={e => { e.preventDefault(); dragControls.start(e); }}
            className="flex items-center gap-1 transition-colors touch-none cursor-grab"
            style={{ color: 'var(--sl-t3)' }}
          >
            <DragDots />
            <span className="text-[9px] font-bold uppercase tracking-wider">Ligne</span>
          </div>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--sl-border)' }} />
        </div>
      )}

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
            <div key={block.id} style={{ flex: spanToFlex(block.span ?? 12), minWidth: 0, fontFamily: block.data?.font ? `'${block.data.font}', sans-serif` : undefined }}>
              <FontInjector font={block.data?.font} />
              <BlockContent block={block} isEditing={false} onUpdate={() => {}} allEvents={allEvents} club={club} currentUser={currentUser} />
            </div>
          ) : null
        ))}

        {isEditing && remaining > 0 && remaining < 12 && (
          <EmptySlot remaining={remaining} onAdd={type => onAddToRow(row.rowId, type)} />
        )}
      </div>
    </Reorder.Item>
  );
}
