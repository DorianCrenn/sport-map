import { useMemo } from 'react';
import { useFeedItems } from '../hooks/useFeedItems.ts';
import { useFeaturedEvents } from '../hooks/useFeaturedEvents.ts';
import { useClubSponsors } from '../hooks/useClubSponsors.ts';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useManagedClubs } from '../hooks/useManagedClubs.js';
import ClubFeed from '../components/feed/ClubFeed.tsx';

export default function NewsPage({ followedClubIds = [], onNavigate, onOpenTrainings }) {
  const { currentUser } = useAuth();
  const { managedClubs } = useManagedClubs();

  // Les clubs gérés sont visibles dans le feed sans avoir à les suivre explicitement
  const feedClubIds = useMemo(() => {
    const managed = managedClubs.map(c => String(c.id));
    return [...new Set([...followedClubIds, ...managed])];
  }, [followedClubIds, managedClubs]);

  const { items, loading }     = useFeedItems(feedClubIds);
  const { items: featured }    = useFeaturedEvents({ clubIds: feedClubIds });
  const { sponsors }           = useClubSponsors(feedClubIds);
  const hasClubs = feedClubIds.length > 0;

  return (
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
    />
  );
}
