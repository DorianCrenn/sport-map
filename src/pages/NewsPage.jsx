import { useMemo, useState } from 'react';
import { useFeedItems } from '../hooks/useFeedItems.ts';
import { useFeaturedEvents } from '../hooks/useFeaturedEvents.ts';
import { useClubSponsors } from '../hooks/useClubSponsors.ts';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useManagedClubs } from '../hooks/useManagedClubs.js';
import ClubFeed from '../components/feed/ClubFeed.tsx';
import MatchesTab from '../components/feed/MatchesTab.jsx';

// ── Onglets principaux ────────────────────────────────────────────────────────

const MAIN_TABS = [
  { key: 'agenda',    label: 'Agenda'    },
  { key: 'mes-clubs', label: 'Mes clubs' },
];

// ── Pills de filtre (affichées dans l'onglet "Mes clubs") ─────────────────────

const FEED_FILTERS = [
  { key: 'all',     label: 'Tout',     emoji: '🗂️' },
  { key: 'match',   label: 'Matchs',   emoji: '⚽' },
  { key: 'flash',   label: 'Annonces', emoji: '📢' },
  { key: 'carpool', label: 'Covoiturage', emoji: '🚗' },
];

// ── NavTabBar ─────────────────────────────────────────────────────────────────

function NavTabBar({ activeMain, activeFeed, onMainChange, onFeedChange }) {
  return (
    <div className="shrink-0 bg-[var(--sl-bg)] border-b border-[var(--sl-border)]">

      {/* Onglets principaux */}
      <div className="flex">
        {MAIN_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => onMainChange(tab.key)}
            className={[
              'flex-1 py-3 text-[13px] font-bold transition-colors relative',
              activeMain === tab.key
                ? 'text-indigo-500'
                : 'text-[var(--sl-t3)] hover:text-[var(--sl-t2)]',
            ].join(' ')}
          >
            {tab.label}
            {activeMain === tab.key && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-indigo-500" />
            )}
          </button>
        ))}
      </div>

      {/* Pills de filtre — visibles uniquement quand "Mes clubs" est actif */}
      {activeMain === 'mes-clubs' && (
        <div
          className="flex gap-1.5 px-4 py-2.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          role="group"
          aria-label="Filtrer le fil d'actualité"
        >
          {FEED_FILTERS.map(f => {
            const active = activeFeed === f.key;
            return (
              <button
                key={f.key}
                onClick={() => onFeedChange(f.key)}
                aria-pressed={active}
                className={[
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold',
                  'whitespace-nowrap transition-all duration-150 shrink-0',
                  active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50'
                    : 'bg-[var(--sl-pill-bg)] text-[var(--sl-pill-text)] hover:bg-[var(--sl-hover)] border border-[var(--sl-border)]',
                ].join(' ')}
              >
                <span className="text-[13px]" aria-hidden="true">{f.emoji}</span>
                {f.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── NoClubsZeroState ──────────────────────────────────────────────────────────

function NoClubsZeroState({ onNavigateClubs, onSwitchToAgenda }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '0 32px',
      textAlign: 'center',
    }}>
      {/* Illustration */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, lineHeight: 1 }}>
        <span style={{ fontSize: 42, transform: 'rotate(-12deg)', display: 'inline-block' }}>⚽</span>
        <span style={{ fontSize: 42, transform: 'translateY(-10px)', display: 'inline-block' }}>🏀</span>
        <span style={{ fontSize: 42, transform: 'rotate(12deg)', display: 'inline-block' }}>🏉</span>
      </div>

      <p style={{ fontSize: 19, fontWeight: 800, color: 'var(--sl-t1)', margin: '0 0 12px', lineHeight: 1.3 }}>
        Suivez votre premier club
      </p>

      <p style={{ fontSize: 14, color: 'var(--sl-t2)', maxWidth: 270, lineHeight: 1.65, margin: '0 0 32px' }}>
        Rejoignez votre club sportif pour retrouver ses matchs, résultats, annonces et covoiturages directement ici.
      </p>

      <button
        onClick={onNavigateClubs}
        style={{
          width: '100%', maxWidth: 300, padding: '15px 24px', borderRadius: 16,
          border: 'none', background: '#6366f1', color: '#fff',
          fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 14,
          boxShadow: '0 4px 24px rgba(99,102,241,0.38)', letterSpacing: '-0.01em',
        }}
      >
        Découvrir les clubs
      </button>

      <button
        onClick={onSwitchToAgenda}
        style={{
          background: 'none', border: 'none', color: 'var(--sl-t3)',
          fontSize: 13, cursor: 'pointer', padding: '6px 0',
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}
      >
        Voir les matchs du jour
      </button>
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
      margin: '0 0 12px', padding: '14px 16px', borderRadius: 16,
      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.22)',
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

  const [activeMain, setActiveMain] = useState('agenda');
  const [activeFeed, setActiveFeed] = useState('all');

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

  return (
    <div className="flex flex-col h-full bg-[var(--sl-bg)]">

      <NavTabBar
        activeMain={activeMain}
        activeFeed={activeFeed}
        onMainChange={setActiveMain}
        onFeedChange={setActiveFeed}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeMain === 'agenda' ? (
          <MatchesTab
            followedClubIds={feedClubIds}
            onNavigateClubs={onNavigate ? () => onNavigate('clubs') : undefined}
          />
        ) : !hasClubs ? (
          <NoClubsZeroState
            onNavigateClubs={onNavigate ? () => onNavigate('clubs') : undefined}
            onSwitchToAgenda={() => setActiveMain('agenda')}
          />
        ) : (
          <ClubFeed
            clubId="followed"
            clubName="Mes clubs"
            items={items}
            featuredItems={featured}
            sponsorItems={sponsors}
            loading={loading}
            currentUser={currentUser}
            onNavigateClubs={onNavigate ? () => onNavigate('clubs') : undefined}
            onOpenTrainings={onOpenTrainings}
            externalFilter={activeFeed}
            hideHeader
            headerSlot={showSetupCard ? (
              <QuickSetupCard onDismiss={dismissSetup} />
            ) : undefined}
          />
        )}
      </div>
    </div>
  );
}
