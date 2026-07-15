import { describe, it, expect } from 'vitest';
import { rankBy, metricValue, presenceRate, type Metric } from '../../components/club/tabs/seasonRanking.js';
import type { PlayerSeasonStat } from '../../hooks/usePlayerStats.js';

function player(over: Partial<PlayerSeasonStat> & { playerId: string }): PlayerSeasonStat {
  return {
    clubId: 'c1', playerName: over.playerId, jerseyNumber: null, position: null,
    matchesTotal: 0, matchesPlayed: 0, totalGoals: 0, totalAssists: 0, totalYellow: 0, totalRed: 0,
    ...over,
  };
}

const A = player({ playerId: 'A', totalGoals: 5, totalAssists: 2, totalYellow: 2, totalRed: 0, matchesPlayed: 8,  matchesTotal: 10 }); // presence 0.8
const B = player({ playerId: 'B', totalGoals: 3, totalAssists: 5, totalYellow: 0, totalRed: 1, matchesPlayed: 10, matchesTotal: 10 }); // presence 1.0
const C = player({ playerId: 'C', totalGoals: 0, totalAssists: 0, totalYellow: 0, totalRed: 0, matchesPlayed: 2,  matchesTotal: 4  }); // presence 0.5
const D = player({ playerId: 'D', matchesPlayed: 0, matchesTotal: 0 }); // jamais convoqué
const ALL = [C, A, D, B]; // volontairement désordonné

const ids = (arr: PlayerSeasonStat[]) => arr.map(p => p.playerId);

describe('seasonRanking', () => {
  describe('presenceRate', () => {
    it('ratio joués / total', () => {
      expect(presenceRate(A)).toBeCloseTo(0.8);
      expect(presenceRate(B)).toBe(1);
    });
    it('0 si aucun match convoqué (pas de division par zéro)', () => {
      expect(presenceRate(D)).toBe(0);
    });
  });

  describe('metricValue', () => {
    it('cartons = jaunes + rouges', () => {
      expect(metricValue(A, 'cards')).toBe(2);
      expect(metricValue(B, 'cards')).toBe(1);
    });
    it('buts / passes directs', () => {
      expect(metricValue(A, 'goals')).toBe(5);
      expect(metricValue(B, 'assists')).toBe(5);
    });
  });

  describe('rankBy', () => {
    it('buteurs : tri décroissant, exclut les 0 but', () => {
      expect(ids(rankBy(ALL, 'goals'))).toEqual(['A', 'B']);
    });

    it('passeurs : tri décroissant', () => {
      expect(ids(rankBy(ALL, 'assists'))).toEqual(['B', 'A']);
    });

    it('cartons : tri décroissant, exclut les joueurs sans carton', () => {
      expect(ids(rankBy(ALL, 'cards'))).toEqual(['A', 'B']);
    });

    it('présence : garde tous ceux ayant ≥1 match (même sans stat off.), exclut les jamais convoqués', () => {
      // B(1.0) > A(0.8) > C(0.5) ; D exclu (matchesTotal 0)
      expect(ids(rankBy(ALL, 'presence'))).toEqual(['B', 'A', 'C']);
    });

    it('ne mute pas le tableau source', () => {
      const before = ids(ALL);
      rankBy(ALL, 'goals');
      expect(ids(ALL)).toEqual(before);
    });

    it('liste vide → tableau vide pour toute métrique', () => {
      (['goals', 'assists', 'presence', 'cards'] as Metric[]).forEach(m => {
        expect(rankBy([], m)).toEqual([]);
      });
    });
  });
});
