import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventReactions, REACTION_EMOJIS } from '../hooks/useEventReactions.js';

interface ReactionButtonProps { emoji: string; count: number; active: boolean; onClick: () => void; isLoggedIn: boolean; }

function ReactionButton({ emoji, count, active, onClick, isLoggedIn }: ReactionButtonProps) {
  return (
    <motion.button whileTap={{ scale: 0.82 }} onClick={isLoggedIn ? onClick : undefined} title={isLoggedIn ? (active ? `Retirer ${emoji}` : `Réagir ${emoji}`) : 'Connectez-vous pour réagir'} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--sl-radius-4xl)', border: `1.5px solid ${active ? 'rgba(34,217,106,0.5)' : 'var(--sl-border)'}`, backgroundColor: active ? 'rgba(34,217,106,0.10)' : 'var(--sl-surface)', cursor: isLoggedIn ? 'pointer' : 'default', transition: 'all 0.15s', flexShrink: 0 }}>
      <span style={{ fontSize: 16, lineHeight: 1 }}>{emoji}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={count} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }} style={{ fontSize: 12, fontWeight: 700, color: active ? 'var(--sl-green)' : 'var(--sl-t3)', fontVariantNumeric: 'tabular-nums', minWidth: 14, textAlign: 'center' }}>
          {count > 0 ? count : ''}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

interface EventReactionsProps { eventId: string | number; }

function EventReactions({ eventId }: EventReactionsProps) {
  const { counts, mine, toggle, loading, isLoggedIn } = useEventReactions(String(eventId));
  if (loading) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 10, marginTop: 10, borderTop: '1px solid var(--sl-border)' }}>
      {(REACTION_EMOJIS as unknown as string[]).map(emoji => (
        <ReactionButton key={emoji} emoji={emoji} count={(counts as Record<string, number>)[emoji] ?? 0} active={(mine as Set<string>).has(emoji)} onClick={() => (toggle as (e: string) => void)(emoji)} isLoggedIn={isLoggedIn as boolean} />
      ))}
      {!isLoggedIn && <span style={{ fontSize: 10, color: 'var(--sl-t3)', marginLeft: 4 }}>Connectez-vous pour réagir</span>}
    </div>
  );
}

export default memo(EventReactions);
