import { type FC, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import NewsPage from './NewsPage.jsx';

const HomePage = lazy(() => import('./HomePage.jsx'));

interface HomeScreenProps {
  followedClubIds: string[];
  onNavigate: (tab: string) => void;
  stats?: Record<string, number>;
  clubs?: unknown[];
  allEvents?: unknown[];
}

const HomeScreen: FC<HomeScreenProps> = ({ followedClubIds, onNavigate, stats, clubs, allEvents }) => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <NewsPage followedClubIds={followedClubIds} />;
  }

  return (
    <Suspense fallback={null}>
      <HomePage
        onNavigate={onNavigate}
        stats={stats}
        clubs={clubs ?? []}
        allEvents={allEvents ?? []}
      />
    </Suspense>
  );
};

export default HomeScreen;
