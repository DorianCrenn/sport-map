import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPORTS } from '../../data/events.js';
import { useClubPage } from '../../hooks/useClubPage.js';
import SportIcon from '../SportIcon.jsx';
import TitleBlock from './blocks/TitleBlock.jsx';
import TextBlock from './blocks/TextBlock.jsx';
import UpcomingEventsBlock from './blocks/UpcomingEventsBlock.jsx';
import TrainingBlock from './blocks/TrainingBlock.jsx';
import AddBlockMenu from './AddBlockMenu.jsx';

const BLOCK_LABELS = {
  title: 'Titre',
  text: 'Texte',
  'upcoming-events': 'Événements',
  training: 'Entraînements',
};

// ── Icônes contrôles ──────────────────────────────────────────────────────────
const ChevUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);
const ChevDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
);
const EyeOn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ── Bloc wrapper (contrôles éditeur) ─────────────────────────────────────────
function BlockWrapper({ block, isEditing, isFirst, isLast, onMoveUp, onMoveDown, onDelete, onToggle, onAddAfter, children }) {
  if (!isEditing) {
    return block.enabled ? <div className="mb-6">{children}</div> : null;
  }

  return (
    <div className={`mb-3 ${!block.enabled ? 'opacity-40' : ''}`}>
      {/* Barre de contrôle */}
      <div className="flex items-center gap-1 mb-1 px-0.5">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {BLOCK_LABELS[block.type] ?? block.type}
        </span>
        <div className="flex-1" />
        <button
          onClick={onToggle}
          title={block.enabled ? 'Masquer' : 'Afficher'}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {block.enabled ? <EyeOn /> : <EyeOff />}
        </button>
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <ChevUp />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <ChevDown />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <TrashIcon />
        </button>
      </div>

      {/* Contenu */}
      <div className="border border-dashed border-gray-200 rounded-2xl p-4 bg-white">
        {children}
      </div>

      {/* Bouton Ajouter après */}
      <button
        onClick={onAddAfter}
        className="flex items-center justify-center gap-1 w-full mt-2 py-1.5 text-xs text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <PlusIcon /> Ajouter un bloc ici
      </button>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function ClubPageView({ club, allEvents, onBack }) {
  const { blocks, isEditing, setIsEditing, addBlock, updateBlock, deleteBlock, moveBlock, toggleBlock } = useClubPage(club);
  const [openMenuAfter, setOpenMenuAfter] = useState(null); // null | block.id

  const sportData = SPORTS[club.sport];

  function handleAddBlock(type, afterId) {
    addBlock(type, afterId);
    setOpenMenuAfter(null);
  }

  function toggleMenu(id) {
    setOpenMenuAfter(prev => prev === id ? null : id);
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      className="absolute inset-0 bg-gray-50 flex flex-col z-10"
    >
      {/* ── En-tête club ── */}
      <div className="flex-shrink-0 relative text-white" style={{ backgroundColor: '#1e293b' }}>
        {/* Bouton retour */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Clubs
          </button>

          {/* Toggle édition */}
          <button
            onClick={() => { setIsEditing(e => !e); setOpenMenuAfter(null); }}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
              isEditing
                ? 'bg-green-500 text-white hover:bg-green-400'
                : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
            }`}
          >
            {isEditing ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Terminé
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                Modifier
              </>
            )}
          </button>
        </div>

        {/* Identité club */}
        <div className="px-4 pb-5 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-base font-oswald flex-shrink-0"
            style={{ backgroundColor: sportData?.color ?? '#64748b' }}
          >
            {club.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 3)}
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
                <a
                  href={`mailto:${club.contact}`}
                  className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full hover:bg-slate-600 transition-colors"
                >
                  Contacter
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bandeau mode édition */}
        {isEditing && (
          <div className="px-4 py-2 bg-amber-500 text-white text-xs font-medium flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Mode édition — vos modifications sont sauvegardées automatiquement
          </div>
        )}
      </div>

      {/* ── Contenu (blocs) ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <AnimatePresence initial={false}>
          {blocks.map((block, idx) => (
            <motion.div
              key={block.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
            >
              <BlockWrapper
                block={block}
                isEditing={isEditing}
                isFirst={idx === 0}
                isLast={idx === blocks.length - 1}
                onMoveUp={() => moveBlock(block.id, 'up')}
                onMoveDown={() => moveBlock(block.id, 'down')}
                onDelete={() => deleteBlock(block.id)}
                onToggle={() => toggleBlock(block.id)}
                onAddAfter={() => toggleMenu(block.id)}
              >
                {block.type === 'title' && (
                  <TitleBlock data={block.data} isEditing={isEditing} onUpdate={p => updateBlock(block.id, p)} />
                )}
                {block.type === 'text' && (
                  <TextBlock data={block.data} isEditing={isEditing} onUpdate={p => updateBlock(block.id, p)} />
                )}
                {block.type === 'upcoming-events' && (
                  <UpcomingEventsBlock data={block.data} allEvents={allEvents} isEditing={isEditing} onUpdate={p => updateBlock(block.id, p)} />
                )}
                {block.type === 'training' && (
                  <TrainingBlock data={block.data} isEditing={isEditing} onUpdate={p => updateBlock(block.id, p)} />
                )}
              </BlockWrapper>

              {/* Menu ajout bloc après ce bloc */}
              <AnimatePresence>
                {isEditing && openMenuAfter === block.id && (
                  <AddBlockMenu
                    key={`menu-${block.id}`}
                    onAdd={type => handleAddBlock(type, block.id)}
                    onCancel={() => setOpenMenuAfter(null)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* État vide */}
        {blocks.length === 0 && isEditing && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-sm mb-1">Page vide</p>
            <p className="text-gray-400 text-xs mb-4">Ajoutez votre premier bloc</p>
            <button
              onClick={() => handleAddBlock('title', null)}
              className="px-4 py-2 bg-slate-800 text-white text-sm rounded-xl hover:bg-slate-700 transition-colors"
            >
              + Ajouter un bloc
            </button>
          </div>
        )}

        {/* Bouton ajout global (fin de liste, mode édition) */}
        {isEditing && blocks.length > 0 && openMenuAfter === null && (
          <button
            onClick={() => toggleMenu('__end__')}
            className="flex items-center justify-center gap-2 w-full py-3 mt-2 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-slate-400 hover:text-slate-600 transition-colors"
          >
            <PlusIcon /> Ajouter un bloc à la fin
          </button>
        )}
        <AnimatePresence>
          {isEditing && openMenuAfter === '__end__' && (
            <AddBlockMenu
              onAdd={type => handleAddBlock(type, null)}
              onCancel={() => setOpenMenuAfter(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
