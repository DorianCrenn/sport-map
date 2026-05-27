import { useFeedItems } from '../hooks/useFeedItems.ts';
import ClubFeed from '../components/feed/ClubFeed.tsx';

export default function NewsPage({ followedClubIds = [] }) {
  const { items, loading } = useFeedItems(followedClubIds);

  const hasClubs = followedClubIds.length > 0;

  return (
    <ClubFeed
      clubId="followed"
      clubName="Mes clubs"
      items={hasClubs ? items : undefined}
      loading={loading}
    />
  );
}
