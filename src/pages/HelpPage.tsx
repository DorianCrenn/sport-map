import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z } from '../constants/zIndex.js';
import { HELP_CONTENT, HELP_CATEGORIES } from '../data/helpContent.js';
import { useAndroidBack } from '../hooks/useAndroidBack.js';
import { useFeedback } from '../hooks/useFeedback.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import { IconChat, IconHelpCircle, IconBulb, IconBell } from '../components/icons.js';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:       { label: 'Nouveau',     color: '#6b7280' },
  analyzing: { label: 'En analyse',  color: '#6366f1' },
  planned:   { label: 'Planifié',    color: '#8b5cf6' },
  in_dev:    { label: 'En cours',    color: '#f59e0b' },
  resolved:  { label: 'Réalisé',     color: '#10b981' },
  closed:    { label: 'Fermé',       color: '#6b7280' },
};

const NOTIF_STATUS_LABELS: Record<string, string> = {
  new:       'Nouveau',
  analyzing: 'En analyse',
  planned:   'Planifié',
  in_dev:    'En cours',
  resolved:  'Déployé',
  closed:    'Fermé',
};

const NOTIF_STATUS_COLORS: Record<string, string> = {
  new:       '#6b7280',
  analyzing: '#6366f1',
  planned:   '#8b5cf6',
  in_dev:    '#f59e0b',
  resolved:  '#10b981',
  closed:    '#6b7280',
};

const NOTIF_TYPE_EMOJI: Record<string, string> = { bug: '🐛', idea: '💡', question: '❓' };

function formatNotifDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

interface HelpPageProps {
  onClose: () => void;
  onOpenFeedback?: (() => void) | null;
  notifications?: Record<string, any>[];
  unreadCount?: number;
  onMarkRead?: ((id: string) => void) | null;
  onMarkAllRead?: (() => void) | null;
}

export default function HelpPage({ onClose, onOpenFeedback, notifications = [], unreadCount = 0, onMarkRead, onMarkAllRead }: HelpPageProps) {
  const initialTab = unreadCount > 0 ? 'notifs' : 'faq';
  const [tab, setTab]                 = useState(initialTab);
  const [query, setQuery]             = useState('');
  const [activeCategory, setCategory] = useState<string | null>(null);
  const [openId, setOpenId]           = useState<string | null>(null);

  const { fetchIdeas, vote, unvote, ideas, loadMyVotes } = useFeedback() as any;
  const [myVotes,   setMyVotes]   = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('sl-my-votes') ?? '[]')); } catch { return new Set(); }
  });
  const [ideasLoading, setIdeasLoading] = useState(false);

  useAndroidBack(true, onClose);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (tab === 'ideas') {
      setIdeasLoading(true);
      Promise.all([
        ideas.length === 0 ? fetchIdeas() : Promise.resolve(ideas),
        loadMyVotes().then((votes: Set<string>) => setMyVotes(votes)),
      ]).finally(() => setIdeasLoading(false));
    }
  }, [tab]);

  const persistVotes = useCallback((set: Set<string>) => {
    try { localStorage.setItem('sl-my-votes', JSON.stringify([...set])); } catch { /* ignore */ }
  }, []);

  const handleVote = useCallback(async (id: string) => {
    const next = new Set(myVotes);
    if (next.has(id)) {
      next.delete(id);
      await unvote(id);
    } else {
      next.add(id);
      await vote(id);
    }
    setMyVotes(next);
    persistVotes(next);
  }, [myVotes, vote, unvote, persistVotes]);

  const filtered = useMemo(() => {
    let items = HELP_CONTENT;
    if (activeCategory) items = items.filter((i: any) => i.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((i: any) =>
        i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q)
      );
    }
    return items;
  }, [query, activeCategory]);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      style={{
        position: 'absolute', inset: 0, zIndex: Z.helpPage,
        display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--sl-bg)', fontFamily: 'Inter, sans-serif',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Centre d'aide"
    >
      <div style={{
        flexShrink: 0, padding: '14px 16px',
        backgroundColor: 'var(--sl-card)',
        borderBottom: '1px solid var(--sl-border)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={onClose}
          aria-label="Fermer l'aide"
          style={{
            width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
            backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>
            Centre d'aide
          </h1>
          <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: 0, marginTop: 1 }}>
            {tab === 'faq' ? `${HELP_CONTENT.length} réponses disponibles` : tab === 'ideas' ? `${ideas.length} idées de la communauté` : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {onOpenFeedback && (
          <button
            onClick={onOpenFeedback}
            aria-label="Donner mon avis"
            style={{
              padding: '7px 12px', borderRadius: 10, border: '1.5px solid rgba(99,102,241,0.35)',
              backgroundColor: 'rgba(99,102,241,0.1)', color: '#818cf8',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <IconChat size={13} /> Avis
          </button>
        )}
      </div>

      <div style={{
        flexShrink: 0,
        display: 'flex', gap: 0,
        backgroundColor: 'var(--sl-card)',
        borderBottom: '1px solid var(--sl-border)',
        padding: '0 16px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {[
          { id: 'faq',    label: 'FAQ',            Icon: IconHelpCircle },
          { id: 'ideas',  label: 'Idées',           Icon: IconBulb },
          ...(notifications.length > 0 ? [{ id: 'notifs', label: 'Notifications', Icon: IconBell, badge: unreadCount }] : []),
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? '#6366f1' : 'var(--sl-t3)',
              borderBottom: `2px solid ${tab === t.id ? '#6366f1' : 'transparent'}`,
              marginBottom: -1, transition: 'all 0.12s',
              display: 'flex', alignItems: 'center', gap: 5, position: 'relative',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            <t.Icon size={13} color={tab === t.id ? '#6366f1' : 'var(--sl-t3)'} /> {t.label}
            {(t as any).badge > 0 && (
              <span aria-hidden="true" style={{
                minWidth: 16, height: 16, borderRadius: 8, padding: '0 4px',
                backgroundColor: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 800,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {(t as any).badge > 9 ? '9+' : (t as any).badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'faq' ? (
          <motion.div
            key="faq"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            <div style={{ padding: '12px 16px', flexShrink: 0, backgroundColor: 'var(--sl-card)', borderBottom: '1px solid var(--sl-border)' }}>
              <div style={{ position: 'relative' }}>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher une question…"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '9px 12px 9px 34px', borderRadius: 12,
                    backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
                    color: 'var(--sl-t1)', fontSize: 13, outline: 'none',
                  }}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    aria-label="Effacer la recherche"
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sl-t3)', fontSize: 16, lineHeight: 1, padding: 2 }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex', gap: 8, padding: '10px 16px', overflowX: 'auto',
              scrollbarWidth: 'none', flexShrink: 0,
              backgroundColor: 'var(--sl-card)', borderBottom: '1px solid var(--sl-border)',
            }}>
              <button
                onClick={() => setCategory(null)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                  backgroundColor: !activeCategory ? 'var(--sl-green)' : 'var(--sl-surface)',
                  color: !activeCategory ? '#000' : 'var(--sl-t2)',
                  border: '1px solid var(--sl-border)',
                  transition: 'all 0.12s',
                }}
              >
                Tout
              </button>
              {HELP_CATEGORIES.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(activeCategory === cat.id ? null : cat.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 5,
                    backgroundColor: activeCategory === cat.id ? 'var(--sl-green)' : 'var(--sl-surface)',
                    color: activeCategory === cat.id ? '#000' : 'var(--sl-t2)',
                    border: '1px solid var(--sl-border)',
                    transition: 'all 0.12s',
                  }}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 32px' }}>
              {filtered.length === 0 ? (
                <EmptyState
                  emoji="🔍"
                  title="Aucun résultat"
                  subtitle="Essayez d'autres mots-clés ou parcourez les catégories"
                  actionLabel="Effacer la recherche"
                  onAction={() => { setQuery(''); setCategory(null); }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((item: any, i: number) => {
                      const isOpen = openId === item.id;
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          style={{
                            borderRadius: 14,
                            backgroundColor: 'var(--sl-card)',
                            border: `1px solid ${isOpen ? 'rgba(99,102,241,0.3)' : 'var(--sl-border)'}`,
                            overflow: 'hidden',
                            transition: 'border-color 0.15s',
                          }}
                        >
                          <button
                            onClick={() => setOpenId(isOpen ? null : item.id)}
                            aria-expanded={isOpen}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              gap: 10, padding: '13px 16px',
                              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)', lineHeight: 1.4, flex: 1 }}>
                              {item.question}
                            </span>
                            <svg
                              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round"
                              style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                              aria-hidden="true"
                            >
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{ padding: '0 16px 14px', fontSize: 13, color: 'var(--sl-t2)', lineHeight: 1.6, borderTop: '1px solid var(--sl-border)' }}>
                                  <div style={{ paddingTop: 12 }}>{item.answer}</div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {onOpenFeedback && (
                    <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 14, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--sl-t2)' }}>
                        Vous ne trouvez pas votre réponse ?
                      </p>
                      <button
                        onClick={onOpenFeedback}
                        style={{
                          padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                          backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8',
                          fontSize: 13, fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <IconChat size={14} /> Poser une question ou signaler un bug
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : tab === 'ideas' ? (
          <motion.div
            key="ideas"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 32px' }}
          >
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--sl-t2)', margin: 0, lineHeight: 1.5 }}>
                Votez pour les idées qui vous semblent prioritaires. Les plus populaires intègrent la roadmap.
              </p>
            </div>

            {ideasLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div style={{ width: 24, height: 24, border: '2px solid var(--sl-border)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              </div>
            ) : ideas.length === 0 ? (
              <EmptyState
                emoji="💡"
                title="Aucune idée pour l'instant"
                subtitle="Soyez le premier à proposer une amélioration"
                actionLabel={onOpenFeedback ? "Proposer une idée" : null}
                onAction={onOpenFeedback}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ideas.map((idea: any, i: number) => {
                  const voted  = myVotes.has(idea.id);
                  const status = STATUS_LABELS[idea.status] ?? STATUS_LABELS.new;
                  const voteCount = idea.vote_count ?? 0;
                  return (
                    <motion.div
                      key={idea.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 14px', borderRadius: 14,
                        backgroundColor: 'var(--sl-card)',
                        border: `1px solid ${voted ? 'rgba(99,102,241,0.3)' : 'var(--sl-border)'}`,
                        transition: 'border-color 0.15s',
                      }}
                    >
                      <button
                        onClick={() => handleVote(idea.id)}
                        aria-label={voted ? 'Retirer mon vote' : 'Voter pour cette idée'}
                        aria-pressed={voted}
                        style={{
                          flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                          width: 40, padding: '6px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                          backgroundColor: voted ? 'rgba(99,102,241,0.15)' : 'var(--sl-surface)',
                          color: voted ? '#6366f1' : 'var(--sl-t3)',
                          transition: 'all 0.12s',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={voted ? '#6366f1' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <polyline points="18 15 12 9 6 15"/>
                        </svg>
                        <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>{voteCount}</span>
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)', lineHeight: 1.4 }}>
                            {idea.title}
                          </span>
                        </div>
                        {idea.description && (
                          <p style={{ margin: '4px 0 6px', fontSize: 12, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
                            {idea.description}
                          </p>
                        )}
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.03em',
                          backgroundColor: `${status.color}18`, color: status.color,
                          border: `1px solid ${status.color}30`,
                        }}>
                          {status.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

                {onOpenFeedback && (
                  <button
                    onClick={onOpenFeedback}
                    style={{
                      marginTop: 8, padding: '12px', borderRadius: 14, border: '1.5px dashed var(--sl-border)',
                      backgroundColor: 'transparent', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, color: 'var(--sl-t3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#818cf8'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sl-border)'; e.currentTarget.style.color = 'var(--sl-t3)'; }}
                  >
                    💡 Proposer une nouvelle idée
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ) : tab === 'notifs' ? (
          <motion.div
            key="notifs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 32px' }}
          >
            {unreadCount > 0 && onMarkAllRead && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button
                  onClick={onMarkAllRead}
                  style={{
                    fontSize: 11, fontWeight: 600, color: '#6366f1',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                  }}
                >
                  Tout marquer comme lu
                </button>
              </div>
            )}

            {notifications.length === 0 ? (
              <EmptyState
                emoji="🔔"
                title="Aucune notification"
                subtitle="Vous serez notifié ici quand vos retours évoluent"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notifications.map(n => {
                  const newStatusColor = NOTIF_STATUS_COLORS[n.new_status] ?? '#6b7280';
                  const typeEmoji = NOTIF_TYPE_EMOJI[n.feedback_type] ?? '💬';
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: '12px 14px', borderRadius: 14,
                        backgroundColor: n.read ? 'var(--sl-card)' : 'rgba(99,102,241,0.06)',
                        border: `1px solid ${n.read ? 'var(--sl-border)' : 'rgba(99,102,241,0.2)'}`,
                        cursor: !n.read && onMarkRead ? 'pointer' : 'default',
                      }}
                      onClick={() => !n.read && onMarkRead?.(n.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        {!n.read && (
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            backgroundColor: '#6366f1', flexShrink: 0, marginTop: 5,
                          }} aria-hidden="true" />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)', lineHeight: 1.4 }}>
                            {typeEmoji} Votre {n.feedback_type === 'bug' ? 'bug' : n.feedback_type === 'idea' ? 'idée' : 'question'}
                          </p>
                          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--sl-t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            «{n.feedback_title}»
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>est maintenant</span>
                            <span style={{
                              fontSize: 11, fontWeight: 700,
                              color: newStatusColor,
                              backgroundColor: `${newStatusColor}18`,
                              padding: '2px 8px', borderRadius: 20,
                            }}>
                              {NOTIF_STATUS_LABELS[n.new_status] ?? n.new_status}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--sl-t3)', marginLeft: 'auto' }}>
                              {formatNotifDate(n.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
