import { memo } from 'react';

export const Skeleton = memo(function Skeleton({ width, height, radius = 8, style }) {
  return (
    <div
      className="img-skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, flexShrink: 0, ...style }}
    />
  );
});

export const SkeletonClubCard = memo(function SkeletonClubCard() {
  return (
    <div
      aria-hidden="true"
      style={{
        borderRadius: 14, marginBottom: 8,
        backgroundColor: 'var(--sl-card)',
        border: '1px solid var(--sl-border)',
        padding: '12px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Skeleton width={44} height={44} radius={12} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton height={13} radius={6} style={{ width: '58%' }} />
          <Skeleton height={10} radius={5} style={{ width: '38%' }} />
        </div>
      </div>
    </div>
  );
});

export const SkeletonLeaderboardRow = memo(function SkeletonLeaderboardRow() {
  return (
    <div
      aria-hidden="true"
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: '1px solid var(--sl-border)' }}
    >
      <Skeleton width={20} height={13} radius={5} style={{ flexShrink: 0 }} />
      <Skeleton width={28} height={28} radius={8} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton height={12} radius={5} style={{ width: '55%' }} />
        <Skeleton height={9} radius={4} style={{ width: '30%' }} />
      </div>
      <Skeleton width={48} height={22} radius={7} style={{ flexShrink: 0 }} />
    </div>
  );
});
