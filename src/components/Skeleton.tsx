import { memo, type CSSProperties } from 'react';

interface SkeletonProps { width?: number | string; height?: number | string; radius?: number; style?: CSSProperties; }

export const Skeleton = memo(function Skeleton({ width, height, radius = 8, style }: SkeletonProps) {
  return <div className="img-skeleton" aria-hidden="true" style={{ width, height, borderRadius: radius, flexShrink: 0, ...style }} />;
});

export const SkeletonClubCard = memo(function SkeletonClubCard() {
  return (
    <div aria-hidden="true" style={{ borderRadius: 'var(--sl-radius-2xl)', marginBottom: 8, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px 10px' }}>
        <Skeleton width={44} height={44} radius={12} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <Skeleton height={14} radius={6} style={{ width: '62%' }} />
          <Skeleton height={10} radius={5} style={{ width: '40%' }} />
          <div style={{ display: 'flex', gap: 5 }}>
            <Skeleton width={44} height={18} radius={5} />
            <Skeleton width={52} height={18} radius={5} />
          </div>
        </div>
      </div>
      <div style={{ height: 1, backgroundColor: 'var(--sl-border)' }} />
      <div style={{ display: 'flex', padding: '10px 14px', gap: 8 }}>
        <Skeleton height={30} radius={8} style={{ flex: 1 }} />
        <Skeleton height={30} radius={8} style={{ flex: 1 }} />
      </div>
    </div>
  );
});

export const SkeletonLeaderboardRow = memo(function SkeletonLeaderboardRow() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: '1px solid var(--sl-border)' }}>
      <Skeleton width={20} height={13} radius={5} style={{ flexShrink: 0 }} />
      <Skeleton width={28} height={28} radius={8} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton height={12} radius={5} style={{ width: '55%' }} />
        <Skeleton height={9}  radius={4} style={{ width: '30%' }} />
      </div>
      <Skeleton width={48} height={22} radius={7} style={{ flexShrink: 0 }} />
    </div>
  );
});
