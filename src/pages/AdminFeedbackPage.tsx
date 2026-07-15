import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedbackAdmin } from '../hooks/useFeedbackAdmin.js';
import { useToast } from '../contexts/ToastContext.jsx';

const TYPE_META: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  bug:      { label: 'Bug',      emoji: '🐛', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  idea:     { label: 'Idée',     emoji: '💡', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  question: { label: 'Question', emoji: '❓', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: 'Nouveau',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  analyzing: { label: 'En analyse',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  planned:   { label: 'Planifié',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  in_dev:    { label: 'En cours',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  resolved:  { label: 'Réalisé',     color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  closed:    { label: 'Fermé',       color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
};

const STATUS_ORDER = ['new', 'analyzing', 'planned', 'in_dev', 'resolved', 'closed'];

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface TypeBadgeProps { type: string; small?: boolean; }
function TypeBadge({ type, small = false }: TypeBadgeProps) {
  const m = TYPE_META[type] ?? TYPE_META.question;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '2px 7px' : '3px 9px',
      borderRadius: 'var(--sl-radius-4xl)', fontSize: small ? 10 : 11, fontWeight: 700,
      backgroundColor: m.bg, color: m.color, flexShrink: 0,
    }}>
      {m.emoji} {m.label}
    </span>
  );
}

interface StatusBadgeProps { status: string; }
function StatusBadge({ status }: StatusBadgeProps) {
  const m = STATUS_META[status] ?? STATUS_META.new;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px', borderRadius: 'var(--sl-radius-4xl)', fontSize: 10, fontWeight: 700,
      backgroundColor: m.bg, color: m.color, flexShrink: 0,
    }}>
      {m.label}
    </span>
  );
}

interface FeedbackDetailProps {
  item: Record<string, any>;
  onClose: () => void;
  onSave: (id: string, patch: Record<string, any>) => Promise<void>;
}
function FeedbackDetail({ item, onClose, onSave }: FeedbackDetailProps) {
  const [status, setStatus]       = useState(item.status);
  const [adminNote, setAdminNote] = useState(item.admin_note ?? '');
  const [saving, setSaving]       = useState(false);
  const { toast } = useToast() as any;

  const changed = status !== item.status || adminNote !== (item.admin_note ?? '');

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(item.id, { status, admin_note: adminNote });
      toast({ message: 'Feedback mis à jour' });
      onClose();
    } catch (err: any) {
      toast({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const browserInfo = item.browser_info ?? {};

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--sl-bg)', fontFamily: 'var(--sl-font-ui)',
      }}
    >
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px',
        backgroundColor: 'var(--sl-card)',
        borderBottom: '1px solid var(--sl-border)',
      }}>
        <button
          onClick={onClose}
          aria-label="Retour à la liste"
          style={{
            width: 38, height: 38, borderRadius: 'var(--sl-radius-lg)', border: 'none',
            backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--sl-t3)', fontWeight: 500 }}>Détail feedback</p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <TypeBadge type={item.type} />
          {item.category && (
            <span style={{ fontSize: 11, color: 'var(--sl-t3)', backgroundColor: 'var(--sl-surface)', padding: '2px 8px', borderRadius: 'var(--sl-radius-4xl)', border: '1px solid var(--sl-border)' }}>
              {item.category}
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--sl-t3)', marginLeft: 'auto' }}>
            {formatDate(item.created_at)}
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--sl-card)', borderRadius: 'var(--sl-radius-2xl)', padding: 14, border: '1px solid var(--sl-border)' }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Titre</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--sl-t1)', lineHeight: 1.4 }}>{item.title}</p>
        </div>

        {item.description && (
          <div style={{ backgroundColor: 'var(--sl-card)', borderRadius: 'var(--sl-radius-2xl)', padding: 14, border: '1px solid var(--sl-border)' }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--sl-t2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.description}</p>
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          backgroundColor: 'var(--sl-card)', borderRadius: 'var(--sl-radius-2xl)', padding: 14,
          border: '1px solid var(--sl-border)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)' }}>{item.vote_count ?? 0}</span>
          <span style={{ fontSize: 12, color: 'var(--sl-t3)' }}>vote{(item.vote_count ?? 0) !== 1 ? 's' : ''}</span>
        </div>

        {(item.page_url || item.app_version || browserInfo.ua) && (
          <details style={{ backgroundColor: 'var(--sl-card)', borderRadius: 'var(--sl-radius-2xl)', padding: 14, border: '1px solid var(--sl-border)' }}>
            <summary style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t3)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Infos techniques
            </summary>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {item.page_url && <p style={{ margin: 0, fontSize: 11, color: 'var(--sl-t3)' }}>Page : <span style={{ color: 'var(--sl-t2)' }}>{item.page_url}</span></p>}
              {item.app_version && <p style={{ margin: 0, fontSize: 11, color: 'var(--sl-t3)' }}>Version : <span style={{ color: 'var(--sl-t2)' }}>{item.app_version}</span></p>}
              {browserInfo.ua && <p style={{ margin: 0, fontSize: 11, color: 'var(--sl-t3)', wordBreak: 'break-all' }}>UA : <span style={{ color: 'var(--sl-t2)' }}>{browserInfo.ua}</span></p>}
              {browserInfo.screen && <p style={{ margin: 0, fontSize: 11, color: 'var(--sl-t3)' }}>Écran : <span style={{ color: 'var(--sl-t2)' }}>{browserInfo.screen}</span></p>}
              {browserInfo.lang && <p style={{ margin: 0, fontSize: 11, color: 'var(--sl-t3)' }}>Langue : <span style={{ color: 'var(--sl-t2)' }}>{browserInfo.lang}</span></p>}
            </div>
          </details>
        )}

        <div style={{ backgroundColor: 'var(--sl-card)', borderRadius: 'var(--sl-radius-2xl)', padding: 14, border: '1px solid rgba(99,102,241,0.25)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zone Admin</p>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 8 }}>
              Statut
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STATUS_ORDER.map(s => {
                const m = STATUS_META[s];
                const active = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    style={{
                      padding: '5px 12px', borderRadius: 'var(--sl-radius-4xl)', border: 'none', cursor: 'pointer',
                      fontSize: 11, fontWeight: 600,
                      backgroundColor: active ? m.color : 'var(--sl-surface)',
                      color: active ? '#fff' : 'var(--sl-t2)',
                      transition: 'all 0.12s',
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              htmlFor="admin-note-textarea"
              style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 6 }}
            >
              Note interne
            </label>
            <textarea
              id="admin-note-textarea"
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Ajouter une note interne (non visible par l'utilisateur)…"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '9px 12px',
                borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)',
                backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)',
                fontSize: 13, resize: 'vertical', outline: 'none',
                fontFamily: 'var(--sl-font-ui)',
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !changed}
            data-testid="feedback-save-btn"
            style={{
              width: '100%', padding: '11px', borderRadius: 'var(--sl-radius-xl)', border: 'none',
              backgroundColor: changed ? '#6366f1' : 'var(--sl-surface)',
              color: changed ? '#fff' : 'var(--sl-t3)',
              fontSize: 13, fontWeight: 700, cursor: changed ? 'pointer' : 'default',
              transition: 'all 0.15s', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>

      </div>
    </motion.div>
  );
}

interface FeedbackCardProps {
  item: Record<string, any>;
  onClick: (item: Record<string, any>) => void;
}
function FeedbackCard({ item, onClick }: FeedbackCardProps) {
  const m = TYPE_META[item.type] ?? TYPE_META.question;
  return (
    <button
      onClick={() => onClick(item)}
      style={{
        width: '100%', textAlign: 'left',
        backgroundColor: 'var(--sl-card)', borderRadius: 'var(--sl-radius-2xl)',
        border: '1px solid var(--sl-border)',
        padding: 14, cursor: 'pointer',
        transition: 'border-color 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sl-border)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 'var(--sl-radius-lg)', flexShrink: 0,
          backgroundColor: m.bg, color: m.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15,
        }}>
          {m.emoji}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.title}
            </span>
            <StatusBadge status={item.status} />
          </div>
          {item.description && (
            <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--sl-t3)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
              {item.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {item.category && (
              <span style={{ fontSize: 10, color: 'var(--sl-t3)', backgroundColor: 'var(--sl-surface)', padding: '1px 6px', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)' }}>
                {item.category}
              </span>
            )}
            <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              ▲ {item.vote_count ?? 0}
            </span>
            <span style={{ fontSize: 10, color: 'var(--sl-t3)', marginLeft: 'auto' }}>{formatDate(item.created_at)}</span>
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 4 }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </button>
  );
}

interface StatsRowProps { stats: Record<string, any> | null; }
function StatsRow({ stats }: StatsRowProps) {
  if (!stats) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 4 }}>
      {[
        { label: 'Bugs',     value: stats.byType.bug,      emoji: '🐛', color: '#ef4444' },
        { label: 'Idées',    value: stats.byType.idea,     emoji: '💡', color: '#f59e0b' },
        { label: 'Questions',value: stats.byType.question, emoji: '❓', color: '#6366f1' },
      ].map(({ label, value, emoji, color }) => (
        <div key={label} style={{
          backgroundColor: 'var(--sl-card)', borderRadius: 'var(--sl-radius-xl)', padding: '10px 12px',
          border: '1px solid var(--sl-border)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 18, marginBottom: 2 }}>{emoji}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
          <div style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 500 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

interface AdminFeedbackPageProps { onBack: () => void; }

export default function AdminFeedbackPage({ onBack }: AdminFeedbackPageProps) {
  const {
    items, loading, total, stats,
    fetchAll, fetchStats, updateFeedback,
  } = useFeedbackAdmin() as any;

  const [typeFilter,   setTypeFilter]   = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sort,         setSort]         = useState('recent');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(0);
  const [selected,     setSelected]     = useState<Record<string, any> | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback((overrides: Record<string, any> = {}) => {
    const params = {
      type:   typeFilter,
      status: statusFilter,
      sort,
      search,
      page,
      ...overrides,
    };
    fetchAll(params);
  }, [fetchAll, typeFilter, statusFilter, sort, search, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    load();
  }, [typeFilter, statusFilter, sort, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(0);
      fetchAll({ type: typeFilter, status: statusFilter, sort, search: val, page: 0 });
    }, 350);
  }, [fetchAll, typeFilter, statusFilter, sort]);

  function applyType(t: string) {
    const next = typeFilter === t ? null : t;
    setTypeFilter(next);
    setPage(0);
    fetchAll({ type: next, status: statusFilter, sort, search, page: 0 });
  }

  function applyStatus(s: string) {
    const next = statusFilter === s ? null : s;
    setStatusFilter(next);
    setPage(0);
    fetchAll({ type: typeFilter, status: next, sort, search, page: 0 });
  }

  function applySort(s: string) {
    setSort(s);
    setPage(0);
    fetchAll({ type: typeFilter, status: statusFilter, sort: s, search, page: 0 });
  }

  const totalPages = Math.ceil(total / 40);

  return (
    <div style={{
      height: '100%', position: 'relative',
      display: 'flex', flexDirection: 'column',
      backgroundColor: 'var(--sl-bg)', fontFamily: 'var(--sl-font-ui)',
    }}>
      <div style={{
        flexShrink: 0, backgroundColor: 'var(--sl-card)',
        borderBottom: '1px solid var(--sl-border)', padding: '14px 16px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button
            onClick={onBack}
            aria-label="Retour à l'administration"
            style={{
              width: 38, height: 38, borderRadius: 'var(--sl-radius-lg)', border: 'none', flexShrink: 0,
              backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em' }}>
              Feedback communautaire
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--sl-t3)' }}>
              {total} retour{total !== 1 ? 's' : ''} au total
            </p>
          </div>
        </div>

        <StatsRow stats={stats} />

        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none', padding: '10px 0 0', marginTop: 4 }}>
          {STATUS_ORDER.map(s => {
            const m = STATUS_META[s];
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => applyStatus(s)}
                style={{
                  padding: '5px 11px', borderRadius: 'var(--sl-radius-4xl)', border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600, flexShrink: 0,
                  backgroundColor: active ? m.color : 'var(--sl-surface)',
                  color: active ? '#fff' : 'var(--sl-t3)',
                  transition: 'all 0.12s',
                }}>
                {m.label}
                {stats?.byStatus[s] > 0 && ` (${stats.byStatus[s]})`}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 6, padding: '10px 0 12px' }}>
          {Object.entries(TYPE_META).map(([t, m]) => {
            const active = typeFilter === t;
            return (
              <button key={t} onClick={() => applyType(t)}
                style={{
                  padding: '5px 11px', borderRadius: 'var(--sl-radius-4xl)', border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600, flexShrink: 0,
                  backgroundColor: active ? m.color : 'var(--sl-surface)',
                  color: active ? '#fff' : 'var(--sl-t3)',
                  transition: 'all 0.12s',
                }}>
                {m.emoji} {m.label}
              </button>
            );
          })}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {[
              { id: 'recent',  label: 'Récents' },
              { id: 'votes',   label: 'Votes' },
              { id: 'updated', label: 'Mis à jour' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => applySort(id)}
                style={{
                  padding: '5px 10px', borderRadius: 'var(--sl-radius-4xl)', border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 600,
                  backgroundColor: sort === id ? '#6366f1' : 'var(--sl-surface)',
                  color: sort === id ? '#fff' : 'var(--sl-t3)',
                  transition: 'all 0.12s',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '10px 16px', backgroundColor: 'var(--sl-card)', borderBottom: '1px solid var(--sl-border)' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher dans les titres…"
            aria-label="Rechercher dans les feedbacks"
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              borderRadius: 'var(--sl-radius-lg)', fontSize: 13,
              backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
              color: 'var(--sl-t1)', outline: 'none', fontFamily: 'var(--sl-font-ui)',
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, overscrollBehavior: 'contain' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--sl-border)', borderTopColor: '#6366f1', animation: 'sl-spin 0.7s linear infinite' }} />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
            <p style={{ fontSize: 13, color: 'var(--sl-t3)' }}>Aucun feedback dans cette catégorie</p>
          </div>
        )}

        {items.map((item: Record<string, any>) => (
          <FeedbackCard key={item.id} item={item} onClick={setSelected} />
        ))}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingTop: 8 }}>
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              style={{
                padding: '7px 16px', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)',
                backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
                fontSize: 12, fontWeight: 600, cursor: page === 0 ? 'default' : 'pointer',
                opacity: page === 0 ? 0.4 : 1,
              }}
            >
              ← Précédent
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--sl-t3)', padding: '0 8px' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{
                padding: '7px 16px', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)',
                backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
                fontSize: 12, fontWeight: 600, cursor: page + 1 >= totalPages ? 'default' : 'pointer',
                opacity: page + 1 >= totalPages ? 0.4 : 1,
              }}
            >
              Suivant →
            </button>
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>

      <AnimatePresence>
        {selected && (
          <FeedbackDetail
            key={selected.id}
            item={selected}
            onClose={() => setSelected(null)}
            onSave={async (id, patch) => {
              await updateFeedback(id, patch);
              setSelected(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
