import { useState, useEffect } from 'react';

interface DemoConvocation {
  id: string;
  status: 'pending' | 'accepted' | 'declined' | 'unavailable';
  event: { id: string; title: string; date: string; team_name: string; adversaire: string; city: string };
  player: { name: string };
}

interface DemoMatchScore { score_home: number; score_away: number; status: 'in_progress' | 'ended'; }
interface DemoLiveMatch  { event: { id: string; sport: string; team_name: string; adversaire: string }; matchScore: DemoMatchScore; }

function daysFromNow(days: number, hours: number, minutes: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function useDemoFeed(): {
  demoConvocations: DemoConvocation[];
  setDemoConvocations: React.Dispatch<React.SetStateAction<DemoConvocation[]>>;
  demoLiveMatches: DemoLiveMatch[];
} {
  const [demoConvocations, setDemoConvocations] = useState<DemoConvocation[]>([
    {
      id: 'dc-1', status: 'pending',
      event: { id: 'demo-event-006', title: 'FC SportLink Démo U17 vs US Bohars U17', date: daysFromNow(6, 14, 30), team_name: 'U17', adversaire: 'US Bohars U17', city: 'Brest' },
      player: { name: 'Liam Creach' },
    },
    {
      id: 'dc-2', status: 'pending',
      event: { id: 'demo-event-003', title: 'Tournoi de la Pentecôte', date: daysFromNow(10, 9, 0), team_name: 'U17', adversaire: 'Tournoi – 8 équipes', city: 'Brest' },
      player: { name: 'Noa Kerguelen' },
    },
  ]);

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

  return { demoConvocations, setDemoConvocations, demoLiveMatches };
}
