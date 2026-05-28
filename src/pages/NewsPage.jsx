import { useFeedItems } from '../hooks/useFeedItems.ts';
import { useFeaturedEvents } from '../hooks/useFeaturedEvents.ts';
import { useClubSponsors } from '../hooks/useClubSponsors.ts';
import { useAuth } from '../contexts/AuthContext.jsx';
import ClubFeed from '../components/feed/ClubFeed.tsx';

export default function NewsPage({ followedClubIds = [], onNavigate, onOpenTrainings }) {
  const { currentUser } = useAuth();
  const { items, loading }     = useFeedItems(followedClubIds);
  const { items: featured }    = useFeaturedEvents({ clubIds: followedClubIds });
  const { sponsors }           = useClubSponsors(followedClubIds);
  const hasClubs = followedClubIds.length > 0;

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
