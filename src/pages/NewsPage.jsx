import { useFeedItems } from '../hooks/useFeedItems.ts';
import { useFeaturedEvents } from '../hooks/useFeaturedEvents.ts';
import ClubFeed from '../components/feed/ClubFeed.tsx';

export default function NewsPage({ followedClubIds = [] }) {
  const { items, loading }     = useFeedItems(followedClubIds);
  const { items: featured }    = useFeaturedEvents({ clubIds: followedClubIds });
  const hasClubs = followedClubIds.length > 0;

  return (
    <ClubFeed
      clubId="followed"
      clubName="Mes clubs"
      items={hasClubs ? items : undefined}
      featuredItems={hasClubs ? featured : undefined}
      loading={loading}
    />
  );
}
