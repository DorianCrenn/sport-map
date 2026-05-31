import { useMemo, useState } from 'react';
import { useFeedItems } from '../hooks/useFeedItems.ts';
import { useFeaturedEvents } from '../hooks/useFeaturedEvents.ts';
import { useClubSponsors } from '../hooks/useClubSponsors.ts';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useManagedClubs } from '../hooks/useManagedClubs.js';
import ClubFeed from '../components/feed/ClubFeed.tsx';
import MatchesTab from '../components/feed/MatchesTab.jsx';

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'matches', label: 'Matchs',  feedFilter: null       },
  { key: 'all',     label: 'Tout',    feedFilter: 'all'      },
  { key: 'carpool', label: 'Covoit',  feedFilter: 'carpool'  },
  { key: 'flash',   label: 'Infos',   feedFilter: 'flash'    },
];

function NavTabBar({ active, onChange }) {
  return (
    <div className="flex shrink-0 bg-[var(--sl-bg)] border-b border-[var(--sl-border)]">
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={[
            'flex-1 py-3 text-[13px] font-bold transition-colors relative',
            active === tab.key
              ? 'text-indigo-500'
              : 'text-[var(--sl-t3)] hover:text-[var(--sl-t2)]',
          ].join(' ')}
        >
          {tab.label}
          {active === tab.key && (
            <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-indigo-500" />
          )}
        </button>
      ))}
    </div>
  );
}

// ── QuickSetupCard ────────────────────────────────────────────────────────────

function QuickSetupCard({ onDismiss }) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const url = window.location.origin;
    if (navigator.share) {
      navigator.share({ title: 'SportLink', text: 'Rejoins mon club sur SportLink !', url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div style={{
      margin: '0 0 12px',
      padding: '14px 16px',
      borderRadius: 16,
      background: 'rgba(99,102,241,0.08)',
      border: '1px solid rgba(99,102,241,0.22)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>Invitez vos joueurs &amp; parents</span>
        </div>
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sl-t3)', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}
          aria-label="Fermer"
        >✕</button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--sl-t2)', margin: '0 0 12px', lineHeight: 1.5 }}>
        Partagez un lien pour rejoindre le club en un tap — aucun formulaire.
      </p>
      <button
        onClick={handleShare}
        style={{
          width: '100%', padding: '9px 0', borderRadius: 10, border: 'none',
          background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        <span>{copied ? '✓ Lien copié !' : '🔗 Copier le lien d\'invitation'}</span>
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewsPage({ followedClubIds = [], onNavigate, onOpenTrainings }) {
  const { currentUser, isAdmin, isClubAdmin, follows } = useAuth();
  const { managedClubs } = useManagedClubs();

  const [activeTab, setActiveTab] = useState('matches');

  const isManager  = isAdmin || isClubAdmin || managedClubs.length > 0;
  const dismissKey = `sl-quick-setup-dismissed-${currentUser?.id}`;
  const [setupDismissed, setSetupDismissed] = useState(
    () => !!localStorage.getItem(dismissKey)
  );

  function dismissSetup() {
    localStorage.setItem(dismissKey, '1');
    setSetupDismissed(true);
  }

  const managedClubIds = useMemo(() => managedClubs.map(c => String(c.id)), [managedClubs]);

  const feedClubIds = useMemo(
    () => [...new Set([...followedClubIds, ...managedClubIds])],
    [followedClubIds, managedClubIds],
  );

  const { items, loading }  = useFeedItems(feedClubIds, follows, managedClubIds);
  const { items: featured } = useFeaturedEvents({ clubIds: feedClubIds });
  const { sponsors }        = useClubSponsors(feedClubIds);
  const hasClubs = feedClubIds.length > 0;

  const showSetupCard = isManager && hasClubs && !setupDismissed;

  const currentTab = TABS.find(t => t.key === activeTab);
  const isFeedTab  = currentTab?.feedFilter !== null;

  return (
    <div className="flex flex-col h-full bg-[var(--sl-bg)]">

      <NavTabBar active={activeTab} onChange={setActiveTab} />

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'matches' ? (
          <MatchesTab followedClubIds={feedClubIds} />
        ) : (
          <ClubFeed
            clubId="followed"
            clubName="Mes clubs"
            items={hasClubs ? items : undefined}
            featuredItems={hasClubs ? featured : undefined}
            sponsorItems={hasClubs ? sponsors : undefined}
            loading={loading}
            currentUser={currentUser}
            onNavigateClubs={onNavigate ? () => onNavigate('clubs') : undefined}
            onOpenTrainings={onOpenTrainings}
            externalFilter={currentTab?.feedFilter}
            hideHeader
            headerSlot={showSetupCard && isFeedTab ? (
              <QuickSetupCard onDismiss={dismissSetup} />
            ) : undefined}
          />
        )}
      </div>
    </div>
  );
}
