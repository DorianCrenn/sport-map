import { useState, useEffect } from 'react';

export function useDemoFeed() {
  const [demoConvocations, setDemoConvocations] = useState([
    {
      id: 'dc-1',
      status: 'pending',
      event: {
        id: 'demo-event-006',
        title: 'FC SportLink Démo U17 vs US Bohars U17',
        date: (() => {
          const d = new Date(); d.setDate(d.getDate() + 6); d.setHours(14, 30, 0, 0);
          return d.toISOString();
        })(),
        team_name: 'U17',
        adversaire: 'US Bohars U17',
        city: 'Brest',
      },
      player: { name: 'Liam Creach' },
    },
    {
      id: 'dc-2',
      status: 'pending',
      event: {
        id: 'demo-event-003',
        title: 'Tournoi de la Pentecôte',
        date: (() => {
          const d = new Date(); d.setDate(d.getDate() + 10); d.setHours(9, 0, 0, 0);
          return d.toISOString();
        })(),
        team_name: 'U17',
        adversaire: 'Tournoi – 8 équipes',
        city: 'Brest',
      },
      player: { name: 'Noa Kerguelen' },
    },
  ]);

  const [demoLiveMatches, setDemoLiveMatches] = useState([
    {
      event: {
        id: 'demo-event-live-001',
        sport: 'Football',
        team_name: 'FC SportLink Démo R',
        adversaire: 'CS Plabennec R',
      },
      matchScore: { score_home: 0, score_away: 1, status: 'in_progress' },
    },
    {
      event: {
        id: 'demo-event-live-002',
        sport: 'Football',
        team_name: 'FC SportLink Démo U17',
        adversaire: 'ES Lannilis U17',
      },
      matchScore: { score_home: 2, score_away: 0, status: 'in_progress' },
    },
  ]);

  useEffect(() => {
    const id = setInterval(() => {
      setDemoLiveMatches(prev => {
        const idx  = Math.floor(Math.random() * prev.length);
        const side = Math.random() > 0.5 ? 'score_home' : 'score_away';
        return prev.map((m, i) =>
          i !== idx
            ? m
            : { ...m, matchScore: { ...m.matchScore, [side]: m.matchScore[side] + 1 } }
        );
      });
    }, 12000);
    return () => clearInterval(id);
  }, []);

  return { demoConvocations, setDemoConvocations, demoLiveMatches };
}
