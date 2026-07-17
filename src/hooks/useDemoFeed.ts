import { useState, useEffect } from 'react';

interface DemoMatchScore { score_home: number; score_away: number; status: 'in_progress' | 'ended'; }
interface DemoLiveMatch  { event: { id: string; sport: string; team_name: string; adversaire: string }; matchScore: DemoMatchScore; }

export function useDemoFeed(): {
  demoLiveMatches: DemoLiveMatch[];
} {
  const [demoLiveMatches, setDemoLiveMatches] = useState<DemoLiveMatch[]>([
    { event: { id: 'demo-event-live-001', sport: 'Football', team_name: 'FC SportLink Démo R', adversaire: 'CS Plabennec R' }, matchScore: { score_home: 0, score_away: 1, status: 'in_progress' } },
    { event: { id: 'demo-event-live-002', sport: 'Football', team_name: 'FC SportLink Démo U17', adversaire: 'ES Lannilis U17' }, matchScore: { score_home: 2, score_away: 0, status: 'in_progress' } },
  ]);

  useEffect(() => {
    const id = setInterval(() => {
      setDemoLiveMatches(prev => {
        const idx  = Math.floor(Math.random() * prev.length);
        const side = Math.random() > 0.5 ? 'score_home' : 'score_away';
        return prev.map((m, i) =>
          i !== idx ? m : { ...m, matchScore: { ...m.matchScore, [side]: m.matchScore[side] + 1 } },
        );
      });
    }, 12000);
    return () => clearInterval(id);
  }, []);

  return { demoLiveMatches };
}
