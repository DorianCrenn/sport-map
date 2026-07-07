import { describe, it, expect } from 'vitest';
import {
  LEADERBOARD_MIN_ENTRIES,
  shouldShowLeaderboard,
  shouldShowHypeBar,
} from '../../lib/progressiveDisclosure.js';

describe('progressiveDisclosure — shouldShowLeaderboard', () => {
  it('masqué en dessous du seuil', () => {
    expect(shouldShowLeaderboard(0)).toBe(false);
    expect(shouldShowLeaderboard(1)).toBe(false);
    expect(shouldShowLeaderboard(LEADERBOARD_MIN_ENTRIES - 1)).toBe(false);
  });

  it('affiché au seuil et au-dessus', () => {
    expect(shouldShowLeaderboard(LEADERBOARD_MIN_ENTRIES)).toBe(true);
    expect(shouldShowLeaderboard(10)).toBe(true);
  });

  it('seuil = 3 (podium minimal)', () => {
    expect(LEADERBOARD_MIN_ENTRIES).toBe(3);
  });
});

describe('progressiveDisclosure — shouldShowHypeBar', () => {
  it('masqué si aucune activité réelle', () => {
    expect(shouldShowHypeBar(0)).toBe(false);
  });

  it('affiché dès un segment réel', () => {
    expect(shouldShowHypeBar(1)).toBe(true);
    expect(shouldShowHypeBar(4)).toBe(true);
  });
});
