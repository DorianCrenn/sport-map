import { useState, useEffect, useMemo, useRef } from 'react';
import { useDynamicMeta } from '../../hooks/useDynamicMeta.js';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { useSports } from '../../hooks/useSports.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useClubPage, useClubAnalytics, FONT_OPTIONS, injectGoogleFont, HERO_STYLE_OPTIONS, getHeroBackground } from '../../hooks/useClubPage.js';
import { supabase } from '../../lib/supabase.js';
import SportIcon from '../SportIcon.jsx';
import FollowModal from '../FollowModal.jsx';
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
import AddBlockMenu from './AddBlockMenu.jsx';
import ClubManagersPanel from './ClubManagersPanel.jsx';
import ClubDashboard from './ClubDashboard.jsx';
import SendAnnouncementModal from './SendAnnouncementModal.jsx';
import { useClubAnnouncements } from '../../hooks/useClubAnnouncements.js';
import ClubFormModal from './ClubFormModal.jsx';
import EventFormModal from '../EventFormModal.jsx';
import PosterStudio from '../PosterStudio.jsx';
import { downloadClubICS } from '../../utils/exportICS.js';
import { useClubManagers } from '../../hooks/useClubManagers.js';
import { useClubTrainings } from '../../hooks/useClubTrainings.js';
import { useShare } from '../../hooks/useShare.js';

const BLOCK_LABELS = {
  title: 'Titre', text: 'Texte',
  'upcoming-events': 'Événements', training: 'Entraînements',
  image: 'Image', matches: 'Matchs', about: 'À propos', gallery: 'Galerie',
  sponsors: 'Sponsors', 'next-match': 'Prochain match',
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

// ── Font injector — side-effect only, renders nothing ────────────────────────
function FontInjector({ font }) {
  useEffect(() => { if (font) injectGoogleFont(font); }, [font]);
  return null;
}

// ── Block content renderer ────────────────────────────────────────────────────
function BlockContent({ block, isEditing, onUpdate, allEvents, club }) {
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
        : <SponsorsBlockView   block={block} />
      )}
      {block.type === 'next-match'      && <NextMatchBlock data={block.data} allEvents={allEvents} club={club} />}
    </>
  );
}

// ── Single block in edit mode ─────────────────────────────────────────────────
function EditBlock({ block, rowBlocks, isFirst, isLast, onUpdate, onDelete, onToggle, onSetSpan, onMoveLeft, onMoveRight, allEvents, club }) {
  const usedByOthers = rowBlocks.filter(b => b.id !== block.id).reduce((s, b) => s + (b.span ?? 12), 0);

  return (
    <div
      className={`flex flex-col rounded-2xl overflow-hidden transition-opacity ${!block.enabled ? 'opacity-40' : ''}`}
      style={{
        flex: spanToFlex(block.span ?? 12),
        minWidth: 0,
        border: '1.5px dashed var(--sl-border-s)',
        backgroundColor: 'var(--sl-card)',
      }}
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
            {FONT_OPTIONS.map(f => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1" />

        {/* Move within row */}
        {rowBlocks.length > 1 && (
          <div className="flex">
            <button onClick={onMoveLeft} disabled={isFirst} aria-label="Déplacer le bloc à gauche"
              className="p-1 transition-colors cursor-pointer disabled:opacity-20"
              style={{ color: 'var(--sl-t3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={onMoveRight} disabled={isLast} aria-label="Déplacer le bloc à droite"
              className="p-1 transition-colors cursor-pointer disabled:opacity-20"
              style={{ color: 'var(--sl-t3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}

        <button onClick={onToggle} aria-label={block.enabled ? 'Masquer le bloc' : 'Afficher le bloc'} aria-pressed={block.enabled} className="p-1 transition-colors cursor-pointer" style={{ color: 'var(--sl-t3)' }}>
          {block.enabled ? <EyeOn /> : <EyeOff />}
        </button>
        <button onClick={onDelete} aria-label="Supprimer le bloc" className="p-1 transition-colors cursor-pointer" style={{ color: '#ef4444' }}>
          <TrashIcon />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1" style={{ fontFamily: block.data?.font ? `'${block.data.font}', sans-serif` : undefined }}>
        <FontInjector font={block.data?.font} />
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
          className="w-full h-full min-h-[80px] flex flex-col items-center justify-center gap-2 rounded-2xl transition-colors cursor-pointer"
          style={{ border: '2px dashed var(--sl-border-s)', color: 'var(--sl-t3)' }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.color = '#3b82f6';
            e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--sl-border-s)';
            e.currentTarget.style.color = 'var(--sl-t3)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
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
            <div key={block.id} style={{ flex: spanToFlex(block.span ?? 12), minWidth: 0, marginBottom: 0, fontFamily: block.data?.font ? `'${block.data.font}', sans-serif` : undefined }}>
              <FontInjector font={block.data?.font} />
              <BlockContent block={block} isEditing={false} onUpdate={() => {}} allEvents={allEvents} club={club} />
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

// ── Simple mode editor ────────────────────────────────────────────────────────
const SIMPLE_PRESETS = [
  {
    type: 'upcoming-events',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    ),
    label: 'Prochains événements',
    desc: 'Liste automatique des matchs à venir',
  },
  {
    type: 'matches',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8l2.47 5h5.27l-4.27 3.1 1.64 5.02L12 18.12l-5.1 3L8.53 16.1 4.26 13h5.27L12 8z"/></svg>
    ),
    label: 'Résultats & calendrier',
    desc: 'Scores V/N/D et prochains matchs',
  },
  {
    type: 'about',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    ),
    label: 'À propos du club',
    desc: 'Description, adresse, contacts, tarifs',
  },
  {
    type: 'training',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
    label: "Créneaux d'entraînement",
    desc: 'Horaires hebdomadaires par équipe',
  },
  {
    type: 'image',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    ),
    label: 'Photo',
    desc: 'Image ou photo du club',
  },
  {
    type: 'sponsors',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
    ),
    label: 'Sponsors',
    desc: 'Logos et liens de vos partenaires',
  },
];

function SimpleModeEditor({ blocks, onAddBlock, onAdvanced, accentColor }) {
  const existingTypes = new Set(blocks.map(b => b.type));

  return (
    <div className="px-4 py-6">
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 4 }}>Construisez votre page en un clic</div>
        <div style={{ fontSize: 12, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
          Ajoutez les sections essentielles. Chaque section sera visible sur la page publique de votre club.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SIMPLE_PRESETS.map(preset => {
          const added = existingTypes.has(preset.type);
          return (
            <button
              key={preset.type}
              type="button"
              onClick={() => { if (!added) onAddBlock(preset.type); }}
              disabled={added}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderRadius: 16, textAlign: 'left', cursor: added ? 'default' : 'pointer',
                border: `1.5px solid ${added ? 'var(--sl-green)' : 'var(--sl-border)'}`,
                backgroundColor: added ? 'var(--sl-green-dim)' : 'var(--sl-card)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!added) { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.backgroundColor = 'var(--sl-surface)'; } }}
              onMouseLeave={e => { if (!added) { e.currentTarget.style.borderColor = 'var(--sl-border)'; e.currentTarget.style.backgroundColor = 'var(--sl-card)'; } }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: added ? 'rgba(34,197,94,0.15)' : 'var(--sl-surface)',
                color: added ? 'var(--sl-green)' : 'var(--sl-t2)',
              }}>
                {added
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : preset.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: added ? 'var(--sl-green)' : 'var(--sl-t1)', marginBottom: 2 }}>{preset.label}</div>
                <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{preset.desc}</div>
              </div>
              {!added && (
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--sl-t3)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAdvanced}
        style={{
          display: 'block', width: '100%', marginTop: 20, padding: '13px',
          borderRadius: 14, border: '1px solid var(--sl-border)',
          backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
        }}
      >
        Passer en mode Avancé →
      </button>
    </div>
  );
}

// ── Training calendar generator ───────────────────────────────────────────────
const DAY_IDX = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 0 };

function TrainingCalendarGenerator({ sessions, club, team, onGenerate }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo]   = useState('');

  if (!sessions.length || !onGenerate) return null;

  function countOccurrences() {
    if (!from || !to) return 0;
    let n = 0;
    const toDate = new Date(to + 'T23:59:59');
    for (const s of sessions) {
      let cur = new Date(from);
      while (cur.getDay() !== DAY_IDX[s.day] && cur <= toDate) cur.setDate(cur.getDate() + 1);
      while (cur <= toDate && n < 200) { n++; cur = new Date(cur.getTime() + 7 * 86400000); }
    }
    return n;
  }

  function generate() {
    if (!from || !to) return;
    const toDate  = new Date(to + 'T23:59:59');
    const events  = [];
    const base    = `training_${team.id}_${Date.now()}`;
    for (const s of sessions) {
      let cur = new Date(from);
      while (cur.getDay() !== DAY_IDX[s.day] && cur <= toDate) cur.setDate(cur.getDate() + 1);
      while (cur <= toDate && events.length < 200) {
        events.push({
          title: `Entraînement ${team.name}`,
          sport: club.sport, sportGroup: club.sport,
          date: `${cur.toISOString().slice(0, 10)}T${s.time}:00`,
          city: club.city ?? '', lat: club.lat ?? 48.3904, lng: club.lng ?? -4.4861,
          venue: s.location, description: `Entraînement — ${team.name}`,
          eventType: 'friendly',
          teamName: team.name, category: team.category ?? '',
          clubId: club.id, seriesId: `${base}_${s.id}`,
        });
        cur = new Date(cur.getTime() + 7 * 86400000);
      }
    }
    onGenerate(events);
    setOpen(false); setFrom(''); setTo('');
  }

  const count = countOccurrences();
  const inputSt = { width: '100%', boxSizing: 'border-box', borderRadius: 10, padding: '8px 10px', fontSize: 12, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)', color: 'var(--sl-t1)', colorScheme: 'dark', outline: 'none' };

  return (
    <div style={{ marginTop: 8, borderRadius: 14, border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: open ? 'rgba(59,130,246,0.08)' : 'var(--sl-surface)', border: 'none', cursor: 'pointer', color: open ? '#3b82f6' : 'var(--sl-t2)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Générer dans le calendrier</span>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: 0 }}>
                Crée automatiquement un événement d'entraînement par créneau, chaque semaine, dans la plage choisie.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 4 }}>Du</label>
                  <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputSt} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 4 }}>Au</label>
                  <input type="date" value={to} onChange={e => setTo(e.target.value)} min={from || undefined} style={inputSt} />
                </div>
              </div>
              {from && to && (
                <p style={{ fontSize: 11, fontWeight: 600, margin: 0, color: count > 0 ? '#3b82f6' : 'var(--sl-t3)' }}>
                  {count > 0 ? `${count} entraînement${count > 1 ? 's' : ''} seront créés` : 'Aucun créneau dans cette plage'}
                </p>
              )}
              <button
                disabled={count === 0}
                onClick={generate}
                style={{ padding: '9px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, transition: 'all 0.15s', cursor: count > 0 ? 'pointer' : 'not-allowed', backgroundColor: count > 0 ? '#3b82f6' : 'var(--sl-border)', color: count > 0 ? '#fff' : 'var(--sl-t3)' }}
              >
                {count > 0 ? `Créer ${count} entraînement${count > 1 ? 's' : ''}` : 'Sélectionnez une plage'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Team training section ─────────────────────────────────────────────────────
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const BLANK_TR = { id: '', day: 'Lundi', time: '18:00', location: '' };

function TeamTrainingSection({ sessions, isEditing, onChange }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_TR);
  function setF(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function add() {
    if (!form.location.trim()) return;
    onChange([...sessions, { ...form, id: `tr_${Date.now()}` }]);
    setForm(BLANK_TR);
    setShowForm(false);
  }

  function remove(id) {
    onChange(sessions.filter(s => s.id !== id));
  }

  const inputCls = 'w-full text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400/40';
  const inputStyle = { backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)', color: 'var(--sl-t1)' };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--sl-t3)' }}>Entraînements</span>
        {sessions.length > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
            {sessions.length}
          </span>
        )}
      </div>

      {sessions.length === 0 && !showForm && (
        <p className="text-xs italic text-center py-4 rounded-xl mb-3" style={{ color: 'var(--sl-t3)', border: '2px dashed var(--sl-border)' }}>
          {isEditing ? "Ajoutez les créneaux d'entraînement" : 'Aucun entraînement planifié'}
        </p>
      )}

      {sessions.length > 0 && (
        <div className="space-y-2 mb-3">
          {sessions.map(s => (
            <div key={s.id} className="rounded-xl px-3 py-2.5 flex items-center gap-3"
              style={{ backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', boxShadow: 'var(--sl-shadow)' }}>
              <div className="w-10 text-center flex-shrink-0">
                <div className="text-[9px] font-bold uppercase leading-none" style={{ color: 'var(--sl-t3)' }}>{s.day.slice(0, 3)}</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--sl-t1)' }}>{s.time}</div>
              </div>
              <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: 'var(--sl-border)' }} />
              <div className="flex-1 text-sm truncate" style={{ color: 'var(--sl-t2)' }}>{s.location}</div>
              {isEditing && (
                <button onClick={() => remove(s.id)} aria-label="Supprimer ce créneau"
                  className="p-1.5 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--sl-t3)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--sl-t3)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isEditing && showForm && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="rounded-2xl p-3 space-y-2 mb-3"
            style={{ border: '1px solid rgba(59,130,246,0.3)', backgroundColor: 'rgba(59,130,246,0.06)' }}
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--sl-t3)' }}>Jour</label>
                <select value={form.day} onChange={e => setF('day', e.target.value)} className={inputCls} style={inputStyle}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--sl-t3)' }}>Heure</label>
                <input type="time" value={form.time} onChange={e => setF('time', e.target.value)} className={inputCls} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--sl-t3)' }}>Lieu *</label>
              <input type="text" value={form.location} onChange={e => setF('location', e.target.value)}
                placeholder="ex. Gymnase Jean Macé" className={inputCls} style={inputStyle} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setShowForm(false); setForm(BLANK_TR); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                style={{ border: '1px solid var(--sl-border-s)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)' }}>
                Annuler
              </button>
              <button onClick={add}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
                style={{ backgroundColor: '#3b82f6' }}>
                Ajouter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isEditing && !showForm && (
        <button onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
          style={{ border: '2px dashed var(--sl-border)', color: 'var(--sl-t3)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sl-border)'; e.currentTarget.style.color = 'var(--sl-t3)'; }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajouter un créneau
        </button>
      )}
    </div>
  );
}

// ── Team view ─────────────────────────────────────────────────────────────────
function TeamView({ team, blocks, isEditing, updateBlock, addBlock, club, allEvents, trainings, onUpdateTrainings, onAddEventForTeam, canAddEvent, onBulkAddTrainingEvents }) {
  const matchesBlock = blocks.find(b => b.type === 'matches');
  const teamSessions = trainings[team.id] ?? [];

  function updateSessions(sessions) {
    onUpdateTrainings({ ...trainings, [team.id]: sessions });
  }

  return (
    <div className="px-4 py-5 space-y-6">
      {/* Team event creation */}
      {canAddEvent && onAddEventForTeam && (
        <button
          onClick={() => onAddEventForTeam(team)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer"
          style={{ backgroundColor: '#1e293b', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajouter un événement pour {team.name}
        </button>
      )}

      <TeamTrainingSection sessions={teamSessions} isEditing={isEditing} onChange={updateSessions} />
      {!isEditing && (
        <TrainingCalendarGenerator sessions={teamSessions} club={club} team={team} onGenerate={onBulkAddTrainingEvents} />
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--sl-t3)' }}>Matchs</span>
        </div>
        {matchesBlock ? (
          <MatchesBlock
            data={matchesBlock.data}
            isEditing={isEditing}
            onUpdate={patch => updateBlock(matchesBlock.id, patch)}
            club={club}
            filterTeamId={team.id}
            allEvents={allEvents}
          />
        ) : isEditing ? (
          <button onClick={() => addBlock('matches', null)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-xs transition-colors cursor-pointer"
            style={{ border: '2px dashed var(--sl-border)', color: 'var(--sl-t3)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.color = '#22C55E'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sl-border)'; e.currentTarget.style.color = 'var(--sl-t3)'; }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Activer les matchs pour ce club
          </button>
        ) : (
          <p className="text-xs italic text-center py-6 rounded-2xl" style={{ color: 'var(--sl-t3)', border: '2px dashed var(--sl-border)' }}>
            Aucun match enregistré
          </p>
        )}
      </div>
    </div>
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

function usePendingResults(blocks) {
  return useMemo(() => {
    const now = new Date();
    return blocks
      .filter(b => b.type === 'matches')
      .flatMap(b => b.data?.matches ?? [])
      .filter(m => m.date && new Date(m.date + 'T23:59:59') < now && (m.scoreHome === null || m.scoreHome === undefined)).length;
  }, [blocks]);
}

function PendingResultsBanner({ count, isEditing }) {
  if (!isEditing || count === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 mb-0 rounded-2xl px-4 py-3 flex items-center gap-3 border"
      style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderColor: '#fcd34d' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p className="text-xs font-semibold flex-1" style={{ color: '#92400e' }}>
        {count} match{count > 1 ? 's' : ''} passé{count > 1 ? 's' : ''} sans score — pensez à les saisir !
      </p>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ClubPageView({ club, allEvents, onBack, onAddEvent, canAddEvent: canAddEventProp, onUpdateClub }) {
  const { allSports: SPORTS } = useSports();
  const { isAdmin, isClubAdmin, currentUser, isLoggedIn, follows, followClub, unfollowClub, updateFollow, isFollowingClub, getFollow } = useAuth();
  const { share } = useShare();
  const canAddEvent = canAddEventProp ?? (isAdmin || isClubAdmin);
  const isOwner = isAdmin || (isClubAdmin && currentUser?.clubId === club.id);
  const { managers, addManager, removeManager, isManager } = useClubManagers(club.id);
  const canEdit = isOwner || isManager(currentUser?.email);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const isFollowing = isFollowingClub(club.id);
  const currentFollow = getFollow(club.id);

  const pageViews = useClubAnalytics(club.id);

  const {
    blocks, isEditing, setIsEditing,
    addBlock, addBlockToRow,
    updateBlock, setBlockSpan, moveBlockInRow,
    deleteBlock, reorderRows, toggleBlock,
    typography, setTypography,
    theme, setTheme,
  } = useClubPage(club);

  const [openMenuAfter, setOpenMenuAfter] = useState(null);
  const [simpleMode, setSimpleMode]   = useState(() => blocks.length === 0);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [showManagersPanel, setShowManagersPanel] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const tabBarRef = useRef(null);

  // Auto-scroll active tab into view when switching teams
  useEffect(() => {
    const container = tabBarRef.current;
    if (!container) return;
    const active = container.querySelector('[data-active="true"]');
    active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTeamId]);

  const { sendAnnouncement } = useClubAnnouncements(canEdit ? club.id : null);
  const [teamEventModal, setTeamEventModal] = useState(undefined); // undefined=closed
  const [showPoster, setShowPoster] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showEditInfo, setShowEditInfo]     = useState(false);

  async function handleShareClub() {
    const url = `${window.location.origin}${window.location.pathname}#club/${club.id}`;
    const result = await share({
      title: club.name,
      text: `${club.name} — ${club.city}`,
      url,
    });
    if (result.success) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2200);
    }
  }

  const [teamTrainings, setTeamTrainings] = useClubTrainings(club.id);

  useEffect(() => {
    if (!canEdit && isEditing) setIsEditing(false);
  }, [canEdit, isEditing, setIsEditing]);

  // Track page view to Supabase — throttled to 1 per session per club
  useEffect(() => {
    const sessionKey = `cpv_${club.id}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');
    supabase
      .from('club_page_views')
      .insert({ club_id: String(club.id), user_id: currentUser?.id ?? null, session_id: sessionKey })
      .then(({ error }) => {
        if (error) console.warn('[ClubPageView] view track failed:', error.message);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club.id]);

  // OpenGraph / document title via hook centralisé
  const clubUrl = `${window.location.origin}${window.location.pathname}#club/${club.id}`;
  const clubDesc = club.description || `${club.name} — club de ${club.sport}${club.city ? ` à ${club.city}` : ''}`;
  useDynamicMeta({
    title:       club.name,
    description: clubDesc,
    image:       club.logo_url || undefined,
    url:         clubUrl,
  });

  const clubEventIds = useMemo(
    () => (allEvents ?? []).filter(e => String(e.clubId) === String(club.id)).map(e => e.id),
    [allEvents, club.id]
  );

  const allTeams = useMemo(
    () => (club.categories ?? []).flatMap(c => c.teams ?? []),
    [club.categories]
  );

  const activeTeam = allTeams.find(t => t.id === activeTeamId) ?? null;
  const sportData = SPORTS[club.sport];
  const accentColor = theme.accent ?? sportData?.color ?? '#22C55E';

  const posterEvent = useMemo(() => {
    const now = new Date();
    const next = (allEvents ?? [])
      .filter(e => e.clubId === club.id && new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    if (next) return next;
    return {
      id: `club-poster-${club.id}`,
      sport: club.sport,
      title: club.name,
      date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      city: club.city,
      eventType: 'friendly',
    };
  }, [allEvents, club]);
  const rows = getRows(blocks);
  const stats = useMatchStats(blocks);
  const pendingCount = usePendingResults(blocks);

  function handleAddBlock(type, afterRowId) {
    const rowBlocks = blocks.filter(b => b.rowId === afterRowId);
    const lastId    = rowBlocks[rowBlocks.length - 1]?.id ?? null;
    addBlock(type, lastId);
    setOpenMenuAfter(null);
  }

  function handleAddEventForTeam(team) {
    const parentCat = (club.categories ?? []).find(cat =>
      cat.teams?.some(t => t.id === team.id)
    );
    setTeamEventModal({
      _isNew: true,
      defaultTeam:     team.name,
      defaultCategory: parentCat?.name ?? team.category ?? '',
      defaultLevel:    team.level ?? '',
      defaultSport:    club.sport,
      defaultCity:     club.city,
      defaultHomeOrAway: 'home',
    });
  }

  function handleTeamEventSave(formData) {
    if (onAddEvent) onAddEvent({ ...formData, clubId: club.id });
    setTeamEventModal(undefined);
  }

  async function handleBulkTeamEventSave(events) {
    if (onAddEvent) for (const ev of events) await onAddEvent({ ...ev, clubId: club.id });
    setTeamEventModal(undefined);
  }

  function handleExportICS() {
    const now = new Date();
    const upcoming = (allEvents ?? []).filter(e => e.clubId === club.id && new Date(e.date) >= now);
    downloadClubICS(upcoming, club.name);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute inset-0 flex flex-col z-20"
      style={{ backgroundColor: 'var(--sl-bg)', overflow: 'hidden' }}
    >
      {/* ── Header ── */}
      <div className="flex-shrink-0 relative text-white" style={getHeroBackground(theme.primary, accentColor, theme.heroStyle ?? 'solid')}>
        {/* accent glow overlay — toned down on gradient/aurora styles */}
        {!['gradient', 'aurora'].includes(theme.heroStyle) && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `linear-gradient(135deg, transparent 35%, ${accentColor}1A 100%)`,
          }} />
        )}
        <div style={{
          position: 'absolute', top: '-40%', right: '-8%', width: 240, height: 240,
          borderRadius: '50%', pointerEvents: 'none',
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 65%)`,
        }} />
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm transition-colors cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Clubs
          </button>
          <div className="flex items-center gap-2">
            {/* Share / deeplink button */}
            <button
              onClick={handleShareClub}
              aria-label="Copier le lien du club"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              style={{
                backgroundColor: linkCopied ? 'rgba(34,217,106,0.25)' : 'rgba(255,255,255,0.1)',
                color: linkCopied ? '#22d96a' : 'rgba(255,255,255,0.7)',
              }}
            >
              {linkCopied
                ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              }
              <span className="hidden sm:inline">{linkCopied ? 'Copié !' : 'Partager'}</span>
            </button>

            {isOwner && (
              <button
                onClick={() => setShowDashboard(true)}
                aria-label="Tableau de bord du club"
                className="flex items-center gap-1.5 text-xs font-semibold p-2 sm:px-3 sm:py-1.5 rounded-xl transition-colors cursor-pointer bg-slate-700 text-slate-300 hover:bg-slate-600"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/>
                  <rect x="2" y="15" width="6" height="6" rx="1"/><rect x="16" y="15" width="6" height="6" rx="1"/>
                  <line x1="11" y1="6" x2="13" y2="6"/><line x1="11" y1="18" x2="13" y2="18"/>
                  <line x1="6" y1="11" x2="6" y2="13"/><line x1="18" y1="11" x2="18" y2="13"/>
                  <line x1="11" y1="12" x2="13" y2="12"/>
                </svg>
                <span className="hidden sm:inline">Stats</span>
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => setShowManagersPanel(true)}
                aria-label="Gérer les gestionnaires du club"
                className="flex items-center gap-1.5 text-xs font-semibold p-2 sm:px-3 sm:py-1.5 rounded-xl transition-colors cursor-pointer bg-slate-700 text-slate-300 hover:bg-slate-600"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                  <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                <span className="hidden sm:inline">Gestion</span>
                {managers.length > 0 && (
                  <span className="text-[10px] font-bold px-1 py-0.5 rounded-full bg-blue-500 text-white leading-none">
                    {managers.length}
                  </span>
                )}
              </button>
            )}
            {canEdit && onUpdateClub && (
              <button
                onClick={() => setShowEditInfo(true)}
                aria-label="Modifier les informations du club"
                className="flex items-center gap-1.5 text-xs font-semibold p-2 sm:px-3 sm:py-1.5 rounded-xl transition-colors cursor-pointer bg-slate-600 text-slate-200 hover:bg-slate-500"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span className="hidden sm:inline">Équipes</span>
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-2 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-white text-base font-oswald flex-shrink-0"
            style={{ backgroundColor: club.logo ? '#fff' : accentColor, boxShadow: '0 0 0 2.5px rgba(255,255,255,0.75)', padding: club.logo ? 4 : 0 }}>
            {club.logo
              ? <img src={club.logo} alt={club.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.style.backgroundColor = accentColor; e.currentTarget.parentElement.textContent = club.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 3); }} />
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
              {club.categories?.length > 0 ? (
                <>
                  {club.categories.slice(0, 6).map(cat => (
                    <span key={cat.id} className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                      {cat.name}
                    </span>
                  ))}
                  {club.categories.length > 6 && (
                    <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                      +{club.categories.length - 6}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{club.level}</span>
              )}
              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{club.members} membres</span>
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

        {/* Action buttons — own row so the club name area gets full width */}
        <div className="px-4 pb-4 flex gap-2">
          {/* Follow */}
          <button
            onClick={() => isLoggedIn ? setShowFollowModal(true) : null}
            title={isFollowing ? 'Modifier le suivi' : 'Suivre ce club'}
            className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer"
            style={{ backgroundColor: isFollowing ? `${accentColor}25` : 'rgba(255,255,255,0.08)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: isFollowing ? `${accentColor}30` : 'rgba(255,255,255,0.1)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill={isFollowing ? accentColor : 'none'} stroke={isFollowing ? accentColor : '#cbd5e1'} strokeWidth="2" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <span className="text-[9px] font-medium" style={{ color: isFollowing ? accentColor : '#94a3b8' }}>
              {isFollowing ? 'Suivi' : 'Suivre'}
            </span>
          </button>

          {/* Poster */}
          <button
            onClick={() => setShowPoster(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
            title="Créer l'affiche du prochain match"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}25` }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <span className="text-[9px] font-medium" style={{ color: accentColor }}>Affiche</span>
          </button>

          {/* ICS export */}
          <button
            onClick={handleExportICS}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
            title="Exporter le calendrier .ics"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span className="text-[9px] text-slate-400 font-medium">Agenda</span>
          </button>

          {/* Contact */}
          {club.contact && (
            <a href={`mailto:${club.contact}`}
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-700 transition-colors"
              title={`Contacter ${club.name}`}>
              <div className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <span className="text-[9px] text-slate-400 font-medium">Contact</span>
            </a>
          )}
        </div>

        {isEditing && (
          <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#d97706' }}>
            <span className="text-white text-xs font-medium opacity-90 flex-1 min-w-0 mr-3 truncate">
              {simpleMode ? 'Mode rapide' : 'Avancé — glissez ⠿ pour réordonner'}
            </span>
            <button
              type="button"
              onClick={() => setOptionsOpen(o => !o)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              style={{ backgroundColor: optionsOpen ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)', color: '#fff' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
              Options
            </button>
          </div>
        )}
      </div>

      <PendingResultsBanner count={pendingCount} isEditing={isEditing} />

      {/* ── Options drawer (edit mode) ── */}
      <AnimatePresence>
        {isEditing && optionsOpen && (
          <motion.div
            key="options-drawer"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden flex-shrink-0"
            style={{ borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)' }}
          >
            <div className="px-4 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── Mode d'édition ── */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--sl-t3)' }}>Mode d'édition</div>
                <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--sl-border)', width: 'fit-content' }}>
                  <button type="button" onClick={() => setSimpleMode(true)}
                    className="px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
                    style={{ backgroundColor: simpleMode ? 'var(--sl-t1)' : 'transparent', color: simpleMode ? 'var(--sl-bg)' : 'var(--sl-t2)' }}>
                    Rapide
                  </button>
                  <button type="button" onClick={() => setSimpleMode(false)}
                    className="px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
                    style={{ backgroundColor: !simpleMode ? 'var(--sl-t1)' : 'transparent', color: !simpleMode ? 'var(--sl-bg)' : 'var(--sl-t2)' }}>
                    Avancé
                  </button>
                </div>
                <p className="text-[10px] mt-1.5" style={{ color: 'var(--sl-t3)' }}>
                  {simpleMode ? 'Ajoutez les sections essentielles en un clic' : 'Glissez ⠿ pour réordonner · Réduisez un bloc pour le mettre côte-à-côte'}
                </p>
              </div>

              {/* ── Style du bandeau hero ── */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--sl-t3)' }}>Style du bandeau</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {HERO_STYLE_OPTIONS.map(opt => {
                    const bg = getHeroBackground(theme.primary, accentColor, opt.key);
                    const isActive = (theme.heroStyle ?? 'solid') === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setTheme({ heroStyle: opt.key })}
                        style={{
                          borderRadius: 10, overflow: 'hidden', cursor: 'pointer', height: 48,
                          border: `2px solid ${isActive ? accentColor : 'var(--sl-border)'}`,
                          padding: 0, position: 'relative', ...bg,
                        }}
                      >
                        {/* mini radial glow preview */}
                        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 80% 30%, ${accentColor}33 0%, transparent 60%)` }} />
                        <span style={{
                          position: 'relative', fontSize: 9, fontWeight: 700,
                          color: 'rgba(255,255,255,0.9)', display: 'block', paddingLeft: 7, paddingTop: 6,
                          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        }}>{opt.label}</span>
                        {isActive && (
                          <div style={{
                            position: 'absolute', bottom: 5, right: 6,
                            width: 12, height: 12, borderRadius: '50%',
                            backgroundColor: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Typographie ── */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--sl-t3)' }}>Typographie</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['titleFont', 'bodyFont'].map(key => (
                    <div key={key}>
                      <div className="text-[10px] mb-1.5 font-medium" style={{ color: 'var(--sl-t3)' }}>
                        {key === 'titleFont' ? 'Titres' : 'Corps de texte'}
                      </div>
                      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                        {FONT_OPTIONS.map(font => (
                          <button
                            key={font.key}
                            onClick={() => setTypography({ [key]: font.key })}
                            className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                            style={{
                              fontFamily: `"${font.key}", sans-serif`,
                              backgroundColor: typography[key] === font.key ? '#0F1E3A' : 'var(--sl-card)',
                              color: typography[key] === font.key ? 'white' : 'var(--sl-t2)',
                              border: `1px solid ${typography[key] === font.key ? '#0F1E3A' : 'var(--sl-border)'}`,
                            }}
                          >
                            {font.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Couleurs du club ── */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--sl-t3)' }}>Couleurs du club</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, cursor: 'pointer' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sl-t3)' }}>Couleur principale (header)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="color"
                        value={theme.primary}
                        onChange={e => setTheme({ primary: e.target.value })}
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--sl-border-s)', cursor: 'pointer', padding: 2, backgroundColor: 'transparent' }}
                      />
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--sl-t2)' }}>{theme.primary}</span>
                    </div>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, cursor: 'pointer' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sl-t3)' }}>Couleur d'accent (boutons)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="color"
                        value={theme.accent ?? (sportData?.color ?? '#22C55E')}
                        onChange={e => setTheme({ accent: e.target.value })}
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--sl-border-s)', cursor: 'pointer', padding: 2, backgroundColor: 'transparent' }}
                      />
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--sl-t2)' }}>{theme.accent ?? (sportData?.color ?? '#22C55E')}</span>
                      {theme.accent && (
                        <button
                          onClick={() => setTheme({ accent: null })}
                          style={{ fontSize: 10, color: 'var(--sl-t3)', padding: '2px 6px', borderRadius: 6, border: '1px solid var(--sl-border)', backgroundColor: 'transparent', cursor: 'pointer' }}
                        >
                          Réinitialiser
                        </button>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* ── Vues ── */}
              <div className="flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span className="text-[10px] font-semibold" style={{ color: 'var(--sl-t3)' }}>{pageViews} vue{pageViews !== 1 ? 's' : ''} sur cette page</span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab bar ── */}
      {allTeams.length > 0 && (
        <div className="flex-shrink-0 relative" style={{ borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
          <div
            ref={tabBarRef}
            className="flex overflow-x-auto"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x', scrollBehavior: 'smooth' }}
          >
            <button
              data-active={activeTeamId === null}
              onClick={() => setActiveTeamId(null)}
              className="flex-shrink-0 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer"
              style={activeTeamId === null
                ? { borderColor: '#1e293b', color: 'var(--sl-t1)' }
                : { borderColor: 'transparent', color: 'var(--sl-t3)' }}
            >
              Général
            </button>
            {allTeams.map(team => (
              <button
                key={team.id}
                data-active={activeTeamId === team.id}
                onClick={() => setActiveTeamId(team.id)}
                className="flex-shrink-0 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer"
                style={activeTeamId === team.id
                  ? { borderColor: '#1e293b', color: 'var(--sl-t1)' }
                  : { borderColor: 'transparent', color: 'var(--sl-t3)' }}
              >
                {team.name}
              </button>
            ))}
            {/* Spacer so last tab doesn't sit at the very edge */}
            <div className="flex-shrink-0 w-4" />
          </div>
          {/* Right-fade overflow hint — hidden via CSS when scrolled to end */}
          {allTeams.length > 2 && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute', right: 0, top: 0, bottom: 1,
                width: 32, pointerEvents: 'none',
                background: 'linear-gradient(to right, transparent, var(--sl-card))',
              }}
            />
          )}
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ overscrollBehavior: 'contain', '--club-font-title': `"${typography.titleFont}", sans-serif`, '--club-font-body': `"${typography.bodyFont}", sans-serif` }}>
        {activeTeam ? (
          <TeamView
            key={activeTeam.id}
            team={activeTeam}
            blocks={blocks}
            isEditing={isEditing}
            updateBlock={updateBlock}
            addBlock={addBlock}
            club={club}
            allEvents={allEvents ?? []}
            trainings={teamTrainings}
            onUpdateTrainings={setTeamTrainings}
            onAddEventForTeam={handleAddEventForTeam}
            canAddEvent={canAddEvent && !!onAddEvent}
            onBulkAddTrainingEvents={handleBulkTeamEventSave}
          />
        ) : isEditing && simpleMode ? (
          <SimpleModeEditor
            blocks={blocks}
            onAddBlock={type => addBlock(type, null)}
            onAdvanced={() => setSimpleMode(false)}
            club={club}
            accentColor={accentColor}
          />
        ) : (
          <div className="px-4 py-5">
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
                    allEvents={allEvents ?? []}
                    club={club}
                  />

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
                          className="flex items-center justify-center gap-1 w-full mb-3 py-1.5 text-xs rounded-xl transition-colors cursor-pointer"
                          style={{ color: 'var(--sl-t3)' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--sl-hover)'; e.currentTarget.style.color = 'var(--sl-t2)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--sl-t3)'; }}
                        >
                          <PlusIcon /> Ajouter une ligne ici
                        </button>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </Reorder.Group>

            {blocks.length === 0 && isEditing && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--sl-surface)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                </div>
                <p className="font-medium text-sm mb-4" style={{ color: 'var(--sl-t2)' }}>Page vide — ajoutez votre premier bloc</p>
                <button onClick={() => addBlock('title', null)}
                  className="px-4 py-2 text-white text-sm rounded-xl transition-colors cursor-pointer"
                  style={{ backgroundColor: '#1e293b' }}>
                  + Ajouter un bloc
                </button>
              </div>
            )}

            {blocks.length === 0 && !isEditing && (() => {
              const now = new Date();
              const hasUpcoming = (allEvents ?? []).some(
                e => String(e.clubId) === String(club.id) && new Date(e.date) >= now
              );
              if (!hasUpcoming) return null;
              return (
                <div style={{ padding: '0 0 16px' }}>
                  <UpcomingEventsBlock data={{}} allEvents={allEvents ?? []} club={club} isEditing={false} onUpdate={() => {}} />
                </div>
              );
            })()}

            {isEditing && blocks.length > 0 && openMenuAfter === null && (
              <button onClick={() => setOpenMenuAfter('__end__')}
                className="flex items-center justify-center gap-2 w-full py-3 mt-1 rounded-2xl text-sm transition-colors cursor-pointer"
                style={{ border: '2px dashed var(--sl-border)', color: 'var(--sl-t3)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--sl-border-s)'; e.currentTarget.style.color = 'var(--sl-t2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sl-border)'; e.currentTarget.style.color = 'var(--sl-t3)'; }}>
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
        )}
      </div>

      {/* Edit club info modal (name, categories, teams…) */}
      {showEditInfo && onUpdateClub && (
        <ClubFormModal
          club={club}
          onSave={async (data) => { await onUpdateClub(data); setShowEditInfo(false); }}
          onClose={() => setShowEditInfo(false)}
        />
      )}

      {/* Team event modal */}
      {teamEventModal !== undefined && (
        <EventFormModal
          event={teamEventModal}
          onSave={handleTeamEventSave}
          onBulkSave={handleBulkTeamEventSave}
          onClose={() => setTeamEventModal(undefined)}
        />
      )}

      {/* Poster studio modal */}
      {showPoster && <PosterStudio event={posterEvent} club={club} onClose={() => setShowPoster(false)} />}

      {/* Managers panel */}
      {showManagersPanel && (
        <ClubManagersPanel
          managers={managers}
          ownerEmail={currentUser?.email}
          ownerName={currentUser?.name}
          onAdd={addManager}
          onRemove={removeManager}
          onClose={() => setShowManagersPanel(false)}
        />
      )}

      {/* Follow modal */}
      {showFollowModal && (
        <FollowModal
          club={club}
          allEvents={allEvents ?? []}
          currentFollow={currentFollow}
          onSave={(options) => {
            if (isFollowing) {
              updateFollow(club.id, options);
            } else {
              followClub(club.id, options);
            }
            setShowFollowModal(false);
          }}
          onClose={() => setShowFollowModal(false)}
        />
      )}

      {/* Announcement modal */}
      <AnimatePresence>
        {showAnnouncement && (
          <SendAnnouncementModal
            key="send-announcement"
            club={club}
            onSend={sendAnnouncement}
            onClose={() => setShowAnnouncement(false)}
          />
        )}
      </AnimatePresence>

      {/* Club dashboard slide-in */}
      <AnimatePresence>
        {showDashboard && (
          <ClubDashboard
            key="club-dashboard"
            club={club}
            clubEventIds={clubEventIds}
            allEvents={allEvents}
            onClose={() => setShowDashboard(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating announcement FAB */}
      {canEdit && !isEditing && !showEditInfo && !showAnnouncement && !showDashboard && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => setShowAnnouncement(true)}
          aria-label="Envoyer une annonce aux abonnés"
          style={{
            position: 'absolute', bottom: 'calc(78px + env(safe-area-inset-bottom, 0px))', right: 16, zIndex: 30,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 18, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700,
            backgroundColor: 'rgba(59,130,246,0.9)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l19-9-9 19-2-8-8-2z"/>
          </svg>
          📢 Annonce
        </motion.button>
      )}

      {/* Floating edit FAB */}
      {canEdit && !showEditInfo && !showAnnouncement && !showDashboard && (
        <motion.button
          key={isEditing ? 'done' : 'edit'}
          initial={{ scale: 0.8, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => { setIsEditing(e => !e); setOpenMenuAfter(null); }}
          aria-label={isEditing ? 'Terminer la modification' : 'Modifier la page du club'}
          style={{
            position: 'absolute', bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))', right: 16, zIndex: 30,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', borderRadius: 18, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700,
            backgroundColor: isEditing ? 'var(--sl-green)' : 'rgba(15,30,58,0.92)',
            color: isEditing ? '#fff' : '#cbd5e1',
            boxShadow: isEditing
              ? '0 4px 20px rgba(34,217,106,0.45)'
              : '0 4px 24px rgba(0,0,0,0.55)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {isEditing ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Terminé
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
              </svg>
              Modifier la page
            </>
          )}
        </motion.button>
      )}
    </motion.div>
  );
}
