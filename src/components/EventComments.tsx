import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventComments } from '../hooks/useEventComments.js';
import { timeAgo } from '../lib/dateUtils.js';
import Avatar from './ui/Avatar.jsx';

const MAX_LEN = 500;

interface Comment { id: string | number; user_id: string; created_at: string; content: string; _temp?: boolean; profiles?: { name?: string } | null; }
interface CommentItemProps { comment: Comment; userId: string | null; onDelete: (id: string | number) => void; }

function CommentItem({ comment, userId, onDelete }: CommentItemProps) {
  const isOwn = comment.user_id === userId;
  const name = comment.profiles?.name ?? 'Anonyme';
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex', gap: 8, marginBottom: 8, opacity: comment._temp ? 0.6 : 1 }}>
      <Avatar name={name} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t1)' }}>{name}</span>
          <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{timeAgo(comment.created_at)}</span>
          {isOwn && !comment._temp && (
            <button onClick={() => onDelete(comment.id)} aria-label="Supprimer" style={{ marginLeft: 'auto', padding: 2, border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--sl-t3)', lineHeight: 1 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--sl-t2)', lineHeight: 1.5, wordBreak: 'break-word' }}>{comment.content}</div>
      </div>
    </motion.div>
  );
}

interface EventCommentsProps { eventId: string | number; }

export default function EventComments({ eventId }: EventCommentsProps) {
  const { comments, loading, posting, addComment, deleteComment, isLoggedIn, userId } = useEventComments(String(eventId));
  const [text,  setText]  = useState('');
  const [error, setError] = useState<string | null>(null);
  const [open,  setOpen]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); e.stopPropagation(); setError(null);
    const { error: err } = await (addComment as (t: string) => Promise<{ error: string | null }>)(text);
    if (err) { setError(err === 'invalid' ? 'Commentaire invalide (1-500 caractères)' : err); }
    else { setText(''); }
  }

  const count = (comments as any[]).length;

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sl-border)' }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--sl-t3)', fontSize: 11, fontWeight: 700 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        {count > 0 ? `${count} commentaire${count > 1 ? 's' : ''}` : 'Commentaires'}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
            <div style={{ paddingTop: 10 }}>
              {loading ? (
                <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginBottom: 8 }}>Chargement…</div>
              ) : (
                <AnimatePresence initial={false}>
                  {(comments as Comment[]).map(c => <CommentItem key={c.id} comment={c} userId={userId as string | null} onDelete={deleteComment as (id: any) => void} />)}
                </AnimatePresence>
              )}
              {isLoggedIn ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 6 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input ref={inputRef} value={text} onChange={e => { setText(e.target.value); setError(null); }} placeholder="Ajouter un commentaire…" maxLength={MAX_LEN} disabled={posting as boolean} style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--sl-radius-md)', fontSize: 12, boxSizing: 'border-box', backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)', color: 'var(--sl-t1)', outline: 'none' }} />
                    {text.length > 400 && <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 9, color: text.length >= MAX_LEN ? '#ef4444' : 'var(--sl-t3)' }}>{MAX_LEN - text.length}</span>}
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={(posting as boolean) || !text.trim()} style={{ padding: '7px 12px', borderRadius: 'var(--sl-radius-md)', border: 'none', cursor: (posting as boolean) || !text.trim() ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-green)', color: '#fff', opacity: (posting as boolean) || !text.trim() ? 0.5 : 1, flexShrink: 0 }}>
                    {posting ? '…' : 'Envoyer'}
                  </motion.button>
                </form>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--sl-t3)', textAlign: 'center', padding: '6px 0' }}>Connectez-vous pour commenter</div>
              )}
              {error && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
