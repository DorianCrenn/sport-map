import { useState } from 'react';
import { usePermissionMatrix, ROLES, RESOURCES, ACTIONS } from '../hooks/usePermissionMatrix.js';
import { useToast } from '../contexts/ToastContext.jsx';

function PermCell({ allowed, saving, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        width: 28, height: 28, borderRadius: 7, border: 'none', cursor: saving ? 'default' : 'pointer',
        backgroundColor: allowed ? 'rgba(34,197,94,0.18)' : 'var(--sl-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.1s',
        flexShrink: 0,
      }}
      title={allowed ? 'Autorisé — cliquer pour refuser' : 'Refusé — cliquer pour autoriser'}
    >
      {allowed
        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--sl-border)" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      }
    </button>
  );
}

export default function AdminPermissionsPage({ onBack }) {
  const { matrix, loading, saving, isAllowed, togglePermission, allowAll, denyAll, copyRole } = usePermissionMatrix();
  const { toast } = useToast();

  const [selectedRole,   setSelectedRole]   = useState(ROLES[0].id);
  const [showCopyFrom,   setShowCopyFrom]   = useState(false);
  const [copyFromRole,   setCopyFromRole]   = useState('');
  const [copying,        setCopying]        = useState(false);

  const currentRole = ROLES.find(r => r.id === selectedRole);

  async function handleToggle(resource, action) {
    const cur = isAllowed(selectedRole, resource, action);
    try {
      await togglePermission(selectedRole, resource, action, !cur);
    } catch (e) {
      toast({ message: e.message, type: 'error' });
    }
  }

  async function handleAllowAll(resource) {
    try { await allowAll(selectedRole, resource); toast({ message: `Tout autorisé : ${resource}` }); }
    catch (e) { toast({ message: e.message, type: 'error' }); }
  }

  async function handleDenyAll(resource) {
    try { await denyAll(selectedRole, resource); toast({ message: `Tout refusé : ${resource}` }); }
    catch (e) { toast({ message: e.message, type: 'error' }); }
  }

  async function handleCopy() {
    if (!copyFromRole) return;
    setCopying(true);
    try {
      await copyRole(copyFromRole, selectedRole);
      toast({ message: `Permissions copiées depuis ${ROLES.find(r => r.id === copyFromRole)?.label}` });
      setShowCopyFrom(false);
    } catch (e) {
      toast({ message: e.message, type: 'error' });
    } finally { setCopying(false); }
  }

  // Compteur de permissions accordées pour ce rôle
  const allowedCount = matrix.filter(r => r.role === selectedRole && r.allowed).length;
  const totalCount   = RESOURCES.length * ACTIONS.length;

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--sl-border)', borderTopColor: '#8b5cf6', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--sl-border)' }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)' }}>Matrice des permissions</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--sl-t3)' }}>Rôles × Ressources × Actions — modifications en temps réel</p>
        </div>
        {saving && <span style={{ fontSize: 11, color: '#f59e0b' }}>Sauvegarde…</span>}
      </div>

      {/* Sélecteur de rôle */}
      <div style={{ flexShrink: 0, padding: '10px 16px', borderBottom: '1px solid var(--sl-border)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
          {ROLES.map(r => (
            <button key={r.id} onClick={() => setSelectedRole(r.id)}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
                backgroundColor: selectedRole === r.id ? r.color : 'var(--sl-surface)',
                color: selectedRole === r.id ? '#fff' : 'var(--sl-t2)',
              }}>
              {r.icon} {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Barre actions rôle */}
      <div style={{ flexShrink: 0, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)' }}>
        <span style={{ fontSize: 18 }}>{currentRole?.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: currentRole?.color }}>{currentRole?.label}</span>
        <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{allowedCount}/{totalCount} permissions accordées</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowCopyFrom(p => !p)}
          style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--sl-border)', fontSize: 11, fontWeight: 600, cursor: 'pointer', backgroundColor: 'var(--sl-card)', color: 'var(--sl-t2)' }}>
          📋 Copier depuis…
        </button>
      </div>

      {/* Copier depuis */}
      {showCopyFrom && (
        <div style={{ flexShrink: 0, padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid var(--sl-border)', backgroundColor: 'rgba(139,92,246,0.06)' }}>
          <span style={{ fontSize: 12, color: 'var(--sl-t2)' }}>Copier les permissions de :</span>
          <select value={copyFromRole} onChange={e => setCopyFromRole(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: 10, border: '1px solid var(--sl-border)', fontSize: 12, backgroundColor: 'var(--sl-card)', color: 'var(--sl-t1)' }}>
            <option value="">-- Choisir --</option>
            {ROLES.filter(r => r.id !== selectedRole).map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <button onClick={handleCopy} disabled={!copyFromRole || copying}
            style={{ padding: '5px 12px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, color: '#fff', backgroundColor: '#8b5cf6', cursor: 'pointer' }}>
            {copying ? '…' : 'Copier'}
          </button>
          <button onClick={() => setShowCopyFrom(false)}
            style={{ padding: '5px 10px', borderRadius: 10, border: '1px solid var(--sl-border)', fontSize: 12, backgroundColor: 'var(--sl-card)', cursor: 'pointer', color: 'var(--sl-t2)' }}>
            Annuler
          </button>
        </div>
      )}

      {/* Matrice */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {RESOURCES.map(res => {
          const rowAllowed = ACTIONS.filter(a => isAllowed(selectedRole, res.id, a.id)).length;
          return (
            <div key={res.id} style={{ backgroundColor: 'var(--sl-card)', borderRadius: 14, border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
              {/* Ressource header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)' }}>
                <span style={{ fontSize: 16 }}>{res.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--sl-t1)', flex: 1 }}>{res.label}</span>
                <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{rowAllowed}/{ACTIONS.length}</span>
                <button onClick={() => handleAllowAll(res.id)} style={{ padding: '3px 8px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)', fontSize: 10, fontWeight: 700, cursor: 'pointer', color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)' }}>✓ Tout</button>
                <button onClick={() => handleDenyAll(res.id)} style={{ padding: '3px 8px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', fontSize: 10, fontWeight: 700, cursor: 'pointer', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)' }}>✗ Rien</button>
              </div>
              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
                {ACTIONS.map(act => {
                  const allowed = isAllowed(selectedRole, res.id, act.id);
                  return (
                    <div key={act.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', borderRight: '1px solid var(--sl-border)' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: act.color, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>{act.label}</span>
                      <PermCell allowed={allowed} saving={saving} onClick={() => handleToggle(res.id, act.id)} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
