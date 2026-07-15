import { useState } from 'react';
import { useAdminAuditLog } from '../hooks/useAdminAuditLog.js';

interface FilterOption {
  id: string;
  label: string;
}

const ENTITY_FILTER_OPTIONS: FilterOption[] = [
  { id: '',                     label: 'Toutes les entités' },
  { id: 'admin_grants',         label: 'Grants' },
  { id: 'plan_features_config', label: 'Features' },
  { id: 'plan_quotas_config',   label: 'Quotas' },
  { id: 'permission_matrix',    label: 'Permissions' },
];

interface ValueDiffProps {
  oldVal: any;
  newVal: any;
}

function ValueDiff({ oldVal, newVal }: ValueDiffProps) {
  const old = oldVal ? JSON.stringify(oldVal) : null;
  const nw  = newVal ? JSON.stringify(newVal) : null;
  if (!old && !nw) return null;
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
      {old && (
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 'var(--sl-radius-md)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          − {old}
        </span>
      )}
      {nw && (
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 'var(--sl-radius-md)', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          + {nw}
        </span>
      )}
    </div>
  );
}

interface AdminAuditLogPageProps {
  onBack: () => void;
}

export default function AdminAuditLogPage({ onBack }: AdminAuditLogPageProps) {
  const [entityFilter, setEntityFilter] = useState('');
  const { entries, loading, hasMore, loadMore, refetch, ACTION_LABELS } = useAdminAuditLog({
    entityType: entityFilter || null,
    limit: 50,
  }) as any;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--sl-border)' }}>
        <button onClick={onBack} aria-label="Retour à l'administration" style={{ width: 44, height: 44, borderRadius: 'var(--sl-radius-xl)', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)' }}>Journal d'audit</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--sl-t3)' }}>{entries.length} entrée{entries.length !== 1 ? 's' : ''} — modifications admin traçées</p>
        </div>
        <button onClick={refetch} aria-label="Actualiser le journal" style={{ width: 44, height: 44, borderRadius: 'var(--sl-radius-xl)', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {/* Filtres */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid var(--sl-border)', overflowX: 'auto' }}>
        {ENTITY_FILTER_OPTIONS.map(f => (
          <button key={f.id} onClick={() => setEntityFilter(f.id)}
            style={{
              padding: '5px 12px', borderRadius: 'var(--sl-radius-4xl)', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
              backgroundColor: entityFilter === f.id ? '#8b5cf6' : 'var(--sl-surface)',
              color: entityFilter === f.id ? '#fff' : 'var(--sl-t2)',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--sl-t3)', fontSize: 13 }}>Chargement…</div>
        )}
        {!loading && entries.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <p style={{ fontSize: 13, color: 'var(--sl-t3)' }}>Aucune entrée dans le journal</p>
          </div>
        )}
        {entries.map((entry: any) => {
          const meta = ACTION_LABELS[entry.action] ?? { label: entry.action, color: '#64748b', icon: '📝' };
          return (
            <div key={entry.id} style={{ backgroundColor: 'var(--sl-card)', borderRadius: 'var(--sl-radius-2xl)', border: '1px solid var(--sl-border)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--sl-radius-lg)', backgroundColor: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 'var(--sl-radius-4xl)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t3)', fontFamily: 'monospace' }}>
                      {entry.entity_type}
                    </span>
                    {entry.entity_id && (
                      <span style={{ fontSize: 10, color: 'var(--sl-t3)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                        #{entry.entity_id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--sl-t3)' }}>
                    👤 {entry.admin_email ?? entry.admin_id?.slice(0, 8)} ·{' '}
                    🕒 {new Date(entry.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <ValueDiff oldVal={entry.old_value} newVal={entry.new_value} />
                </div>
              </div>
            </div>
          );
        })}
        {hasMore && (
          <button onClick={loadMore} disabled={loading} data-testid="audit-load-more"
            style={{ padding: '10px 0', borderRadius: 'var(--sl-radius-xl)', border: '1px solid var(--sl-border)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)' }}>
            {loading ? 'Chargement…' : 'Charger plus'}
          </button>
        )}
      </div>
    </div>
  );
}
