import { useState } from 'react';
import { useClubSponsorsPage } from '../../../hooks/useClubSponsorsPage.js';

const TIER_ORDER = ['gold', 'silver', 'bronze', 'partner'];

const TIER_META: Record<string, { label: string; color: string; logoH: number; cols: string }> = {
  gold:    { label: 'Or',         color: '#f59e0b', logoH: 60, cols: 'repeat(auto-fill, minmax(120px, 1fr))' },
  silver:  { label: 'Argent',     color: '#94a3b8', logoH: 44, cols: 'repeat(auto-fill, minmax(90px, 1fr))'  },
  bronze:  { label: 'Bronze',     color: '#cd7c54', logoH: 32, cols: 'repeat(auto-fill, minmax(72px, 1fr))'  },
  partner: { label: 'Partenaire', color: '#4da6ff', logoH: 32, cols: 'repeat(auto-fill, minmax(72px, 1fr))'  },
};

interface Sponsor {
  id: string | number;
  name: string;
  tier: string;
  logo?: string | null;
  url?: string | null;
}

function SponsorLogo({ sponsor, height }: { sponsor: Sponsor; height: number }) {
  const [err, setErr] = useState(false);
  const meta = TIER_META[sponsor.tier] ?? TIER_META.partner;
  const wrapper: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height, minWidth: 60, padding: '6px 10px', borderRadius: 12,
    backgroundColor: sponsor.logo && !err ? '#fff' : meta.color + '22',
    border: '1px solid var(--sl-border)',
    boxShadow: sponsor.tier === 'gold' ? '0 2px 10px rgba(0,0,0,0.10)' : 'none',
    overflow: 'hidden',
    cursor: sponsor.url ? 'pointer' : 'default',
    flexShrink: 0,
  };

  const inner = sponsor.logo && !err ? (
    <img
      src={sponsor.logo}
      alt={sponsor.name}
      onError={() => setErr(true)}
      style={{ maxHeight: height - 12, maxWidth: '100%', objectFit: 'contain', display: 'block' }}
    />
  ) : (
    <span style={{
      fontSize: Math.max(10, height / 4),
      fontWeight: 700,
      color: meta.color,
      textAlign: 'center',
      lineHeight: 1.2,
      wordBreak: 'break-word',
    }}>
      {sponsor.name}
    </span>
  );

  if (sponsor.url) {
    return (
      <a href={sponsor.url} target="_blank" rel="noopener noreferrer" style={{ ...wrapper, textDecoration: 'none' }} title={sponsor.name}>
        {inner}
      </a>
    );
  }
  return <div style={wrapper} title={sponsor.name}>{inner}</div>;
}

function TierSection({ tier, sponsors, isMultiTier }: { tier: string; sponsors: Sponsor[]; isMultiTier: boolean }) {
  const meta = TIER_META[tier] ?? TIER_META.partner;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {isMultiTier && (
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: meta.color, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: meta.color }} />
          {meta.label}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: meta.cols, gap: tier === 'gold' ? 12 : 8, alignItems: 'center' }}>
        {sponsors.map(s => (
          <SponsorLogo key={s.id} sponsor={s} height={meta.logoH} />
        ))}
      </div>
    </div>
  );
}

export function SponsorsBlockView({ block, clubId, canEdit = false }: { block: Record<string, any>; clubId?: string | number | null; canEdit?: boolean }) {
  const dbSponsors = useClubSponsorsPage(String(clubId)) as Sponsor[];
  const sponsors = dbSponsors.length ? dbSponsors : (block.data?.sponsors ?? []) as Sponsor[];
  if (sponsors.length === 0) {
    if (!canEdit) return null;
    return (
      <div style={{ padding: '20px 16px', textAlign: 'center', borderRadius: 14, border: '1px dashed var(--sl-border)', color: 'var(--sl-t3)', fontSize: 12 }}>
        🤝 Aucun partenaire — ajoutez vos sponsors depuis le tableau de bord
      </div>
    );
  }

  const grouped: Record<string, Sponsor[]> = {};
  for (const tier of TIER_ORDER) {
    const list = sponsors.filter(s => s.tier === tier);
    if (list.length) grouped[tier] = list;
  }
  const tiers = Object.keys(grouped);
  const isMultiTier = tiers.length > 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)' }}>
        Partenaires &amp; Sponsors
      </div>
      {tiers.map(tier => (
        <TierSection key={tier} tier={tier} sponsors={grouped[tier]} isMultiTier={isMultiTier} />
      ))}
    </div>
  );
}

export function SponsorsBlockEditor(_props?: { block?: any; onChange?: any }) {
  return (
    <div style={{ padding: '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 28 }}>🤝</span>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sl-t1)' }}>
        Gérez vos partenaires depuis l'onglet <strong style={{ color: '#6366f1' }}>Partenaires</strong>
      </div>
      <div style={{ fontSize: 12, color: 'var(--sl-t3)', maxWidth: 260, lineHeight: 1.5 }}>
        Ce bloc affiche automatiquement les sponsors ayant <em>Page club</em> activé.
      </div>
    </div>
  );
}
