import { useState } from 'react';
import { useParentChildren } from '../../hooks/useParentChildren.js';
import UpcomingAgendaSection from '../feed/UpcomingAgendaSection.jsx';
import ConvocationsList from '../convocations/ConvocationsList.jsx';

function ChildTab({ child, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
        border: `1.5px solid ${active ? '#6366f1' : 'var(--sl-border)'}`,
        backgroundColor: active ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: active ? '#6366f1' : 'var(--sl-t3)',
        fontSize: 12, fontWeight: active ? 800 : 600,
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
    >
      {child.name}
    </button>
  );
}

export default function ParentDashboard({ currentUser, convocations = [], onConvocationRespond }) {
  const { children, loading } = useParentChildren(currentUser?.id);
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (loading) return null;
  if (!children.length) return null;

  const selectedChild = children[selectedIdx];

  // Filtrer les convocations de l'enfant sélectionné
  const childConvocations = convocations.filter(c => c.player_id === selectedChild?.playerId);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Section titre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sl-t3)' }}>
          Mes enfants
        </span>
        <span style={{ fontSize: 9, fontWeight: 800, color: '#6366f1', backgroundColor: 'rgba(99,102,241,0.12)', padding: '2px 6px', borderRadius: 20 }}>
          {children.length}
        </span>
      </div>

      {/* Tabs enfants (si plusieurs) */}
      {children.length > 1 && (
        <div
          style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}
          className="hide-scrollbar"
        >
          {children.map((child, i) => (
            <ChildTab
              key={child.playerId}
              child={child}
              active={selectedIdx === i}
              onClick={() => setSelectedIdx(i)}
            />
          ))}
        </div>
      )}

      {/* Convocations en attente pour cet enfant */}
      {childConvocations.filter(c => c.status === 'pending').length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{
            padding: '8px 12px', borderRadius: 12, marginBottom: 8,
            backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 13 }}>📋</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
              {childConvocations.filter(c => c.status === 'pending').length} convocation{childConvocations.filter(c => c.status === 'pending').length > 1 ? 's' : ''} en attente pour {selectedChild.name}
            </span>
          </div>
          <ConvocationsList convocations={childConvocations} onRespond={onConvocationRespond} />
        </div>
      )}

      {/* Agenda de l'enfant sélectionné */}
      <p style={{ fontSize: 11, color: 'var(--sl-t3)', marginBottom: 6, fontWeight: 600 }}>
        Agenda de {selectedChild?.name}
      </p>
      <UpcomingAgendaSection
        currentUser={currentUser}
        convocations={childConvocations}
        onConvocationRespond={onConvocationRespond}
      />
    </div>
  );
}
